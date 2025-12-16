// Price service for fetching cryptocurrency prices
const FLIKIT_API = 'https://system.flikit.io/Api/Index/marketInfo';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface MarketData {
  id: string;
  ticker: string;
  name: string;
  icon: string;
  new_price: string;
  buy_price: string;
  sell_price: string;
  min_price: string;
  max_price: string;
  change: number;
  volume: number;
}

interface ApiResponse {
  status: number;
  data: {
    market: MarketData[];
  };
}

interface CoinGeckoPrice {
  usd: number;
  usd_24h_change: number;
}

// Map chain symbols to CoinGecko IDs
const COINGECKO_IDS: { [key: string]: string } = {
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'MATIC': 'matic-network',
};

export const PriceService = {
  // Fetch BCC price (Blokista) from Flikit
  getBCCPrice: async (): Promise<{ price: number; change: number } | null> => {
    try {
      const response = await fetch(FLIKIT_API);
      const data: ApiResponse = await response.json();

      if (data.status === 1 && data.data.market) {
        // Find BCC/USDT ticker (id: 486)
        const bccMarket = data.data.market.find(
          (item) => item.id === '486' && item.ticker === 'bcc_usdt'
        );

        if (bccMarket) {
          return {
            price: parseFloat(bccMarket.new_price),
            change: bccMarket.change,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching BCC price:', error);
      return null;
    }
  },

  // Fetch Blokista token price by symbol from Flikit
  getBlokirstaTokenPrice: async (symbol: string): Promise<{ price: number; change: number } | null> => {
    try {
      const response = await fetch(FLIKIT_API);
      const data: ApiResponse = await response.json();

      if (data.status === 1 && data.data.market) {
        // Search for token with matching symbol (e.g., bcusd_usdt, avc_usdt)
        const ticker = `${symbol.toLowerCase()}_usdt`;
        const tokenMarket = data.data.market.find(
          (item) => item.ticker.toLowerCase() === ticker
        );

        if (tokenMarket) {
          return {
            price: parseFloat(tokenMarket.new_price),
            change: tokenMarket.change,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching ${symbol} price:`, error);
      return null;
    }
  },

  // Fetch price from CoinGecko for any coin
  getCoinGeckoPrice: async (symbol: string): Promise<{ price: number; change: number } | null> => {
    try {
      const coinId = COINGECKO_IDS[symbol];
      if (!coinId) {
        console.log(`No CoinGecko ID mapping for ${symbol}`);
        return null;
      }

      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();

      if (data[coinId]) {
        return {
          price: data[coinId].usd,
          change: data[coinId].usd_24h_change || 0,
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching ${symbol} price from CoinGecko:`, error);
      return null;
    }
  },

  // Fetch token price by contract address
  getTokenPriceByContract: async (
    chainId: number,
    contractAddress: string
  ): Promise<{ price: number; change: number } | null> => {
    try {
      // Map chain IDs to CoinGecko platform IDs
      const platformMap: { [key: number]: string } = {
        1: 'ethereum',
        56: 'binance-smart-chain',
        137: 'polygon-pos',
        42161: 'arbitrum-one',
        10: 'optimistic-ethereum',
      };

      const platform = platformMap[chainId];
      if (!platform) {
        return null;
      }

      const response = await fetch(
        `${COINGECKO_API}/simple/token_price/${platform}?contract_addresses=${contractAddress}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();

      const lowerAddress = contractAddress.toLowerCase();
      if (data[lowerAddress]) {
        return {
          price: data[lowerAddress].usd,
          change: data[lowerAddress].usd_24h_change || 0,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  },

  // Universal price fetcher
  getPrice: async (
    chainId: number,
    symbol: string,
    contractAddress?: string
  ): Promise<{ price: number; change: number } | null> => {
    // Blokista chain
    if (chainId === 639054) {
      return await PriceService.getBCCPrice();
    }

    // Token with contract address
    if (contractAddress) {
      return await PriceService.getTokenPriceByContract(chainId, contractAddress);
    }

    // Native token by symbol
    return await PriceService.getCoinGeckoPrice(symbol);
  },

  // Format price for display
  formatPrice: (price: number): string => {
    if (price >= 1) {
      return price.toFixed(2);
    } else if (price >= 0.01) {
      return price.toFixed(4);
    } else {
      return price.toFixed(8);
    }
  },

  // Format USD value
  formatUSD: (amount: number, price: number): string => {
    const usdValue = amount * price;
    return usdValue.toFixed(2);
  },
};
