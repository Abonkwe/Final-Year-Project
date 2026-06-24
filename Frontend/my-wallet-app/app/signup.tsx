import React, { useState } from 'react';
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
import { router } from 'expo-router';
import api from '../src/services/api';

export default function SignupScreen() {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async () => {
    if (!fullName || !email || !phoneNumber || !password) {
      Alert.alert('Validation Error', 'All registration fields are required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup', {
        email: email.trim(),
        password: password,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
      });

      Alert.alert(
        'Success',
        'Registration completed successfully! You can now sign in with your student credentials.',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.detail || 'Failed to register account.';
      Alert.alert('Signup Error', errorMessage);
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
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <Text className="text-2xl font-bold text-slate-800">Register Account</Text>
          <Text className="text-sm text-slate-500 mt-1 mb-6">Connect your credentials to access campus web balance services</Text>

          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Name</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 focus:border-blue-600 focus:bg-white"
              placeholder="John Doe"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 focus:border-blue-600 focus:bg-white"
              placeholder="johndoe@university.edu"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phone Number</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 focus:border-blue-600 focus:bg-white"
              placeholder="+2348000000000"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 focus:border-blue-600 focus:bg-white"
              placeholder="Make it strong"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className="bg-blue-900 rounded-xl py-4 items-center justify-center shadow-md active:bg-blue-950"
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="color-white font-bold text-lg">Register Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.push('/login')}
          >
            <Text className="text-sm text-slate-500">
              Already have an account? <Text className="color-blue-900 font-bold underline">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
