import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useWalletStore } from '@/src/store/walletStore';
import { CHAINS } from '@/src/config/chains';
import { WalletService } from '@/src/utils/walletService';
import { PriceService } from '@/src/utils/priceService';

// Token logo map
const TOKEN_LOGOS: { [key: string]: string } = {
  'BCC': 'https://bccscan.com/images/logo-bcc.png',
  'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
};

interface TokenWithBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  price: number | null;
  usdValue: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { getCurrentWallet, currentChainId, setCurrentChainId, tokens } = useWalletStore();
  const wallet = getCurrentWallet();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [nativePrice, setNativePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenWithBalance[]>([]);

  const currentChain = CHAINS.find((c) => c.chainId === currentChainId) || CHAINS[0];
  const chainTokens = tokens.filter(t => t.chainId === currentChainId);

  const loadBalance = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const bal = await WalletService.getBalance(wallet.address, currentChain.rpcUrl);
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrice = async () => {
    try {
      const priceData = await PriceService.getPrice(
        currentChain.chainId,
        currentChain.symbol
      );
      if (priceData) {
        setNativePrice(priceData.price);
        setPriceChange(priceData.change);
      } else {
        setNativePrice(null);
        setPriceChange(null);
      }
    } catch (error) {
      console.error('Error loading price:', error);
      setNativePrice(null);
      setPriceChange(null);
    }
  };

  const loadTokenBalances = async () => {
    if (!wallet || chainTokens.length === 0) {
      setTokenBalances([]);
      return;
    }

    try {
      const balancesPromises = chainTokens.map(async (token) => {
        try {
          // Fetch balance
          const bal = await WalletService.getTokenBalance(
            token.address,
            wallet.address,
            currentChain.rpcUrl
          );

          // Fetch price based on chain
          let priceData = null;
          if (currentChain.chainId === 639054) {
            // Blokista chain - use Flikit API
            priceData = await PriceService.getBlokirstaTokenPrice(token.symbol);
          } else {
            // Other chains - use CoinGecko
            priceData = await PriceService.getTokenPriceByContract(
              currentChain.chainId,
              token.address
            );
          }

          const price = priceData?.price || null;
          const balNum = parseFloat(bal) || 0;
          const usdValue = price ? balNum * price : 0;

          return {
            ...token,
            balance: bal,
            price,
            usdValue,
          };
        } catch (error) {
          console.error(`Error loading token ${token.symbol}:`, error);
          return {
            ...token,
            balance: '0',
            price: null,
            usdValue: 0,
          };
        }
      });

      const balances = await Promise.all(balancesPromises);
      setTokenBalances(balances);
    } catch (error) {
      console.error('Error loading token balances:', error);
    }
  };

  useEffect(() => {
    loadBalance();
    loadPrice();
    loadTokenBalances();
  }, [currentChainId, wallet, chainTokens.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBalance(), loadPrice(), loadTokenBalances()]);
    setRefreshing(false);
  };

  const copyAddress = async () => {
    if (wallet?.address) {
      await Clipboard.setStringAsync(wallet.address);
      // You could add a toast notification here
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.chainSelector}
          onPress={() => setShowChainSelector(!showChainSelector)}
        >
          <Text style={styles.chainName}>{currentChain.name}</Text>
          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/screens/TransactionHistoryScreen')}>
          <Ionicons name="time" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Chain Selector Dropdown */}
      {showChainSelector && (
        <View style={styles.chainDropdown}>
          {CHAINS.map((chain) => (
            <TouchableOpacity
              key={chain.chainId}
              style={[
                styles.chainOption,
                chain.chainId === currentChainId && styles.chainOptionActive,
              ]}
              onPress={() => {
                setCurrentChainId(chain.chainId);
                setShowChainSelector(false);
              }}
            >
              <Text style={styles.chainOptionText}>{chain.name}</Text>
              {chain.chainId === currentChainId && (
                <Ionicons name="checkmark" size={20} color="#6C5CE7" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <>
              <Text style={styles.balance}>
                {parseFloat(balance).toFixed(4)} {currentChain.symbol}
              </Text>
              {nativePrice && (
                <View style={styles.priceContainer}>
                  <Text style={styles.usdValue}>
                    ≈ ${PriceService.formatUSD(parseFloat(balance), nativePrice)} USD
                  </Text>
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceLabel}>
                      {currentChain.symbol} Price: ${PriceService.formatPrice(nativePrice)}
                    </Text>
                    {priceChange !== null && (
                      <Text
                        style={[
                          styles.priceChange,
                          { color: priceChange >= 0 ? '#51CF66' : '#FF6B6B' },
                        ]}
                      >
                        {priceChange >= 0 ? '+' : ''}
                        {priceChange.toFixed(2)}%
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </>
          )}

          <TouchableOpacity style={styles.addressContainer} onPress={copyAddress}>
            <Text style={styles.address}>
              {wallet?.address.substring(0, 6)}...{wallet?.address.substring(38)}
            </Text>
            <Ionicons name="copy-outline" size={16} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/screens/SendScreen')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/screens/ReceiveScreen')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => alert('Swap feature coming soon!')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Tokens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tokens</Text>
            <TouchableOpacity onPress={() => router.push('/screens/AddTokenScreen')}>
              <Ionicons name="add-circle-outline" size={24} color="#6C5CE7" />
            </TouchableOpacity>
          </View>

          {/* Native Token */}
          <TouchableOpacity 
            style={styles.tokenItem}
            onPress={() => router.push({
              pathname: '/screens/TokenDetailScreen',
              params: {
                symbol: currentChain.symbol,
                name: currentChain.name,
                isNative: 'true',
                chainId: currentChain.chainId.toString(),
              }
            })}
          >
            {TOKEN_LOGOS[currentChain.symbol] && currentChain.symbol !== 'BCC' ? (
              <Image 
                source={{ uri: TOKEN_LOGOS[currentChain.symbol] }} 
                style={styles.tokenLogo}
                onError={() => {}}
              />
            ) : (
              <View style={[
                styles.tokenIcon,
                currentChain.symbol === 'BCC' && { backgroundColor: '#ff9933' }
              ]}>
                <Text style={styles.tokenIconText}>{currentChain.symbol[0]}</Text>
              </View>
            )}
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenName}>{currentChain.symbol}</Text>
              <Text style={styles.tokenBalance}>{parseFloat(balance).toFixed(4)}</Text>
              {nativePrice && (
                <Text style={styles.tokenUsdValue}>
                  ${PriceService.formatUSD(parseFloat(balance), nativePrice)}
                </Text>
              )}
            </View>
            <View style={styles.tokenRight}>
              {nativePrice && (
                <>
                  <Text style={styles.tokenPrice}>${PriceService.formatPrice(nativePrice)}</Text>
                  {priceChange !== null && (
                    <Text
                      style={[
                        styles.tokenChange,
                        { color: priceChange >= 0 ? '#51CF66' : '#FF6B6B' },
                      ]}
                    >
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </Text>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Custom Tokens */}
          {tokenBalances.map((token) => (
            <TouchableOpacity 
              key={token.address} 
              style={styles.tokenItem}
              onPress={() => router.push({
                pathname: '/screens/TokenDetailScreen',
                params: {
                  symbol: token.symbol,
                  name: token.name,
                  address: token.address,
                  decimals: token.decimals.toString(),
                  isNative: 'false',
                  chainId: currentChain.chainId.toString(),
                }
              })}
            >
              {TOKEN_LOGOS[token.symbol] ? (
                <Image 
                  source={{ uri: TOKEN_LOGOS[token.symbol] }} 
                  style={styles.tokenLogo}
                />
              ) : (
                <View style={styles.tokenIcon}>
                  <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
                </View>
              )}
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>{token.symbol}</Text>
                <Text style={styles.tokenBalance}>{parseFloat(token.balance).toFixed(4)}</Text>
                {token.price && (
                  <Text style={styles.tokenUsdValue}>
                    ${token.usdValue.toFixed(2)}
                  </Text>
                )}
              </View>
              <View style={styles.tokenRight}>
                {token.price && (
                  <>
                    <Text style={styles.tokenPrice}>${PriceService.formatPrice(token.price)}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {tokenBalances.length === 0 && (
            <Text style={styles.noTokensText}>No custom tokens added</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  chainSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chainName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chainDropdown: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  chainOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  chainOptionActive: {
    backgroundColor: '#2A2A2A',
  },
  chainOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  walletCard: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 8,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  usdValue: {
    color: '#A0A0A0',
    fontSize: 18,
    marginBottom: 8,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceLabel: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '500',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  address: {
    color: '#A0A0A0',
    fontSize: 14,
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
  actionIconContainer: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ff9933',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenBalance: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 2,
  },
  tokenUsdValue: {
    color: '#6C5CE7',
    fontSize: 12,
    marginTop: 2,
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenPrice: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tokenChange: {
    fontSize: 12,
    marginTop: 2,
  },
  noTokensText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
});
