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

  const handlePlayTrack = (track: Track, index: number) => {
    setQueue(queue, index);
    play(track);
  };

  const handleRemoveTrack = (trackId: string) => {
    Alert.alert('Eliminar de la cola', '¿Eliminar esta canción de la cola?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeFromQueue(trackId),
      },
    ]);
  };

  const handleClearQueue = () => {
    if (queue.length === 0) return;
    Alert.alert('Limpiar cola', '¿Eliminar todas las canciones de la cola?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
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
      <View style={[styles.queueItem, isCurrentTrack && styles.queueItemActive]}>
        <TouchableOpacity
          style={styles.queueItemContent}
          onPress={() => handlePlayTrack(item, index)}>
          <View style={styles.trackNumber}>
            {isPlayingTrack ? (
              <Icon name="volume-high" size={16} color="#1DB954" />
            ) : (
              <Text style={[styles.numberText, isCurrentTrack && styles.numberTextActive]}>
                {index + 1}
              </Text>
            )}
          </View>
          <View style={styles.trackInfo}>
            <Text
              style={[styles.trackName, isCurrentTrack && styles.trackNameActive]}
              numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.trackSource}>{item.source || 'Local'}</Text>
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
              color={index === 0 ? '#282828' : '#b3b3b3'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moveBtn}
            onPress={() => handleMoveDown(index)}
            disabled={index === queue.length - 1}>
            <Icon
              name="chevron-down"
              size={20}
              color={index === queue.length - 1 ? '#282828' : '#b3b3b3'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveTrack(item.id)}>
            <Icon name="close-circle" size={22} color="#E91E63" />
          </TouchableOpacity>
        </View>
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Cola de reproducción</Text>
            <Text style={styles.count}>{queue.length} canciones</Text>
          </View>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearQueue}>
            <Icon name="trash-outline" size={22} color="#E91E63" />
          </TouchableOpacity>
        </View>

        {queue.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="list-outline" size={80} color="#535353" />
            <Text style={styles.emptyTitle}>Cola vacía</Text>
            <Text style={styles.emptySubtitle}>
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
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  count: { color: '#b3b3b3', fontSize: 12, marginTop: 3 },
  clearBtn: { padding: 8 },
  listContent: { padding: 15 },
  queueItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#181818',
    padding: 12, borderRadius: 10, marginBottom: 8,
  },
  queueItemActive: { backgroundColor: '#1DB95415', borderLeftWidth: 3, borderLeftColor: '#1DB954' },
  queueItemContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  trackNumber: { width: 30, alignItems: 'center' },
  numberText: { color: '#535353', fontSize: 14 },
  numberTextActive: { color: '#1DB954' },
  trackInfo: { flex: 1, marginLeft: 10 },
  trackName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  trackNameActive: { color: '#1DB954' },
  trackSource: { color: '#535353', fontSize: 12, marginTop: 3 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  moveBtn: { padding: 5 },
  removeBtn: { padding: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: {
    color: '#535353', fontSize: 13, marginTop: 8,
    textAlign: 'center', paddingHorizontal: 40,
  },
});

export default QueueScreen;
