import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/walletStore';
import { CHAINS } from '@/src/config/chains';
import { WalletService } from '@/src/utils/walletService';

export default function SendScreen() {
  const router = useRouter();
  const { getCurrentWallet, currentChainId } = useWalletStore();
  const wallet = getCurrentWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  const [loadingBalance, setLoadingBalance] = useState(true);

  const currentChain = CHAINS.find((c) => c.chainId === currentChainId) || CHAINS[0];

  // Load balance on mount
  useEffect(() => {
    loadBalance();
  }, [wallet, currentChainId]);

  const loadBalance = async () => {
    if (!wallet) return;
    setLoadingBalance(true);
    try {
      const bal = await WalletService.getBalance(wallet.address, currentChain.rpcUrl);
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const setPercentage = (percent: number) => {
    const balanceNum = parseFloat(balance);
    if (balanceNum > 0) {
      const amountToSend = (balanceNum * percent / 100).toFixed(8);
      setAmount(amountToSend);
    }
  };

  const setMaxAmount = () => {
    setAmount(balance);
  };

  const send = async () => {
    if (!toAddress || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!wallet?.privateKey) {
      Alert.alert('Error', 'Wallet not found');
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance);
    
    if (amountNum > balanceNum) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const txHash = await WalletService.sendTransaction(
        wallet.privateKey,
        toAddress,
        amount,
        currentChain.rpcUrl
      );
      Alert.alert(
        'Success',
        `Transaction sent successfully!\n\nTx Hash: ${txHash.substring(0, 10)}...`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const scanQR = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'QR Scanner is only available on mobile devices');
    } else {
      router.push('/screens/QRScannerScreen');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send {currentChain.symbol}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {loadingBalance ? (
            <ActivityIndicator color="#6C5CE7" size="small" />
          ) : (
            <Text style={styles.balanceText}>
              {parseFloat(balance).toFixed(6)} {currentChain.symbol}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>To Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              placeholderTextColor="#666"
              value={toAddress}
              onChangeText={setToAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.scanButton} onPress={scanQR}>
              <Ionicons name="qr-code" size={24} color="#6C5CE7" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Amount</Text>
            <TouchableOpacity onPress={setMaxAmount}>
              <Text style={styles.maxText}>MAX</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.0"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          
          {/* Percentage Buttons */}
          <View style={styles.percentageContainer}>
            <TouchableOpacity
              style={styles.percentButton}
              onPress={() => setPercentage(25)}
            >
              <Text style={styles.percentText}>25%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.percentButton}
              onPress={() => setPercentage(50)}
            >
              <Text style={styles.percentText}>50%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.percentButton}
              onPress={() => setPercentage(75)}
            >
              <Text style={styles.percentText}>75%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.percentButton}
              onPress={() => setPercentage(100)}
            >
              <Text style={styles.percentText}>100%</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={send}
          disabled={loading || loadingBalance}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Send {currentChain.symbol}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 24,
  },
  balanceCard: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 24,
    color: '#6C5CE7',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  maxText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  scanButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  percentButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  percentText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
