import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Switch, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsService, { AppSettings } from '../services/settingsService';
import VaultService from '../services/vaultService';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }: any) => {
  const { colors, settings, t, reloadSettings } = useTheme();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPin, setResetPin] = useState('');

  const handleThemeChange = () => {
    Alert.alert(t('theme'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('dark'),
        onPress: async () => { await SettingsService.setTheme('dark'); reloadSettings(); },
      },
      {
        text: t('light'),
        onPress: async () => { await SettingsService.setTheme('light'); reloadSettings(); },
      },
      {
        text: t('system'),
        onPress: async () => { await SettingsService.setTheme('system'); reloadSettings(); },
      },
    ]);
  };

  const handleLanguageChange = () => {
    Alert.alert(t('language'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: 'Espanol',
        onPress: async () => { await SettingsService.setLanguage('es'); reloadSettings(); },
      },
      {
        text: 'English',
        onPress: async () => { await SettingsService.setLanguage('en'); reloadSettings(); },
      },
    ]);
  };

  const handleQualityChange = () => {
    Alert.alert(t('downloadQuality'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: 'Baja (128kbps)', onPress: async () => { await SettingsService.setDownloadQuality('low'); reloadSettings(); } },
      { text: 'Media (192kbps)', onPress: async () => { await SettingsService.setDownloadQuality('medium'); reloadSettings(); } },
      { text: 'Alta (320kbps)', onPress: async () => { await SettingsService.setDownloadQuality('high'); reloadSettings(); } },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert(t('clearCache'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: 'Limpiar', style: 'destructive', onPress: () => Alert.alert('Hecho', 'Caché limpiada') },
    ]);
  };

  const handleResetSettings = async () => {
    const isSetup = await VaultService.isVaultSetup();
    if (isSetup) {
      Alert.alert('Verificación requerida', 'Ingresa tu PIN del cofre', [
        { text: t('cancel'), style: 'cancel' },
        { text: 'Ingresar PIN', onPress: () => { setResetPin(''); setShowResetModal(true); } },
      ]);
    } else {
      Alert.alert(t('resetConfig'), '', [
        { text: t('cancel'), style: 'cancel' },
        { text: 'Restablecer', style: 'destructive', onPress: doReset },
      ]);
    }
  };

  const handleResetPinInput = async (digit: string) => {
    const newPin = resetPin + digit;
    setResetPin(newPin);
    if (newPin.length === 4) {
      setShowResetModal(false);
      const valid = await VaultService.verifyPin(newPin);
      if (valid) { doReset(); }
      else { Alert.alert('Error', 'PIN incorrecto'); }
    }
  };

  const doReset = async () => {
    await SettingsService.resetSettings();
    reloadSettings();
    Alert.alert('Hecho', 'Configuración restablecida');
  };

  const getThemeLabel = () => settings.theme === 'dark' ? t('dark') : settings.theme === 'light' ? t('light') : t('system');
  const getLanguageLabel = () => settings.language === 'es' ? 'Espanol' : 'English';
  const getQualityLabel = () => settings.downloadQuality === 'low' ? 'Baja' : settings.downloadQuality === 'high' ? 'Alta' : 'Media';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('general')}</Text>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} onPress={handleThemeChange}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#1DB95420' }]}>
                  <Icon name="color-palette" size={22} color="#1DB954" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('theme')}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: colors.textMuted }]}>{getThemeLabel()}</Text>
                <Icon name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} onPress={handleLanguageChange}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#E91E6320' }]}>
                  <Icon name="language" size={22} color="#E91E63" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('language')}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: colors.textMuted }]}>{getLanguageLabel()}</Text>
                <Icon name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('downloads')}</Text>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} onPress={handleQualityChange}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#FF980020' }]}>
                  <Icon name="musical-notes" size={22} color="#FF9800" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('downloadQuality')}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: colors.textMuted }]}>{getQualityLabel()}</Text>
                <Icon name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#2196F320' }]}>
                  <Icon name="wifi" size={22} color="#2196F3" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('wifiOnly')}</Text>
              </View>
              <Switch
                value={settings.wifiOnly}
                onValueChange={async (value) => { await SettingsService.setWifiOnly(value); reloadSettings(); }}
                trackColor={{ false: '#282828', true: '#1DB954' }}
                thumbColor={settings.wifiOnly ? '#fff' : '#b3b3b3'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('player')}</Text>

            <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#9C27B020' }]}>
                  <Icon name="play-circle" size={22} color="#9C27B0" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('autoPlay')}</Text>
              </View>
              <Switch
                value={settings.autoPlay}
                onValueChange={async (value) => { await SettingsService.setAutoPlay(value); reloadSettings(); }}
                trackColor={{ false: '#282828', true: '#1DB954' }}
                thumbColor={settings.autoPlay ? '#fff' : '#b3b3b3'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#00BCD420' }]}>
                  <Icon name="notifications" size={22} color="#00BCD4" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('notifications')}</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={async (value) => { await SettingsService.setNotifications(value); reloadSettings(); }}
                trackColor={{ false: '#282828', true: '#1DB954' }}
                thumbColor={settings.notifications ? '#fff' : '#b3b3b3'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('storage')}</Text>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} onPress={handleClearCache}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#4CAF5020' }]}>
                  <Icon name="trash" size={22} color="#4CAF50" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('clearCache')}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#607D8B20' }]}>
                  <Icon name="information-circle" size={22} color="#607D8B" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{t('version')}</Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.textMuted }]}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('developer')}</Text>

            <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#E91E6320' }]}>
                  <Icon name="person" size={22} color="#E91E63" />
                </View>
                <View>
                  <Text style={[styles.settingText, { color: colors.text }]}>Francisco Ayala</Text>
                  <Text style={[styles.settingValue, { color: colors.textMuted, marginTop: 2 }]}>Desarrollador</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
              onPress={() => Linking.openURL('tel:73919422')}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, { backgroundColor: '#1DB95420' }]}>
                  <Icon name="call" size={22} color="#1DB954" />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>7391-9422</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.resetButton, { borderColor: colors.danger }]} onPress={handleResetSettings}>
            <Text style={[styles.resetButtonText, { color: colors.danger }]}>{t('resetConfig')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {showResetModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Icon name="keypad" size={40} color={colors.danger} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ingresa tu PIN</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>PIN del cofre para restablecer</Text>
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.pinDot, { backgroundColor: colors.inputBg, borderColor: colors.textMuted }, i < resetPin.length && { backgroundColor: colors.danger, borderColor: colors.danger }]} />
              ))}
            </View>
            <View style={styles.keypad}>
              {['1','2','3','4','5','6','7','8','9','','0','del'].map((key, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.keyBtn, { backgroundColor: colors.surface }, key === '' && { opacity: 0 }]}
                  onPress={() => {
                    if (key === 'del') setResetPin(resetPin.slice(0, -1));
                    else if (key !== '') handleResetPinInput(key);
                  }}>
                  {key === 'del' ? (
                    <Icon name="backspace" size={22} color={colors.text} />
                  ) : key !== '' ? (
                    <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowResetModal(false)}>
              <Text style={[styles.cancelModalText, { color: colors.textMuted }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 0.5 },
  title: { fontSize: 20, fontWeight: 'bold' },
  scrollView: { flex: 1 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, marginBottom: 10 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 0.5 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingText: { fontSize: 15 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14 },
  resetButton: { marginHorizontal: 20, marginTop: 20, marginBottom: 40, padding: 15, borderRadius: 12, backgroundColor: '#181818', alignItems: 'center', borderWidth: 1 },
  resetButtonText: { fontSize: 16, fontWeight: '500' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { borderRadius: 20, padding: 30, alignItems: 'center', width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  modalSubtitle: { fontSize: 14, marginTop: 5 },
  pinDots: { flexDirection: 'row', gap: 16, marginTop: 25, marginBottom: 25 },
  pinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, width: 260 },
  keyBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 26, fontWeight: '300' },
  cancelModalText: { fontSize: 16, marginTop: 20 },
});

export default SettingsScreen;
