import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import VaultService from '../../services/vaultService';

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
            setIsSetup(true);
            setHasPattern(true);
            setSetupStep('pin');
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon
              name={showPattern ? 'grid' : 'keypad'}
              size={50}
              color="#E91E63"
            />
          </View>

          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>

          {showPattern && (
            <View style={styles.patternGrid}>
              {patternPoints.map((num) => {
                const isActive = pattern.includes(num);
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.patternDot,
                      isActive && styles.patternDotActive,
                    ]}
                    onPress={() => handlePatternPress(num)}>
                    <View
                      style={[
                        styles.dotInner,
                        isActive && styles.dotInnerActive,
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
                      i < pin.length && styles.pinDotFilled,
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
                        key === '' && styles.keyBtnEmpty,
                      ]}
                      onPress={() => {
                        if (key === 'del') handleClear();
                        else if (key !== '') handlePinPress(key);
                      }}>
                      {key === 'del' ? (
                        <Icon name="backspace" size={24} color="#fff" />
                      ) : key !== '' ? (
                        <Text style={styles.keyText}>{key}</Text>
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
              <Text style={styles.resetText}>Reiniciar</Text>
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
                  <Icon name="grid" size={20} color="#1DB954" />
                  <Text style={styles.switchModeText}>Usar patron</Text>
                </TouchableOpacity>
              )}
              {hasPin && authMode === 'pattern' && (
                <TouchableOpacity
                  style={styles.switchModeBtn}
                  onPress={() => {
                    setAuthMode('pin');
                    setPattern([]);
                  }}>
                  <Icon name="keypad" size={20} color="#1DB954" />
                  <Text style={styles.switchModeText}>Usar PIN</Text>
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
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#535353', fontSize: 16, marginTop: 15 },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E91E6320', justifyContent: 'center', alignItems: 'center',
    marginBottom: 25,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#535353', fontSize: 14, marginBottom: 40 },
  patternGrid: {
    width: 280, flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 25,
  },
  patternDot: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#181818',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
    borderColor: '#282828',
  },
  patternDotActive: { borderColor: '#E91E63', backgroundColor: '#E91E6320' },
  dotInner: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#282828' },
  dotInnerActive: { backgroundColor: '#E91E63' },
  pinSection: { alignItems: 'center' },
  pinDots: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  pinDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#282828',
    borderWidth: 2, borderColor: '#535353',
  },
  pinDotFilled: { backgroundColor: '#E91E63', borderColor: '#E91E63' },
  keypad: {
    width: 280, flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 15,
  },
  keyBtn: {
    width: 75, height: 75, borderRadius: 40, backgroundColor: '#181818',
    justifyContent: 'center', alignItems: 'center',
  },
  keyBtnEmpty: { backgroundColor: 'transparent' },
  keyText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  resetBtn: { marginTop: 30, paddingVertical: 12, paddingHorizontal: 30 },
  resetText: { color: '#535353', fontSize: 16 },
  switchModeContainer: {
    marginTop: 20, alignItems: 'center', gap: 10,
  },
  switchModeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  switchModeText: { color: '#1DB954', fontSize: 16, fontWeight: '500' },
});

export default VaultAuthScreen;
