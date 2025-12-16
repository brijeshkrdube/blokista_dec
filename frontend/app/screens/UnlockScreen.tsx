import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '@/src/utils/walletService';
import { useWalletStore } from '@/src/store/walletStore';

export default function UnlockScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setWallets, setCurrentWallet, loadPersistedData } = useWalletStore();

  const unlock = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const { wallets, currentWalletId } = await WalletService.loadWallets(password);
      if (wallets && wallets.length > 0) {
        await loadPersistedData(); // Load tokens and custom RPCs
        setWallets(wallets);
        if (currentWalletId) {
          setCurrentWallet(currentWalletId);
        }
        router.replace('/screens/MainTabNavigator');
      } else {
        Alert.alert('Error', 'No wallets found');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={80} color="#6C5CE7" />
        <Text style={styles.title}>Unlock Wallet</Text>
        <Text style={styles.subtitle}>Enter your password to continue</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={unlock}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={unlock}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Unlock</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 8,
    marginBottom: 48,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
