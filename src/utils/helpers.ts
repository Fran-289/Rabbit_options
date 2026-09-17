export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
};

export const isAudioFile = (filename: string): boolean => {
  const audioExtensions = ['.mp3', '.opus', '.ogg', '.m4a', '.aac', '.wav'];
  return audioExtensions.includes(getFileExtension(filename));
};

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['.mp4', '.3gp', '.avi', '.mkv'];
  return videoExtensions.includes(getFileExtension(filename));
};

export const getSourceFromPath = (path: string): string => {
  if (path.includes('whatsapp')) return 'WhatsApp';
  if (path.includes('facebook') || path.includes('messenger')) return 'Messenger';
  if (path.includes('telegram')) return 'Telegram';
  return 'Local';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};
