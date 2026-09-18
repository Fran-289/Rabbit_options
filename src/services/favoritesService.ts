import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@music_favorites';

class FavoritesService {
  async getFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async addFavorite(trackId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(trackId)) {
        favorites.push(trackId);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  async removeFavorite(trackId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const updated = favorites.filter(id => id !== trackId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async isFavorite(trackId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(trackId);
    } catch (error) {
      return false;
    }
  }

  async toggleFavorite(trackId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      let result: boolean;
      if (favorites.includes(trackId)) {
        const updated = favorites.filter(id => id !== trackId);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        result = false;
      } else {
        favorites.push(trackId);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        result = true;
      }
      return result;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  async clearFavorites(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }
}

export default new FavoritesService();
