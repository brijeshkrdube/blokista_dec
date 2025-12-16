import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wallet, Token, CustomRPC } from '@/src/types';

const TOKENS_KEY = 'wallet_tokens';
const CUSTOM_RPCS_KEY = 'wallet_custom_rpcs';

interface WalletState {
  wallets: Wallet[];
  currentWalletId: string | null;
  isLocked: boolean;
  currentChainId: number;
  tokens: Token[];
  customRPCs: CustomRPC[];
  setWallets: (wallets: Wallet[]) => void;
  addWallet: (wallet: Wallet) => void;
  setCurrentWallet: (walletId: string) => void;
  getCurrentWallet: () => Wallet | null;
  setIsLocked: (locked: boolean) => void;
  setCurrentChainId: (chainId: number) => void;
  addToken: (token: Token) => void;
  removeToken: (address: string, chainId: number) => void;
  addCustomRPC: (rpc: CustomRPC) => void;
  removeCustomRPC: (id: string) => void;
  removeWallet: (walletId: string) => void;
  clearWallet: () => void;
  loadPersistedData: () => Promise<void>;
  savePersistedData: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  currentWalletId: null,
  isLocked: true,
  currentChainId: 639054, // Default to Blokista
  tokens: [],
  customRPCs: [],
  setWallets: (wallets) => set({ 
    wallets, 
    currentWalletId: wallets.length > 0 ? wallets[0].id : null,
    isLocked: false 
  }),
  addWallet: (wallet) => set((state) => {
    const newWallets = [...state.wallets, wallet];
    return {
      wallets: newWallets,
      currentWalletId: wallet.id,
      isLocked: false,
    };
  }),
  setCurrentWallet: (walletId) => set({ currentWalletId: walletId }),
  getCurrentWallet: () => {
    const state = get();
    return state.wallets.find(w => w.id === state.currentWalletId) || null;
  },
  setIsLocked: (locked) => set({ isLocked: locked }),
  setCurrentChainId: (chainId) => set({ currentChainId: chainId }),
  addToken: (token) => {
    set((state) => {
      const newTokens = [...state.tokens.filter(t => !(t.address === token.address && t.chainId === token.chainId)), token];
      AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(newTokens));
      return { tokens: newTokens };
    });
  },
  removeToken: (address, chainId) => {
    set((state) => {
      const newTokens = state.tokens.filter(t => !(t.address === address && t.chainId === chainId));
      AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(newTokens));
      return { tokens: newTokens };
    });
  },
  addCustomRPC: (rpc) => {
    set((state) => {
      const newRPCs = [...state.customRPCs, rpc];
      AsyncStorage.setItem(CUSTOM_RPCS_KEY, JSON.stringify(newRPCs));
      return { customRPCs: newRPCs };
    });
  },
  removeCustomRPC: (id) => {
    set((state) => {
      const newRPCs = state.customRPCs.filter(r => r.id !== id);
      AsyncStorage.setItem(CUSTOM_RPCS_KEY, JSON.stringify(newRPCs));
      return { customRPCs: newRPCs };
    });
  },
  loadPersistedData: async () => {
    try {
      const [tokensData, rpcsData] = await Promise.all([
        AsyncStorage.getItem(TOKENS_KEY),
        AsyncStorage.getItem(CUSTOM_RPCS_KEY),
      ]);
      
      set({
        tokens: tokensData ? JSON.parse(tokensData) : [],
        customRPCs: rpcsData ? JSON.parse(rpcsData) : [],
      });
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  },
  savePersistedData: async () => {
    const state = get();
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(state.tokens)),
        AsyncStorage.setItem(CUSTOM_RPCS_KEY, JSON.stringify(state.customRPCs)),
      ]);
    } catch (error) {
      console.error('Error saving persisted data:', error);
    }
  },
  removeWallet: (walletId) => set((state) => {
    const newWallets = state.wallets.filter(w => w.id !== walletId);
    const newCurrentId = newWallets.length > 0 ? newWallets[0].id : null;
    return {
      wallets: newWallets,
      currentWalletId: newCurrentId,
      isLocked: newWallets.length === 0,
    };
  }),
  clearWallet: () => set({ 
    wallets: [],
    currentWalletId: null,
    isLocked: true, 
    tokens: [] 
  }),
}));
