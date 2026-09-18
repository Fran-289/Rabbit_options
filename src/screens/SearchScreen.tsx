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
  NetInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import SearchBar from '../components/SearchBar';
import YouTubeService, { YouTubeVideo } from '../services/youtubeService';
import SearchHistoryService from '../services/searchHistoryService';
import SettingsService from '../services/settingsService';
import { useMusic } from '../context/MusicContext';
import { useTheme } from '../context/ThemeContext';

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
  const { colors } = useTheme();

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

    const settings = await SettingsService.getSettings();
    if (settings.wifiOnly) {
      const { default: NetInfoModule } = await import('@react-native-community/netinfo');
      const state = await NetInfoModule.fetch();
      if (!state.isConnected || state.type !== 'wifi') {
        Alert.alert(
          'WiFi requerido',
          'Tienes activada la opción "Solo WiFi" para descargas. Conectate a una red WiFi o desactiva esta opción en Configuración.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ir a Configuración', onPress: () => navigation.navigate('Settings') },
          ]
        );
        return;
      }
    }

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
            {
              text: 'Ver descargas',
              onPress: () => navigation.navigate('Descargas'),
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
            {
              text: 'Ver descargas',
              onPress: () => navigation.navigate('Descargas'),
            },
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
            <Icon name="play-circle" size={16} color={colors.primary} />
            <Text style={[styles.previewText, { color: colors.primary }]}>Vista previa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedVideo(item)}>
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
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color={colors.text} />
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
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Buscando...</Text>
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
          <View style={[styles.downloadPanel, { backgroundColor: colors.card }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>Selecciona formato</Text>
              <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.panelVideoInfo, { backgroundColor: colors.surfaceLight }]}>
              {selectedVideo.thumbnail && (
                <Image source={{ uri: selectedVideo.thumbnail }} style={styles.panelThumbnail} />
              )}
              <Text style={[styles.panelVideoTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedVideo.title}
              </Text>
            </View>

            <Text style={[styles.formatLabel, { color: colors.textMuted }]}>Audio</Text>
            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: colors.surfaceLight }]}
              onPress={() => handleDownload('mp3', '128kbps')}>
              <Icon name="musical-notes" size={22} color={colors.primary} />
              <Text style={[styles.formatName, { color: colors.text }]}>MP3 - 128kbps</Text>
              <Text style={[styles.formatSize, { color: colors.textMuted }]}>~3-5 MB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: colors.surfaceLight }]}
              onPress={() => handleDownload('mp3', '320kbps')}>
              <Icon name="musical-notes" size={22} color={colors.primary} />
              <Text style={[styles.formatName, { color: colors.text }]}>MP3 - 320kbps</Text>
              <Text style={[styles.formatSize, { color: colors.textMuted }]}>~8-12 MB</Text>
            </TouchableOpacity>

            <Text style={[styles.formatLabel, { color: colors.textMuted }]}>Video</Text>
            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: colors.surfaceLight }]}
              onPress={() => handleDownload('mp4', '720')}>
              <Icon name="videocam" size={22} color="#FF9800" />
              <Text style={[styles.formatName, { color: colors.text }]}>MP4 - 720p</Text>
              <Text style={[styles.formatSize, { color: colors.textMuted }]}>~20-50 MB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: colors.surfaceLight }]}
              onPress={() => handleDownload('mp4', '1080')}>
              <Icon name="videocam" size={22} color={colors.accent} />
              <Text style={[styles.formatName, { color: colors.text }]}>MP4 - 1080p</Text>
              <Text style={[styles.formatSize, { color: colors.textMuted }]}>~50-150 MB</Text>
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
                { transform: [{ scale: downloadScale }], backgroundColor: colors.card },
              ]}>
              <View style={[styles.downloadIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Icon name="download" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.downloadingText, { color: colors.text }]}>Descargando...</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceLight }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${downloadProgress}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>{Math.round(downloadProgress)}%</Text>
              </View>
              <Text style={[styles.downloadingSubtext, { color: colors.textMuted }]}>
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
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 0.5 },
  searchContainer: { flex: 1, marginLeft: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16 },
  listContent: { padding: 15 },
  videoItem: { flexDirection: 'row', borderRadius: 12, padding: 10, marginBottom: 12 },
  thumbnailContainer: { position: 'relative' },
  thumbnail: { width: 130, height: 75, borderRadius: 8 },
  thumbnailPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  durationBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 11 },
  videoInfo: { flex: 1, marginLeft: 12 },
  videoTitle: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  videoChannel: { fontSize: 11, marginTop: 4 },
  videoViews: { fontSize: 10, marginTop: 2 },
  previewRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  previewText: { fontSize: 11, marginLeft: 4 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  downloadText: { color: '#fff', fontSize: 11, marginLeft: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: { fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  downloadPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  panelTitle: { fontSize: 18, fontWeight: '600' },
  panelVideoInfo: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 20 },
  panelThumbnail: { width: 60, height: 35, borderRadius: 6 },
  panelVideoTitle: { fontSize: 13, marginLeft: 12, flex: 1 },
  formatLabel: { fontSize: 11, textTransform: 'uppercase', marginBottom: 8, marginTop: 5 },
  formatOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, marginBottom: 8, gap: 12,
  },
  formatOptionDisabled: { opacity: 0.5 },
  formatName: { fontSize: 15, fontWeight: '500', flex: 1 },
  formatSize: { fontSize: 12 },
  downloadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center',
  },
  downloadingContent: {
    alignItems: 'center', padding: 40,
    borderRadius: 20, marginHorizontal: 40,
  },
  downloadIconContainer: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  downloadingText: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  downloadingSubtext: { fontSize: 14, marginTop: 15 },
  progressBarContainer: { width: 250, alignItems: 'center' },
  progressBarBg: { width: '100%', height: 6, borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 14, marginTop: 10 },
  footerLoader: { paddingVertical: 20 },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 15, paddingHorizontal: 5,
  },
  historyTitle: { fontSize: 16, fontWeight: '600' },
  clearHistoryText: { fontSize: 14 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 10, marginBottom: 8, gap: 12,
  },
  historyText: { fontSize: 14, flex: 1 },
});

export default SearchScreen;
