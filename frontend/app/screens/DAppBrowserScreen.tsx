import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/walletStore';

export default function DAppBrowserScreen() {
  const webViewRef = useRef<WebView>(null);
  const { wallet } = useWalletStore();
  const [url, setUrl] = useState('https://app.uniswap.org');
  const [inputUrl, setInputUrl] = useState('https://app.uniswap.org');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Web3 injection script
  const web3InjectionScript = `
    (function() {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '${wallet?.address}',
        chainId: '0x9c74e', // Blokista chain ID in hex
        request: function(args) {
          return new Promise((resolve, reject) => {
            if (args.method === 'eth_requestAccounts') {
              resolve(['${wallet?.address}']);
            } else if (args.method === 'eth_accounts') {
              resolve(['${wallet?.address}']);
            } else if (args.method === 'eth_chainId') {
              resolve('0x9c74e');
            } else if (args.method === 'personal_sign' || args.method === 'eth_sign') {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SIGN_REQUEST',
                message: args.params[0]
              }));
              reject(new Error('User rejected signing'));
            } else if (args.method === 'eth_sendTransaction') {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TRANSACTION_REQUEST',
                transaction: args.params[0]
              }));
              reject(new Error('User rejected transaction'));
            } else {
              reject(new Error('Method not supported'));
            }
          });
        },
        on: function(event, callback) {
          console.log('Event listener added:', event);
        },
        removeListener: function(event, callback) {
          console.log('Event listener removed:', event);
        }
      };
      
      window.web3 = {
        currentProvider: window.ethereum
      };
    })();
  `;

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setUrl(navState.url);
    setInputUrl(navState.url);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'SIGN_REQUEST') {
        Alert.alert(
          'Sign Message',
          'A dApp wants you to sign a message. This feature will be available soon.',
          [{ text: 'OK' }]
        );
      } else if (data.type === 'TRANSACTION_REQUEST') {
        Alert.alert(
          'Confirm Transaction',
          'A dApp wants to send a transaction. This feature will be available soon.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  };

  const goToUrl = () => {
    let finalUrl = inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setUrl(finalUrl);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* URL Bar */}
      <View style={styles.urlBar}>
        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            value={inputUrl}
            onChangeText={setInputUrl}
            onSubmitEditing={goToUrl}
            placeholder="Enter URL or search..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={goToUrl}>
            <Ionicons name="search" size={20} color="#6C5CE7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={web3InjectionScript}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />

      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={canGoBack ? '#FFFFFF' : '#666'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={canGoForward ? '#FFFFFF' : '#666'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => webViewRef.current?.reload()}
          style={styles.navButton}
        >
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setUrl('https://app.uniswap.org')}
          style={styles.navButton}
        >
          <Ionicons name="home" size={24} color="#FFFFFF" />
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
  urlBar: {
    backgroundColor: '#1A1A1A',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  navButton: {
    padding: 8,
  },
});
