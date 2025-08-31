import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import io from "socket.io-client";
import TradingChart from "./components/TradingChart";
import dydxService from "./utils/dydxIntegration";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Header Component
const Header = ({ walletConnected, onConnectWallet, walletAddress, walletType, onOpenDyDx }) => {
  const getWalletDisplay = () => {
    if (!walletConnected) return null;
    
    const typeDisplay = {
      'phantom_solana': '👻 Phantom (SOL)',
      'phantom_ethereum': '👻 Phantom (ETH)',
      'ethereum_dydx': '🌐 Ethereum (DyDx)',
      'dydx_connected': '🔄 DyDx Connected',
      'dydx_stored': '💾 DyDx Synced',
      'manual_sync': '🔗 Manual Sync',
      'default': '💼 Wallet'
    };
    
    return typeDisplay[walletType] || typeDisplay.default;
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[var(--color-surface)] rounded-xl mb-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-lime)] to-[var(--color-accent-lime-dark)] rounded-lg flex items-center justify-center">
          <span className="text-[var(--color-primary-bg)] font-bold text-sm">LT</span>
        </div>
        <span className="text-xl font-bold text-[var(--color-text-primary)]">LumaTrade</span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <span className="nav-item active">Dashboard</span>
        <button 
          className="nav-item cursor-pointer"
          onClick={onOpenDyDx}
          title="Open DyDx Platform"
        >
          DyDx Trade
        </button>
        <span className="nav-item">Market</span>
      </nav>

      {/* User Profile / Connect Wallet */}
      <div className="flex items-center gap-3">
        {walletConnected ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-semantic-success)] to-[#15803d] flex items-center justify-center">
              <span className="text-white text-sm">👻</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-[var(--color-text-primary)] font-medium">
                {getWalletDisplay()}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            </div>
            <button
              className="btn-secondary text-xs px-3 py-1"
              onClick={() => window.open('https://dydx.trade/trade/BTC-USD', '_blank')}
              title="Open DyDx Trading Platform"
            >
              Trade on DyDx
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={onConnectWallet}>
            Connect via DyDx
          </button>
        )}
      </div>
    </header>
  );
};

