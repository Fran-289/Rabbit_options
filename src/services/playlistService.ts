import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYLISTS_KEY = '@playlists';

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

class PlaylistService {
  private playlists: Playlist[] = [];

  async loadPlaylists(): Promise<Playlist[]> {
    try {
      const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
      this.playlists = data ? JSON.parse(data) : [];
      return this.playlists;
    } catch (error) {
      console.error('Error loading playlists:', error);
      return [];
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(this.playlists));
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const playlist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      trackIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.playlists.push(playlist);
    await this.save();
    return playlist;
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    try {
      this.playlists = this.playlists.filter(p => p.id !== playlistId);
      await this.save();
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }

  async renamePlaylist(playlistId: string, newName: string): Promise<boolean> {
    try {
      const playlist = this.playlists.find(p => p.id === playlistId);
      if (playlist) {
        playlist.name = newName;
        playlist.updatedAt = new Date().toISOString();
        await this.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error renaming playlist:', error);
      return false;
    }
  }

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<boolean> {
    try {
      const playlist = this.playlists.find(p => p.id === playlistId);
      if (playlist && !playlist.trackIds.includes(trackId)) {
        playlist.trackIds.push(trackId);
        playlist.updatedAt = new Date().toISOString();
        await this.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      return false;
    }
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<boolean> {
    try {
      const playlist = this.playlists.find(p => p.id === playlistId);
      if (playlist) {
        playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);
        playlist.updatedAt = new Date().toISOString();
        await this.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      return false;
    }
  }

  async isTrackInPlaylist(playlistId: string, trackId: string): Promise<boolean> {
    const playlist = this.playlists.find(p => p.id === playlistId);
    return playlist ? playlist.trackIds.includes(trackId) : false;
  }

  getPlaylists(): Playlist[] {
    return [...this.playlists];
  }

  getPlaylist(playlistId: string): Playlist | undefined {
    return this.playlists.find(p => p.id === playlistId);
  }
}

export default new PlaylistService();
