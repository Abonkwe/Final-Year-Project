import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PinLockScreen() {
  const [pin, setPin] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const storedPin = await AsyncStorage.getItem('userPinCode');
    if (!storedPin) {
      setIsNewUser(true);
    }
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }
    const storedPin = await AsyncStorage.getItem('userPinCode');
    if (pin === storedPin) {
      router.replace('/dashboard');
    } else {
      Alert.alert('Access Denied', 'Incorrect PIN code');
      setPin('');
    }
  };

  const handleCreatePin = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert('Error', 'Both PINs must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Mismatch', 'PINs do not match');
      return;
    }
    await AsyncStorage.setItem('userPinCode', pin);
    Alert.alert('Success', 'ABO Wallet PIN configured!');
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-slate-900 justify-center items-center p-6">
      <Text className="text-3xl font-bold text-emerald-400 mb-2">ABO Wallet</Text>
      <Text className="text-gray-400 text-center mb-8">
        {isNewUser ? 'Set up your secure 4-digit access PIN' : 'Enter your security PIN to unlock'}
      </Text>

      <TextInput
        className="w-full bg-slate-800 text-white text-center text-2xl tracking-widest font-bold rounded-xl p-4 mb-4 border border-slate-700"
        placeholder="****"
        placeholderTextColor="#475569"
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        value={pin}
        onChangeText={setPin}
      />

      {isNewUser && (
        <TextInput
          className="w-full bg-slate-800 text-white text-center text-2xl tracking-widest font-bold rounded-xl p-4 mb-6 border border-slate-700"
          placeholder="Confirm PIN"
          placeholderTextColor="#475569"
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          value={confirmPin}
          onChangeText={setConfirmPin}
        />
      )}

      <TouchableOpacity
        className="w-full bg-emerald-500 rounded-xl p-4 shadow-lg active:bg-emerald-600"
        onPress={isNewUser ? handleCreatePin : handleVerifyPin}
      >
        <Text className="text-center font-bold text-lg text-slate-950">
          {isNewUser ? 'Save PIN Layout' : 'Unlock Wallet'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}