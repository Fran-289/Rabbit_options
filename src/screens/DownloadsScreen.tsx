import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import StorageService from '../services/storageService';
import { useMusic, Track } from '../context/MusicContext';

interface DownloadedTrack {
  id: string;
  name: string;
  path: string;
  size: string;
  date: string;
  dateObj: number;
}

const DownloadsScreen = ({ navigation }: any) => {
  const [tracks, setTracks] = useState<DownloadedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { play, setQueue, currentTrack, isPlaying } = useMusic();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDownloads();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDownloads = async () => {
    setLoading(true);
    try {
      const path = await StorageService.getMusicPath();
      const exists = await RNFS.exists(path);
      if (exists) {
        const files = await RNFS.readDir(path);
        const mp3Files = files.filter(f => f.name.endsWith('.mp3'));
        const trackList: DownloadedTrack[] = mp3Files.map((file, index) => ({
          id: `track_${index}_${file.name}`,
          name: file.name.replace('.mp3', ''),
          path: file.path,
          size: file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          date: new Date(file.mtime || Date.now()).toLocaleDateString(),
          dateObj: file.mtime?.getTime?.() || Date.now(),
        }));
        trackList.sort((a, b) => b.dateObj - a.dateObj);
        setTracks(trackList);
      }
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  }, []);

  const handlePlay = (track: DownloadedTrack, index: number) => {
    const trackForPlay: Track = {
      id: track.id,
      name: track.name,
      path: track.path,
      source: 'Descargas',
    };
    setQueue(
      tracks.map(t => ({
        id: t.id,
        name: t.name,
        path: t.path,
        source: 'Descargas',
      })),
      index
    );
    play(trackForPlay);
    navigation.navigate('Player');
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const allTracks: Track[] = tracks.map(t => ({
      id: t.id,
      name: t.name,
      path: t.path,
      source: 'Descargas',
    }));
    setQueue(allTracks, 0);
    play(allTracks[0]);
    navigation.navigate('Player');
  };

  const handleDelete = (track: DownloadedTrack) => {
    Alert.alert('Eliminar canción', `¿Eliminar "${track.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await RNFS.unlink(track.path);
            setTracks(tracks.filter(t => t.id !== track.id));
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const renderTrackItem = ({ item, index }: { item: DownloadedTrack; index: number }) => {
    const isCurrentTrack = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.trackItem, isCurrentTrack && styles.trackItemActive]}
        onPress={() => handlePlay(item, index)}>
        <View style={styles.trackNumber}>
          {isCurrentTrack && isPlaying ? (
            <Icon name="volume-high" size={16} color="#1DB954" />
          ) : (
            <Text style={styles.numberText}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, isCurrentTrack && styles.trackNameActive]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.trackMeta}>{item.size} • {item.date}</Text>
        </View>
        <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(item, index)}>
          <Icon name="play" size={20} color="#1DB954" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} onPress={() => handleDelete(item)}>
          <Icon name="ellipsis-vertical" size={18} color="#b3b3b3" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Mis Descargas</Text>
            <Text style={styles.count}>{tracks.length} canciones</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : (
          <>
            {tracks.length > 0 && (
              <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
                <Icon name="play-circle" size={24} color="#fff" />
                <Text style={styles.playAllText}>Reproducir todo</Text>
              </TouchableOpacity>
            )}
            <FlatList
              data={tracks}
              keyExtractor={(item) => item.id}
              renderItem={renderTrackItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#1DB954"
                  colors={['#1DB954']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="download-outline" size={80} color="#535353" />
                  <Text style={styles.emptyTitle}>No hay descargas</Text>
                  <Text style={styles.emptySubtitle}>Busca música en YouTube para descargarla</Text>
                  <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={() => navigation.navigate('Buscar')}>
                    <Text style={styles.searchBtnText}>Buscar música</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  count: { color: '#b3b3b3', fontSize: 12, marginTop: 3 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1DB954',
    marginHorizontal: 20, marginBottom: 15, padding: 12, borderRadius: 25,
    justifyContent: 'center',
  },
  playAllText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  listContent: { padding: 15 },
  trackItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#181818',
    padding: 12, borderRadius: 10, marginBottom: 10,
  },
  trackItemActive: { backgroundColor: '#1DB95415' },
  trackNumber: { width: 30, alignItems: 'center' },
  numberText: { color: '#b3b3b3', fontSize: 14 },
  trackInfo: { flex: 1, marginLeft: 10 },
  trackName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  trackNameActive: { color: '#1DB954' },
  trackMeta: { color: '#b3b3b3', fontSize: 12, marginTop: 4 },
  playBtn: { padding: 10 },
  moreBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: {
    color: '#535353', fontSize: 13, marginTop: 8,
    textAlign: 'center', paddingHorizontal: 40, marginBottom: 20,
  },
  searchBtn: {
    backgroundColor: '#1DB954', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 25,
  },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default DownloadsScreen;
