// DyDx Integration Utilities - Official v4 Implementation
import { CompositeClient, Network, LocalWallet, BECH32_PREFIX } from '@dydxprotocol/v4-client-js';

// DyDx V4 Configuration
const DYDX_CONFIG = {
  network: Network.testnet(), // Use Network.mainnet() for production
  bech32Prefix: BECH32_PREFIX
};

class DyDxService {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.isConnected = false;
    this.subaccountNumber = 0;
  }

  async initializeClient() {
    try {
      console.log('Initializing DyDx v4 client...');
      this.client = await CompositeClient.connect(DYDX_CONFIG.network);
      console.log('DyDx v4 client initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing DyDx client:', error);
      return false;
    }
  }

  async connectWithMnemonic(mnemonic) {
    try {
      if (!this.client) {
        await this.initializeClient();
      }

      console.log('Creating wallet from mnemonic...');
      this.wallet = await LocalWallet.fromMnemonic(mnemonic, DYDX_CONFIG.bech32Prefix);
      this.isConnected = true;

      console.log('Wallet created successfully:', this.wallet.address);
      return { 
        success: true, 
        address: this.wallet.address,
        type: 'dydx_mnemonic'
      };
    } catch (error) {
      console.error('Error connecting with mnemonic:', error);
      return { success: false, error: error.message };
    }
  }

  async connectWallet() {
    try {
      // Method 1: Try to connect with Keplr (Cosmos ecosystem wallet)
      if (window.keplr) {
        try {
          // DyDx v4 Chain ID for mainnet
          const chainId = 'dydx-mainnet-1';
          
          await window.keplr.enable(chainId);
          const offlineSigner = window.keplr.getOfflineSigner(chainId);
          const accounts = await offlineSigner.getAccounts();
          
          if (accounts.length > 0) {
            this.wallet = {
              address: accounts[0].address,
              signer: offlineSigner,
              type: 'keplr'
            };
            this.isConnected = true;
            
            if (!this.client) {
              await this.initializeClient();
            }
            
            return { 
              success: true, 
              address: accounts[0].address,
              type: 'keplr'
            };
          }
        } catch (keplrError) {
          console.log('Keplr connection failed:', keplrError.message);
        }
      }
      
      // Method 2: Try MetaMask/Ethereum wallets (for users without Cosmos wallets)
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
          
          if (accounts.length > 0) {
            // Note: This is a fallback - for full DyDx functionality, users need a Cosmos wallet
            this.wallet = {
              address: accounts[0],
              provider: window.ethereum,
              type: 'ethereum'
            };
            this.isConnected = true;
            
            return { 
              success: true, 
              address: accounts[0],
              type: 'ethereum',
              warning: 'Using Ethereum wallet - for full DyDx functionality, please use Keplr or provide a mnemonic'
            };
          }
        } catch (ethError) {
          console.log('Ethereum wallet connection failed:', ethError.message);
        }
      }
      
      // Method 3: Prompt for mnemonic (for advanced users)
      const useMnemonic = window.confirm(
        'No supported wallet found. Would you like to connect using a mnemonic phrase? (Advanced users only)'
      );
      
      if (useMnemonic) {
        const mnemonic = window.prompt(
          'Enter your DyDx mnemonic phrase (24 words):\n\n⚠️ WARNING: Only enter this on trusted devices. Never share your mnemonic!'
        );
        
        if (mnemonic && mnemonic.trim()) {
          return await this.connectWithMnemonic(mnemonic.trim());
        }
      }
      
      throw new Error('No supported wallet found. Please install Keplr wallet for DyDx v4 or use MetaMask as fallback.');
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async getAccountInfo(address = null) {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const targetAddress = address || this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No wallet address available');
      }

      const account = await this.client.validatorClient.get.getAccount(targetAddress);
      return account;
    } catch (error) {
      console.error('Error getting account info:', error);
      return null;
    }
  }

  async getSubaccountInfo(address = null, subaccountNumber = 0) {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const targetAddress = address || this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No wallet address available');
      }

      const subaccount = await this.client.indexerClient.account.getSubaccount(
        targetAddress,
        subaccountNumber
      );
      
      return {
        equity: subaccount?.equity || '0',
        freeCollateral: subaccount?.freeCollateral || '0',
        marginUsage: subaccount?.marginUsage || '0',
        positions: subaccount?.openPerpetualPositions || []
      };
    } catch (error) {
      console.error('Error getting subaccount info:', error);
      return {
        equity: '0',
        freeCollateral: '0',
        marginUsage: '0',
        positions: []
      };
    }
  }

  async getMarkets() {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const markets = await this.client.indexerClient.markets.getPerpetualMarkets();
      return markets?.markets || [];
    } catch (error) {
      console.error('Error getting markets:', error);
      return [];
    }
  }

  async getPositions(address = null, subaccountNumber = 0) {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const targetAddress = address || this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No wallet address available');
      }

      const positions = await this.client.indexerClient.account.getSubaccountPerpetualPositions(
        targetAddress,
        subaccountNumber
      );
      
      return positions?.positions || [];
    } catch (error) {
      console.error('Error getting positions:', error);
      return [];
    }
  }

  async placeOrder(orderParams) {
    if (!this.client || !this.isConnected) {
      throw new Error('Client not initialized or wallet not connected');
    }

    if (this.wallet?.type !== 'dydx_mnemonic' && this.wallet?.type !== 'keplr') {
      throw new Error('DyDx trading requires a Cosmos-compatible wallet or mnemonic');
    }

    try {
      // This is a simplified example - full implementation would require
      // proper order construction and signing based on wallet type
      console.log('Placing DyDx order:', orderParams);
      
      const {
        market,
        side,
        size,
        price,
        orderType = 'LIMIT',
        timeInForce = 'GTT',
        clientId = Date.now()
      } = orderParams;

      // For mnemonic-based wallets, we can place orders directly
      if (this.wallet?.type === 'dydx_mnemonic') {
        // Implementation would go here for actual order placement
        console.log('Placing order with DyDx wallet...');
        
        return {
          success: true,
          orderId: `dydx_order_${clientId}`,
          message: 'Order placed successfully (demo - requires full implementation)'
        };
      }

      // For Keplr wallets, different signing process
      if (this.wallet?.type === 'keplr') {
        console.log('Placing order with Keplr wallet...');
        
        return {
          success: true,
          orderId: `keplr_order_${clientId}`,
          message: 'Order submitted via Keplr (demo - requires full implementation)'
        };
      }

      throw new Error('Unsupported wallet type for trading');
      
    } catch (error) {
      console.error('Error placing order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getOrderbook(market) {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const orderbook = await this.client.indexerClient.markets.getPerpetualMarketOrderbook(market);
      return orderbook;
    } catch (error) {
      console.error('Error getting orderbook:', error);
      return { bids: [], asks: [] };
    }
  }

  async getCandlesData(market, resolution = 'HOUR', limit = 100) {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const candles = await this.client.indexerClient.markets.getPerpetualMarketCandles(
        market,
        resolution,
        undefined, // fromISO
        undefined, // toISO  
        limit
      );
      
      return candles?.candles || [];
    } catch (error) {
      console.error('Error getting candles data:', error);
      return [];
    }
  }

  disconnect() {
    this.wallet = null;
    this.isConnected = false;
    console.log('DyDx wallet disconnected');
  }

  // Utility methods
  getWalletInfo() {
    return {
      isConnected: this.isConnected,
      address: this.wallet?.address,
      type: this.wallet?.type
    };
  }

  isReadyForTrading() {
    return this.isConnected && 
           this.client && 
           (this.wallet?.type === 'dydx_mnemonic' || this.wallet?.type === 'keplr');
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

export const SUPPORTED_WALLETS = {
  KEPLR: 'keplr',
  MNEMONIC: 'dydx_mnemonic', 
  ETHEREUM: 'ethereum'
};