import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import SettingsService, { AppSettings } from '../services/settingsService';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  accent: string;
  danger: string;
  success: string;
  tabBar: string;
  inputBg: string;
}

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#181818',
  surfaceLight: '#282828',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#b3b3b3',
  textMuted: '#535353',
  border: '#282828',
  primary: '#1DB954',
  accent: '#E91E63',
  danger: '#E91E63',
  success: '#4CAF50',
  tabBar: '#181818',
  inputBg: '#282828',
};

const lightColors: ThemeColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F0',
  card: '#FFFFFF',
  text: '#121212',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  primary: '#1DB954',
  accent: '#E91E63',
  danger: '#E91E63',
  success: '#4CAF50',
  tabBar: '#FFFFFF',
  inputBg: '#F0F0F0',
};

interface ThemeContextType {
  colors: ThemeColors;
  settings: AppSettings;
  isDark: boolean;
  t: (key: string) => string;
  reloadSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  settings: SettingsService.getSettings(),
  isDark: true,
  t: (key: string) => key,
  reloadSettings: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

const translations: Record<string, Record<string, string>> = {
  es: {
    welcome: 'Bienvenido',
    search: 'Buscar',
    downloads: 'Descargas',
    local: 'Local',
    vault: 'Cofre',
    settings: 'Configuración',
    myMusic: 'Mi Música',
    files: 'Archivos',
    download: 'Descargar',
    all: 'Todos',
    audio: 'Audio',
    video: 'Video',
    noFiles: 'No se encontraron archivos',
    general: 'General',
    theme: 'Tema de la app',
    language: 'Idioma',
    dark: 'Oscuro',
    light: 'Claro',
    system: 'Sistema',
    downloadQuality: 'Calidad de descarga',
    wifiOnly: 'Solo descargar con WiFi',
    autoPlay: 'Reproducción automática',
    notifications: 'Notificaciones',
    storage: 'Almacenamiento',
    clearCache: 'Limpiar caché',
    version: 'Versión',
    developer: 'Desarrollador',
    resetConfig: 'Restablecer configuración',
    back: 'Volver',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    player: 'Reproductor',
    queue: 'Cola',
    patternOrPin: 'Usa patrón o PIN para acceder',
    createPattern: 'Crea tu patrón',
    confirmPattern: 'Confirma el patrón',
    createPin: 'Crea tu PIN',
    confirmPin: 'Confirma el PIN',
    errorPatternIncorrect: 'Patrón incorrecto',
    errorPatternsNotMatch: 'Los patrones no coinciden',
    errorPinIncorrect: 'PIN incorrecto',
    errorPatternOrPinIncorrect: 'Patrón o PIN incorrectos',
    confirmDrawPattern: 'Dibuja el patrón nuevamente',
    patternConfigured: 'Patrón configurado. Ahora configura tu PIN.',
    pinConfirmAgain: 'Ingresa el PIN nuevamente',
    errorPatternTooShort: 'El patrón debe tener al menos 4 puntos',
    errorPinTooShort: 'El PIN debe tener 4 dígitos',
    wifiRequired: 'WiFi requerido',
    wifiRequiredMsg: 'Tienes activada la opción "Solo WiFi" para descargas. Conectate a una red WiFi o desactiva esta opción en Configuración.',
    goToSettings: 'Ir a Configuración',
    viewDownloads: 'Ver descargas',
    noPlayback: 'Sin reproducción',
    selectSong: 'Selecciona una canción',
    playing: 'Reproduciendo',
    scanningFiles: 'Escaneando archivos...',
    noMediaFound: 'No hay archivos multimedia en las carpetas del dispositivo',
    socialNetworks: 'Redes Sociales',
    openInApp: 'En la app',
    externalBrowser: 'Navegador externo',
    chooseHowToOpen: 'Como quieres abrir?',
    linkDownload: 'Descarga por enlace',
    pasteLinkHere: 'Pega el enlace aqui...',
    downloadMp3: 'Descargar MP3',
    socialBrowserDesc: 'Abre la red social dentro de la app o en el navegador externo',
    socialBrowserInfo: 'Abre la red social dentro de la app, busca el contenido, y copia el enlace para pegarlo en la seccion de descarga.',
    downloadComplete: 'Descarga completada',
    downloadSavedToMusic: 'Archivo guardado en tu musica',
    errorDownloadLink: 'No se pudo descargar desde ese enlace',
    errorVerifyConnection: 'No se pudo descargar el archivo. Verifica tu conexión.',
    playNow: 'Reproducir ahora',
    errorGeneric: 'Error',
    errorCouldNotDelete: 'No se pudo eliminar',
    errorCouldNotOpen: 'No se pudo abrir',
    errorCouldNotAddVideo: 'No se pudo agregar el video',
    errorCouldNotSearch: 'No se pudieron buscar videos',
    errorCouldNotDownload: 'No se pudo descargar',
    errorCouldNotDownloadFile: 'No se pudo descargar el archivo. Verifica tu conexión.',
    errorNoTracksFound: 'No se encontraron las canciones en el dispositivo',
    errorCouldNotLoad: 'No se pudo cargar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    deleteTrack: 'Eliminar canción',
    deleteTrackConfirm: '¿Eliminar esta canción de la cola?',
    deletePlaylist: 'Eliminar playlist',
    deletePlaylistConfirm: '¿Eliminar esta playlist?',
    createPlaylist: 'Crear playlist',
    playlistName: 'Nombre de la playlist',
    addToPlaylist: 'Agregar a playlist',
    noTracksInPlaylist: 'No hay canciones en la playlist',
    playlistEmpty: 'Playlist vacía',
    errorCreatingPlaylist: 'Error al crear playlist',
    downloading: 'Descargando...',
    downloadingFile: 'Descargando archivo...',
    loading: 'Cargando...',
    noResults: 'Sin resultados',
    exploreSongs: 'Explora canciones',
    playing: 'Reproduciendo',
  },
  en: {
    welcome: 'Welcome',
    search: 'Search',
    downloads: 'Downloads',
    local: 'Local',
    vault: 'Vault',
    settings: 'Settings',
    myMusic: 'My Music',
    files: 'Files',
    download: 'Download',
    all: 'All',
    audio: 'Audio',
    video: 'Video',
    noFiles: 'No files found',
    general: 'General',
    theme: 'App theme',
    language: 'Language',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    downloadQuality: 'Download quality',
    wifiOnly: 'WiFi only for downloads',
    autoPlay: 'Auto play',
    notifications: 'Notifications',
    storage: 'Storage',
    clearCache: 'Clear cache',
    version: 'Version',
    developer: 'Developer',
    resetConfig: 'Reset settings',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    player: 'Player',
    queue: 'Queue',
    patternOrPin: 'Use pattern or PIN to access',
    createPattern: 'Create your pattern',
    confirmPattern: 'Confirm the pattern',
    createPin: 'Create your PIN',
    confirmPin: 'Confirm the PIN',
    errorPatternIncorrect: 'Pattern incorrect',
    errorPatternsNotMatch: 'Patterns do not match',
    errorPinIncorrect: 'PIN incorrect',
    errorPatternOrPinIncorrect: 'Pattern or PIN incorrect',
    confirmDrawPattern: 'Draw the pattern again',
    patternConfigured: 'Pattern configured. Now set your PIN.',
    pinConfirmAgain: 'Enter PIN again',
    errorPatternTooShort: 'Pattern must have at least 4 points',
    errorPinTooShort: 'PIN must have 4 digits',
    wifiRequired: 'WiFi required',
    wifiRequiredMsg: 'You have "WiFi only" enabled for downloads. Connect to a WiFi network or disable this option in Settings.',
    goToSettings: 'Go to Settings',
    viewDownloads: 'View downloads',
    noPlayback: 'No playback',
    selectSong: 'Select a song',
    playing: 'Playing',
    scanningFiles: 'Scanning files...',
    noMediaFound: 'No media files found in device folders',
    socialNetworks: 'Social Networks',
    openInApp: 'In the app',
    externalBrowser: 'External browser',
    chooseHowToOpen: 'How do you want to open?',
    linkDownload: 'Download by link',
    pasteLinkHere: 'Paste the link here...',
    downloadMp3: 'Download MP3',
    socialBrowserDesc: 'Open the social network within the app or in the external browser',
    socialBrowserInfo: 'Open the social network within the app, find the content, and copy the link to paste in the download section.',
    downloadComplete: 'Download complete',
    downloadSavedToMusic: 'File saved to your music',
    errorDownloadLink: 'Could not download from that link',
    errorVerifyConnection: 'Could not download the file. Check your connection.',
    playNow: 'Play now',
    errorGeneric: 'Error',
    errorCouldNotDelete: 'Could not delete',
    errorCouldNotOpen: 'Could not open',
    errorCouldNotAddVideo: 'Could not add video',
    errorCouldNotSearch: 'Could not search videos',
    errorCouldNotDownload: 'Could not download',
    errorCouldNotDownloadFile: 'Could not download file. Check your connection.',
    errorNoTracksFound: 'No tracks found on device',
    errorCouldNotLoad: 'Could not load',
    delete: 'Delete',
    cancel: 'Cancel',
    deleteTrack: 'Delete track',
    deleteTrackConfirm: 'Remove this track from the queue?',
    deletePlaylist: 'Delete playlist',
    deletePlaylistConfirm: 'Delete this playlist?',
    createPlaylist: 'Create playlist',
    playlistName: 'Playlist name',
    addToPlaylist: 'Add to playlist',
    noTracksInPlaylist: 'No tracks in playlist',
    playlistEmpty: 'Playlist empty',
    errorCreatingPlaylist: 'Error creating playlist',
    downloading: 'Downloading...',
    downloadingFile: 'Downloading file...',
    loading: 'Loading...',
    noResults: 'No results',
    exploreSongs: 'Explore songs',
    playing: 'Playing',
  },
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(SettingsService.getSettings());
  const [loaded, setLoaded] = useState(false);
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    loadSettings();
    const unsub = SettingsService.addListener((newSettings) => {
      setSettings({ ...newSettings });
    });
    const appearanceSub = Appearance.addChangeListener(({ colorScheme: scheme }) => {
      setColorScheme(scheme);
    });
    return () => {
      unsub();
      appearanceSub.remove();
    };
  }, []);

  const loadSettings = async () => {
    const s = await SettingsService.loadSettings();
    setSettings({ ...s });
    setLoaded(true);
  };

  const isDark = settings.theme === 'dark' ||
    (settings.theme === 'system' && colorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  const lang = settings.language || 'es';
  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['es']?.[key] || key;
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ colors, settings, isDark, t, reloadSettings: loadSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};
