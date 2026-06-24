
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import api from './_services/api';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !phone) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup', {
        full_name: fullName.trim(),
        email: email.trim(),
        password: password,
        phone_number: phone.trim(),
      });

      setLoading(false);
      Alert.alert(
        'Success', 
        'Registration successful! You can now sign in with your credentials.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Signup Error', message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center items-center p-6 my-4">
          <View className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-slate-100">
            {/* Header */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-slate-800 tracking-tight">Create Account</Text>
              <Text className="text-sm text-slate-400 mt-1">Join the ABO Digital Wallet platform</Text>
            </View>

            {/* Inputs */}
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Full Name</Text>
                <TextInput
                  className="w-full h-12 bg-slate-50 rounded-xl px-4 border border-slate-100 text-slate-800"
                  placeholder="Amandine Kamga"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View className="mt-4">
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
                <Text className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Phone Number</Text>
                <TextInput
                  className="w-full h-12 bg-slate-50 rounded-xl px-4 border border-slate-100 text-slate-800"
                  placeholder="+237677123456"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
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
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">REGISTER</Text>
              )}
            </TouchableOpacity>

            {/* Link back to Login */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-400 text-sm">Already have an account? </Text>
              <Link href="/" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-bold text-sm">Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}