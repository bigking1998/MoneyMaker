// DyDx Integration Utilities - Phantom Wallet Integration

class DyDxService {
  constructor() {
    this.wallet = null;
    this.isConnected = false;
    this.dydxClient = null;
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

  async connectThroughDyDx() {
    try {
      // Method 1: Connect through DyDx official interface
      console.log('Connecting through DyDx platform...');
      
      // Open DyDx connection modal
      const connectToDyDx = window.confirm(
        'Connect to DyDx Platform?\n\n' +
        'This will redirect you to dYdX to establish the connection with your Phantom wallet.\n\n' +
        'Click OK to proceed to dYdX platform.'
      );

      if (connectToDyDx) {
        // For demo purposes, we'll simulate the DyDx connection flow
        // In a real implementation, this would integrate with DyDx's official SDK
        
        const hasPhantom = await this.checkPhantomWallet();
        if (!hasPhantom) {
          const installPhantom = window.confirm(
            'Phantom Wallet not found!\n\n' +
            'DyDx works best with Phantom wallet for Ethereum transactions.\n\n' +
            'Would you like to install Phantom wallet?'
          );
          
          if (installPhantom) {
            window.open('https://phantom.app/', '_blank');
            return {
              success: false,
              error: 'Please install Phantom wallet and try again'
            };
          }
        }

        return await this.connectPhantomWallet();
      }

      throw new Error('Connection to DyDx cancelled by user');
      
    } catch (error) {
      console.error('Error connecting through DyDx:', error);
      return { success: false, error: error.message };
    }
  }

  async checkPhantomWallet() {
    return typeof window !== 'undefined' && 
           (window.phantom?.ethereum || window.phantom?.solana);
  }

  async connectPhantomWallet() {
    try {
      if (!window.phantom) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.');
      }

      // Check if Phantom has Ethereum support
      if (window.phantom.ethereum) {
        console.log('Connecting to Phantom Ethereum...');
        
        const accounts = await window.phantom.ethereum.request({
          method: 'eth_requestAccounts'
        });

        if (accounts && accounts.length > 0) {
          this.wallet = {
            address: accounts[0],
            provider: window.phantom.ethereum,
            type: 'phantom_ethereum'
          };
          this.isConnected = true;

          // Simulate DyDx account setup
          await this.setupDyDxAccount(accounts[0]);

          return {
            success: true,
            address: accounts[0],
            type: 'phantom_ethereum',
            message: 'Successfully connected to DyDx via Phantom Wallet'
          };
        }
      }
      // Fallback to Solana if Ethereum not available
      else if (window.phantom.solana) {
        console.log('Connecting to Phantom Solana...');
        
        const response = await window.phantom.solana.connect();
        
        if (response.publicKey) {
          this.wallet = {
            address: response.publicKey.toString(),
            provider: window.phantom.solana,
            type: 'phantom_solana'
          };
          this.isConnected = true;

          return {
            success: true,
            address: response.publicKey.toString(),
            type: 'phantom_solana',
            warning: 'Connected via Solana - for DyDx trading, Ethereum connection is preferred'
          };
        }
      }

      throw new Error('Failed to connect to Phantom wallet');

    } catch (error) {
      console.error('Phantom wallet connection error:', error);
      return {
        success: false,
        error: `Phantom connection failed: ${error.message}`
      };
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

  async connectWallet() {
    try {
      // Primary method: Connect through DyDx platform
      return await this.connectThroughDyDx();
    } catch (error) {
      console.error('Error in wallet connection flow:', error);
      return { success: false, error: error.message };
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
    const dydxUrl = 'https://trade.dydx.exchange/';
    window.open(dydxUrl, '_blank');
  }

  async openDyDxWithWallet() {
    if (this.isConnected) {
      const dydxUrl = `https://trade.dydx.exchange/?wallet=${this.wallet.address}`;
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