// Price Display Component
const PriceDisplay = ({ symbol = "BTC/USD", price = 111191, change = -0.48, subPrice = 111129 }) => {
  const isPositive = change > 0;
  
  return (
    <div className="flex flex-col gap-2 mb-6">
      {/* Trading Pair */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f7931a] to-[#d4761a] flex items-center justify-center">
            <span className="text-white font-bold text-lg">₿</span>
          </div>
          <span className="text-2xl font-semibold text-[var(--color-text-primary)]">$</span>
        </div>
        <span className="text-2xl font-semibold text-[var(--color-text-primary)]">{symbol}</span>
        <span className="text-xl text-[var(--color-text-tertiary)]">⌄</span>
      </div>

      {/* Price */}
      <div className="flex items-center gap-4">
        <span className="price-large">${price.toLocaleString()}</span>
        <span className={`text-base font-medium ${isPositive ? 'price-change-positive' : 'price-change-negative'}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)}% today
        </span>
      </div>
      
      <div className="text-base text-[var(--color-text-tertiary)] mt-1">
        {subPrice.toLocaleString()}
      </div>
    </div>
  );
};

// Chart Component
const Chart = ({ timeframe = "1h", onTimeframeChange, symbol = "ETH/USD" }) => {
  const timeframes = ['1h', '24h', '1w', '1m'];
  
  return (
    <div className="chart-container">
      {/* Timeframe Buttons */}
      <div className="flex gap-2 mb-6">
        {timeframes.map((tf) => (
          <button
            key={tf}
            className={`px-3 py-1.5 rounded-md border-0 text-sm cursor-pointer transition-all duration-200 ${
              tf === timeframe
                ? 'text-[var(--color-text-accent)] bg-[rgba(196,216,45,0.1)]'
                : 'text-[var(--color-text-tertiary)] bg-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]'
            }`}
            onClick={() => onTimeframeChange?.(tf)}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Controls */}
      <div className="absolute top-6 right-6 flex gap-2">
        <button className="w-8 h-8 rounded-md border-0 bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]">
          ↑↓
        </button>
        <button className="w-8 h-8 rounded-md border-0 bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]">
          📊
        </button>
        <button className="w-8 h-8 rounded-md border-0 bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]">
          ⚙️
        </button>
      </div>

      {/* Trading Chart */}
      <div className="w-full h-[calc(100%-80px)]">
        <TradingChart symbol={symbol} timeframe={timeframe} />
      </div>
    </div>
  );
};

// Exchange List Component
const ExchangeList = ({ exchanges = [] }) => {
  const defaultExchanges = [
    { exchange: "UniSwap", symbol: "BTC/USD", price: 3615.32, amount: "1.6254 ETH", status: "limited", volume: "$5,875.00" },
    { exchange: "SushiSwap", symbol: "BTC/USD", price: 3617.12, amount: "1.6203 ETH", status: "trending", volume: "$5,860.12" },
    { exchange: "PancakeSwap", symbol: "BTC/USD", price: 3620.00, amount: "1.5000 ETH", status: "rising", volume: "$5,430.00" }
  ];
  
  const exchangesToShow = exchanges.length > 0 ? exchanges : defaultExchanges;
  
  return (
    <div className="card mt-6">
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 pb-4 border-b border-[var(--color-border)] mb-4 text-sm text-[var(--color-text-tertiary)] font-medium">
        <span>Exchange</span>
        <span>BNB/USD</span>
        <span>Amount</span>
        <span>Diff</span>
        <span>Volume</span>
      </div>

      {/* Rows */}
      {exchangesToShow.map((item, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 py-3 items-center border-b border-[var(--color-surface-elevated)] last:border-b-0 transition-all duration-200 hover:bg-[var(--color-surface-elevated)] hover:rounded-lg hover:px-3">
          {/* Exchange */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-semantic-info)] to-[#1d4ed8]"></div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.exchange}</span>
          </div>
          
          {/* Price */}
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.price}</span>
          
          {/* Amount */}
          <span className="text-sm text-[var(--color-text-secondary)]">{item.amount}</span>
          
          {/* Status */}
          <span className={`status-${item.status}`}>
            {item.status}
          </span>
          
          {/* Volume */}
          <span className="text-sm text-[var(--color-text-secondary)] font-medium">{item.volume}</span>
        </div>
      ))}
    </div>
  );
};

// Trading Panel Component
const TradingPanel = ({ walletConnected, onConnectWallet }) => {
  const [activeTab, setActiveTab] = useState("BUY");
  
  return (
    <div className="card flex flex-col gap-6">
      {/* Trade Tabs */}
      <div className="flex bg-[var(--color-primary-bg)] rounded-lg p-1">
        {['BUY', 'SELL'].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 px-4 rounded-md border-0 text-sm font-medium cursor-pointer transition-all duration-200 ${
              tab === activeTab
                ? 'bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)] font-semibold'
                : 'bg-transparent text-[var(--color-text-tertiary)]'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ETH Balance */}
      <div className="card-elevated flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-semantic-info)] to-[#1d4ed8] flex items-center justify-center">
          <span className="text-white font-bold">Ξ</span>
        </div>
        <div className="flex-1">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-0.5">You Buy</div>
          <div className="text-xl font-bold text-[var(--color-text-primary)]">12.695</div>
          <div className="text-sm text-[var(--color-text-tertiary)]">Balance: 293.0187</div>
        </div>
        <span className="text-xl text-[var(--color-text-tertiary)]">↓</span>
      </div>

      {/* USD Balance */}
      <div className="card-elevated flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent-lime)] to-[var(--color-accent-lime-dark)] flex items-center justify-center">
          <span className="text-[var(--color-primary-bg)] font-bold">$</span>
        </div>
        <div className="flex-1">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-0.5">You Spend</div>
          <div className="text-xl font-bold text-[var(--color-text-primary)]">9,853.00</div>
          <div className="text-sm text-[var(--color-text-tertiary)]">Balance: 12,987.21</div>
        </div>
      </div>

      {/* Buy Button */}
      <button className="btn-primary w-full">
        Buy BTC
      </button>

      {/* Connect Wallet */}
      {!walletConnected && (
        <button 
          className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-[var(--color-accent-lime)] to-[var(--color-accent-lime-dark)] text-[var(--color-primary-bg)] rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          onClick={onConnectWallet}
        >
          <span>👻</span>
          Connect Phantom via DyDx
        </button>
      )}

      {/* DyDx Account Info */}
      {walletConnected && (
        <div className="card-elevated">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-2">DyDx Account Status</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--color-text-tertiary)]">Status</span>
            <span className="text-xs text-[var(--color-semantic-success)] font-medium">Connected via Phantom</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--color-text-tertiary)]">Trading</span>
            <span className="text-xs text-[var(--color-semantic-success)] font-medium">Ready</span>
          </div>
          <button
            className="btn-secondary w-full text-xs mt-2"
            onClick={() => window.open('https://dydx.trade/trade/BTC-USD', '_blank')}
          >
            Open DyDx Platform →
          </button>
        </div>
      )}

      {/* Trade Info */}
      <div className="card-elevated">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-[var(--color-text-tertiary)]">Available Balance</span>
          <div className="text-right">
            <div className="text-lg font-semibold text-[var(--color-text-primary)]">293.0187 ETH</div>
            <span className="text-xs text-[var(--color-semantic-success)]">+7.45%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-[var(--color-text-tertiary)]">
            <span>Estimate fee</span>
            <span>4.28 USD</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--color-text-tertiary)]">
            <span>You will receive</span>
            <span>108.35 USD</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--color-text-tertiary)]">
            <span>Spread</span>
            <span>0%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [exchangeData, setExchangeData] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [walletType, setWalletType] = useState("");
  const [dydxMarkets, setDydxMarkets] = useState([]);

  // Initialize DyDx service
  useEffect(() => {
    const initializeDyDx = async () => {
      try {
        await dydxService.initializeClient();
        const markets = await dydxService.getMarkets();
        setDydxMarkets(markets);
      } catch (error) {
        console.error('Error initializing DyDx:', error);
      }
    };

    initializeDyDx();
  }, []);

  const handleOpenDyDx = async () => {
    if (dydxService.isConnected) {
      await dydxService.openDyDxWithWallet();
    } else {
      await dydxService.redirectToDyDx();
    }
  };
  const socketRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // Fetch initial data
        const [cryptoResponse, exchangesResponse] = await Promise.all([
          axios.get(`${API}/crypto/pairs`),
          axios.get(`${API}/exchanges/aggregated`)
        ]);
        
        setCryptoData(cryptoResponse.data);
        setExchangeData(exchangesResponse.data);
        
        // Connect to WebSocket
        const wsUrl = BACKEND_URL.replace('https', 'wss').replace('http', 'ws');
        socketRef.current = io(wsUrl + '/ws');
        
        socketRef.current.on('connect', () => {
          console.log('Connected to WebSocket');
          socketRef.current.emit('message', JSON.stringify({ type: 'subscribe' }));
        });
        
        socketRef.current.on('message', (data) => {
          const message = JSON.parse(data);
          
          if (message.type === 'crypto_update') {
            setCryptoData(Object.values(message.data));
          } else if (message.type === 'exchange_update') {
            const exchanges = [];
            Object.entries(message.data).forEach(([symbol, exchangeData]) => {
              Object.values(exchangeData).forEach(exchange => {
                exchanges.push(exchange);
              });
            });
            setExchangeData(exchanges);
          }
        });
        
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnection();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      
      // Connect through real DyDx integration
      const dydxResult = await dydxService.connectWallet();
      
      if (dydxResult.success) {
        setWalletConnected(true);
        setWalletAddress(dydxResult.address);
        setWalletType(dydxResult.type);
        
        if (dydxResult.warning) {
          alert(dydxResult.warning);
        }
        
        if (dydxResult.message) {
          alert(`✅ ${dydxResult.message}`);
        }
        
        console.log('Connected to DyDx wallet:', {
          address: dydxResult.address,
          type: dydxResult.type
        });
        
        // Get real DyDx account info if available
        if (dydxService.isReadyForTrading()) {
          try {
            const accountInfo = await dydxService.getDyDxAccountInfo();
            console.log('Real DyDx account info:', accountInfo);
          } catch (error) {
            console.log('Could not fetch DyDx account info:', error.message);
          }
        }
        
        return;
      }
      
      // If DyDx connection failed, show error with helpful instructions
      const errorMessage = `Connection failed: ${dydxResult.error}\n\n` +
                          'To connect:\n' +
                          '1. Make sure you have a wallet installed\n' +
                          '2. Connect to DyDx platform first\n' +
                          '3. Return here to sync your connection';
      
      alert(errorMessage);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update main price when crypto data changes
  const currentPrice = cryptoData.find(crypto => 
    crypto.symbol === 'BTC/USD' || crypto.base_currency === 'BTC'
  ) || { price: 108948, price_24h_change: 0.10 };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="skeleton h-16 rounded-xl mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="skeleton h-32 rounded-2xl"></div>
            <div className="skeleton h-96 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="skeleton h-96 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header 
        walletConnected={walletConnected}
        onConnectWallet={handleConnectWallet}
        walletAddress={walletAddress}
        walletType={walletType}
        onOpenDyDx={handleOpenDyDx}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <PriceDisplay 
            symbol="BTC/USD"
            price={currentPrice?.price || 108948}
            change={currentPrice?.price_24h_change || 0.10}
          />
          <Chart 
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            symbol="BTC/USD"
          />
          <ExchangeList exchanges={exchangeData} />
        </div>

        {/* Trading Panel */}
        <div className="space-y-6">
          <TradingPanel 
            walletConnected={walletConnected}
            onConnectWallet={handleConnectWallet}
          />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;