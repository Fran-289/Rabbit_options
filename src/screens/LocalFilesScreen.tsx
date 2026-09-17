import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  ActivityIndicator, Alert, TextInput, Linking, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import { useTheme } from '../context/ThemeContext';
import StorageService from '../services/storageService';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

interface LocalFile {
  id: string;
  name: string;
  path: string;
  size: string;
  source: string;
  sourceIcon: string;
  sourceColor: string;
  isVideo: boolean;
}

const LocalFilesScreen = ({ navigation }: any) => {
  const { colors, t } = useTheme();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'local' | 'download'>('local');
  const [activeFilter, setActiveFilter] = useState('all');
  const [urlInput, setUrlInput] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayScale = useRef(new Animated.Value(0.8)).current;
  const [choiceModal, setChoiceModal] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    loadLocalFiles();
  }, []);

  const loadLocalFiles = async () => {
    setLoading(true);
    const allFiles: LocalFile[] = [];

    const folders = [
      { path: 'WhatsApp/Audio', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
      { path: 'WhatsApp/Voice Notes', name: 'WhatsApp VN', icon: 'mic', color: '#25D366' },
      { path: 'WhatsApp/Video', name: 'WhatsApp Video', icon: 'logo-whatsapp', color: '#25D366' },
      { path: 'Telegram/Telegram Audio', name: 'Telegram', icon: 'paper-plane', color: '#0088cc' },
      { path: 'Telegram/Telegram Video', name: 'Telegram Video', icon: 'paper-plane', color: '#0088cc' },
      { path: 'Messenger', name: 'Messenger', icon: 'chatbubbles', color: '#A033FF' },
      { path: 'Download', name: 'Download', icon: 'download', color: '#FF9800' },
      { path: 'Movies', name: 'Movies', icon: 'film', color: '#9C27B0' },
      { path: 'DCIM', name: 'Camara', icon: 'camera', color: '#607D8B' },
      { path: 'Snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
      { path: 'TikTok', name: 'TikTok', icon: 'musical-notes', color: '#fe2c55' },
      { path: 'Instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
      { path: 'Twitter', name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
      { path: 'Facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    ];

    for (const folder of folders) {
      try {
        const basePath = `/storage/emulated/0/${folder.path}`;
        const exists = await RNFS.exists(basePath);
        if (exists) {
          const folderFiles = await RNFS.readDir(basePath);
          const mediaFiles = folderFiles.filter(f =>
            f.name.endsWith('.mp3') || f.name.endsWith('.opus') ||
            f.name.endsWith('.m4a') || f.name.endsWith('.ogg') ||
            f.name.endsWith('.mp4') || f.name.endsWith('.mkv') ||
            f.name.endsWith('.3gp') || f.name.endsWith('.webm') ||
            f.name.endsWith('.wav') || f.name.endsWith('.aac')
          );
          for (const file of mediaFiles.slice(0, 100)) {
            const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.mkv') ||
              file.name.endsWith('.3gp') || file.name.endsWith('.webm');
            allFiles.push({
              id: `${folder.name}_${file.name}`,
              name: file.name.replace(/\.[^.]+$/, ''),
              path: file.path,
              size: file.size < 1024 * 1024
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              source: folder.name,
              sourceIcon: folder.icon,
              sourceColor: folder.color,
              isVideo,
            });
          }
        }
      } catch (error) { /* skip */ }
    }
    allFiles.sort((a, b) => a.source.localeCompare(b.source));
    setFiles(allFiles);
    setLoading(false);
  };

  const handlePlay = (file: LocalFile) => {
    navigation.navigate('Player', { track: { ...file, name: file.name } });
  };

  const openInAppBrowser = async (url: string, name: string) => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          animated: true,
          modalPresentationStyle: 'fullScreen',
          showTitle: true,
          enableUrlBarHiding: true,
          enableDefaultShare: true,
        });
      } else {
        Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo abrir ${name}`);
    }
  };

  const openExternalBrowser = (url: string) => {
    Linking.openURL(url);
  };

  const allLinks = [
    { name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', url: 'https://m.youtube.com' },
    { name: 'TikTok', icon: 'musical-notes', color: '#fe2c55', url: 'https://www.tiktok.com' },
    { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C', url: 'https://www.instagram.com' },
    { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', url: 'https://m.facebook.com' },
    { name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2', url: 'https://x.com' },
    { name: 'SoundCloud', icon: 'cloud', color: '#FF5500', url: 'https://soundcloud.com' },
    { name: 'Twitch', icon: 'logo-twitch', color: '#9146FF', url: 'https://m.twitch.tv' },
    { name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023', url: 'https://pinterest.com' },
    { name: 'Reddit', icon: 'logo-reddit', color: '#FF4500', url: 'https://m.reddit.com' },
    { name: 'Vimeo', icon: 'videocam', color: '#1AB7EA', url: 'https://vimeo.com' },
    { name: 'Dailymotion', icon: 'play-circle', color: '#0066DC', url: 'https://www.dailymotion.com' },
    { name: 'Google', icon: 'logo-google', color: '#4285F4', url: 'https://www.google.com' },
    { name: 'Brave', icon: 'shield', color: '#FB542B', url: 'https://search.brave.com' },
    { name: 'DuckDuckGo', icon: 'search', color: '#DE5833', url: 'https://duckduckgo.com' },
    { name: 'Bing', icon: 'globe', color: '#00809D', url: 'https://www.bing.com' },
    { name: 'Yahoo', icon: 'logo-yahoo', color: '#6001D2', url: 'https://m.yahoo.com' },
    { name: 'Ecosia', icon: 'leaf', color: '#44B461', url: 'https://www.ecosia.org' },
  ];

  const handleUrlDownload = async () => {
    const url = urlInput.trim();
    if (!url) return;

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    setDownloading(true);
    setDownloadProgress(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(overlayScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    try {
      const apiUrl = 'https://co.wuk.sh/api/json';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, isAudioOnly: true, aFormat: 'mp3' }),
      });
      const data = await response.json();

      if (data.url) {
        const musicPath = await StorageService.getMusicPath();
        const downloadPath = `${musicPath}/descarga_${Date.now()}.mp3`;
        setDownloadProgress(20);
        await RNFS.downloadFile({
          fromUrl: data.url,
          toFile: downloadPath,
          progress: (res) => {
            setDownloadProgress(Math.min((res.bytesWritten / res.contentLength) * 100, 100));
          },
        }).promise;
        setDownloadProgress(100);
        Alert.alert('Descarga completada', 'Archivo guardado en tu musica', [
          { text: 'Cerrar' },
        ]);
        setUrlInput('');
        loadLocalFiles();
      } else {
        Alert.alert('Error', 'No se pudo descargar desde ese enlace');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo descargar. Verifica el enlace.');
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayScale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
    ]).start(() => { setDownloading(false); setDownloadProgress(0); });
  };

  const filteredFiles = activeFilter === 'all'
    ? files
    : activeFilter === 'video'
      ? files.filter(f => f.isVideo)
      : activeFilter === 'audio'
        ? files.filter(f => !f.isVideo)
        : files.filter(f => f.source.toLowerCase().includes(activeFilter.toLowerCase()));

  const renderFileItem = ({ item }: { item: LocalFile }) => (
    <TouchableOpacity style={[styles.fileItem, { backgroundColor: colors.surface }]} onPress={() => handlePlay(item)}>
      <View style={[styles.sourceIcon, { backgroundColor: `${item.sourceColor}20` }]}>
        <Icon name={item.isVideo ? 'videocam' : item.sourceIcon} size={22} color={item.sourceColor} />
      </View>
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.fileMeta, { color: colors.textMuted }]}>{item.source} {item.size}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: item.isVideo ? '#E91E6320' : '#1DB95420' }]}>
        <Text style={[styles.badgeText, { color: item.isVideo ? '#E91E63' : '#1DB954' }]}>
          {item.isVideo ? 'VIDEO' : 'AUDIO'}
        </Text>
      </View>
      <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(item)}>
        <Icon name="play-circle" size={34} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {activeTab === 'local' ? t('files') : t('download')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'local' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('local')}>
            <Icon name="folder-open" size={18} color={activeTab === 'local' ? '#fff' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'local' ? '#fff' : colors.textMuted }]}>{t('files')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'download' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('download')}>
            <Icon name="globe" size={18} color={activeTab === 'download' ? '#fff' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'download' ? '#fff' : colors.textMuted }]}>Redes Sociales</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'local' ? (
          <>
            <View style={styles.filterContainer}>
              {[
                { key: 'all', label: t('all') },
                { key: 'audio', label: t('audio'), icon: 'musical-notes', color: '#1DB954' },
                { key: 'video', label: t('video'), icon: 'videocam', color: '#E91E63' },
                { key: 'whatsapp', label: 'WA', icon: 'logo-whatsapp', color: '#25D366' },
                { key: 'telegram', label: 'TG', icon: 'paper-plane', color: '#0088cc' },
                { key: 'download', label: 'DL', icon: 'download', color: '#FF9800' },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterBtn, activeFilter === f.key && { backgroundColor: colors.primary }]}
                  onPress={() => setActiveFilter(f.key)}>
                  {f.icon && <Icon name={f.icon} size={13} color={activeFilter === f.key ? '#fff' : f.color} />}
                  <Text style={[styles.filterText, { color: activeFilter === f.key ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Escaneando archivos...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                renderItem={renderFileItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<Text style={[styles.resultCount, { color: colors.textMuted }]}>{filteredFiles.length} archivos encontrados</Text>}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="folder-open-outline" size={80} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noFiles')}</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>No hay archivos multimedia en las carpetas del dispositivo</Text>
                  </View>
                }
              />
            )}
          </>
        ) : (
          <ScrollView style={styles.downloadContainer} contentContainerStyle={{ paddingBottom: 30 }}>
            <View style={[styles.socialHeader, { backgroundColor: colors.surface }]}>
              <Icon name="globe" size={40} color={colors.primary} />
              <Text style={[styles.socialTitle, { color: colors.text }]}>Redes Sociales</Text>
              <Text style={[styles.socialSubtitle, { color: colors.textMuted }]}>
                Abre la red social dentro de la app o en el navegador externo
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Redes sociales y navegadores - Toca para elegir como abrir</Text>
            <View style={styles.socialGrid}>
              {allLinks.map((link) => (
                <TouchableOpacity
                  key={link.name}
                  style={[styles.socialCard, { backgroundColor: colors.surface }]}
                  onPress={() => setChoiceModal({ name: link.name, url: link.url })}>
                  <View style={[styles.socialIcon, { backgroundColor: `${link.color}20` }]}>
                    <Icon name={link.icon} size={28} color={link.color} />
                  </View>
                  <Text style={[styles.socialName, { color: colors.text }]}>{link.name}</Text>
                  <Text style={[styles.socialAction, { color: colors.primary }]}>Abrir</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.downloadSection, { backgroundColor: colors.surface }]}>
              <Icon name="download-circle" size={36} color={colors.primary} />
              <Text style={[styles.downloadTitle, { color: colors.text }]}>Descarga por enlace</Text>
              <Text style={[styles.downloadSubtitle, { color: colors.textMuted }]}>Pega un enlace de cualquier red social</Text>
              <View style={[styles.urlBar, { backgroundColor: colors.inputBg }]}>
                <Icon name="link" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.urlInput, { color: colors.text }]}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="Pega el enlace aqui..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {urlInput.length > 0 && (
                  <TouchableOpacity onPress={() => setUrlInput('')}>
                    <Icon name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.dlBtn, { backgroundColor: colors.primary }, !urlInput.trim() && { opacity: 0.4 }]}
                onPress={handleUrlDownload}
                disabled={!urlInput.trim() || downloading}>
                {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="download" size={20} color="#fff" />}
                <Text style={styles.dlBtnText}>{downloading ? 'Descargando...' : 'Descargar MP3'}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
              <Icon name="information-circle" size={20} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Abre la red social dentro de la app, busca el contenido, y copia el enlace para pegarlo en la seccion de descarga.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>

      <Modal visible={!!choiceModal} transparent animationType="fade">
        <View style={styles.choiceOverlay}>
          <View style={[styles.choiceContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.choiceTitle, { color: colors.text }]}>{choiceModal?.name}</Text>
            <Text style={[styles.choiceSubtitle, { color: colors.textMuted }]}>Como quieres abrir?</Text>
            <TouchableOpacity
              style={[styles.choiceBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (choiceModal) openInAppBrowser(choiceModal.url, choiceModal.name);
                setChoiceModal(null);
              }}>
              <Icon name="phone-portrait-outline" size={22} color="#fff" />
              <Text style={styles.choiceBtnText}>En la app</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => {
                if (choiceModal) openExternalBrowser(choiceModal.url);
                setChoiceModal(null);
              }}>
              <Icon name="open-outline" size={22} color={colors.text} />
              <Text style={[styles.choiceBtnText, { color: colors.text }]}>Navegador externo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setChoiceModal(null)}>
              <Text style={[styles.choiceCancel, { color: colors.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {downloading && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View style={[styles.overlayContent, { transform: [{ scale: overlayScale }], backgroundColor: colors.card }]}>
            <View style={[styles.overlayIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Icon name="download" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.overlayTitle, { color: colors.text }]}>Descargando...</Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.inputBg }]}>
              <View style={[styles.progressBarFill, { width: `${downloadProgress}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.overlayProgress, { color: colors.textSecondary }]}>{Math.round(downloadProgress)}%</Text>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 0.5 },
  title: { fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 15, borderRadius: 12, padding: 4, marginVertical: 12 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabText: { fontSize: 14, fontWeight: '500' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10, gap: 6, flexWrap: 'wrap' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#181818', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  filterText: { fontSize: 12 },
  resultCount: { fontSize: 12, marginBottom: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16 },
  listContent: { padding: 15 },
  fileItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8 },
  sourceIcon: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '500' },
  fileMeta: { fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 8 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  playBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: { fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  downloadContainer: { flex: 1, paddingHorizontal: 15 },
  socialHeader: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  socialTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  socialSubtitle: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  sectionLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 5 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  socialCard: { borderRadius: 12, padding: 12, alignItems: 'center', flexGrow: 1, flexBasis: '30%', minWidth: 95 },
  socialIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  socialName: { fontSize: 11, fontWeight: '500' },
  socialAction: { fontSize: 10, marginTop: 2 },
  downloadSection: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  downloadTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  downloadSubtitle: { fontSize: 12, marginTop: 4, marginBottom: 12 },
  urlBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, width: '100%', gap: 8 },
  urlInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  dlBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 8, marginTop: 12 },
  dlBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  infoBox: { flexDirection: 'row', padding: 12, borderRadius: 10, gap: 10, marginBottom: 30 },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  overlayContent: { alignItems: 'center', padding: 40, borderRadius: 20, marginHorizontal: 40 },
  overlayIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  overlayTitle: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  overlayProgress: { fontSize: 14, marginTop: 10 },
  progressBarBg: { width: 250, height: 6, borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  choiceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  choiceContent: { width: '80%', borderRadius: 20, padding: 24, alignItems: 'center' },
  choiceTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  choiceSubtitle: { fontSize: 13, marginBottom: 20 },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 14, borderRadius: 12, gap: 10, marginBottom: 10 },
  choiceBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  choiceCancel: { fontSize: 14, marginTop: 8 },
});

export default LocalFilesScreen;
