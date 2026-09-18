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
  onNavigateToPlayer?: () => void;
}

const PlayerControl: React.FC<PlayerControlProps> = ({ mini = false, onNavigateToPlayer }) => {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
  } = useMusic();
  const { colors } = useTheme();

  if (!currentTrack) return null;

  if (mini) {
    return (
      <TouchableOpacity
        style={[styles.miniContainer, { backgroundColor: colors.surfaceLight, borderTopColor: colors.border }]}
        onPress={() => onNavigateToPlayer?.()}>
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

  return null;
};

const styles = StyleSheet.create({
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
