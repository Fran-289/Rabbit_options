import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import SettingsService, { AppSettings } from '../services/settingsService';

interface ThemeColors {
  background: string;
  surface: string;
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
  },
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(SettingsService.getSettings());

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
  };

  const isDark = settings.theme === 'dark' ||
    (settings.theme === 'system' && colorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  const lang = settings.language || 'es';
  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['es']?.[key] || key;
  };

  return (
    <ThemeContext.Provider value={{ colors, settings, isDark, t, reloadSettings: loadSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};
