import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { ethers } from 'ethers';
import { useWalletStore } from '@/src/store/walletStore';
import { WalletService } from '@/src/utils/walletService';

export default function SettingsScreen() {
  const router = useRouter();
  const { getCurrentWallet, clearWallet } = useWalletStore();
  const wallet = getCurrentWallet();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordAction, setPasswordAction] = useState<'mnemonic' | 'privateKey' | null>(null);
  const [verifying, setVerifying] = useState(false);

  const verifyPassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter password');
      return;
    }

    setVerifying(true);
    try {
      const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));
      const storedPasswordHash = await SecureStore.getItemAsync('wallet_password');
      
      if (passwordHash !== storedPasswordHash) {
        Alert.alert('Error', 'Incorrect password');
        setVerifying(false);
        return;
      }

      // Password correct - show requested info
      setShowPasswordModal(false);
      setPassword('');
      
      if (passwordAction === 'mnemonic') {
        showMnemonicAfterVerification();
      } else if (passwordAction === 'privateKey') {
        showPrivateKeyAfterVerification();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify password');
    } finally {
      setVerifying(false);
    }
  };

  const showRecoveryPhrase = () => {
    if (!wallet?.mnemonic) {
      Alert.alert('Error', 'Recovery phrase not available for wallets imported with private key');
      return;
    }
    setPasswordAction('mnemonic');
    setShowPasswordModal(true);
  };

  const showMnemonicAfterVerification = async () => {
    if (wallet?.mnemonic) {
      Alert.alert(
        'Recovery Phrase',
        wallet.mnemonic,
        [
          {
            text: 'Copy',
            onPress: async () => {
              await Clipboard.setStringAsync(wallet.mnemonic || '');
              Alert.alert('Copied', 'Recovery phrase copied to clipboard');
            },
          },
          { text: 'Close' },
        ]
      );
    }
  };

  const showPrivateKey = () => {
    if (!wallet?.privateKey) {
      Alert.alert('Error', 'Private key not found');
      return;
    }
    setPasswordAction('privateKey');
    setShowPasswordModal(true);
  };

  const showPrivateKeyAfterVerification = async () => {
    if (wallet?.privateKey) {
      Alert.alert(
        'Private Key',
        wallet.privateKey,
        [
          {
            text: 'Copy',
            onPress: async () => {
              await Clipboard.setStringAsync(wallet.privateKey);
              Alert.alert('Copied', 'Private key copied to clipboard');
            },
          },
          { text: 'Close' },
        ]
      );
    }
  };

  const lockWallet = () => {
    clearWallet();
    router.replace('/');
  };

  const deleteWalletConfirm = () => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure you want to delete this wallet? This action cannot be undone. Make sure you have backed up your recovery phrase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await WalletService.deleteWallet();
            clearWallet();
            router.replace('/');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    danger,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon as any}
          size={24}
          color={danger ? '#FF6B6B' : '#6C5CE7'}
        />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, danger && styles.dangerText]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Password</Text>
            <Text style={styles.modalSubtitle}>
              {passwordAction === 'mnemonic' 
                ? 'Enter password to view recovery phrase' 
                : 'Enter password to view private key'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton]}
                onPress={verifyPassword}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content}>
        {/* Wallet Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <View style={styles.walletInfo}>
            <Text style={styles.walletAddress}>{wallet?.address}</Text>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <SettingItem
            icon="key"
            title="Show Recovery Phrase"
            subtitle="View your 12/24 word recovery phrase"
            onPress={showRecoveryPhrase}
          />
          <SettingItem
            icon="lock-closed"
            title="Show Private Key"
            subtitle="View your wallet's private key"
            onPress={showPrivateKey}
          />
          <SettingItem
            icon="log-out"
            title="Lock Wallet"
            subtitle="Lock your wallet"
            onPress={lockWallet}
          />
        </View>

        {/* Network */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <SettingItem
            icon="globe"
            title="Custom RPC"
            subtitle="Add custom RPC endpoints"
            onPress={() => router.push('/screens/CustomRPCScreen')}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerText]}>Danger Zone</Text>
          <SettingItem
            icon="trash"
            title="Delete Wallet"
            subtitle="Permanently delete this wallet"
            onPress={deleteWalletConfirm}
            danger
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Blokista Wallet v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Decentralized Wallet</Text>
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
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  walletInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
  },
  walletAddress: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
  },
  dangerText: {
    color: '#FF6B6B',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    color: '#666',
    fontSize: 14,
  },
  appInfoSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#0F0F0F',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#2A2A2A',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#6C5CE7',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
