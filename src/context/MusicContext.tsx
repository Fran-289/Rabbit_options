import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import FavoritesService from '../services/favoritesService';

export interface Track {
  id: string;
  name: string;
  path: string;
  artist?: string;
  source?: string;
  duration?: number;
}

interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentIndex: number;
  progress: number;
  duration: number;
  isReady: boolean;
  isBuffering: boolean;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  favorites: string[];
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (time: number) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setIsReady: (ready: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleFavorite: (trackId: string) => void;
  loadTrack: (track: Track) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const savedFavorites = await FavoritesService.getFavorites();
    setFavorites(savedFavorites);
  };

  const play = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setIsReady(false);
    setIsBuffering(true);
    setQueueState(prev => {
      const exists = prev.some(t => t.id === track.id);
      if (!exists) {
        setCurrentIndex(0);
        return [track];
      }
      return prev;
    });
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const stop = useCallback(() => {
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setIsReady(false);
  }, []);

  const next = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex: number;
    if (isShuffled) {
      if (queue.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentIndex);
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return;
        }
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setProgress(0);
    setIsReady(false);
    setIsPlaying(true);
  }, [queue, currentIndex, isShuffled, repeatMode]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;

    let prevIndex: number;
    if (progress > 3) {
      setProgress(0);
      return;
    }

    prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    setCurrentIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    setProgress(0);
    setIsReady(false);
    setIsPlaying(true);
  }, [queue, currentIndex, progress, repeatMode]);

  const seekTo = useCallback((time: number) => {
    setProgress(time);
  }, []);

  const setQueue = useCallback((tracks: Track[], startIndex: number = 0) => {
    setQueueState(tracks);
    setCurrentIndex(startIndex);
    if (tracks.length > 0 && startIndex >= 0) {
      setCurrentTrack(tracks[startIndex]);
      setProgress(0);
      setIsReady(false);
      setIsPlaying(true);
    }
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueueState(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueueState(prev => {
      const removedIndex = prev.findIndex(t => t.id === trackId);
      const newQueue = prev.filter(t => t.id !== trackId);
      if (removedIndex !== -1) {
        if (removedIndex < currentIndex) {
          setCurrentIndex(prev => prev - 1);
        } else if (removedIndex === currentIndex) {
          if (newQueue.length === 0) {
            setCurrentTrack(null);
            setIsPlaying(false);
            setCurrentIndex(-1);
          } else {
            const nextIdx = removedIndex >= newQueue.length ? 0 : removedIndex;
            setCurrentIndex(nextIdx);
            setCurrentTrack(newQueue[nextIdx]);
          }
        }
      }
      return newQueue;
    });
  }, [currentIndex]);

  // Fix #7: clearQueue stops playback
  const clearQueue = useCallback(() => {
    setQueueState([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
    setIsPlaying(false);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleFavorite = useCallback(async (trackId: string) => {
    const isNowFavorite = await FavoritesService.toggleFavorite(trackId);
    setFavorites(prev => {
      if (isNowFavorite) {
        return [...prev, trackId];
      }
      return prev.filter(id => id !== trackId);
    });
  }, []);

  const loadTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setProgress(0);
    setIsReady(false);
    setIsBuffering(true);
  }, []);

  const value: MusicContextType = {
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    progress,
    duration,
    isReady,
    isBuffering,
    volume,
    isShuffled,
    repeatMode,
    favorites,
    play,
    pause,
    resume,
    togglePlayPause,
    stop,
    next,
    previous,
    seekTo,
    setQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setProgress,
    setDuration,
    setIsReady,
    setIsBuffering,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    loadTrack,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

export default MusicContext;
