import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import StorageService from '../services/storageService';
import { useMusic, Track } from '../context/MusicContext';
import { useTheme } from '../context/ThemeContext';
import { formatSize } from '../utils/helpers';

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
  const { colors, t } = useTheme();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDownloads();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDownloads = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
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
          size: formatSize(file.size),
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
    await loadDownloads(true);
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
        style={[styles.trackItem, { backgroundColor: colors.surface }, isCurrentTrack && { backgroundColor: `${colors.primary}15` }]}
        onPress={() => handlePlay(item, index)}>
        <View style={styles.trackNumber}>
          {isCurrentTrack && isPlaying ? (
            <Icon name="volume-high" size={16} color={colors.primary} />
          ) : (
            <Text style={[styles.numberText, { color: colors.textMuted }]}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, { color: isCurrentTrack ? colors.primary : colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.trackMeta, { color: colors.textMuted }]}>{item.size} • {item.date}</Text>
        </View>
        <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(item, index)}>
          <Icon name="play" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} onPress={() => handleDelete(item)}>
          <Icon name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Mis Descargas</Text>
            <Text style={[styles.count, { color: colors.textMuted }]}>{tracks.length} canciones</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {tracks.length > 0 && (
              <TouchableOpacity style={[styles.playAllBtn, { backgroundColor: colors.primary }]} onPress={handlePlayAll}>
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
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="download-outline" size={80} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay descargas</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Busca música en YouTube para descargarla</Text>
                  <TouchableOpacity
                    style={[styles.searchBtn, { backgroundColor: colors.primary }]}
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
  safeArea: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 0.5,
  },
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  count: { fontSize: 12, marginTop: 3 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 15, padding: 12, borderRadius: 25,
    justifyContent: 'center',
  },
  playAllText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  listContent: { padding: 15 },
  trackItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 10, marginBottom: 10,
  },
  trackNumber: { width: 30, alignItems: 'center' },
  numberText: { fontSize: 14 },
  trackInfo: { flex: 1, marginLeft: 10 },
  trackName: { fontSize: 15, fontWeight: '500' },
  trackMeta: { fontSize: 12, marginTop: 4 },
  playBtn: { padding: 10 },
  moreBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: {
    fontSize: 13, marginTop: 8,
    textAlign: 'center', paddingHorizontal: 40, marginBottom: 20,
  },
  searchBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 25,
  },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default DownloadsScreen;
