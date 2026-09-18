import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import VaultService from '../../services/vaultService';
import { useTheme } from '../../context/ThemeContext';

const VaultAuthScreen = ({ navigation }: any) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const [pin, setPin] = useState('');
  const [authMode, setAuthMode] = useState<'pattern' | 'pin'>('pattern');
  const [setupStep, setSetupStep] = useState<'pattern' | 'pin'>('pattern');
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmPattern, setConfirmPattern] = useState<number[]>([]);
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasPattern, setHasPattern] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    checkVaultSetup();
  }, []);

  const checkVaultSetup = async () => {
    const setup = await VaultService.isVaultSetup();
    setIsSetup(setup);
    if (setup) {
      const credentials = await VaultService.getCredentials();
      const pLen = credentials.pattern.length;
      const pPin = credentials.pin.length;
      setHasPattern(pLen > 0);
      setHasPin(pPin > 0);
      if (pLen > 0) {
        setAuthMode('pattern');
      } else if (pPin > 0) {
        setAuthMode('pin');
      }
    }
    setLoading(false);
  };

  const patternPoints = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handlePatternPress = async (num: number) => {
    if (pattern.includes(num)) return;
    if (pattern.length >= 9) return;
    const newPattern = [...pattern, num];
    setPattern(newPattern);

    if (isSetup) {
      if (newPattern.length >= 4) {
        const valid = await VaultService.verifyPattern(newPattern);
        if (valid) {
          navigation.navigate('VaultHome');
        } else {
          Alert.alert('Error', 'Patron incorrecto');
          setPattern([]);
        }
      }
    } else {
      if (setupStep === 'pattern') {
        if (newPattern.length >= 4 && !isConfirming) {
          setTimeout(() => {
            setConfirmPattern(newPattern);
            setIsConfirming(true);
            setPattern([]);
            Alert.alert('Confirma', 'Dibuja el patron nuevamente');
          }, 300);
        } else if (isConfirming && newPattern.length >= 4) {
          const match = JSON.stringify(newPattern) === JSON.stringify(confirmPattern);
          if (match) {
            await VaultService.saveCredentials(confirmPattern, '');
            Alert.alert('Exito', 'Patron configurado. Ahora configura tu PIN.');
            setHasPattern(true);
            setSetupStep('pin');
            setAuthMode('pin');
            setIsConfirming(false);
            setPattern([]);
            setConfirmPattern([]);
          } else {
            Alert.alert('Error', 'Los patrones no coinciden');
            setPattern([]);
            setConfirmPattern([]);
            setIsConfirming(false);
          }
        }
      }
    }
  };

  const handlePinPress = async (num: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      if (isSetup) {
        const valid = await VaultService.verifyPin(newPin);
        if (valid) {
          navigation.navigate('VaultHome');
        } else {
          Alert.alert('Error', 'PIN incorrecto');
          setPin('');
        }
      } else {
        if (setupStep === 'pin') {
          if (!isConfirming) {
            setTimeout(() => {
              setConfirmPin(newPin);
              setIsConfirming(true);
              setPin('');
              Alert.alert('Confirma', 'Ingresa el PIN nuevamente');
            }, 300);
          } else {
            if (newPin === confirmPin) {
              const credentials = await VaultService.getCredentials();
              await VaultService.saveCredentials(credentials.pattern, newPin);
              Alert.alert('Exito', 'PIN configurado correctamente');
              setIsSetup(true);
              setHasPin(true);
              navigation.navigate('VaultHome');
            } else {
              Alert.alert('Error', 'Los PINs no coinciden');
              setPin('');
              setConfirmPin('');
              setIsConfirming(false);
            }
          }
        }
      }
    }
  };

  const handleClear = () => {
    if (authMode === 'pin' || setupStep === 'pin') {
      setPin(pin.slice(0, -1));
    } else {
      setPattern(pattern.slice(0, -1));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Icon name="lock-closed" size={50} color="#E91E63" />
            <Text style={styles.loadingText}>Verificando...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isVerifying = isSetup;
  const showPattern = authMode === 'pattern' || (!isSetup && setupStep === 'pattern');
  const showPin = authMode === 'pin' || (!isSetup && setupStep === 'pin');

  const getTitle = () => {
    if (isVerifying) {
      return showPattern ? 'Dibuja tu patron' : 'Ingresa tu PIN';
    }
    if (isConfirming) {
      return setupStep === 'pattern' ? 'Confirma el patron' : 'Confirma el PIN';
    }
    return setupStep === 'pattern' ? 'Crea tu patron' : 'Crea tu PIN';
  };

  const getSubtitle = () => {
    if (isVerifying) return 'Usa patron o PIN para acceder';
    if (isConfirming) return 'Repite para confirmar';
    return setupStep === 'pattern' ? 'Minimo 4 puntos' : 'Minimo 4 digitos';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
            <Icon
              name={showPattern ? 'grid' : 'keypad'}
              size={50}
              color={colors.accent}
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{getSubtitle()}</Text>

          {showPattern && (
            <View style={styles.patternGrid}>
              {patternPoints.map((num) => {
                const isActive = pattern.includes(num);
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.patternDot,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isActive && { borderColor: colors.accent, backgroundColor: `${colors.accent}20` },
                    ]}
                    onPress={() => handlePatternPress(num)}>
                    <View
                      style={[
                        styles.dotInner,
                        { backgroundColor: colors.border },
                        isActive && { backgroundColor: colors.accent },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showPin && (
            <View style={styles.pinSection}>
              <View style={styles.pinDots}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.pinDot,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.textMuted },
                      i < pin.length && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.keypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(
                  (key, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.keyBtn,
                        { backgroundColor: colors.surface },
                        key === '' && { backgroundColor: 'transparent' },
                      ]}
                      onPress={() => {
                        if (key === 'del') handleClear();
                        else if (key !== '') handlePinPress(key);
                      }}>
                      {key === 'del' ? (
                        <Icon name="backspace" size={24} color={colors.text} />
                      ) : key !== '' ? (
                        <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                      ) : null}
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          )}

          {!isVerifying && setupStep === 'pattern' && pattern.length > 0 && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setPattern([]);
                setIsConfirming(false);
                setConfirmPattern([]);
              }}>
              <Text style={[styles.resetText, { color: colors.textMuted }]}>Reiniciar</Text>
            </TouchableOpacity>
          )}

          {isVerifying && (
            <View style={styles.switchModeContainer}>
              {hasPattern && authMode === 'pin' && (
                <TouchableOpacity
                  style={styles.switchModeBtn}
                  onPress={() => {
                    setAuthMode('pattern');
                    setPin('');
                  }}>
                  <Icon name="grid" size={20} color={colors.primary} />
                  <Text style={[styles.switchModeText, { color: colors.primary }]}>Usar patron</Text>
                </TouchableOpacity>
              )}
              {hasPin && authMode === 'pattern' && (
                <TouchableOpacity
                  style={styles.switchModeBtn}
                  onPress={() => {
                    setAuthMode('pin');
                    setPattern([]);
                  }}>
                  <Icon name="keypad" size={20} color={colors.primary} />
                  <Text style={[styles.switchModeText, { color: colors.primary }]}>Usar PIN</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, marginTop: 15 },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 25,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, marginBottom: 40 },
  patternGrid: {
    width: 280, flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 25,
  },
  patternDot: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  dotInner: { width: 20, height: 20, borderRadius: 10 },
  pinSection: { alignItems: 'center' },
  pinDots: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  pinDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    width: 280, flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 15,
  },
  keyBtn: {
    width: 75, height: 75, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  keyText: { fontSize: 28, fontWeight: '300' },
  resetBtn: { marginTop: 30, paddingVertical: 12, paddingHorizontal: 30 },
  resetText: { fontSize: 16 },
  switchModeContainer: {
    marginTop: 20, alignItems: 'center', gap: 10,
  },
  switchModeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  switchModeText: { fontSize: 16, fontWeight: '500' },
});

export default VaultAuthScreen;
