import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/walletStore';

export default function CustomRPCScreen() {
  const router = useRouter();
  const { customRPCs, addCustomRPC, removeCustomRPC } = useWalletStore();
  const [chainId, setChainId] = useState('');
  const [name, setName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [symbol, setSymbol] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');

  const addRPC = () => {
    if (!chainId || !name || !rpcUrl || !symbol) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    addCustomRPC({
      id: Date.now().toString(),
      chainId: parseInt(chainId),
      name,
      rpcUrl,
      symbol,
      explorerUrl,
    });

    // Clear form
    setChainId('');
    setName('');
    setRpcUrl('');
    setSymbol('');
    setExplorerUrl('');

    Alert.alert('Success', 'Custom RPC added successfully');
  };

  const deleteRPC = (id: string) => {
    Alert.alert('Delete RPC', 'Are you sure you want to remove this RPC?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeCustomRPC(id),
      },
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
        <Text style={styles.headerTitle}>Custom RPC</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add Custom Network</Text>
        <Text style={styles.subtitle}>
          Add a custom RPC endpoint to connect to any EVM-compatible network
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Chain ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={chainId}
            onChangeText={setChainId}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Network Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ethereum Mainnet"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>RPC URL *</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#666"
            value={rpcUrl}
            onChangeText={setRpcUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Currency Symbol *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ETH"
            placeholderTextColor="#666"
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Block Explorer URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#666"
            value={explorerUrl}
            onChangeText={setExplorerUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={addRPC}>
          <Text style={styles.buttonText}>Add Network</Text>
        </TouchableOpacity>

        {/* Existing Custom RPCs */}
        {customRPCs.length > 0 && (
          <View style={styles.existingSection}>
            <Text style={styles.existingTitle}>Custom Networks</Text>
            {customRPCs.map((rpc) => (
              <View key={rpc.id} style={styles.rpcItem}>
                <View style={styles.rpcInfo}>
                  <Text style={styles.rpcName}>{rpc.name}</Text>
                  <Text style={styles.rpcUrl}>{rpc.rpcUrl}</Text>
                  <Text style={styles.rpcChain}>
                    Chain ID: {rpc.chainId} • {rpc.symbol}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteRPC(rpc.id)}>
                  <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
    lineHeight: 20,
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
  input: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  existingSection: {
    marginTop: 16,
  },
  existingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  rpcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rpcInfo: {
    flex: 1,
  },
  rpcName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rpcUrl: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 4,
  },
  rpcChain: {
    color: '#6C5CE7',
    fontSize: 12,
  },
});
