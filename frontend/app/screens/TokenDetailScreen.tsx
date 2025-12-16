import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/walletStore';
import { CHAINS } from '@/src/config/chains';
import { WalletService } from '@/src/utils/walletService';
import { PriceService } from '@/src/utils/priceService';

const TOKEN_LOGOS: { [key: string]: string } = {
  'BCC': 'https://bccscan.com/images/logo-bcc.png',
  'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
};

export default function TokenDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getCurrentWallet } = useWalletStore();
  const wallet = getCurrentWallet();

  const symbol = params.symbol as string;
  const name = params.name as string;
  const address = params.address as string;
  const decimals = params.decimals ? parseInt(params.decimals as string) : 18;
  const isNative = params.isNative === 'true';
  const chainId = parseInt(params.chainId as string);

  const [balance, setBalance] = useState('0');
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const currentChain = CHAINS.find((c) => c.chainId === chainId) || CHAINS[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadBalance(), loadPrice(), loadTransactions()]);
    setLoading(false);
  };

  const loadBalance = async () => {
    if (!wallet) return;
    try {
      if (isNative) {
        const bal = await WalletService.getBalance(wallet.address, currentChain.rpcUrl);
        setBalance(bal);
      } else {
        const bal = await WalletService.getTokenBalance(address, wallet.address, currentChain.rpcUrl);
        setBalance(bal);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadPrice = async () => {
    try {
      let priceData = null;
      if (isNative) {
        priceData = await PriceService.getPrice(chainId, symbol);
      } else {
        if (chainId === 639054) {
          priceData = await PriceService.getBlokirstaTokenPrice(symbol);
        } else {
          priceData = await PriceService.getTokenPriceByContract(chainId, address);
        }
      }
      if (priceData) {
        setPrice(priceData.price);
        setPriceChange(priceData.change);
      }
    } catch (error) {
      console.error('Error loading price:', error);
    }
  };

  const loadTransactions = async () => {
    if (!wallet || chainId !== 639054) {
      setTransactions([]);
      return;
    }
    try {
      const txs = await WalletService.fetchTransactions(wallet.address, currentChain.explorerApiUrl);
      
      // Filter transactions based on token type
      let filteredTxs = txs;
      if (!isNative && address) {
        // For custom tokens, only show transactions involving this token contract
        filteredTxs = txs.filter((tx) => {
          // Check if transaction is to/from the token contract
          const isTokenContract = tx.to?.toLowerCase() === address.toLowerCase();
          // Also check if it's a token transfer by looking at input data
          const hasTokenTransfer = tx.input && tx.input.length > 10; // Has function call data
          return isTokenContract || (hasTokenTransfer && tx.to?.toLowerCase() === address.toLowerCase());
        });
      }
      
      setTransactions(filteredTxs.slice(0, 10));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSend = () => {
    if (isNative) {
      router.push('/screens/SendScreen');
    } else {
      router.push({
        pathname: '/screens/SendTokenScreen',
        params: {
          symbol,
          address,
          decimals: decimals.toString(),
          balance,
        }
      });
    }
  };

  const handleSwap = () => {
    Alert.alert('Coming Soon', 'Token swap feature will be available soon!');
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const formatValue = (value: string) => {
    const eth = parseInt(value) / 1e18;
    return eth.toFixed(4);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{symbol}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        {/* Token Info Card */}
        <View style={styles.tokenCard}>
          {TOKEN_LOGOS[symbol] ? (
            <Image source={{ uri: TOKEN_LOGOS[symbol] }} style={styles.tokenLogo} />
          ) : (
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenIconText}>{symbol[0]}</Text>
            </View>
          )}
          
          <Text style={styles.tokenName}>{name}</Text>
          <Text style={styles.balance}>{parseFloat(balance).toFixed(6)} {symbol}</Text>
          
          {price && (
            <View style={styles.priceContainer}>
              <Text style={styles.usdValue}>
                ≈ ${PriceService.formatUSD(parseFloat(balance), price)} USD
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>${PriceService.formatPrice(price)}</Text>
                {priceChange !== null && (
                  <Text style={[styles.priceChange, { color: priceChange >= 0 ? '#51CF66' : '#FF6B6B' }]}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <View style={styles.actionIcon}>
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/screens/ReceiveScreen')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
            <View style={styles.actionIcon}>
              <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length > 0 ? (
            transactions.map((tx, index) => {
              const isSent = tx.from.toLowerCase() === wallet?.address.toLowerCase();
              return (
                <View key={index} style={styles.txItem}>
                  <View style={[styles.txIcon, { backgroundColor: isSent ? '#FF6B6B' : '#51CF66' }]}>
                    <Ionicons name={isSent ? 'arrow-up' : 'arrow-down'} size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txType}>{isSent ? 'Sent' : 'Received'}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.timeStamp)}</Text>
                  </View>
                  <View style={styles.txValueContainer}>
                    <Text style={[styles.txValue, { color: isSent ? '#FF6B6B' : '#51CF66' }]}>
                      {isSent ? '-' : '+'}{formatValue(tx.value)} {symbol}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noTxText}>No recent transactions</Text>
          )}
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  tokenCard: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  tokenLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  tokenIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#ff9933',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenIconText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  tokenName: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  priceContainer: {
    alignItems: 'center',
  },
  usdValue: {
    fontSize: 18,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6C5CE7',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#6C5CE7',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 2,
  },
  txValueContainer: {
    alignItems: 'flex-end',
  },
  txValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  noTxText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
});
