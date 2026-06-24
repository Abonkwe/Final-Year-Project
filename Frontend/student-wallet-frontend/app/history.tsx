
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react-native';

import api from './_services/api';
import { getLocalTransactions, saveLocalTransactions } from './_services/db';

interface Transaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
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

      // 1. Instant Rendering: Load SQLite Cache
      const cachedTxns = await getLocalTransactions(activeId);
      if (cachedTxns.length > 0) {
        setHistory(cachedTxns);
        setLoading(false); // Stop main loader since we have cached data to show
      }

      // 2. Background Sync: Fetch fresh data from FastAPI backend
      try {
        const response = await api.get(`/transfers/history/${activeId}`);
        const rawTransactions = response.data.data || [];
        const mappedHistory = rawTransactions.map((txn: any) => {
          const isCredit = txn.receiver_id === activeId;
          const feeStr = txn.charges ? ` (Fee: ${txn.charges} XAF)` : '';
          return {
            id: txn.transaction_id,
            userId: isCredit ? txn.receiver_id : txn.sender_id,
            type: isCredit ? 'CREDIT' : 'DEBIT',
            amount: txn.amount,
            description: isCredit
              ? `Received Transfer${feeStr}`
              : `Sent Transfer${feeStr}`,
            timestamp: txn.created_at,
            status: 'COMPLETED',
          };
        });

        // Commit to local SQLite
        await saveLocalTransactions(activeId, mappedHistory);

        // Fetch combined cache (completed from backend + pending offline transactions)
        const updatedTxns = await getLocalTransactions(activeId);
        setHistory(updatedTxns);
      } catch (err) {
        console.error('Failed to update remote transaction cache:', err);
      } finally {
        setLoading(false);
      }
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

    const isPending = item.status === 'PENDING';
    const isFailed = item.status === 'FAILED';

    return (
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-50 active:bg-slate-50 ">
        <View className="flex-row items-center flex-1 pr-2">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            isPending ? 'bg-amber-50' : isFailed ? 'bg-red-50' : isCredit ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {isPending ? (
              <RefreshCw size={16} color="#d97706" />
            ) : isFailed ? (
              <AlertCircle size={16} color="#dc2626" />
            ) : isCredit ? (
              <TrendingUp size={16} color="#16a34a" />
            ) : (
              <TrendingDown size={16} color="#dc2626" />
            )}
          </View>
          <View className="flex-1">
            <Text className="font-bold text-slate-800 text-sm tracking-tight" numberOfLines={1}>{item.description}</Text>
            <View className="flex-row items-center mt-0.5">
              <Text className="text-xs text-slate-400">{dateStr} • {timeStr}</Text>
              {isPending && (
                <View className="bg-amber-100 px-1.5 py-0.5 rounded-md ml-2">
                  <Text className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider">Pending Sync</Text>
                </View>
              )}
              {isFailed && (
                <View className="bg-red-100 px-1.5 py-0.5 rounded-md ml-2">
                  <Text className="text-[9px] font-extrabold text-red-800 uppercase tracking-wider">Failed</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="items-end">
          <Text className={`font-bold text-sm ${
            isFailed ? 'text-slate-400 line-through' : isCredit ? 'text-green-600' : 'text-red-600'
          }`}>
            {amountStr}
          </Text>
          <Text className="text-slate-300 text-[10px] uppercase font-mono mt-0.5" numberOfLines={1} style={{ maxWidth: 80 }}>
            {item.id.startsWith('pending_') ? 'Pending' : item.id}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 pt-10">
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