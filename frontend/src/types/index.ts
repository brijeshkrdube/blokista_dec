export interface Wallet {
  id: string;
  name: string;
  address: string;
  mnemonic?: string;
  privateKey: string;
  createdAt: number;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  chainId: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  blockNumber: string;
  gas: string;
  gasPrice: string;
  isError: string;
}

export interface CustomRPC {
  id: string;
  chainId: number;
  name: string;
  rpcUrl: string;
  symbol: string;
  explorerUrl: string;
}
