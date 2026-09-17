import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import SearchBar from '../components/SearchBar';
import YouTubeService, { YouTubeVideo } from '../services/youtubeService';
import SearchHistoryService from '../services/searchHistoryService';
import { useMusic } from '../context/MusicContext';

const SearchScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const downloadOverlayOpacity = useRef(new Animated.Value(0)).current;
  const downloadScale = useRef(new Animated.Value(0.8)).current;

  const { play } = useMusic();

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    const history = await SearchHistoryService.getRecentSearches(8);
    setSearchHistory(history);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResults([]);
    setNextPageToken(undefined);
    setShowHistory(false);

    await SearchHistoryService.addSearch(searchQuery);
    loadSearchHistory();

    try {
      const response = await YouTubeService.searchVideos(searchQuery);
      setResults(response.videos);
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron buscar videos');
    }
    setLoading(false);
  };

  const handleHistoryPress = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  const handleClearHistory = async () => {
    Alert.alert('Limpiar historial', '¿Eliminar todo el historial de búsquedas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
        style: 'destructive',
        onPress: async () => {
          await SearchHistoryService.clearHistory();
          setSearchHistory([]);
        },
      },
    ]);
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await YouTubeService.searchVideos(query, nextPageToken);
      setResults(prev => [...prev, ...response.videos]);
      setNextPageToken(response.nextPageToken);
    } catch (error) {
      console.error('Error loading more:', error);
    }
    setLoadingMore(false);
  };

  const handleDownload = async (format: 'mp3' | 'mp4', quality: string) => {
    if (!selectedVideo) return;
    setDownloading(true);
    setDownloadProgress(0);

    Animated.parallel([
      Animated.timing(downloadOverlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(downloadScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (format === 'mp3') {
        const filePath = await YouTubeService.downloadAudio(
          selectedVideo.id,
          selectedVideo.title,
          (progress) => {
            setDownloadProgress(progress);
          }
        );

        Alert.alert(
          'Descarga completada',
          `"${selectedVideo.title}" descargado como MP3 (${quality})`,
          [
            {
              text: 'Reproducir ahora',
              onPress: () => {
                play({
                  id: `track_${Date.now()}`,
                  name: selectedVideo.title,
                  path: filePath,
                  source: selectedVideo.channel,
                });
                navigation.navigate('Player');
              },
            },
            { text: 'Cerrar' },
          ]
        );
      } else {
        const filePath = await YouTubeService.downloadVideo(
          selectedVideo.id,
          selectedVideo.title,
          quality,
          (progress) => {
            setDownloadProgress(progress);
          }
        );

        Alert.alert(
          'Descarga completada',
          `"${selectedVideo.title}" descargado como MP4 (${quality})`,
          [
            { text: 'Cerrar' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo descargar el archivo. Verifica tu conexión.');
    }

    Animated.parallel([
      Animated.timing(downloadOverlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(downloadScale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDownloading(false);
      setSelectedVideo(null);
      setDownloadProgress(0);
    });
  };

  const renderVideoItem = ({ item }: { item: YouTubeVideo }) => (
    <View style={styles.videoItem}>
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Icon name="videocam" size={30} color="#535353" />
          </View>
        )}
        {item.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoChannel} numberOfLines={1}>{item.channel}</Text>
        {item.viewCount ? <Text style={styles.videoViews}>{item.viewCount}</Text> : null}
        <View style={styles.previewRow}>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => {
              play({
                id: `preview_${item.id}`,
                name: item.title,
                path: `https://www.youtube.com/watch?v=${item.id}`,
                source: item.channel,
              });
            }}>
            <Icon name="play-circle" size={16} color="#1DB954" />
            <Text style={styles.previewText}>Vista previa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadBtn} onPress={() => setSelectedVideo(item)}>
            <Icon name="download" size={16} color="#fff" />
            <Text style={styles.downloadText}>Descargar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1DB954" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Buscar en YouTube..."
              onSearch={handleSearch}
              loading={loading}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {searchHistory.length > 0 ? (
                  <>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyTitle}>Búsquedas recientes</Text>
                      <TouchableOpacity onPress={handleClearHistory}>
                        <Text style={styles.clearHistoryText}>Limpiar</Text>
                      </TouchableOpacity>
                    </View>
                    {searchHistory.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.historyItem}
                        onPress={() => handleHistoryPress(item)}>
                        <Icon name="time-outline" size={20} color="#535353" />
                        <Text style={styles.historyText}>{item}</Text>
                        <Icon name="arrow-forward" size={16} color="#535353" />
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <>
                    <Icon name="logo-youtube" size={80} color="#FF0000" />
                    <Text style={styles.emptyTitle}>Busca tu música favorita</Text>
                    <Text style={styles.emptySubtitle}>
                      Escribe el nombre de una canción, artista o video
                    </Text>
                  </>
                )}
              </View>
            }
          />
        )}

        {selectedVideo && (
          <View style={styles.downloadPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Selecciona formato</Text>
              <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.panelVideoInfo}>
              {selectedVideo.thumbnail && (
                <Image source={{ uri: selectedVideo.thumbnail }} style={styles.panelThumbnail} />
              )}
              <Text style={styles.panelVideoTitle} numberOfLines={1}>
                {selectedVideo.title}
              </Text>
            </View>

            <Text style={styles.formatLabel}>Audio</Text>
            <TouchableOpacity
              style={styles.formatOption}
              onPress={() => handleDownload('mp3', '128kbps')}>
              <Icon name="musical-notes" size={22} color="#1DB954" />
              <Text style={styles.formatName}>MP3 - 128kbps</Text>
              <Text style={styles.formatSize}>~3-5 MB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.formatOption}
              onPress={() => handleDownload('mp3', '320kbps')}>
              <Icon name="musical-notes" size={22} color="#1DB954" />
              <Text style={styles.formatName}>MP3 - 320kbps</Text>
              <Text style={styles.formatSize}>~8-12 MB</Text>
            </TouchableOpacity>

            <Text style={styles.formatLabel}>Video</Text>
            <TouchableOpacity
              style={styles.formatOption}
              onPress={() => handleDownload('mp4', '720')}>
              <Icon name="videocam" size={22} color="#FF9800" />
              <Text style={styles.formatName}>MP4 - 720p</Text>
              <Text style={styles.formatSize}>~20-50 MB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.formatOption}
              onPress={() => handleDownload('mp4', '1080')}>
              <Icon name="videocam" size={22} color="#E91E63" />
              <Text style={styles.formatName}>MP4 - 1080p</Text>
              <Text style={styles.formatSize}>~50-150 MB</Text>
            </TouchableOpacity>
          </View>
        )}

        {downloading && (
          <Animated.View
            style={[
              styles.downloadingOverlay,
              { opacity: downloadOverlayOpacity },
            ]}>
            <Animated.View
              style={[
                styles.downloadingContent,
                { transform: [{ scale: downloadScale }] },
              ]}>
              <View style={styles.downloadIconContainer}>
                <Icon name="download" size={40} color="#1DB954" />
              </View>
              <Text style={styles.downloadingText}>Descargando...</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${downloadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
              </View>
              <Text style={styles.downloadingSubtext}>
                {downloadProgress < 100 ? 'Por favor espera...' : '¡Completado!'}
              </Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  searchContainer: { flex: 1, marginLeft: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#b3b3b3', marginTop: 15, fontSize: 16 },
  listContent: { padding: 15 },
  videoItem: { flexDirection: 'row', backgroundColor: '#181818', borderRadius: 12, padding: 10, marginBottom: 12 },
  thumbnailContainer: { position: 'relative' },
  thumbnail: { width: 130, height: 75, borderRadius: 8 },
  thumbnailPlaceholder: { backgroundColor: '#282828', justifyContent: 'center', alignItems: 'center' },
  durationBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 11 },
  videoInfo: { flex: 1, marginLeft: 12 },
  videoTitle: { color: '#fff', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  videoChannel: { color: '#b3b3b3', fontSize: 11, marginTop: 4 },
  videoViews: { color: '#535353', fontSize: 10, marginTop: 2 },
  previewRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#282828', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  previewText: { color: '#1DB954', fontSize: 11, marginLeft: 4 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1DB954', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  downloadText: { color: '#fff', fontSize: 11, marginLeft: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: { color: '#535353', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  downloadPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  panelTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  panelVideoInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#282828', padding: 12, borderRadius: 10, marginBottom: 20 },
  panelThumbnail: { width: 60, height: 35, borderRadius: 6 },
  panelVideoTitle: { color: '#fff', fontSize: 13, marginLeft: 12, flex: 1 },
  formatLabel: { color: '#535353', fontSize: 11, textTransform: 'uppercase', marginBottom: 8, marginTop: 5 },
  formatOption: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#282828',
    padding: 14, borderRadius: 12, marginBottom: 8, gap: 12,
  },
  formatOptionDisabled: { opacity: 0.5 },
  formatName: { color: '#fff', fontSize: 15, fontWeight: '500', flex: 1 },
  formatSize: { color: '#535353', fontSize: 12 },
  downloadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center',
  },
  downloadingContent: {
    alignItems: 'center', padding: 40, backgroundColor: '#1E1E1E',
    borderRadius: 20, marginHorizontal: 40,
  },
  downloadIconContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1DB95420',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  downloadingText: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 20 },
  downloadingSubtext: { color: '#535353', fontSize: 14, marginTop: 15 },
  progressBarContainer: { width: 250, alignItems: 'center' },
  progressBarBg: { width: '100%', height: 6, backgroundColor: '#282828', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#1DB954', borderRadius: 3 },
  progressText: { color: '#b3b3b3', fontSize: 14, marginTop: 10 },
  footerLoader: { paddingVertical: 20 },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 15, paddingHorizontal: 5,
  },
  historyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  clearHistoryText: { color: '#1DB954', fontSize: 14 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#181818',
    padding: 14, borderRadius: 10, marginBottom: 8, gap: 12,
  },
  historyText: { color: '#b3b3b3', fontSize: 14, flex: 1 },
});

export default SearchScreen;
