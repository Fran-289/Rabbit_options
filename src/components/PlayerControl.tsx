import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useMusic } from '../context/MusicContext';
import { useTheme } from '../context/ThemeContext';

interface PlayerControlProps {
  mini?: boolean;
  navigation?: any;
  onNavigateToPlayer?: () => void;
}

const PlayerControl: React.FC<PlayerControlProps> = ({ mini = false, navigation, onNavigateToPlayer }) => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    next,
    previous,
    progress,
    duration,
  } = useMusic();
  const { colors } = useTheme();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  if (mini) {
    return (
      <TouchableOpacity
        style={[styles.miniContainer, { backgroundColor: colors.surfaceLight, borderTopColor: colors.border }]}
        onPress={() => onNavigateToPlayer ? onNavigateToPlayer() : navigation?.navigate('Player')}>
        <View style={styles.miniInfo}>
          <View style={[styles.miniThumbnail, { backgroundColor: colors.border }]}>
            <Icon name="musical-notes" size={16} color={colors.primary} />
          </View>
          <View style={styles.miniTextContainer}>
            <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={1}>
              {currentTrack.name}
            </Text>
            <Text style={[styles.miniArtist, { color: colors.textMuted }]} numberOfLines={1}>
              {currentTrack.source || 'Local'}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={togglePlayPause} style={styles.miniPlayButton}>
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${duration > 0 ? (progress / duration) * 100 : 0}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(progress)}</Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>
          {currentTrack.name}
        </Text>
        <Text style={[styles.trackArtist, { color: colors.textMuted }]} numberOfLines={1}>
          {currentTrack.source || 'Local'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={previous} style={styles.controlButton}>
          <Icon name="play-skip-back" size={30} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayPause} style={[styles.playButton, { backgroundColor: colors.primary }]}>
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={40}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={next} style={styles.controlButton}>
          <Icon name="play-skip-forward" size={30} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 15,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  time: {
    fontSize: 12,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  trackArtist: {
    fontSize: 14,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  miniInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  miniArtist: {
    fontSize: 12,
    marginTop: 2,
  },
  miniPlayButton: {
    padding: 10,
  },
});

export default PlayerControl;
