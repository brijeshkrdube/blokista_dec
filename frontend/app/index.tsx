import '../polyfills';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { WalletService } from '@/src/utils/walletService';
import { useWalletStore } from '@/src/store/walletStore';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { isLocked } = useWalletStore();

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const hasWallet = await WalletService.hasWallet();
      
      if (hasWallet) {
        // Wallet exists, show unlock screen
        router.replace('/screens/UnlockScreen');
      } else {
        // No wallet, show welcome screen
        router.replace('/screens/WelcomeScreen');
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
      router.replace('/screens/WelcomeScreen');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
