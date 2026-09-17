import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import StorageService from '../services/storageService';
import PlaylistService, { Playlist } from '../services/playlistService';
import { useTheme } from '../context/ThemeContext';
import { useMusic, Track } from '../context/MusicContext';

type ViewMode = 'tabs' | 'playlistDetail';

const MiMusicaScreen = ({ navigation }: any) => {
  const { colors, t } = useTheme();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'playlists'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<Track | null>(null);

  const { play, favorites, setQueue, currentTrack, isPlaying, toggleFavorite } = useMusic();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    setLoading(true);
    try {
      await PlaylistService.loadPlaylists();
      setPlaylists(PlaylistService.getPlaylists());

      const path = await StorageService.getMusicPath();
      const exists = await RNFS.exists(path);
      if (exists) {
        const files = await RNFS.readDir(path);
        const mp3Files = files.filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.opus'));
        setTracks(mp3Files.map((file, index) => ({
          id: `track_${index}_${file.name}`,
          name: file.name.replace(/\.(mp3|opus)$/, ''),
          path: file.path,
          source: 'Mi musica',
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handlePlay = (track: Track, index: number, trackList?: Track[]) => {
    const list = trackList || tracks;
    setQueue(list, index);
    play(track);
    navigation.navigate('Player');
  };

  const isFavorite = (trackId: string) => favorites.includes(trackId);

  const getPlaylistTracks = (playlist: Playlist): Track[] => {
    return playlist.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter((t): t is Track => t !== undefined);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await PlaylistService.createPlaylist(newPlaylistName.trim());
    setPlaylists(PlaylistService.getPlaylists());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert('Eliminar lista', `Eliminar "${playlist.name}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await PlaylistService.deletePlaylist(playlist.id);
          setPlaylists(PlaylistService.getPlaylists());
          if (selectedPlaylist?.id === playlist.id) {
            setViewMode('tabs');
            setSelectedPlaylist(null);
          }
        },
      },
    ]);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!showAddToPlaylist) return;
    await PlaylistService.addTrackToPlaylist(playlistId, showAddToPlaylist.id);
    setPlaylists(PlaylistService.getPlaylists());
    setShowAddToPlaylist(null);
    Alert.alert('Agregado', 'Cancion agregada a la lista');
  };

  const handleRemoveFromPlaylist = (trackId: string) => {
    if (!selectedPlaylist) return;
    Alert.alert('Remover', 'Quitar de esta lista?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive',
        onPress: async () => {
          await PlaylistService.removeTrackFromPlaylist(selectedPlaylist.id, trackId);
          const updated = PlaylistService.getPlaylist(selectedPlaylist.id);
          if (updated) setSelectedPlaylist(updated);
          setPlaylists(PlaylistService.getPlaylists());
        },
      },
    ]);
  };

  const filteredTracks = activeTab === 'favorites'
    ? tracks.filter(t => isFavorite(t.id))
    : tracks;

  const playlistTracks = selectedPlaylist ? getPlaylistTracks(selectedPlaylist) : [];

  const renderTrackItem = ({ item, index, inPlaylist }: { item: Track; index: number; inPlaylist?: boolean }) => {
    const isCurrentTrack = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.trackItem, { backgroundColor: colors.surface }, isCurrentTrack && { backgroundColor: `${colors.primary}15` }]}
        onPress={() => handlePlay(item, index, inPlaylist ? playlistTracks : undefined)}>
        <View style={styles.trackIndex}>
          {isCurrentTrack && isPlaying ? (
            <Icon name="volume-high" size={16} color={colors.primary} />
          ) : (
            <Text style={[styles.indexText, { color: colors.textMuted }]}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, { color: isCurrentTrack ? colors.primary : colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.trackMeta, { color: colors.textMuted }]}>{item.source || 'Mi musica'}</Text>
        </View>
        {inPlaylist ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemoveFromPlaylist(item.id)}>
            <Icon name="remove-circle-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleFavorite(item.id)}>
            <Icon
              name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite(item.id) ? '#E91E63' : colors.textMuted}
            />
          </TouchableOpacity>
        )}
        {inPlaylist ? null : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddToPlaylist(item)}>
            <Icon name="add-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handlePlay(item, index, inPlaylist ? playlistTracks : undefined)}>
          <Icon name="play-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => {
    const count = item.trackIds.length;
    return (
      <TouchableOpacity
        style={[styles.playlistItem, { backgroundColor: colors.surface }]}
        onPress={() => { setSelectedPlaylist(item); setViewMode('playlistDetail'); }}>
        <View style={[styles.playlistIcon, { backgroundColor: `${colors.primary}20` }]}>
          <Icon name="musical-notes" size={24} color={colors.primary} />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={[styles.playlistName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.playlistCount, { color: colors.textMuted }]}>{count} canciones</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {
          if (count > 0) {
            const plTracks = getPlaylistTracks(item);
            setQueue(plTracks, 0);
            play(plTracks[0]);
            navigation.navigate('Player');
          }
        }}>
          <Icon name="play-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeletePlaylist(item)}>
          <Icon name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (viewMode === 'playlistDetail' && selectedPlaylist) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setViewMode('tabs'); setSelectedPlaylist(null); }}>
              <Icon name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{selectedPlaylist.name}</Text>
            <View style={{ width: 40 }} />
          </View>

          {playlistTracks.length > 0 && (
            <TouchableOpacity style={[styles.playAllBtn, { backgroundColor: colors.primary }]} onPress={() => {
              setQueue(playlistTracks, 0);
              play(playlistTracks[0]);
              navigation.navigate('Player');
            }}>
              <Icon name="play-circle" size={24} color="#fff" />
              <Text style={styles.playAllText}>Reproducir todo</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={playlistTracks}
            keyExtractor={(item) => item.id}
            renderItem={(props) => renderTrackItem({ ...props, inPlaylist: true })}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="musical-notes-outline" size={60} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Lista vacia</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Agrega canciones con el boton +</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('myMusic')}</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <Icon name="add-circle" size={30} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {[
            { key: 'all' as const, label: `Todas (${tracks.length})` },
            { key: 'favorites' as const, label: `Favoritas (${tracks.filter(t => isFavorite(t.id)).length})` },
            { key: 'playlists' as const, label: `Listas (${playlists.length})` },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, { backgroundColor: colors.surface }, activeTab === tab.key && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabText, { color: activeTab === tab.key ? '#fff' : colors.textSecondary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab !== 'playlists' && filteredTracks.length > 0 && (
          <TouchableOpacity style={[styles.playAllBtn, { backgroundColor: colors.primary }]} onPress={() => {
            setQueue(filteredTracks, 0);
            play(filteredTracks[0]);
            navigation.navigate('Player');
          }}>
            <Icon name="play-circle" size={24} color="#fff" />
            <Text style={styles.playAllText}>Reproducir todo</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeTab === 'playlists' ? (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            renderItem={renderPlaylistItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="list-outline" size={80} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay listas</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Toca + para crear tu primera lista musical</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredTracks}
            keyExtractor={(item) => item.id}
            renderItem={renderTrackItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="musical-notes-outline" size={80} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {activeTab === 'favorites' ? 'No hay favoritas' : 'No hay musica'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {activeTab === 'favorites' ? 'Marca canciones como favoritas' : 'Descarga musica para comenzar'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nueva lista</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Nombre de la lista..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surface }]} onPress={() => { setShowCreateModal(false); setNewPlaylistName(''); }}>
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleCreatePlaylist}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!showAddToPlaylist} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '60%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Agregar a lista</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{showAddToPlaylist?.name}</Text>
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              style={{ marginTop: 15 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.playlistSelectItem, { backgroundColor: colors.surface }]}
                  onPress={() => handleAddToPlaylist(item.id)}>
                  <Icon name="musical-notes" size={20} color={colors.primary} />
                  <Text style={[styles.playlistSelectName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.playlistSelectCount, { color: colors.textMuted }]}>{item.trackIds.length} tracks</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptySubtitle, { color: colors.textMuted, textAlign: 'center', marginTop: 20 }]}>
                  Crea una lista primero
                </Text>
              }
            />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surface, marginTop: 15 }]} onPress={() => setShowAddToPlaylist(null)}>
              <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 0.5,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, gap: 8 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '500' },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 15, marginBottom: 12, padding: 12, borderRadius: 25,
    justifyContent: 'center',
  },
  playAllText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  listContent: { padding: 15 },
  trackItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 10, marginBottom: 8,
  },
  trackIndex: { width: 30, alignItems: 'center' },
  indexText: { fontSize: 14 },
  trackInfo: { flex: 1, marginLeft: 10 },
  trackName: { fontSize: 15, fontWeight: '500' },
  trackMeta: { fontSize: 12, marginTop: 3 },
  actionBtn: { padding: 8 },
  playlistItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, marginBottom: 10,
  },
  playlistIcon: {
    width: 50, height: 50, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  playlistInfo: { flex: 1, marginLeft: 14 },
  playlistName: { fontSize: 16, fontWeight: '600' },
  playlistCount: { fontSize: 12, marginTop: 3 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: { fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '85%', borderRadius: 20, padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 10 },
  modalInput: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, marginTop: 15,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
  },
  modalBtnText: { fontSize: 16, fontWeight: '600' },
  playlistSelectItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 10, marginBottom: 8, gap: 12,
  },
  playlistSelectName: { flex: 1, fontSize: 15, fontWeight: '500' },
  playlistSelectCount: { fontSize: 12 },
});

export default MiMusicaScreen;
