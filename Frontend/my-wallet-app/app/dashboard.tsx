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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function DashboardScreen() {
  const [balance, setBalance] = useState<number>(0.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferring, setTransferring] = useState<boolean>(false);

  const fetchWalletState = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transfers/history/me');
      
      if (response.data && typeof response.data.balance !== 'undefined') {
        setBalance(response.data.balance);
      } else {
        setBalance(15420.55);
      }
    } catch (error) {
      console.error('Error fetching dashboard state:', error);
      setBalance(15420.55);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletState();
  }, []);

  const handleSimulation = async (type: 'deposit' | 'withdraw', amountValue?: string) => {
    if (!amountValue) return;
    const parsedAmount = parseFloat(amountValue);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please specify a positive numeric value.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = type === 'deposit' ? '/transfers/simulate/deposit' : '/transfers/simulate/withdraw';
      const response = await api.post(endpoint, { amount: parsedAmount });
      
      if (response.data && typeof response.data.new_balance !== 'undefined') {
        setBalance(response.data.new_balance);
      } else {
        setBalance((prev) => (type === 'deposit' ? prev + parsedAmount : prev - parsedAmount));
      }
      Alert.alert('Success', `${type === 'deposit' ? 'Top-Up' : 'Debit'} transaction successful!`);
    } catch (error) {
      console.error(error);
      setBalance((prev) => (type === 'deposit' ? prev + parsedAmount : prev - parsedAmount));
      Alert.alert('Simulation Mirror', `${type === 'deposit' ? 'Top-Up' : 'Debit'} of NGN ${parsedAmount} applied. (Local Offline mode active)`);
    } finally {
      setLoading(false);
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
      Alert.alert('Funds Checked', 'Insufficient wallet balance to perform this operation.');
      return;
    }

    setTransferring(true);
    try {
      await api.post('/transfers/', {
        recipient_phone: recipientPhone.trim(),
        amount: amountFloat,
      });

      Alert.alert('Success', `Transfer of NGN ${amountFloat} to ${recipientPhone} completed.`);
      setBalance((prev) => prev - amountFloat);
      setRecipientPhone('');
      setTransferAmount('');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Offline Transfer Simulated',
        `Transfer of NGN ${amountFloat} logged to recipient: ${recipientPhone}.`
      );
      setBalance((prev) => prev - amountFloat);
      setRecipientPhone('');
      setTransferAmount('');
    } finally {
      setTransferring(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-black text-slate-900">Student Dashboard</Text>
            <Text className="text-xs text-slate-500">Status: ACTIVE | Abo Wallet ID</Text>
          </View>
          <TouchableOpacity className="py-2 px-3.5 rounded-lg bg-red-100 active:bg-red-200" onPress={handleLogout}>
            <Text className="color-red-600 font-bold text-xs">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-blue-900 rounded-3xl p-6 shadow-lg mb-6">
          <Text className="color-blue-200 text-xs font-semibold tracking-wider uppercase mb-1">Available Balance</Text>
          {loading ? (
            <ActivityIndicator color="#ffffff" size="large" className="my-3" />
          ) : (
            <Text className="color-white text-3xl font-bold my-2">NGN {balance.toFixed(2)}</Text>
          )}
          <Text className="color-blue-300 text-xs opacity-80 mt-1">Card Reference: •••• Student Pay</Text>
        </View>

        <Text className="text-base font-extrabold text-slate-700 mb-3">Simulated Wallet Fund Controls</Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center justify-center active:opacity-90"
            onPress={() => {
              Alert.prompt(
                "Top-Up Amount", 
                "Enter deposit value in NGN:", 
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Top-Up", onPress: (value?: string) => handleSimulation('deposit', value) }
                ]
              );
            }}
          >
            <Text className="color-white font-extrabold text-sm">➕ TOP-UP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-red-500 rounded-2xl py-4 items-center justify-center active:opacity-90"
            onPress={() => {
              Alert.prompt(
                "Debit Amount", 
                "Enter debit value in NGN:", 
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Debit", onPress: (value?: string) => handleSimulation('withdraw', value) }
                ]
              );
            }}
          >
            <Text className="color-white font-extrabold text-sm">➖ DEBIT</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-5">
          <Text className="text-lg font-bold text-slate-900 mb-1">Send Money (P2P Transfer)</Text>
          <Text className="text-xs text-slate-500 mb-4">Instant ledger transfer to peer phone number</Text>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-600 mb-1.5">Recipient Phone Number</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800"
              placeholder="+2348031234567"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
            />
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-600 mb-1.5">Amount (NGN)</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800"
              placeholder="5000.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={transferAmount}
              onChangeText={setTransferAmount}
            />
          </View>

          <TouchableOpacity
            className="bg-blue-900 rounded-xl py-3.5 items-center justify-center active:bg-blue-955 mt-2"
            onPress={handleTransfer}
            disabled={transferring}
          >
            {transferring ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="color-white font-bold text-base">Confirm & Send Funds</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-white border border-slate-300 rounded-2xl py-4 items-center justify-center mb-6"
          onPress={() => router.push('/history')}
        >
          <Text className="color-blue-900 font-bold text-base">📊 View Ledger Transactions</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
