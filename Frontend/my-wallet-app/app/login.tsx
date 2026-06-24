import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkExistingPinSession = async () => {
      const token = await AsyncStorage.getItem('user_token');
      const pin = await AsyncStorage.getItem('secure_pin');
      if (token && pin) {
        router.replace({ pathname: '/', params: { mode: 'UNLOCK' } });
      }
    };
    checkExistingPinSession();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password,
      });

      interface TokenResponse {
        access_token?: string;
      }
      const { access_token } = response.data as TokenResponse;

      if (access_token) {
        await AsyncStorage.setItem('user_token', access_token);
        
        const pinExists = await AsyncStorage.getItem('secure_pin');
        if (pinExists) {
          Alert.alert('Success', 'Login successful!');
          router.replace('/dashboard');
        } else {
          Alert.alert('Login Successful', 'Please configure your 4-Digit Security PIN Code for fast logins.');
          router.replace({ pathname: '/', params: { mode: 'SETUP' } });
        }
      } else {
        Alert.alert('Error', 'Invalid authentication response from server.');
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.detail || 'Invalid email or password.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="p-6">
        <View className="items-center mb-8">
          <Text className="text-4xl text-blue-900 font-extrabold tracking-tight mb-1">🎓 Abo Wallet</Text>
          <Text className="text-slate-500 font-medium tracking-wide">Student Digital Wallet Portal</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <Text className="text-2xl font-bold text-slate-800">Welcome Back</Text>
          <Text className="text-sm text-slate-500 mt-1 mb-6">Sign in to manage your campus digital account</Text>

          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 focus:border-blue-600 focus:bg-white"
              placeholder="student@university.edu"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 focus:border-blue-600 focus:bg-white"
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className="bg-blue-900 rounded-xl py-4 items-center justify-center shadow-md active:bg-blue-950"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="color-white font-bold text-lg">Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.push('/signup')}
          >
            <Text className="text-sm text-slate-500">
              New student? <Text className="color-blue-900 font-bold underline">Create an Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
