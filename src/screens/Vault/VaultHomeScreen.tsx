import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import VaultService, { VaultVideo } from '../../services/vaultService';
import { useMusic } from '../../context/MusicContext';
import { launchImageLibrary } from 'react-native-image-picker';

const VaultHomeScreen = ({ navigation }: any) => {
  const [videos, setVideos] = useState<VaultVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { play } = useMusic();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVideos();
    });
    return unsubscribe;
  }, [navigation]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const vaultVideos = await VaultService.getVideos();
      setVideos(vaultVideos);
    } catch (error) {
      console.error('Error loading vault videos:', error);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  }, []);

  const handleAddVideo = () => {
    Alert.alert('Agregar video', 'Selecciona una opción', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Galería',
        onPress: async () => {
          try {
            const result = await launchImageLibrary({
              mediaType: 'video',
              selectionLimit: 0,
            });

            if (result.didCancel || !result.assets) return;

            for (const asset of result.assets) {
              if (asset.uri && asset.fileName) {
                const added = await VaultService.moveVideoToVault(
                  asset.uri.replace('file://', ''),
                  asset.fileName.replace(/\.[^.]+$/, ''),
                );
                if (added) {
                  Alert.alert('Agregado', `"${added.title}" movido al cofre`);
                  loadVideos();
                }
              }
            }
          } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'No se pudo agregar el video');
          }
        },
      },
    ]);
  };

  const handleDeleteVideo = (video: VaultVideo) => {
    Alert.alert('Eliminar video', `¿Eliminar "${video.title}" del cofre?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await VaultService.removeVideo(video.id);
            setVideos(videos.filter(v => v.id !== video.id));
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const handlePlayVideo = (video: VaultVideo) => {
    play({
      id: video.id,
      name: video.title,
      path: video.path,
      source: 'Cofre Privado',
    });
    navigation.navigate('Player');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const renderVideoItem = ({ item }: { item: VaultVideo }) => (
    <TouchableOpacity style={styles.videoItem} onPress={() => handlePlayVideo(item)}>
      <View style={styles.videoThumbnail}>
        <Icon name="videocam" size={30} color="#E91E63" />
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.videoMeta}>
          {formatSize(item.size)} • {new Date(item.addedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity style={styles.playBtn}>
        <Icon name="play-circle" size={36} color="#1DB954" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreBtn} onPress={() => handleDeleteVideo(item)}>
        <Icon name="trash-outline" size={20} color="#E91E63" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Icon name="lock-closed" size={20} color="#E91E63" />
            <Text style={styles.title}>Mi Cofre</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddVideo}>
            <Icon name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Videos privados protegidos con patrón y PIN
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Icon name="lock-closed" size={60} color="#E91E63" />
            <Text style={styles.loadingText}>Cargando videos...</Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#E91E63"
                colors={['#E91E63']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="shield-checkmark" size={80} color="#E91E63" />
                </View>
                <Text style={styles.emptyTitle}>Cofre seguro</Text>
                <Text style={styles.emptySubtitle}>
                  Tus videos privados estarán protegidos aquí.{'\n'}
                  Nadie podrá acceder sin tu patrón y PIN.
                </Text>
                <TouchableOpacity style={styles.addVideoBtn} onPress={handleAddVideo}>
                  <Icon name="add-circle" size={24} color="#fff" />
                  <Text style={styles.addVideoBtnText}>Agregar primer video</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addBtn: { padding: 8, backgroundColor: '#E91E63', borderRadius: 20 },
  subtitle: {
    color: '#535353', fontSize: 13, textAlign: 'center',
    paddingHorizontal: 40, marginBottom: 20,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#535353', marginTop: 15, fontSize: 16 },
  listContent: { padding: 15 },
  videoItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#181818',
    padding: 12, borderRadius: 12, marginBottom: 10,
  },
  videoThumbnail: {
    width: 80, height: 50, backgroundColor: '#282828',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  videoInfo: { flex: 1, marginLeft: 12 },
  videoName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  videoMeta: { color: '#535353', fontSize: 12, marginTop: 4 },
  playBtn: { padding: 8 },
  moreBtn: { padding: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIconContainer: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#E91E6315', justifyContent: 'center', alignItems: 'center',
    marginBottom: 25,
  },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  emptySubtitle: {
    color: '#535353', fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginBottom: 30,
  },
  addVideoBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E91E63',
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 25, gap: 8,
  },
  addVideoBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default VaultHomeScreen;
