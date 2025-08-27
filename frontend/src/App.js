import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import io from "socket.io-client";
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
const Header = ({ walletConnected, onConnectWallet, walletAddress }) => {
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
        <span className="nav-item">Trade</span>
        <span className="nav-item">Market</span>
      </nav>

      {/* User Profile / Connect Wallet */}
      <div className="flex items-center gap-3">
        {walletConnected ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-semantic-warning)] to-[#d97706]"></div>
            <span className="text-sm text-[var(--color-text-tertiary)] font-mono hidden md:block">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </span>
          </div>
        ) : (
          <button className="btn-primary" onClick={onConnectWallet}>
            Log in
          </button>
        )}
      </div>
    </header>
  );
};

// Price Display Component
const PriceDisplay = ({ symbol = "ETH/USD", price = 3615.86, change = 3.27, subPrice = 3630.00 }) => {
  const isPositive = change > 0;
  
  return (
    <div className="flex flex-col gap-2 mb-6">
      {/* Trading Pair */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-semantic-info)] to-[#1d4ed8] flex items-center justify-center">
            <span className="text-white font-bold">Ξ</span>
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
const Chart = ({ timeframe = "1h", onTimeframeChange }) => {
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

      {/* Chart Placeholder */}
      <div className="w-full h-[calc(100%-80px)] bg-[var(--color-primary-bg)] rounded-lg flex items-center justify-center">
        <div className="text-[var(--color-text-tertiary)]">Chart will be rendered here</div>
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
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--color-surface-elevated)] rounded-lg text-[var(--color-text-secondary)] text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--color-border)]"
          onClick={onConnectWallet}
        >
          <span>🔗</span>
          Connect Wallet
        </button>
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
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
          
          // Here you would integrate with DyDx
          console.log('Connected to wallet:', accounts[0]);
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const currentPrice = cryptoData.find(crypto => 
    crypto.symbol === 'ETH/USD' || crypto.base_currency === 'ETH'
  );

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
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <PriceDisplay 
            price={currentPrice?.price || 3615.86}
            change={currentPrice?.price_24h_change || 3.27}
          />
          <Chart 
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
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