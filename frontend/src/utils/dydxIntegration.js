// DyDx Integration Utilities
import { CompositeClient, IndexerConfig, ValidatorConfig } from '@dydxprotocol/v4-client-js';

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
      const indexerConfig = new IndexerConfig(
        DYDX_CONFIG.indexer.host,
        DYDX_CONFIG.indexer.websocket
      );
      
      const validatorConfig = new ValidatorConfig(
        DYDX_CONFIG.validator.host,
        DYDX_CONFIG.validator.chainId,
        {
          CHAINTOKEN_DENOM: 'adydx',
          CHAINTOKEN_DECIMALS: 18,
          USDC_DENOM: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
          USDC_GAS_DENOM: 'uusdc',
          USDC_DECIMALS: 6,
        }
      );

      this.client = await CompositeClient.connect(
        indexerConfig,
        validatorConfig
      );

      console.log('DyDx client initialized');
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
      } 
      // Fallback to MetaMask for Ethereum-compatible wallets
      else if (window.ethereum) {
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
      } else {
        throw new Error('No compatible wallet found. Please install Keplr or MetaMask.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async getAccountBalance(address) {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const subaccount = await this.client.indexerClient.account.getSubaccount(
        address,
        0
      );
      
      return {
        equity: subaccount?.equity || '0',
        freeCollateral: subaccount?.freeCollateral || '0',
        marginUsage: subaccount?.marginUsage || '0'
      };
    } catch (error) {
      console.error('Error getting account balance:', error);
      return { equity: '0', freeCollateral: '0', marginUsage: '0' };
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

  async getPositions(address) {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      const positions = await this.client.indexerClient.account.getSubaccountPerpetualPositions(
        address,
        0
      );
      
      return positions?.positions || [];
    } catch (error) {
      console.error('Error getting positions:', error);
      return [];
    }
  }

  async placeTrade(orderParams) {
    if (!this.client || !this.isConnected) {
      throw new Error('Client not initialized or wallet not connected');
    }

    try {
      // This is a simplified example
      // In a real implementation, you would need to handle signing and submission
      console.log('Placing trade with params:', orderParams);
      
      // Placeholder for actual trade execution
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

  async getCandlesData(market, resolution = '1HOUR', limit = 100) {
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