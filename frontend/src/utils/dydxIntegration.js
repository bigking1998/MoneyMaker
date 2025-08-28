// DyDx Integration Utilities - Phantom Wallet Integration
import { PublicKey } from '@solana/web3.js';

class DyDxService {
  constructor() {
    this.wallet = null;
    this.isConnected = false;
    this.dydxClient = null;
    this.provider = null;
  }

  async initializeClient() {
    try {
      console.log('Initializing DyDx service with Phantom wallet support...');
      return true;
    } catch (error) {
      console.error('Error initializing DyDx service:', error);
      return false;
    }
  }

  async connectPhantomWallet() {
    try {
      // Check if Phantom is installed
      if (!window.phantom || !window.phantom.solana) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet from https://phantom.app/');
      }

      const provider = window.phantom.solana;
      
      // Check if already connected
      if (provider.isConnected) {
        console.log('Phantom already connected, getting account...');
        this.wallet = {
          address: provider.publicKey.toString(),
          provider: provider,
          type: 'phantom_solana'
        };
        this.isConnected = true;
        this.provider = provider;
        
        return {
          success: true,
          address: provider.publicKey.toString(),
          type: 'phantom_solana',
          message: 'Successfully connected to Phantom Solana Wallet'
        };
      }

      // Connect to Phantom
      console.log('Connecting to Phantom Solana wallet...');
      const response = await provider.connect();
      
      if (response.publicKey) {
        this.wallet = {
          address: response.publicKey.toString(),
          provider: provider,
          type: 'phantom_solana'
        };
        this.isConnected = true;
        this.provider = provider;

        // Setup DyDx account for Solana
        await this.setupDyDxAccount(response.publicKey.toString());

        console.log('Successfully connected to Phantom:', response.publicKey.toString());

        return {
          success: true,
          address: response.publicKey.toString(),
          type: 'phantom_solana',
          message: 'Successfully connected to DyDx via Phantom Solana Wallet'
        };
      }

      throw new Error('Failed to get public key from Phantom wallet');

    } catch (error) {
      console.error('Phantom wallet connection error:', error);
      return {
        success: false,
        error: `Phantom connection failed: ${error.message}`
      };
    }
  }

  async connectThroughDyDx() {
    try {
      // First try to connect Phantom wallet
      console.log('Attempting to connect Phantom wallet for DyDx...');
      
      const phantomResult = await this.connectPhantomWallet();
      
      if (phantomResult.success) {
        // Success with Phantom, now guide user to DyDx
        const openDyDx = window.confirm(
          `✅ Phantom Wallet Connected!\n\n` +
          `Address: ${phantomResult.address.slice(0, 8)}...${phantomResult.address.slice(-4)}\n\n` +
          `Now let's connect to DyDx trading platform.\n\n` +
          `Click OK to open DyDx where you can:\n` +
          `• Connect your wallet to DyDx\n` +
          `• Start trading BTC/USD\n` +
          `• Access all DyDx features`
        );

        if (openDyDx) {
          // Open DyDx platform
          const dydxUrl = 'https://dydx.trade/trade/BTC-USD';
          window.open(dydxUrl, '_blank');
        }

        return phantomResult;
      } else {
        // Failed to connect Phantom, show error with instructions
        const installPhantom = window.confirm(
          `❌ ${phantomResult.error}\n\n` +
          `To use DyDx, you need Phantom wallet:\n\n` +
          `1. Install Phantom from phantom.app\n` +
          `2. Create a Solana wallet\n` +
          `3. Return here to connect\n\n` +
          `Click OK to open Phantom website`
        );

        if (installPhantom) {
          window.open('https://phantom.app/', '_blank');
        }

        return phantomResult;
      }
      
    } catch (error) {
      console.error('Error connecting through DyDx:', error);
      return { success: false, error: error.message };
    }
  }

  async getDyDxWalletInfo() {
    try {
      // Try to get wallet info from DyDx platform
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (accounts && accounts.length > 0) {
          this.wallet = {
            address: accounts[0],
            provider: window.ethereum,
            type: 'dydx_connected'
          };
          this.isConnected = true;
          
          return {
            success: true,
            address: accounts[0],
            type: 'dydx_connected',
            message: 'Connected to DyDx wallet'
          };
        }
      }
      
      throw new Error('No wallet found on DyDx');
    } catch (error) {
      console.error('Error getting DyDx wallet info:', error);
      return { success: false, error: error.message };
    }
  }

  async syncWithDyDx() {
    try {
      // Attempt to sync with DyDx platform
      console.log('Syncing with DyDx platform...');
      
      // Try multiple methods to detect DyDx connection
      const syncMethods = [
        this.checkEthereumWallet.bind(this),
        this.checkPhantomWallet.bind(this),
        this.checkLocalStorage.bind(this)
      ];
      
      for (const method of syncMethods) {
        try {
          const result = await method();
          if (result.success) {
            return result;
          }
        } catch (error) {
          console.log('Sync method failed:', error.message);
          continue;
        }
      }
      
      // If no automatic sync, prompt user
      const manualSync = window.confirm(
        'Automatic sync failed.\n\n' +
        'If you have connected your wallet on DyDx:\n' +
        '• Make sure you are logged in to DyDx\n' +
        '• Try refreshing both tabs\n' +
        '• Ensure your wallet is unlocked\n\n' +
        'Try manual sync?'
      );
      
      if (manualSync) {
        return await this.manualWalletSync();
      }
      
      throw new Error('Unable to sync with DyDx');
      
    } catch (error) {
      console.error('Error syncing with DyDx:', error);
      return { success: false, error: error.message };
    }
  }

  async checkEthereumWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        this.wallet = {
          address: accounts[0],
          provider: window.ethereum,
          type: 'ethereum_dydx'
        };
        this.isConnected = true;
        return {
          success: true,
          address: accounts[0],
          type: 'ethereum_dydx',
          message: 'Synced with Ethereum wallet from DyDx'
        };
      }
    }
    throw new Error('No Ethereum wallet found');
  }

  async checkPhantomWallet() {
    if (window.phantom?.ethereum) {
      try {
        const accounts = await window.phantom.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          this.wallet = {
            address: accounts[0],
            provider: window.phantom.ethereum,
            type: 'phantom_dydx'
          };
          this.isConnected = true;
          return {
            success: true,
            address: accounts[0],
            type: 'phantom_dydx',
            message: 'Synced with Phantom wallet from DyDx'
          };
        }
      } catch (error) {
        console.log('Phantom wallet check failed:', error);
      }
    }
    throw new Error('No Phantom wallet found');
  }

  async checkLocalStorage() {
    // Check if DyDx has stored wallet info in localStorage
    try {
      const dydxWallet = localStorage.getItem('dydx-wallet') || 
                        localStorage.getItem('wallet-connect') ||
                        localStorage.getItem('phantom-wallet');
      
      if (dydxWallet) {
        const walletData = JSON.parse(dydxWallet);
        if (walletData.address) {
          this.wallet = {
            address: walletData.address,
            type: 'dydx_stored',
            data: walletData
          };
          this.isConnected = true;
          return {
            success: true,
            address: walletData.address,
            type: 'dydx_stored',
            message: 'Synced with stored DyDx wallet'
          };
        }
      }
    } catch (error) {
      console.log('LocalStorage check failed:', error);
    }
    throw new Error('No stored wallet found');
  }

  async manualWalletSync() {
    const walletAddress = window.prompt(
      'Manual Wallet Sync\n\n' +
      'Please enter your wallet address that is connected to DyDx:\n' +
      '(You can find this in your DyDx account or wallet)'
    );
    
    if (walletAddress && walletAddress.trim()) {
      const address = walletAddress.trim();
      
      // Basic address validation
      if (address.length >= 40 && (address.startsWith('0x') || address.length === 42)) {
        this.wallet = {
          address: address,
          type: 'manual_sync',
          synced: true
        };
        this.isConnected = true;
        
        return {
          success: true,
          address: address,
          type: 'manual_sync',
          message: 'Manually synced with DyDx wallet'
        };
      } else {
        throw new Error('Invalid wallet address format');
      }
    }
    
    throw new Error('Manual sync cancelled');
  }

  async connectWallet() {
    try {
      // Primary method: Connect Phantom wallet first, then guide to DyDx
      return await this.connectThroughDyDx();
    } catch (error) {
      console.error('Error in wallet connection flow:', error);
      return { success: false, error: error.message };
    }
  }

  async setupDyDxAccount(address) {
    try {
      console.log('Setting up DyDx account for:', address);
      
      // Simulate DyDx account initialization
      // In a real implementation, this would:
      // 1. Check if user has a DyDx account
      // 2. Create one if needed
      // 3. Set up trading permissions
      
      this.dydxAccount = {
        address: address,
        equity: '0.00',
        freeCollateral: '0.00',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      console.log('DyDx account setup completed');
      return true;
    } catch (error) {
      console.error('Error setting up DyDx account:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.provider && this.provider.isConnected) {
        await this.provider.disconnect();
        console.log('Disconnected from Phantom wallet');
      }
      
      this.wallet = null;
      this.isConnected = false;
      this.dydxAccount = null;
      this.provider = null;
      
      console.log('Disconnected from DyDx and Phantom wallet');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  async getDyDxAccountInfo() {
    if (!this.isConnected || !this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      // In a real implementation, this would call DyDx API
      return {
        address: this.wallet.address,
        equity: this.dydxAccount?.equity || '0.00',
        freeCollateral: this.dydxAccount?.freeCollateral || '0.00',
        marginUsage: '0.0',
        totalPositions: 0,
        openOrders: 0,
        accountType: 'Cross Margin',
        status: 'Active'
      };
    } catch (error) {
      console.error('Error getting DyDx account info:', error);
      return null;
    }
  }

  async getSubaccountInfo(address = null, subaccountNumber = 0) {
    try {
      if (!this.isConnected) {
        return {
          equity: '0',
          freeCollateral: '0',
          marginUsage: '0',
          positions: []
        };
      }

      // Demo data showing DyDx account status
      return {
        equity: '10000.00',
        freeCollateral: '8500.00',
        marginUsage: '15.0',
        positions: [
          { 
            market: 'ETH-USD', 
            size: '5.0', 
            side: 'LONG', 
            unrealizedPnl: '156.78',
            entryPrice: '3500.00',
            markPrice: '3615.86'
          }
        ]
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
    try {
      // Demo markets data from DyDx
      return [
        { 
          ticker: 'ETH-USD', 
          oraclePrice: '3615.86',
          priceChange24H: '3.27',
          volume24H: '2500000',
          openInterest: '45000'
        },
        { 
          ticker: 'BTC-USD', 
          oraclePrice: '65420.50',
          priceChange24H: '-1.45',
          volume24H: '15000000',
          openInterest: '125000'
        },
        { 
          ticker: 'SOL-USD', 
          oraclePrice: '145.23',
          priceChange24H: '5.67',
          volume24H: '850000',
          openInterest: '28000'
        }
      ];
    } catch (error) {
      console.error('Error getting markets:', error);
      return [];
    }
  }

  async placeOrderThroughDyDx(orderParams) {
    if (!this.isConnected) {
      throw new Error('Please connect your Phantom wallet through DyDx first');
    }

    if (!this.isReadyForTrading()) {
      throw new Error('Account not ready for trading. Please complete DyDx setup.');
    }

    try {
      console.log('Placing order through DyDx:', orderParams);
      
      const {
        market,
        side,
        size,
        price,
        orderType = 'LIMIT',
        timeInForce = 'GTT'
      } = orderParams;

      // Simulate DyDx order placement
      const orderId = `dydx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, this would:
      // 1. Validate order parameters
      // 2. Check account margins
      // 3. Submit to DyDx API
      // 4. Handle Phantom wallet signing

      return {
        success: true,
        orderId: orderId,
        message: 'Order placed successfully through DyDx',
        details: {
          market,
          side,
          size,
          price,
          orderType,
          timeInForce,
          walletType: this.wallet.type,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Error placing order through DyDx:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    try {
      if (this.wallet?.type === 'phantom_solana' && window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      }
      
      this.wallet = null;
      this.isConnected = false;
      this.dydxAccount = null;
      
      console.log('Disconnected from DyDx and Phantom wallet');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  // Utility methods
  getWalletInfo() {
    return {
      isConnected: this.isConnected,
      address: this.wallet?.address,
      type: this.wallet?.type,
      dydxReady: this.isReadyForTrading()
    };
  }

  isReadyForTrading() {
    return this.isConnected && 
           this.wallet && 
           (this.wallet.type === 'phantom_ethereum' || this.wallet.type === 'phantom_solana');
  }

  getConnectionInstructions() {
    return {
      primary: {
        name: 'DyDx + Phantom Wallet',
        description: 'Connect through DyDx platform using Phantom wallet',
        steps: [
          'Install Phantom wallet',
          'Connect through DyDx platform',
          'Authorize wallet connection',
          'Start trading'
        ]
      },
      phantom: {
        name: 'Phantom Wallet',
        description: 'Multi-chain wallet supporting Ethereum and Solana',
        url: 'https://phantom.app/',
        supported: true
      }
    };
  }

  // Direct DyDx integration methods
  async redirectToDyDx() {
    const dydxUrl = 'https://dydx.trade/trade/BTC-USD';
    window.open(dydxUrl, '_blank');
  }

  async openDyDxWithWallet() {
    if (this.isConnected) {
      const dydxUrl = `https://dydx.trade/trade/BTC-USD?wallet=${this.wallet.address}`;
      window.open(dydxUrl, '_blank');
    } else {
      await this.redirectToDyDx();
    }
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
  PHANTOM: 'phantom',
  PHANTOM_ETHEREUM: 'phantom_ethereum',
  PHANTOM_SOLANA: 'phantom_solana'
};