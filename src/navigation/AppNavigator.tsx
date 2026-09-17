import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import LocalFilesScreen from '../screens/LocalFilesScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MiMusicaScreen from '../screens/MiMusicaScreen';
import QueueScreen from '../screens/QueueScreen';
import VaultAuthScreen from '../screens/Vault/VaultAuthScreen';
import VaultHomeScreen from '../screens/Vault/VaultHomeScreen';
import PlayerControl from '../components/PlayerControl';
import { useMusic } from '../context/MusicContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const VaultStack = createStackNavigator();

const VaultNavigator = () => (
  <VaultStack.Navigator screenOptions={{ headerShown: false }}>
    <VaultStack.Screen name="VaultAuth" component={VaultAuthScreen} />
    <VaultStack.Screen name="VaultHome" component={VaultHomeScreen} />
  </VaultStack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="MiMúsica" component={MiMusicaScreen} />
    <Stack.Screen name="Player" component={PlayerScreen} />
    <Stack.Screen name="Queue" component={QueueScreen} />
  </Stack.Navigator>
);

const SearchStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SearchMain" component={SearchScreen} />
    <Stack.Screen name="Player" component={PlayerScreen} />
    <Stack.Screen name="Queue" component={QueueScreen} />
  </Stack.Navigator>
);

const DownloadsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DownloadsMain" component={DownloadsScreen} />
    <Stack.Screen name="Player" component={PlayerScreen} />
    <Stack.Screen name="Queue" component={QueueScreen} />
  </Stack.Navigator>
);

const LocalStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LocalMain" component={LocalFilesScreen} />
    <Stack.Screen name="Player" component={PlayerScreen} />
    <Stack.Screen name="Queue" component={QueueScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { currentTrack } = useMusic();

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: string;
              switch (route.name) {
                case 'Inicio':
                  iconName = focused ? 'home' : 'home-outline';
                  break;
                case 'Buscar':
                  iconName = focused ? 'search' : 'search-outline';
                  break;
                case 'Descargas':
                  iconName = focused ? 'download' : 'download-outline';
                  break;
                case 'Local':
                  iconName = focused ? 'folder' : 'folder-outline';
                  break;
                case 'Cofre':
                  iconName = focused ? 'lock-closed' : 'lock-closed-outline';
                  break;
                default:
                  iconName = 'ellipse';
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#1DB954',
            tabBarInactiveTintColor: 'gray',
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#fff',
            tabBarStyle: {
              backgroundColor: '#181818',
              borderTopColor: '#282828',
              paddingBottom: 5,
              height: 60,
            },
          })}>
          <Tab.Screen name="Inicio" component={HomeStack} options={{ headerShown: false }} />
          <Tab.Screen name="Buscar" component={SearchStack} options={{ headerShown: false }} />
          <Tab.Screen name="Descargas" component={DownloadsStack} options={{ headerShown: false }} />
          <Tab.Screen name="Local" component={LocalStack} options={{ headerShown: false }} />
          <Tab.Screen
            name="Cofre"
            component={VaultNavigator}
            options={{ headerShown: false }}
          />
        </Tab.Navigator>

        {currentTrack && <PlayerControl mini={true} />}
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppNavigator;
