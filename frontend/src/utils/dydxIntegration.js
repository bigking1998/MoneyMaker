// DyDx Integration Utilities - Simplified Browser Version
// Note: This is a simplified version for browser compatibility

// DyDx V4 Configuration
const DYDX_CONFIG = {
  network: 'testnet', // Use 'mainnet' for production
  indexer: {
    host: 'https://indexer.dydxprotocol.com',
    websocket: 'wss://indexer.dydxprotocol.com/v4/ws'
  },
  validator: {
    host: 'https://dydx-ops-rpc.kingnodes.com',
    chainId: 'dydx-mainnet-1'
  }
};

class DyDxService {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.isConnected = false;
  }

  async initializeClient() {
    try {
      // Simplified initialization for demo
      console.log('DyDx client initialized (demo mode)');
      return true;
    } catch (error) {
      console.error('Error initializing DyDx client:', error);
      return false;
    }
  }

  async connectWallet() {
    try {
      // Check if wallet is available
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }

      // For DyDx V4, we can use Keplr or other Cosmos wallets
      if (window.keplr) {
        try {
          await window.keplr.enable(DYDX_CONFIG.validator.chainId);
          const offlineSigner = window.getOfflineSigner(DYDX_CONFIG.validator.chainId);
          const accounts = await offlineSigner.getAccounts();
          
          if (accounts.length > 0) {
            this.wallet = {
              address: accounts[0].address,
              signer: offlineSigner
            };
            this.isConnected = true;
            return { success: true, address: accounts[0].address };
          }
        } catch (keplrError) {
          console.log('Keplr not available or chain not added:', keplrError);
        }
      }
      
      // Fallback to MetaMask for Ethereum-compatible wallets
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          this.wallet = {
            address: accounts[0],
            provider: window.ethereum
          };
          this.isConnected = true;
          return { success: true, address: accounts[0] };
        }
      }
      
      throw new Error('No compatible wallet found. Please install Keplr or MetaMask.');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async getAccountBalance(address) {
    try {
      // Demo data for now
      return {
        equity: '10000.00',
        freeCollateral: '8500.00',
        marginUsage: '15.0'
      };
    } catch (error) {
      console.error('Error getting account balance:', error);
      return { equity: '0', freeCollateral: '0', marginUsage: '0' };
    }
  }

  async getMarkets() {
    try {
      // Demo markets data
      return [
        { market: 'ETH-USD', price: '3615.86', change24h: '3.27' },
        { market: 'BTC-USD', price: '65420.50', change24h: '-1.45' },
        { market: 'SOL-USD', price: '145.23', change24h: '5.67' }
      ];
    } catch (error) {
      console.error('Error getting markets:', error);
      return [];
    }
  }

  async getPositions(address) {
    try {
      // Demo positions
      return [
        { market: 'ETH-USD', size: '5.0', side: 'LONG', unrealizedPnl: '156.78' },
        { market: 'BTC-USD', size: '0.1', side: 'SHORT', unrealizedPnl: '-23.45' }
      ];
    } catch (error) {
      console.error('Error getting positions:', error);
      return [];
    }
  }

  async placeTrade(orderParams) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Placing trade with params:', orderParams);
      
      // Demo trade execution
      return {
        success: true,
        orderId: `order_${Date.now()}`,
        message: 'Trade placed successfully (demo)'
      };
    } catch (error) {
      console.error('Error placing trade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getOrderbook(market) {
    try {
      // Demo orderbook data
      return {
        bids: [
          { price: '3614.50', size: '2.5' },
          { price: '3614.00', size: '1.8' },
          { price: '3613.50', size: '3.2' }
        ],
        asks: [
          { price: '3616.00', size: '1.9' },
          { price: '3616.50', size: '2.1' },
          { price: '3617.00', size: '1.5' }
        ]
      };
    } catch (error) {
      console.error('Error getting orderbook:', error);
      return { bids: [], asks: [] };
    }
  }

  async getCandlesData(market, resolution = '1HOUR', limit = 100) {
    try {
      // Demo candles data
      const candles = [];
      const now = Date.now();
      let price = 3600 + Math.random() * 100;
      
      for (let i = limit; i >= 0; i--) {
        const time = now - (i * 60 * 60 * 1000); // 1 hour intervals
        const change = (Math.random() - 0.5) * 50;
        price += change;
        
        candles.push({
          startedAt: new Date(time).toISOString(),
          open: price.toString(),
          high: (price + Math.random() * 20).toString(),
          low: (price - Math.random() * 20).toString(),
          close: price.toString(),
          baseTokenVolume: (Math.random() * 1000).toString()
        });
      }
      
      return candles;
    } catch (error) {
      console.error('Error getting candles data:', error);
      return [];
    }
  }

  disconnect() {
    this.wallet = null;
    this.isConnected = false;
    console.log('Wallet disconnected');
  }
}

// Create singleton instance
const dydxService = new DyDxService();

export default dydxService;

// Helper functions
export const formatDyDxPrice = (price) => {
  return parseFloat(price || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
};

export const formatDyDxSize = (size) => {
  return parseFloat(size || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  });
};

export const getDyDxMarketColor = (priceChange) => {
  const change = parseFloat(priceChange || 0);
  return change >= 0 ? 'var(--color-semantic-success)' : 'var(--color-semantic-danger)';
};