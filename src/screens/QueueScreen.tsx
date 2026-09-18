import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useMusic, Track } from '../context/MusicContext';
import { useTheme } from '../context/ThemeContext';

const QueueScreen = ({ navigation }: any) => {
  const {
    queue,
    currentTrack,
    currentIndex,
    isPlaying,
    play,
    removeFromQueue,
    clearQueue,
    setQueue,
  } = useMusic();
  const { colors, t } = useTheme();

  const handlePlayTrack = (track: Track, index: number) => {
    setQueue(queue, index);
    play(track);
  };

  const handleRemoveTrack = (trackId: string) => {
    Alert.alert(t('deleteTrack'), t('deleteTrackConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => removeFromQueue(trackId),
      },
    ]);
  };

  const handleClearQueue = () => {
    if (queue.length === 0) return;
    Alert.alert(t('deleteTrack'), t('deleteTrackConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => clearQueue(),
      },
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index - 1];
    newQueue[index - 1] = temp;
    setQueue(newQueue, currentIndex);
  };

  const handleMoveDown = (index: number) => {
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index + 1];
    newQueue[index + 1] = temp;
    setQueue(newQueue, currentIndex);
  };

  const renderQueueItem = ({ item, index }: { item: Track; index: number }) => {
    const isCurrentTrack = index === currentIndex;
    const isPlayingTrack = isCurrentTrack && isPlaying;

    return (
      <View style={[styles.queueItem, { backgroundColor: colors.surface }, isCurrentTrack && { backgroundColor: `${colors.primary}15`, borderLeftWidth: 3, borderLeftColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.queueItemContent}
          onPress={() => handlePlayTrack(item, index)}>
          <View style={styles.trackNumber}>
            {isPlayingTrack ? (
              <Icon name="volume-high" size={16} color={colors.primary} />
            ) : (
              <Text style={[styles.numberText, { color: colors.textMuted }, isCurrentTrack && { color: colors.primary }]}>
                {index + 1}
              </Text>
            )}
          </View>
          <View style={styles.trackInfo}>
            <Text
              style={[styles.trackName, { color: colors.text }, isCurrentTrack && { color: colors.primary }]}
              numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.trackSource, { color: colors.textMuted }]}>{item.source || 'Local'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.trackActions}>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleMoveUp(index)}
            disabled={index === 0}>
            <Icon
              name="chevron-up"
              size={20}
              color={index === 0 ? colors.border : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleMoveDown(index)}
            disabled={index === queue.length - 1}>
            <Icon
              name="chevron-down"
              size={20}
              color={index === queue.length - 1 ? colors.border : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveTrack(item.id)}>
            <Icon name="close-circle" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
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
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Cola de reproducción</Text>
            <Text style={[styles.count, { color: colors.textMuted }]}>{queue.length} canciones</Text>
          </View>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearQueue}>
            <Icon name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {queue.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="list-outline" size={80} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Cola vacía</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Agrega canciones desde la lista de reproducción
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={renderQueueItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  count: { fontSize: 12, marginTop: 3 },
  clearBtn: { padding: 8 },
  listContent: { padding: 15 },
  queueItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 10, marginBottom: 8,
  },
  queueItemContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  trackNumber: { width: 30, alignItems: 'center' },
  numberText: { fontSize: 14 },
  trackInfo: { flex: 1, marginLeft: 10 },
  trackName: { fontSize: 15, fontWeight: '500' },
  trackSource: { fontSize: 12, marginTop: 3 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  moveBtn: { padding: 5 },
  removeBtn: { padding: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: {
    fontSize: 13, marginTop: 8,
    textAlign: 'center', paddingHorizontal: 40,
  },
});

export default QueueScreen;
