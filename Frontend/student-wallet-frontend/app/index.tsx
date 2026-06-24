
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './_services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password,
      });

      const { token, user } = response.data;
      
      // Persist values in AsyncStorage
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', user.id);
      await AsyncStorage.setItem('userName', user.fullName);
      await AsyncStorage.setItem('userPhone', user.phone);
      await AsyncStorage.setItem('userBalance', String(user.balance));

      setLoading(false);
      // Replace layout stack to prevent backward navigation into Login
      router.replace('/dashboard');
    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.error || 'Failed to authenticate. Please check your credentials.';
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center items-center p-6">
          <View className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-slate-100">
            {/* Logo */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-100 mb-4">
                <Text className="text-white text-xl font-extrabold font-mono">ABO</Text>
              </View>
              <Text className="text-2xl font-bold text-slate-800 tracking-tight">ABO Wallet</Text>
              <Text className="text-sm text-slate-400 mt-1">Manage your digital funds securely</Text>
            </View>

            {/* Inputs */}
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Email Address</Text>
                <TextInput
                  className="w-full h-12 bg-slate-50 rounded-xl px-4 border border-slate-100 text-slate-800"
                  placeholder="name@school.edu"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View className="mt-4">
                <Text className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Password</Text>
                <TextInput
                  className="w-full h-12 bg-slate-50 rounded-xl px-4 border border-slate-100 text-slate-800"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Action */}
            <TouchableOpacity 
              className="w-full h-12 bg-blue-600 rounded-xl items-center justify-center mt-8 active:opacity-90 shadow-md shadow-blue-200"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">SIGN IN</Text>
              )}
            </TouchableOpacity>

            {/* Link to Signup */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-400 text-sm">Don't have an account? </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-bold text-sm">Create account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}