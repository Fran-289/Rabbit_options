import RNFS from 'react-native-fs';
import StorageService from './storageService';

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  viewCount: string;
}

export interface SearchResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

class YouTubeService {
  private apiKey: string = '';
  private invidiousInstances = [
    'https://inv.nadeko.net',
    'https://invidious.privacyredirect.com',
    'https://vid.puffyan.us',
    'https://invidious.nerdvpn.de',
  ];
  private currentInstance: string = 'https://inv.nadeko.net';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async tryInvidious(query: string, pageToken?: string): Promise<SearchResult> {
    for (const instance of this.invidiousInstances) {
      try {
        const pageParam = pageToken ? `&page=${pageToken}` : '';
        const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video${pageParam}&sort_by=relevance`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) continue;
        const data = await response.json();

        const videos: YouTubeVideo[] = data
          .filter((item: any) => item.type === 'video' && item.videoId)
          .map((item: any) => ({
            id: item.videoId,
            title: item.title || 'Sin titulo',
            channel: item.author || 'Desconocido',
            duration: this.formatLengthSeconds(item.lengthSeconds || 0),
            thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url
              || item.videoThumbnails?.[0]?.url
              || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
            viewCount: item.viewCount ? this.formatViews(item.viewCount) : '',
          }));

        if (videos.length > 0) {
          this.currentInstance = instance;
          return { videos, nextPageToken: data.length >= 20 ? String((parseInt(pageToken || '1') + 1)) : undefined };
        }
      } catch (error) {
        continue;
      }
    }
    return { videos: [] };
  }

  async searchVideos(query: string, pageToken?: string): Promise<SearchResult> {
    if (this.apiKey) {
      try {
        let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=20&key=${this.apiKey}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.items) {
          const videos = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            duration: '',
            thumbnail: item.snippet.thumbnails?.medium?.url || '',
            viewCount: '',
          }));
          return { videos, nextPageToken: data.nextPageToken };
        }
      } catch (error) {
        console.error('Google API error, falling back to Invidious:', error);
      }
    }

    return this.tryInvidious(query, pageToken);
  }

  async getVideoInfo(videoId: string): Promise<YouTubeVideo | null> {
    try {
      const url = `${this.currentInstance}/api/v1/videos/${videoId}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const item = await response.json();

      return {
        id: item.videoId,
        title: item.title,
        channel: item.author,
        duration: this.formatLengthSeconds(item.lengthSeconds || 0),
        thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'high')?.url
          || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        viewCount: item.viewCount ? this.formatViews(item.viewCount) : '',
      };
    } catch (error) {
      return {
        id: videoId,
        title: 'Video',
        channel: 'Canal',
        duration: '3:00',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        viewCount: '',
      };
    }
  }

  async downloadAudio(videoId: string, title: string, onProgress?: (progress: number) => void): Promise<string> {
    const musicPath = await StorageService.getMusicPath();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u00C0-\u024F ]/g, '').trim();
    const filePath = `${musicPath}/${sanitizedTitle}.mp3`;

    try {
      const apiUrl = 'https://co.wuk.sh/api/json';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          isAudioOnly: true,
          aFormat: 'mp3',
        }),
      });

      const data = await response.json();

      if (data.url) {
        onProgress?.(10);
        await RNFS.downloadFile({
          fromUrl: data.url,
          toFile: filePath,
          progress: (res) => {
            const progress = (res.bytesWritten / res.contentLength) * 100;
            onProgress?.(Math.min(progress, 100));
          },
        }).promise;

        onProgress?.(100);
        return filePath;
      }

      throw new Error('No URL');
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw error;
    }
  }

  async downloadVideo(videoId: string, title: string, quality: string, onProgress?: (progress: number) => void): Promise<string> {
    const videosPath = await StorageService.getVideosPath();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u00C0-\u024F ]/g, '').trim();
    const filePath = `${videosPath}/${sanitizedTitle}.mp4`;

    try {
      const apiUrl = 'https://co.wuk.sh/api/json';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          vQuality: quality,
        }),
      });

      const data = await response.json();

      if (data.url) {
        onProgress?.(10);
        await RNFS.downloadFile({
          fromUrl: data.url,
          toFile: filePath,
          progress: (res) => {
            const progress = (res.bytesWritten / res.contentLength) * 100;
            onProgress?.(Math.min(progress, 100));
          },
        }).promise;

        onProgress?.(100);
        return filePath;
      }

      throw new Error('No URL');
    } catch (error) {
      console.error('Error downloading video:', error);
      throw error;
    }
  }

  private formatLengthSeconds(seconds: number): string {
    if (seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private formatViews(views: number): string {
    if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B vistas`;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M vistas`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K vistas`;
    return `${views} vistas`;
  }
}

export default new YouTubeService();
