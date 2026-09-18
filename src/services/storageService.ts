import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

class StorageService {
  private basePath: string;

  constructor() {
    this.basePath = RNFS.DocumentDirectoryPath;
  }

  async init() {
    try {
      const exists = await RNFS.exists(this.basePath);
      if (!exists) {
        await RNFS.mkdir(this.basePath);
      }
      await RNFS.mkdir(`${this.basePath}/Music`);
      await RNFS.mkdir(`${this.basePath}/Videos`);
      await RNFS.mkdir(`${this.basePath}/Vault`);
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  async getMusicPath(): Promise<string> {
    try {
      const path = `${this.basePath}/Music`;
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.mkdir(path);
      }
      return path;
    } catch (error) {
      console.error('Error getting music path:', error);
      return this.basePath;
    }
  }

  async getVideosPath(): Promise<string> {
    try {
      const path = `${this.basePath}/Videos`;
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.mkdir(path);
      }
      return path;
    } catch (error) {
      console.error('Error getting videos path:', error);
      return this.basePath;
    }
  }

  async getVaultPath(): Promise<string> {
    try {
      const path = `${this.basePath}/Vault`;
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.mkdir(path);
      }
      return path;
    } catch (error) {
      console.error('Error getting vault path:', error);
      return this.basePath;
    }
  }

  async saveFile(sourcePath: string, destination: string): Promise<string> {
    const destPath = `${await this.getMusicPath()}/${destination}`;
    await RNFS.moveFile(sourcePath, destPath);
    return destPath;
  }

  async saveToVault(sourcePath: string, fileName: string): Promise<string> {
    const destPath = `${await this.getVaultPath()}/${fileName}`;
    await RNFS.moveFile(sourcePath, destPath);
    return destPath;
  }

  async listMusicFiles(): Promise<any[]> {
    try {
      const path = await this.getMusicPath();
      const files = await RNFS.readDir(path);
      return files.filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.opus'));
    } catch (error) {
      console.error('Error listing music files:', error);
      return [];
    }
  }

  async listVaultFiles(): Promise<any[]> {
    try {
      const path = await this.getVaultPath();
      const files = await RNFS.readDir(path);
      return files.filter(f => f.name.endsWith('.mp4') || f.name.endsWith('.video'));
    } catch (error) {
      console.error('Error listing vault files:', error);
      return [];
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    return RNFS.exists(filePath);
  }

  async clearCache(): Promise<void> {
    try {
      const cachePath = `${RNFS.CachesDirectoryPath}`;
      const exists = await RNFS.exists(cachePath);
      if (exists) {
        const files = await RNFS.readDir(cachePath);
        for (const file of files) {
          try {
            await RNFS.unlink(file.path);
          } catch { /* skip individual file errors */ }
        }
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default new StorageService();
