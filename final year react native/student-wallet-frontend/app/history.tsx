/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react-native';

import api from './_services/api';

interface Transaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  timestamp: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const storedId = await AsyncStorage.getItem('userId');
      const activeId = storedId || 'student_123';

      const response = await api.get(`/transfers/history/${activeId}`);
      setHistory(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Failed to retrieve statement logs:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'CREDIT';
    const amountStr = `${isCredit ? '+' : '-'}${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XAF`;
    
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-50 active:bg-slate-50">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
            {isCredit ? (
              <TrendingUp size={16} color="#16a34a" />
            ) : (
              <TrendingDown size={16} color="#dc2626" />
            )}
          </View>
          <View>
            <Text className="font-bold text-slate-800 text-sm tracking-tight">{item.description}</Text>
            <Text className="text-xs text-slate-400 mt-0.5">{dateStr} • {timeStr}</Text>
          </View>
        </View>

        <View className="items-end">
          <Text className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
            {amountStr}
          </Text>
          <Text className="text-slate-300 text-[10px] uppercase font-mono mt-0.5">{item.id}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center mr-4 active:bg-slate-200"
        >
          <ArrowLeft size={18} color="#475569" />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-bold text-slate-800">Statement Ledger</Text>
          <Text className="text-xs text-slate-400">All digital wallet history and transfers</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : history.length === 0 ? (
        <View className="flex-grow justify-center items-center p-8 py-20">
          <Text className="text-slate-400 text-xs text-center">No Transactions Found</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}