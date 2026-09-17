import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 20;

class SearchHistoryService {
  async getHistory(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  async addSearch(query: string): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const trimmedQuery = query.trim();
      
      if (!trimmedQuery) return false;

      const updatedHistory = history.filter(item => item.toLowerCase() !== trimmedQuery.toLowerCase());
      updatedHistory.unshift(trimmedQuery);

      const finalHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(finalHistory));
      return true;
    } catch (error) {
      console.error('Error adding search:', error);
      return false;
    }
  }

  async removeSearch(query: string): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const updatedHistory = history.filter(item => item.toLowerCase() !== query.toLowerCase());
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
      return true;
    } catch (error) {
      console.error('Error removing search:', error);
      return false;
    }
  }

  async clearHistory(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }

  async getRecentSearches(limit: number = 5): Promise<string[]> {
    try {
      const history = await this.getHistory();
      return history.slice(0, limit);
    } catch (error) {
      return [];
    }
  }
}

export default new SearchHistoryService();
