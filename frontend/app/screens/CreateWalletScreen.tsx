import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '@/src/utils/walletService';
import { useWalletStore } from '@/src/store/walletStore';

export default function CreateWalletScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [loading, setLoading] = useState(false);
  const { addWallet } = useWalletStore();

  const generateMnemonic = () => {
    const newMnemonic = WalletService.generateMnemonic(wordCount);
    setMnemonic(newMnemonic);
    setStep(2);
  };

  const createWallet = async () => {
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
      const wallet = await WalletService.createWalletFromMnemonic(mnemonic, `Wallet ${Date.now()}`);
      const { wallets: existingWallets } = await WalletService.loadWallets(password).catch(() => ({ wallets: [], currentWalletId: null }));
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

  const mnemonicWords = mnemonic.split(' ');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(step - 1)}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <Text style={styles.title}>Choose Recovery Phrase Length</Text>
            <Text style={styles.description}>
              Your recovery phrase is the key to your wallet. Keep it safe and never share it.
            </Text>

            <View style={styles.optionContainer}>
              <TouchableOpacity
                style={[styles.option, wordCount === 12 && styles.optionSelected]}
                onPress={() => setWordCount(12)}
              >
                <Text style={[styles.optionText, wordCount === 12 && styles.optionTextSelected]}>
                  12 Words
                </Text>
                <Text style={styles.optionSubtext}>Standard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, wordCount === 24 && styles.optionSelected]}
                onPress={() => setWordCount(24)}
              >
                <Text style={[styles.optionText, wordCount === 24 && styles.optionTextSelected]}>
                  24 Words
                </Text>
                <Text style={styles.optionSubtext}>More Secure</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={generateMnemonic}>
              <Text style={styles.buttonText}>Generate Recovery Phrase</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Backup Recovery Phrase</Text>
            <Text style={styles.description}>
              Write down these words in order and store them safely. You'll need them to recover your wallet.
            </Text>

            <View style={styles.mnemonicContainer}>
              {mnemonicWords.map((word, index) => (
                <View key={index} style={styles.wordContainer}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.word}>{word}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
              <Text style={styles.buttonText}>I've Saved My Recovery Phrase</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Set Password</Text>
            <Text style={styles.description}>
              Create a password to unlock your wallet. This password encrypts your wallet on this device.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Enter password"
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
                placeholder="Confirm password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={createWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Create Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 32,
    lineHeight: 20,
  },
  optionContainer: {
    gap: 16,
    marginBottom: 32,
  },
  option: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  optionSelected: {
    borderColor: '#6C5CE7',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionTextSelected: {
    color: '#6C5CE7',
  },
  optionSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  wordContainer: {
    width: '30%',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordNumber: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  word: {
    fontSize: 14,
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
  button: {
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
