import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import api from '../src/services/api';

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  phone?: string;
  date: string;
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transfers/history/me'); 
      
      if (response.data && Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        setTransactions(getFallbackTransactions());
      }
    } catch (error) {
      console.error('Error fetching ledger logs:', error);
      setTransactions(getFallbackTransactions());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackTransactions = (): TransactionItem[] => {
    return [
      { id: 't1', type: 'transfer_out', amount: 2500.00, phone: '+2348039876543', date: '2026-06-19 10:24' },
      { id: 't2', type: 'deposit', amount: 10000.00, phone: 'Self Top-Up', date: '2026-06-18 15:40' },
      { id: 't3', type: 'transfer_out', amount: 1200.00, phone: '+2348022223333', date: '2026-06-17 12:15' },
      { id: 't4', type: 'withdraw', amount: 3000.00, phone: 'ATM Cash Out', date: '2026-06-16 09:00' },
      { id: 't5', type: 'deposit', amount: 15000.00, phone: 'University Bursary', date: '2026-06-15 14:00' },
    ];
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }: { item: TransactionItem }) => {
    const isCredit = item.type === 'deposit';
    const typeLabel = isCredit ? 'CREDIT' : 'DEBIT';
    const formattedAmount = `${isCredit ? '+' : '-'} NGN ${parseFloat(item.amount.toString()).toFixed(2)}`;

    return (
      <View className="bg-white rounded-2xl p-4 mb-3.5 flex-row justify-between items-center border border-slate-200">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-800">{item.phone || 'Digital Transfer'}</Text>
          <Text className="text-xs text-slate-400 mt-1">{item.date}</Text>
        </View>
        <View className="items-end">
          <Text className={`text-base font-bold ${isCredit ? 'color-emerald-500' : 'color-red-500'}`}>
            {formattedAmount}
          </Text>
          <Text className="text-[10px] font-extrabold text-slate-500 mt-1 uppercase tracking-wider">{typeLabel}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row justify-between items-center p-4 border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Text className="color-blue-900 font-bold text-base">◁ Back</Text>
        </TouchableOpacity>
        <Text className="text-md font-bold text-slate-800">Ledger Transaction Log</Text>
        <TouchableOpacity onPress={fetchHistory} className="p-1">
          <Text className="color-blue-900 text-sm font-semibold">Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text className="mt-3 text-sm text-slate-500">Querying ledger transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || String(Math.random())}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text className="text-sm text-slate-400">No financial logs found in account.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
