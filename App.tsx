import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MusicProvider } from './src/context/MusicContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import StorageService from './src/services/storageService';

function App() {
  useEffect(() => {
    StorageService.init();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MusicProvider>
          <AppNavigator />
        </MusicProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
