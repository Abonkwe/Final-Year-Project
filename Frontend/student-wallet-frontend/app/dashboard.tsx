import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LogOut, Send, RefreshCw, History, CreditCard } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import api from './_services/api';
import { getLocalProfile, saveLocalProfile, queueOfflineTransfer } from './_services/db';
import { setupNetworkSyncListener, syncPendingTransfers } from './_services/sync';

export default function DashboardScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [balance, setBalance] = useState<number>(0.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferring, setTransferring] = useState<boolean>(false);

  const loadLocalUser = async () => {
    try {
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;
      setUserId(storedId);

      // 1. Instant Rendering: Priority on SQLite Cache
      const cachedProfile = await getLocalProfile(storedId);
      if (cachedProfile) {
        setUserName(cachedProfile.fullName);
        setUserPhone(cachedProfile.phone);
        setBalance(cachedProfile.balance);
      } else {
        // Fallback to AsyncStorage cache
        const storedName = await AsyncStorage.getItem('userName');
        const storedPhone = await AsyncStorage.getItem('userPhone');
        const storedBalance = await AsyncStorage.getItem('userBalance');

        if (storedName) setUserName(storedName);
        if (storedPhone) setUserPhone(storedPhone);
        if (storedBalance) setBalance(parseFloat(storedBalance) || 0.0);
      }

      // 2. Synchronize any pending transactions in the background first
      await syncPendingTransfers(storedId);

      // 3. Background Sync: Fetch fresh data from backend
      fetchProfileAndBalance(storedId);
    } catch (error) {
      console.error('Error loading stored user details:', error);
    }
  };

  const fetchProfileAndBalance = async (uid: string, isManualRefresh = false) => {
    setLoading(true);
    try {
      const response = await api.get(`/auth/profile/${uid}`);
      if (response.data && response.data.user) {
        const u = response.data.user;
        setBalance(u.balance);
        setUserName(u.fullName);
        setUserPhone(u.phone);

        // Update local SQLite Cache
        await saveLocalProfile({
          id: uid,
          email: u.email || '',
          fullName: u.fullName,
          phone: u.phone,
          balance: u.balance,
        });

        // Sync to AsyncStorage
        await AsyncStorage.setItem('userName', u.fullName);
        await AsyncStorage.setItem('userPhone', u.phone);
        await AsyncStorage.setItem('userBalance', String(u.balance));
      }
    } catch (error: any) {
      console.error('Error fetching dashboard state:', error);
      // Suppress connection popups and use SQLite silently, alert only if manual refresh
      if (isManualRefresh) {
        Alert.alert('Sync Connection Error', 'Failed to retrieve latest balance from server. Using local cache.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalUser();

    // Hook network listener for background sync when connection regains
    let unsubscribe: (() => void) | undefined;
    AsyncStorage.getItem('userId').then((uid) => {
      if (uid) {
        unsubscribe = setupNetworkSyncListener(uid, () => {
          fetchProfileAndBalance(uid);
        });
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleOfflineTransfer = async (amountFloat: number) => {
    try {
      const tempId = `pending_${Date.now()}`;
      await queueOfflineTransfer({
        tempId,
        userId,
        senderPhone: userPhone,
        receiverPhone: recipientPhone.trim(),
        amount: amountFloat,
      });

      // Update UI balance immediately
      setBalance((prev) => prev - amountFloat);

      Alert.alert(
        'Offline Mode',
        `No network connection. Transfer of ${amountFloat} XAF has been queued locally and will be processed once connection is restored.`
      );

      setRecipientPhone('');
      setTransferAmount('');
    } catch (err) {
      console.error('Failed to queue offline transfer:', err);
      Alert.alert('Local Error', 'Could not cache transaction locally. Please check your storage.');
    }
  };

  const handleTransfer = async () => {
    if (!recipientPhone || !transferAmount) {
      Alert.alert('Input Error', 'Please input both recipient phone number and transfer amount.');
      return;
    }
    const amountFloat = parseFloat(transferAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      Alert.alert('Input Error', 'Amount must be greater than zero.');
      return;
    }
    if (amountFloat > balance) {
      Alert.alert('Funds Check', 'Insufficient wallet balance to perform this operation.');
      return;
    }

    setTransferring(true);

    // Verify network connectivity
    let isConnected = false;
    try {
      const netState = await NetInfo.fetch();
      isConnected = !!(netState.isConnected && netState.isInternetReachable !== false);
    } catch (e) {
      isConnected = false;
    }

    if (!isConnected) {
      await handleOfflineTransfer(amountFloat);
      setTransferring(false);
      return;
    }

    // Process remote transfer
    try {
      const payload = {
        sender_phone: userPhone,
        receiver_phone: recipientPhone.trim(),
        amount: amountFloat,
      };

      const response = await api.post('/transfers/', payload);
      
      Alert.alert('Success', response.data.message || `Transfer of ${amountFloat} XAF completed.`);
      
      // Clear inputs
      setRecipientPhone('');
      setTransferAmount('');

      // Refresh balance and cache
      if (userId) {
        fetchProfileAndBalance(userId);
      }
    } catch (error: any) {
      console.error('Transfer execution failure:', error);
      
      // If it failed because of a network timeout or API server disconnect (rather than a 400/404 rejection)
      const isNetworkError = !error.response;
      if (isNetworkError) {
        await handleOfflineTransfer(amountFloat);
      } else {
        const detail = error.response?.data?.detail || 'P2P Transfer failed. Please try again.';
        Alert.alert('Transfer Error', detail);
      }
    } finally {
      setTransferring(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userPhone');
    await AsyncStorage.removeItem('userBalance');
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 pt-10">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-slate-800 tracking-tight">ABO Wallet</Text>
              <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Hi, {userName || 'Student'}
              </Text>
            </View>
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                className="w-10 h-10 bg-white border border-slate-100 rounded-full items-center justify-center active:bg-slate-50 shadow-sm shadow-slate-100 mr-2"
                onPress={() => userId && fetchProfileAndBalance(userId, true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <RefreshCw size={16} color="#475569" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 bg-red-50 rounded-full items-center justify-center active:bg-red-100"
                onPress={handleLogout}
              >
                <LogOut size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Card */}
          <View className="bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-100 border border-blue-500 mb-6">
            <Text className="text-blue-100 text-xs font-semibold tracking-wider uppercase mb-1">
              Available Balance
            </Text>
            <Text className="text-white text-3xl font-extrabold my-2">
              {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} XAF
            </Text>
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-blue-500/50">
              <Text className="text-blue-200 text-xs tracking-tight">
                Phone Address: {userPhone || 'Not Configured'}
              </Text>
              <View className="flex-row items-center">
                <CreditCard size={12} color="#93c5fd" className="mr-1" />
                <Text className="text-blue-200 text-[10px] uppercase font-mono">ABO Pay</Text>
              </View>
            </View>
          </View>

          {/* P2P Transfer Section */}
          <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
                <Send size={16} color="#2563eb" />
              </View>
              <View>
                <Text className="text-lg font-bold text-slate-800">Send Money (P2P)</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Transfer instantly to ABO phone numbers</Text>
              </View>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Recipient Phone
                </Text>
                <TextInput
                  className="w-full h-12 bg-slate-50 rounded-xl px-4 border border-slate-100 text-slate-800 text-sm font-medium"
                  placeholder="+237677123456"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={recipientPhone}
                  onChangeText={setRecipientPhone}
                />
              </View>

              <View className="mt-4">
                <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Amount (XAF)
                </Text>
                <TextInput
                  className="w-full h-12 bg-slate-50 rounded-xl px-4 border border-slate-100 text-slate-800 text-sm font-medium"
                  placeholder="5000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                />
              </View>

              <TouchableOpacity
                className="w-full h-12 bg-blue-600 rounded-xl items-center justify-center mt-6 active:opacity-90 shadow-md shadow-blue-200"
                onPress={handleTransfer}
                disabled={transferring}
              >
                {transferring ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-base">Send Funds</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Ledger History Link */}
          <TouchableOpacity
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 flex-row items-center justify-center active:bg-slate-50 shadow-sm shadow-slate-100"
            onPress={() => router.push('/history')}
          >
            <History size={18} color="#2563eb" className="mr-2" />
            <Text className="text-blue-600 font-bold text-base ml-1">Statement History</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}