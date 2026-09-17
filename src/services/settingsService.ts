import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@app_settings';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  downloadQuality: 'low' | 'medium' | 'high';
  wifiOnly: boolean;
  autoPlay: boolean;
  notifications: boolean;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'es',
  downloadQuality: 'medium',
  wifiOnly: false,
  autoPlay: true,
  notifications: true,
};

class SettingsService {
  private settings: AppSettings = { ...defaultSettings };
  private listeners: Array<(settings: AppSettings) => void> = [];

  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        this.settings = { ...defaultSettings, ...JSON.parse(data) };
      }
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  async setTheme(theme: 'dark' | 'light' | 'system'): Promise<boolean> {
    return this.saveSettings({ theme });
  }

  async setLanguage(language: string): Promise<boolean> {
    return this.saveSettings({ language });
  }

  async setDownloadQuality(quality: 'low' | 'medium' | 'high'): Promise<boolean> {
    return this.saveSettings({ downloadQuality: quality });
  }

  async setWifiOnly(wifiOnly: boolean): Promise<boolean> {
    return this.saveSettings({ wifiOnly });
  }

  async setAutoPlay(autoPlay: boolean): Promise<boolean> {
    return this.saveSettings({ autoPlay });
  }

  async setNotifications(notifications: boolean): Promise<boolean> {
    return this.saveSettings({ notifications });
  }

  addListener(listener: (settings: AppSettings) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.settings));
  }

  async resetSettings(): Promise<boolean> {
    try {
      this.settings = { ...defaultSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }
}

export default new SettingsService();
