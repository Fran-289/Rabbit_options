import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import StorageService from '../services/storageService';
import { FadeInView, SlideInView } from '../animations/AnimatedComponents';
import { useTheme } from '../context/ThemeContext';

const HomeScreen = ({ navigation }: any) => {
  const { colors, t } = useTheme();
  const [downloadCount, setDownloadCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [localCount, setLocalCount] = useState(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const unsubscribe = navigation.addListener('focus', () => {
      loadCounts();
    });
    return unsubscribe;
  }, [navigation, headerOpacity]);

  const loadCounts = async () => {
    try {
      const musicPath = await StorageService.getMusicPath();
      const musicExists = await RNFS.exists(musicPath);
      if (musicExists) {
        const files = await RNFS.readDir(musicPath);
        setDownloadCount(files.filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.opus')).length);
      }

      const videosPath = await StorageService.getVideosPath();
      const videosExists = await RNFS.exists(videosPath);
      if (videosExists) {
        const files = await RNFS.readDir(videosPath);
        setVideoCount(files.filter(f => f.name.endsWith('.mp4')).length);
      }
    } catch {
      setDownloadCount(0);
      setVideoCount(0);
    }
  };

  const actions = [
    {
      title: 'Buscar en YouTube',
      subtitle: 'Descarga música o videos',
      icon: 'logo-youtube',
      color: '#FF0000',
      screen: 'Buscar',
    },
    {
      title: 'Mi Música',
      subtitle: `${downloadCount} canciones descargadas`,
      icon: 'musical-notes',
      color: '#1DB954',
      screen: 'MiMúsica',
    },
    {
      title: 'Descargas',
      subtitle: `${downloadCount + videoCount} archivos guardados`,
      icon: 'download',
      color: '#FF9800',
      screen: 'Descargas',
    },
    {
      title: 'Archivos Locales',
      subtitle: 'Videos y audio del dispositivo',
      icon: 'folder-open',
      color: '#2196F3',
      screen: 'Local',
    },
    {
      title: 'Mi Cofre',
      subtitle: 'Videos privados seguros',
      icon: 'lock-closed',
      color: '#E91E63',
      screen: 'Cofre',
    },
  ];

  const steps = [
    'Busca canciones o videos en YouTube',
    'Escucha una vista previa antes de descargar',
    'Elige formato MP3 (audio) o MP4 (video)',
    'Guarda videos privados en tu cofre seguro',
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>{t('welcome')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Archivos multimedia gestionados</Text>
            <Text style={[styles.headerSub2, { color: colors.primary }]}>
              {downloadCount} {t('downloads').toLowerCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings-outline" size={26} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.quickActions}>
            {Array.from({ length: Math.ceil(actions.length / 2) }).map((_, rowIndex) => (
              <SlideInView
                key={rowIndex}
                direction="up"
                delay={rowIndex * 150}
                duration={400}>
                <View style={styles.actionRow}>
                  {actions.slice(rowIndex * 2, rowIndex * 2 + 2).map((action) => (
                    <TouchableOpacity
                      key={action.screen}
                      style={[styles.actionButton, { backgroundColor: colors.surface }]}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate(action.screen)}>
                      <View style={[styles.iconCircle, { backgroundColor: `${action.color}20` }]}>
                        <Icon name={action.icon} size={28} color={action.color} />
                      </View>
                      <Text style={[styles.actionText, { color: colors.text }]}>{action.title}</Text>
                      <Text style={[styles.actionCount, { color: colors.textMuted }]}>{action.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </SlideInView>
            ))}
          </View>

          <FadeInView delay={500} duration={500}>
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Cómo funciona</Text>
              {steps.map((step, index) => (
                <SlideInView
                  key={index}
                  direction="right"
                  delay={600 + index * 100}
                  duration={400}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoStep}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.infoText}>{step}</Text>
                  </View>
                </SlideInView>
              ))}
            </View>
          </FadeInView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#b3b3b3', marginTop: 4 },
  headerSub2: { fontSize: 13, color: '#1DB954', marginTop: 2, fontWeight: '500' },
  settingsBtn: { padding: 10, backgroundColor: '#181818', borderRadius: 25 },
  scrollView: { flex: 1 },
  quickActions: {
    paddingHorizontal: 15, paddingTop: 10,
  },
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0,
  },
  actionButton: {
    backgroundColor: '#181818', padding: 16, borderRadius: 16,
    marginBottom: 10, width: '48%',
  },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  actionCount: { color: '#535353', fontSize: 12, marginTop: 4 },
  infoSection: {
    backgroundColor: '#181818', borderRadius: 16, padding: 18, margin: 15,
  },
  infoTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 18 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  infoStep: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#1DB954',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  stepNumber: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  infoText: { color: '#b3b3b3', fontSize: 13, flex: 1 },
});

export default HomeScreen;
