import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MusicProvider } from './src/context/MusicContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MusicProvider>
          <StatusBar barStyle="light-content" />
          <AppNavigator />
        </MusicProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
