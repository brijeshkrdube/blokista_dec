import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';
import { Wallet } from '@/src/types';

const WALLETS_KEY = 'wallets_data';
const CURRENT_WALLET_KEY = 'current_wallet_id';
const WALLET_PASSWORD_KEY = 'wallet_password';

export const WalletService = {
  // Generate new mnemonic
  generateMnemonic: (wordCount: 12 | 24 = 12): string => {
    const strength = wordCount === 12 ? 128 : 256;
    return bip39.generateMnemonic(strength);
  },

  // Create wallet from mnemonic
  createWalletFromMnemonic: async (mnemonic: string, name?: string): Promise<Wallet> => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const walletId = Date.now().toString() + Math.random().toString(36).substring(7);
    
    return {
      id: walletId,
      name: name || `Wallet ${new Date().toLocaleDateString()}`,
      address: hdNode.address,
      mnemonic: mnemonic,
      privateKey: hdNode.privateKey,
      createdAt: Date.now(),
    };
  },

  // Import wallet from private key
  importWalletFromPrivateKey: async (privateKey: string, name?: string): Promise<Wallet> => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const walletId = Date.now().toString() + Math.random().toString(36).substring(7);
      
      return {
        id: walletId,
        name: name || `Imported Wallet`,
        address: wallet.address,
        privateKey: wallet.privateKey,
        createdAt: Date.now(),
      };
    } catch (error) {
      throw new Error('Invalid private key');
    }
  },

  // Save wallets
  saveWallets: async (wallets: Wallet[], password: string): Promise<void> => {
    try {
      const walletsData = JSON.stringify(wallets);
      await SecureStore.setItemAsync(WALLETS_KEY, walletsData);
      
      const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));
      await SecureStore.setItemAsync(WALLET_PASSWORD_KEY, passwordHash);
    } catch (error) {
      throw new Error('Failed to save wallets');
    }
  },

  // Save current wallet ID
  saveCurrentWalletId: async (walletId: string): Promise<void> => {
    await SecureStore.setItemAsync(CURRENT_WALLET_KEY, walletId);
  },

  // Load wallets
  loadWallets: async (password: string): Promise<{ wallets: Wallet[]; currentWalletId: string | null }> => {
    try {
      const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));
      const storedPasswordHash = await SecureStore.getItemAsync(WALLET_PASSWORD_KEY);
      
      if (passwordHash !== storedPasswordHash) {
        throw new Error('Incorrect password');
      }

      const walletsData = await SecureStore.getItemAsync(WALLETS_KEY);
      const currentWalletId = await SecureStore.getItemAsync(CURRENT_WALLET_KEY);
      
      if (!walletsData) {
        return { wallets: [], currentWalletId: null };
      }

      const wallets = JSON.parse(walletsData);
      return { wallets, currentWalletId };
    } catch (error) {
      throw error;
    }
  },

  // Check if wallets exist
  hasWallet: async (): Promise<boolean> => {
    const walletsData = await SecureStore.getItemAsync(WALLETS_KEY);
    return walletsData !== null;
  },

  // Delete all wallets
  deleteAllWallets: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(WALLETS_KEY);
    await SecureStore.deleteItemAsync(CURRENT_WALLET_KEY);
    await SecureStore.deleteItemAsync(WALLET_PASSWORD_KEY);
  },

  // Get balance
  getBalance: async (address: string, rpcUrl: string): Promise<string> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  },

  // Get ERC20 token balance
  getTokenBalance: async (tokenAddress: string, walletAddress: string, rpcUrl: string): Promise<string> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
      const contract = new ethers.Contract(tokenAddress, abi, provider);
      const balance = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  },

  // Send transaction
  sendTransaction: async (
    privateKey: string,
    to: string,
    amount: string,
    rpcUrl: string
  ): Promise<string> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      
      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      throw new Error(error.message || 'Transaction failed');
    }
  },

  // Send ERC20 token
  sendToken: async (
    privateKey: string,
    tokenAddress: string,
    to: string,
    amount: string,
    rpcUrl: string,
    decimals: number
  ): Promise<string> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
      const contract = new ethers.Contract(tokenAddress, abi, wallet);
      
      const tx = await contract.transfer(to, ethers.parseUnits(amount, decimals));
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      throw new Error(error.message || 'Token transfer failed');
    }
  },

  // Fetch transactions from Blokista explorer
  fetchTransactions: async (address: string, explorerApiUrl?: string): Promise<any[]> => {
    try {
      if (!explorerApiUrl) return [];
      
      const response = await fetch(
        `${explorerApiUrl}?module=account&action=txlist&address=${address}`
      );
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        return data.result;
      }
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },
};
