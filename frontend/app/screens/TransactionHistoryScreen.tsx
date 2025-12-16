import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/walletStore';
import { CHAINS } from '@/src/config/chains';
import { WalletService } from '@/src/utils/walletService';
import { Transaction } from '@/src/types';

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const { getCurrentWallet, currentChainId } = useWalletStore();
  const wallet = getCurrentWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentChain = CHAINS.find((c) => c.chainId === currentChainId) || CHAINS[0];

  const loadTransactions = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const txs = await WalletService.fetchTransactions(
        wallet.address,
        currentChain.explorerApiUrl
      );
      setTransactions(txs.slice(0, 50)); // Show last 50 transactions
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentChainId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const formatValue = (value: string) => {
    const eth = parseInt(value) / 1e18;
    return eth.toFixed(4);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && transactions.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
          }
        >
          {transactions.map((tx, index) => {
            const isSent = tx.from.toLowerCase() === wallet?.address.toLowerCase();
            return (
              <View key={index} style={styles.txItem}>
                <View
                  style={[
                    styles.txIcon,
                    { backgroundColor: isSent ? '#FF6B6B' : '#51CF66' },
                  ]}
                >
                  <Ionicons
                    name={isSent ? 'arrow-up' : 'arrow-down'}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>{isSent ? 'Sent' : 'Received'}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.timeStamp)}</Text>
                </View>
                <View style={styles.txValueContainer}>
                  <Text style={[styles.txValue, { color: isSent ? '#FF6B6B' : '#51CF66' }]}>
                    {isSent ? '-' : '+'}{formatValue(tx.value)} {currentChain.symbol}
                  </Text>
                  <Text style={styles.txStatus}>
                    {tx.isError === '0' ? 'Success' : 'Failed'}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  txDate: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
  },
  txValueContainer: {
    alignItems: 'flex-end',
  },
  txValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  txStatus: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
  },
});
