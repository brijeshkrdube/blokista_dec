import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/walletStore';
import { CHAINS } from '@/src/config/chains';
import { ethers } from 'ethers';

export default function AddTokenScreen() {
  const router = useRouter();
  const { currentChainId, addToken } = useWalletStore();
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('');
  const [loading, setLoading] = useState(false);

  const currentChain = CHAINS.find((c) => c.chainId === currentChainId) || CHAINS[0];

  const fetchTokenInfo = async () => {
    if (!tokenAddress) {
      Alert.alert('Error', 'Please enter token address');
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(currentChain.rpcUrl);
      const abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
      ];
      const contract = new ethers.Contract(tokenAddress, abi, provider);

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      setTokenName(name);
      setTokenSymbol(symbol);
      setTokenDecimals(decimals.toString());
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch token info. Please check the address.');
    } finally {
      setLoading(false);
    }
  };

  const addCustomToken = () => {
    if (!tokenAddress || !tokenSymbol || !tokenName || !tokenDecimals) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    addToken({
      address: tokenAddress,
      symbol: tokenSymbol,
      name: tokenName,
      decimals: parseInt(tokenDecimals),
      balance: '0',
      chainId: currentChainId,
    });

    Alert.alert('Success', 'Token added successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
        <Text style={styles.headerTitle}>Add Token</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Custom Token</Text>
        <Text style={styles.subtitle}>
          Add any ERC20 token to your wallet on {currentChain.name}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Token Contract Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              placeholderTextColor="#666"
              value={tokenAddress}
              onChangeText={setTokenAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.fetchButton}
              onPress={fetchTokenInfo}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="search" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Token Symbol</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. USDT"
            placeholderTextColor="#666"
            value={tokenSymbol}
            onChangeText={setTokenSymbol}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Token Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tether USD"
            placeholderTextColor="#666"
            value={tokenName}
            onChangeText={setTokenName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Decimals</Text>
          <TextInput
            style={styles.input}
            placeholder="18"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={tokenDecimals}
            onChangeText={setTokenDecimals}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={addCustomToken}>
          <Text style={styles.buttonText}>Add Token</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  fetchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
