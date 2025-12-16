import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '@/src/utils/walletService';
import { useWalletStore } from '@/src/store/walletStore';

export default function ImportWalletScreen() {
  const router = useRouter();
  const [importMethod, setImportMethod] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addWallet } = useWalletStore();

  const importWallet = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      let wallet;
      if (importMethod === 'mnemonic') {
        if (!mnemonic.trim()) {
          throw new Error('Please enter recovery phrase');
        }
        wallet = await WalletService.createWalletFromMnemonic(mnemonic.trim(), 'Imported Wallet');
      } else {
        if (!privateKey.trim()) {
          throw new Error('Please enter private key');
        }
        wallet = await WalletService.importWalletFromPrivateKey(privateKey.trim(), 'Imported Wallet');
      }

      // Load existing wallets and add new one
      const { wallets: existingWallets } = await WalletService.loadWallets(password).catch(() => ({ 
        wallets: [], 
        currentWalletId: null 
      }));
      const allWallets = [...existingWallets, wallet];
      await WalletService.saveWallets(allWallets, password);
      await WalletService.saveCurrentWalletId(wallet.id);
      
      addWallet(wallet);
      router.replace('/screens/MainTabNavigator');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose Import Method</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, importMethod === 'mnemonic' && styles.tabActive]}
            onPress={() => setImportMethod('mnemonic')}
          >
            <Text style={[styles.tabText, importMethod === 'mnemonic' && styles.tabTextActive]}>
              Recovery Phrase
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, importMethod === 'privateKey' && styles.tabActive]}
            onPress={() => setImportMethod('privateKey')}
          >
            <Text style={[styles.tabText, importMethod === 'privateKey' && styles.tabTextActive]}>
              Private Key
            </Text>
          </TouchableOpacity>
        </View>

        {importMethod === 'mnemonic' ? (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Recovery Phrase</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your 12 or 24 word recovery phrase"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              value={mnemonic}
              onChangeText={setMnemonic}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Private Key</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your private key"
              placeholderTextColor="#666"
              value={privateKey}
              onChangeText={setPrivateKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Create a password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Confirm your password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={importWallet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Import Wallet</Text>
          )}
        </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#6C5CE7',
  },
  tabText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
