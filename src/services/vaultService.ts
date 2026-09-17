import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from './storageService';

export interface VaultVideo {
  id: string;
  title: string;
  path: string;
  addedAt: string;
  size: number;
  sizeFormatted: string;
}

export interface VaultCredentials {
  pattern: number[];
  pin: string;
  isSetup: boolean;
}

class VaultService {
  private static VAULT_KEY = '@vault_videos';
  private static VAULT_CREDENTIALS_KEY = '@vault_credentials';

  async getCredentials(): Promise<VaultCredentials> {
    try {
      const data = await AsyncStorage.getItem(VaultService.VAULT_CREDENTIALS_KEY);
      return data ? JSON.parse(data) : { pattern: [], pin: '', isSetup: false };
    } catch (error) {
      console.error('Error getting vault credentials:', error);
      return { pattern: [], pin: '', isSetup: false };
    }
  }

  async saveCredentials(pattern: number[], pin: string): Promise<boolean> {
    try {
      const credentials: VaultCredentials = {
        pattern,
        pin,
        isSetup: true,
      };
      await AsyncStorage.setItem(
        VaultService.VAULT_CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );
      return true;
    } catch (error) {
      console.error('Error saving vault credentials:', error);
      return false;
    }
  }

  async verifyPattern(pattern: number[]): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      if (!credentials.isSetup) return true;
      return JSON.stringify(pattern) === JSON.stringify(credentials.pattern);
    } catch (error) {
      console.error('Error verifying pattern:', error);
      return false;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      if (!credentials.isSetup) return true;
      return pin === credentials.pin;
    } catch (error) {
      console.error('Error verifying pin:', error);
      return false;
    }
  }

  async isVaultSetup(): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      return credentials.isSetup;
    } catch (error) {
      return false;
    }
  }

  async resetCredentials(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(VaultService.VAULT_CREDENTIALS_KEY);
      return true;
    } catch (error) {
      console.error('Error resetting credentials:', error);
      return false;
    }
  }

  async getVideos(): Promise<VaultVideo[]> {
    try {
      const data = await AsyncStorage.getItem(VaultService.VAULT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting vault videos:', error);
      return [];
    }
  }

  async addVideo(video: Omit<VaultVideo, 'id' | 'addedAt'>): Promise<VaultVideo> {
    const videos = await this.getVideos();
    const newVideo: VaultVideo = {
      ...video,
      id: `vault_${Date.now()}`,
      addedAt: new Date().toISOString(),
    };

    videos.push(newVideo);
    await AsyncStorage.setItem(VaultService.VAULT_KEY, JSON.stringify(videos));

    return newVideo;
  }

  async removeVideo(videoId: string): Promise<boolean> {
    try {
      const videos = await this.getVideos();
      const video = videos.find(v => v.id === videoId);

      if (video) {
        await StorageService.deleteFile(video.path);
        const updatedVideos = videos.filter(v => v.id !== videoId);
        await AsyncStorage.setItem(VaultService.VAULT_KEY, JSON.stringify(updatedVideos));
      }

      return true;
    } catch (error) {
      console.error('Error removing vault video:', error);
      return false;
    }
  }

  async moveVideoToVault(sourcePath: string, title: string): Promise<VaultVideo | null> {
    try {
      const vaultPath = await StorageService.getVaultPath();
      const fileName = `${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      const destPath = `${vaultPath}/${fileName}`;

      await RNFS.moveFile(sourcePath, destPath);
      const stat = await RNFS.stat(destPath);

      const video = await this.addVideo({
        title,
        path: destPath,
        size: stat.size,
        sizeFormatted: this.formatSize(stat.size),
      });

      return video;
    } catch (error) {
      console.error('Error moving video to vault:', error);
      return null;
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

export default new VaultService();
