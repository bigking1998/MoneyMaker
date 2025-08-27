// DyDx Integration Utilities - Browser-Compatible Implementation

class DyDxService {
  constructor() {
    this.wallet = null;
    this.isConnected = false;
    this.subaccountNumber = 0;
  }

  async initializeClient() {
    try {
      console.log('DyDx service initialized in browser mode');
      return true;
    } catch (error) {
      console.error('Error initializing DyDx service:', error);
      return false;
    }
  }

  async connectWallet() {
    try {
      // Method 1: Try to connect with Keplr (Cosmos ecosystem wallet)
      if (window.keplr) {
        try {
          // DyDx v4 Chain ID
          const chainId = 'dydx-mainnet-1';
          
          // Check if dYdX chain is already added to Keplr
          try {
            await window.keplr.enable(chainId);
          } catch (enableError) {
            // If chain not added, suggest adding it
            if (enableError.message?.includes('not found') || enableError.message?.includes('does not exist')) {
              // Suggest chain addition
              const addChain = window.confirm(
                'DyDx chain not found in Keplr. Would you like to add it?\n\n' +
                'This will add the DyDx v4 chain to your Keplr wallet.'
              );
              
              if (addChain) {
                try {
                  await window.keplr.experimentalSuggestChain({
                    chainId: chainId,
                    chainName: 'dYdX Chain',
                    rpc: 'https://dydx-ops-rpc.kingnodes.com',
                    rest: 'https://dydx-ops-rest.kingnodes.com',
                    bip44: {
                      coinType: 118,
                    },
                    bech32Config: {
                      bech32PrefixAccAddr: 'dydx',
                      bech32PrefixAccPub: 'dydxpub',
                      bech32PrefixValAddr: 'dydxvaloper',
                      bech32PrefixValPub: 'dydxvaloperpub',
                      bech32PrefixConsAddr: 'dydxvalcons',
                      bech32PrefixConsPub: 'dydxvalconspub',
                    },
                    currencies: [{
                      coinDenom: 'DYDX',
                      coinMinimalDenom: 'adydx',
                      coinDecimals: 18,
                    }],
                    feeCurrencies: [{
                      coinDenom: 'DYDX',
                      coinMinimalDenom: 'adydx',
                      coinDecimals: 18,
                    }],
                    stakeCurrency: {
                      coinDenom: 'DYDX',
                      coinMinimalDenom: 'adydx',
                      coinDecimals: 18,
                    },
                  });
                  
                  // Try enabling again after adding
                  await window.keplr.enable(chainId);
                } catch (addError) {
                  console.error('Failed to add DyDx chain to Keplr:', addError);
                  throw new Error('Failed to add DyDx chain to Keplr wallet');
                }
              } else {
                throw new Error('DyDx chain addition cancelled by user');
              }
            } else {
              throw enableError;
            }
          }
          
          const offlineSigner = window.keplr.getOfflineSigner(chainId);
          const accounts = await offlineSigner.getAccounts();
          
          if (accounts.length > 0) {
            this.wallet = {
              address: accounts[0].address,
              signer: offlineSigner,
              type: 'keplr'
            };
            this.isConnected = true;
            
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
              warning: 'Using Ethereum wallet - for full DyDx functionality, please install Keplr wallet'
            };
          }
        } catch (ethError) {
          console.log('Ethereum wallet connection failed:', ethError.message);
        }
      }
      
      // Provide helpful instructions
      const installWallet = window.confirm(
        'No supported wallet found.\n\n' +
        'For DyDx v4 trading, you need:\n' +
        '• Keplr wallet (recommended)\n' +
        '• MetaMask (limited functionality)\n\n' +
        'Would you like to install Keplr wallet?'
      );
      
      if (installWallet) {
        window.open('https://www.keplr.app/', '_blank');
      }
      
      throw new Error('Please install Keplr wallet for full DyDx functionality');
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async getSubaccountInfo(address = null, subaccountNumber = 0) {
    try {
      const targetAddress = address || this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No wallet address available');
      }

      // Demo data for now - would integrate with actual DyDx API
      return {
        equity: '10000.00',
        freeCollateral: '8500.00',
        marginUsage: '15.0',
        positions: [
          { market: 'ETH-USD', size: '5.0', side: 'LONG', unrealizedPnl: '156.78' }
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
      // Demo markets data - would fetch from actual DyDx API
      return [
        { 
          ticker: 'ETH-USD', 
          oraclePrice: '3615.86',
          priceChange24H: '3.27',
          volume24H: '2500000'
        },
        { 
          ticker: 'BTC-USD', 
          oraclePrice: '65420.50',
          priceChange24H: '-1.45',
          volume24H: '15000000'
        },
        { 
          ticker: 'SOL-USD', 
          oraclePrice: '145.23',
          priceChange24H: '5.67',
          volume24H: '850000'
        }
      ];
    } catch (error) {
      console.error('Error getting markets:', error);
      return [];
    }
  }

  async placeOrder(orderParams) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!this.isReadyForTrading()) {
      throw new Error('Trading requires Keplr wallet for full DyDx functionality');
    }

    try {
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

      // Demo implementation - real implementation would use DyDx v4 client
      return {
        success: true,
        orderId: `dydx_order_${clientId}`,
        message: 'Order placed successfully (demo implementation)',
        details: {
          market,
          side,
          size,
          price,
          orderType,
          timeInForce
        }
      };
      
    } catch (error) {
      console.error('Error placing order:', error);
      return {
        success: false,
        error: error.message
      };
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
    return this.isConnected && this.wallet?.type === 'keplr';
  }

  getConnectionInstructions() {
    return {
      keplr: {
        name: 'Keplr Wallet',
        description: 'Recommended for full DyDx functionality',
        url: 'https://www.keplr.app/',
        supported: true
      },
      metamask: {
        name: 'MetaMask',
        description: 'Limited functionality, viewing only',
        url: 'https://metamask.io/',
        supported: true
      }
    };
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
  ETHEREUM: 'ethereum'
};