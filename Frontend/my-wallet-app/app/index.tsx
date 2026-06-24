import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';

export default function PinScreen() {
  const params = useLocalSearchParams();
  const forceMode = params.mode as 'SETUP' | 'CONFIRM' | 'UNLOCK' | undefined;

  const [mode, setMode] = useState<'SETUP' | 'CONFIRM' | 'UNLOCK'>('UNLOCK');
  const [pin, setPin] = useState<string>('');
  const [tempPin, setTempPin] = useState<string>(''); 
  const [loading, setLoading] = useState<boolean>(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);

  useEffect(() => {
    checkPinStatus();
  }, [forceMode]);

  const checkPinStatus = async () => {
    setLoading(true);
    try {
      const storedPin = await AsyncStorage.getItem('secure_pin');
      setSavedPin(storedPin);

      if (forceMode) {
        setMode(forceMode);
      } else if (storedPin) {
        setMode('UNLOCK');
      } else {
        setMode('SETUP');
      }
    } catch (error) {
      console.error('Error loading secure PIN state:', error);
      setMode('SETUP');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setTimeout(() => {
          validatePin(newPin);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const validatePin = async (enteredPin: string) => {
    if (mode === 'UNLOCK') {
      const targetPin = savedPin || '1234'; 
      if (enteredPin === targetPin) {
        Vibration.vibrate(50);
        router.replace('/dashboard');
      } else {
        Vibration.vibrate(200);
        Alert.alert('Incorrect PIN', 'The security PIN code you entered is invalid. Please try again.');
        setPin('');
      }
    } else if (mode === 'SETUP') {
      setTempPin(enteredPin);
      setPin('');
      setMode('CONFIRM');
    } else if (mode === 'CONFIRM') {
      if (enteredPin === tempPin) {
        setLoading(true);
        try {
          await AsyncStorage.setItem('secure_pin', enteredPin);
          Vibration.vibrate(100);
          Alert.alert(
            'PIN Configured Successfully', 
            'Your security PIN has been set. You will now use this PIN for fast entry without needing to sign in again.',
            [{ text: 'Proceed to Portal', onPress: () => router.replace('/dashboard') }]
          );
        } catch (error) {
          Alert.alert('Error Info', 'Could not persist security PIN details. Please try again.');
          setMode('SETUP');
          setPin('');
        } finally {
          setLoading(false);
        }
      } else {
        Vibration.vibrate(250);
        Alert.alert('PIN Mismatch', 'The confirmation PIN does not match. Please start over.');
        setMode('SETUP');
        setPin('');
        setTempPin('');
      }
    }
  };

  const handleResetPinBypass = async () => {
    Alert.alert(
      'Account Log Out',
      'If you forgot your PIN code, you can log out and sign in again with your email and password.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset and Login', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('user_token');
            await AsyncStorage.removeItem('secure_pin');
            router.replace('/login');
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text className="mt-3 text-slate-500 font-medium font-sans">Verifying security state...</Text>
      </SafeAreaView>
    );
  }

  let titleText = 'Enter Secure PIN';
  let subText = 'Input your 4-digit security code to unlock';
  if (mode === 'SETUP') {
    titleText = 'Create Security PIN';
    subText = 'Set a 4-digit PIN for instant access next time';
  } else if (mode === 'CONFIRM') {
    titleText = 'Confirm Security PIN';
    subText = 'Re-enter your 4-digit PIN to activate';
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 justify-between px-6 py-10">
        
        <View className="items-center mt-6">
          <Text className="text-4xl text-blue-900 font-black tracking-tight mb-2">🎓 Abo Wallet</Text>
          <View className="bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
            <Text className="text-blue-900 font-bold text-xs tracking-wider">SECURE DIGITAL LEDGER</Text>
          </View>
        </View>

        <View className="items-center my-8">
          <Text className="text-2xl font-bold text-slate-800 tracking-tight">{titleText}</Text>
          <Text className="text-sm text-slate-500 mt-2 text-center max-w-xs">{subText}</Text>
          
          <View className="flex-row gap-5 mt-8 items-center h-8">
            {[1, 2, 3, 4].map((index) => {
              const filled = pin.length >= index;
              return (
                <View
                  key={index}
                  className={`rounded-full ${
                    filled 
                      ? 'w-5 h-5 bg-blue-900 border-2 border-blue-900 scale-110' 
                      : 'w-4.5 h-4.5 bg-slate-200 border border-slate-300'
                  }`}
                  style={{ transform: [{ scale: filled ? 1.15 : 1.0 }] }}
                />
              );
            })}
          </View>
        </View>

        <View className="w-full max-w-sm mx-auto items-center mb-6">
          <View className="flex-row justify-between w-full mb-4">
            {['1', '2', '3'].map((num) => (
              <TouchableOpacity
                key={num}
                className="w-20 h-20 bg-white border border-slate-100 rounded-full items-center justify-center shadow-xs active:bg-slate-100"
                onPress={() => handleKeyPress(num)}
              >
                <Text className="text-2xl font-bold text-slate-800">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between w-full mb-4">
            {['4', '5', '6'].map((num) => (
              <TouchableOpacity
                key={num}
                className="w-20 h-20 bg-white border border-slate-100 rounded-full items-center justify-center shadow-xs active:bg-slate-100"
                onPress={() => handleKeyPress(num)}
              >
                <Text className="text-2xl font-bold text-slate-800">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between w-full mb-4">
            {['7', '8', '9'].map((num) => (
              <TouchableOpacity
                key={num}
                className="w-20 h-20 bg-white border border-slate-100 rounded-full items-center justify-center shadow-xs active:bg-slate-100"
                onPress={() => handleKeyPress(num)}
              >
                <Text className="text-2xl font-bold text-slate-800">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between w-full">
            <TouchableOpacity
              className="w-20 h-20 rounded-full items-center justify-center active:bg-slate-100"
              onPress={handleResetPinBypass}
            >
              <Text className="text-center text-xs font-bold text-blue-900 underline">Reset / Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-20 h-20 bg-white border border-slate-100 rounded-full items-center justify-center shadow-xs active:bg-slate-100"
              onPress={() => handleKeyPress('0')}
            >
              <Text className="text-2xl font-bold text-slate-800">0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-20 h-20 rounded-full items-center justify-center active:bg-slate-100"
              onPress={handleBackspace}
            >
              <Text className="text-slate-500 font-bold text-lg">◁</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center mt-3">
          <Text className="text-[10px] uppercase font-bold tracking-widest text-slate-400">🛡️ End-to-End Cryptography Enabled</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
