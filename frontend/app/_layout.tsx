import '../polyfills';
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F0F' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="screens/WelcomeScreen" />
      <Stack.Screen name="screens/CreateWalletScreen" />
      <Stack.Screen name="screens/ImportWalletScreen" />
      <Stack.Screen name="screens/UnlockScreen" />
      <Stack.Screen name="screens/MainTabNavigator" />
      <Stack.Screen name="screens/SendScreen" />
      <Stack.Screen name="screens/ReceiveScreen" />
      <Stack.Screen name="screens/TransactionHistoryScreen" />
      <Stack.Screen name="screens/QRScannerScreen" />
      <Stack.Screen name="screens/AddTokenScreen" />
      <Stack.Screen name="screens/CustomRPCScreen" />
      <Stack.Screen name="screens/TokenDetailScreen" />
      <Stack.Screen name="screens/SendTokenScreen" />
    </Stack>
  );
}
