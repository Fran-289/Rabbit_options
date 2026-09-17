import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { useMusic } from '../context/MusicContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PlayerScreen = ({ navigation }: any) => {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    isReady,
    isBuffering,
    volume,
    isShuffled,
    repeatMode,
    togglePlayPause,
    stop,
    next,
    previous,
    seekTo,
    setProgress,
    setDuration,
    setIsReady,
    setIsBuffering,
    setVolume,
    toggleShuffle,
    cycleRepeat,
  } = useMusic();

  const videoRef = useRef<any>(null);
  const artworkScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isBuffering) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(artworkScale, {
            toValue: 0.95,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(artworkScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      artworkScale.stopAnimation(() => {
        Animated.spring(artworkScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isBuffering, artworkScale]);

  const handleProgress = useCallback((data: OnProgressData) => {
    setProgress(data.currentTime);
  }, [setProgress]);

  const handleLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration);
    setIsReady(true);
    setIsBuffering(false);

    Animated.spring(artworkScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [setDuration, setIsReady, setIsBuffering, artworkScale]);

  const handleEnd = useCallback(() => {
    next();
  }, [next]);

  const handleBuffer = useCallback((buffering: boolean) => {
    setIsBuffering(buffering);
  }, [setIsBuffering]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: any) => {
    const { locationX } = event.nativeEvent;
    const progressBarWidth = SCREEN_WIDTH - 80;
    const percentage = locationX / progressBarWidth;
    const newTime = percentage * duration;
    seekTo(Math.max(0, Math.min(newTime, duration)));
  };

  const handleDelete = () => {
    if (!currentTrack) return;
    Alert.alert(
      'Eliminar',
      `¿Eliminar "${currentTrack.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            stop();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'all':
        return 'repeat';
      case 'one':
        return 'repeat-outline';
      default:
        return 'repeat-outline';
    }
  };

  const getRepeatColor = () => {
    return repeatMode !== 'off' ? '#1DB954' : '#fff';
  };

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="chevron-down" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reproduciendo</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={styles.artworkContainer}>
            <View style={[styles.artwork, styles.artworkEmpty]}>
              <Icon name="musical-notes" size={80} color="#535353" />
            </View>
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackName}>Sin reproducción</Text>
            <Text style={styles.artist}>Selecciona una canción</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Video
        ref={videoRef}
        source={{ uri: `file://${currentTrack.path}` }}
        paused={!isPlaying}
        volume={volume}
        resizeMode="contain"
        onProgress={handleProgress}
        onLoad={handleLoad}
        onEnd={handleEnd}
        onBuffer={({ isBuffering: buffering }) => handleBuffer(buffering)}
        style={styles.videoHidden}
        repeat={repeatMode === 'one'}
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-down" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reproduciendo</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.queueBtn}
              onPress={() => navigation.navigate('Queue')}>
              <Icon name="list" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Icon name="trash-outline" size={24} color="#E91E63" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.artworkContainer}>
          <Animated.View
            style={[
              styles.artwork,
              { transform: [{ scale: artworkScale }] },
            ]}>
            <View style={styles.artworkInner}>
              <Icon name="musical-notes" size={80} color="#fff" />
              {isBuffering && (
                <View style={styles.bufferingOverlay}>
                  <Icon name="sync" size={40} color="#fff" />
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={2}>
            {currentTrack.name}
          </Text>
          <Text style={styles.artist}>{currentTrack.source || 'Local'}</Text>
        </View>

        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={handleSeek} activeOpacity={1}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${duration > 0 ? (progress / duration) * 100 : 0}%` },
                ]}
              />
              <View
                style={[
                  styles.progressThumb,
                  {
                    left: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(progress)}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.mainControls}>
          <TouchableOpacity onPress={toggleShuffle} style={styles.controlBtn}>
            <Icon
              name="shuffle"
              size={24}
              color={isShuffled ? '#1DB954' : '#fff'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={previous} style={styles.controlBtn}>
            <Icon name="play-skip-back" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainControlBtn}
            onPress={togglePlayPause}>
            <View style={styles.mainControlBtnInner}>
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                size={40}
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={next} style={styles.controlBtn}>
            <Icon name="play-skip-forward" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={cycleRepeat} style={styles.controlBtn}>
            <Icon name={getRepeatIcon()} size={24} color={getRepeatColor()} />
          </TouchableOpacity>
        </View>

        <View style={styles.volumeContainer}>
          <Icon name="volume-low" size={20} color="#b3b3b3" />
          <TouchableOpacity
            style={styles.volumeSlider}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              const newVolume = Math.max(0, Math.min(1, locationX / 200));
              setVolume(newVolume);
            }}>
            <View style={styles.volumeBar}>
              <View
                style={[styles.volumeFill, { width: `${volume * 100}%` }]}
              />
            </View>
          </TouchableOpacity>
          <Icon name="volume-high" size={20} color="#b3b3b3" />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 25,
  },
  videoHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  queueBtn: {
    padding: 5,
  },
  artworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  artworkEmpty: {
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  artworkInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1DB954',
  },
  bufferingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
    height: '100%',
  },
  trackInfo: {
    alignItems: 'center',
    marginTop: 40,
  },
  trackName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 16,
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 40,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#282828',
    borderRadius: 3,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1DB954',
    marginLeft: -7,
    elevation: 5,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  time: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 20,
  },
  controlBtn: {
    padding: 10,
  },
  mainControlBtn: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  mainControlBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    borderRadius: 37.5,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 15,
  },
  volumeSlider: {
    flex: 1,
    maxWidth: 200,
  },
  volumeBar: {
    height: 4,
    backgroundColor: '#282828',
    borderRadius: 2,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
});

export default PlayerScreen;
