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
const PriceDisplay = ({ symbol = "BTC/USD", price = 111191, change = -0.48, subPrice = 111129, cryptoData = [], onCryptoSelect }) => {
  const isPositive = change > 0;
  
  // Get the crypto icon based on symbol
  const getCryptoIcon = (symbol) => {
    const base = symbol.split('/')[0];
    const icons = {
      'BTC': '₿',
      'ETH': 'Ξ', 
      'SOL': 'S',
      'ADA': 'A',
      'AVAX': 'A',
      'MATIC': 'M',
      'LINK': 'L',
      'UNI': 'U',
      'LTC': 'L'
    };
    return icons[base] || base[0];
  };

  const getCryptoColor = (symbol) => {
    const base = symbol.split('/')[0];
    const colors = {
      'BTC': 'from-[#f7931a] to-[#d4761a]',
      'ETH': 'from-[#627eea] to-[#4f6bd5]',
      'SOL': 'from-[#9945ff] to-[#14f195]',
      'ADA': 'from-[#0033ad] to-[#1e88e5]',
      'AVAX': 'from-[#e84142] to-[#c73e39]',
      'MATIC': 'from-[#8247e5] to-[#6c3fb0]',
      'LINK': 'from-[#375bd2] to-[#2e4ab8]',
      'UNI': 'from-[#ff007a] to-[#e6006b]',
      'LTC': 'from-[#bfbbbb] to-[#8e8b8b]'
    };
    return colors[base] || 'from-[#6b7280] to-[#4b5563]';
  };
  
  return (
    <div className="flex flex-col gap-2 mb-6">
      {/* Trading Pair */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCryptoColor(symbol)} flex items-center justify-center cursor-pointer`}>
            <span className="text-white font-bold text-lg">{getCryptoIcon(symbol)}</span>
          </div>
          <span className="text-2xl font-semibold text-[var(--color-text-primary)]">$</span>
        </div>
        <div className="relative group">
          <span className="text-2xl font-semibold text-[var(--color-text-primary)] cursor-pointer">{symbol}</span>
          {/* Crypto Dropdown */}
          <div className="absolute top-full left-0 mt-2 bg-[var(--color-surface)] rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            {cryptoData.slice(0, 6).map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => onCryptoSelect(crypto.symbol)}
                className="w-full px-4 py-2 text-left hover:bg-[var(--color-surface-elevated)] first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getCryptoColor(crypto.symbol)} flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">{getCryptoIcon(crypto.symbol)}</span>
                </div>
                <span className="text-sm text-[var(--color-text-primary)]">{crypto.symbol}</span>
                <span className="text-xs text-[var(--color-text-secondary)] ml-auto">${crypto.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
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
const FreqtradePanel = ({ 
  strategies, 
  selectedStrategy, 
  onSelectStrategy, 
  onCreateStrategy, 
  onAnalyzeStrategy, 
  analysis 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    symbol: 'BTC/USD',
    timeframe: '5m',
    stake_amount: 100
  });

  const handleCreateStrategy = async () => {
    const result = await onCreateStrategy({
      ...newStrategy,
      type: 'sample',
      dry_run: true
    });
    if (result) {
      setShowCreateForm(false);
      setNewStrategy({ name: '', symbol: 'BTC/USD', timeframe: '5m', stake_amount: 100 });
    }
  };

  const getSignalColor = (signal) => {
    switch(signal) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      case 'exit': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getSignalIcon = (signal) => {
    switch(signal) {
      case 'buy': return '📈';
      case 'sell': return '📉';
      case 'exit': return '🚪';
      default: return '⏸️';
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
          🤖 Freqtrade Strategies
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)] rounded-lg font-medium hover:opacity-80"
        >
          {showCreateForm ? 'Cancel' : 'New Strategy'}
        </button>
      </div>

      {/* Create Strategy Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-[var(--color-surface-elevated)] rounded-lg">
          <h4 className="text-lg font-medium mb-3 text-[var(--color-text-primary)]">Create Freqtrade Strategy</h4>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Strategy Name"
              value={newStrategy.name}
              onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
              className="px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)]"
            />
            <select
              value={newStrategy.symbol}
              onChange={(e) => setNewStrategy({...newStrategy, symbol: e.target.value})}
              className="px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)]"
            >
              <option value="BTC/USD">BTC/USD</option>
              <option value="ETH/USD">ETH/USD</option>
              <option value="SOL/USD">SOL/USD</option>
            </select>
            <select
              value={newStrategy.timeframe}
              onChange={(e) => setNewStrategy({...newStrategy, timeframe: e.target.value})}
              className="px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)]"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
            </select>
            <input
              type="number"
              placeholder="Stake Amount ($)"
              value={newStrategy.stake_amount}
              onChange={(e) => setNewStrategy({...newStrategy, stake_amount: parseFloat(e.target.value)})}
              className="px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)]"
            />
          </div>
          <button
            onClick={handleCreateStrategy}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Strategy
          </button>
        </div>
      )}

      {/* Strategies List */}
      <div className="space-y-3">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedStrategy?.id === strategy.id 
                ? 'border-[var(--color-accent-lime)] bg-[var(--color-accent-lime)]/10' 
                : 'border-[var(--color-border)] hover:border-[var(--color-accent-lime)]/50'
            }`}
            onClick={() => onSelectStrategy(strategy)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-[var(--color-text-primary)]">{strategy.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-secondary)]">{strategy.timeframe}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnalyzeStrategy(strategy.id);
                  }}
                  className="px-3 py-1 bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)] rounded text-sm font-medium"
                >
                  Analyze
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-[var(--color-text-secondary)]">Stoploss: {(strategy.stoploss * 100).toFixed(1)}%</span>
                <span className="text-[var(--color-text-secondary)]">Trades: {strategy.trade_count || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Analysis Results */}
      {analysis && (
        <div className="mt-6 p-4 bg-[var(--color-surface-elevated)] rounded-lg">
          <h4 className="text-lg font-medium mb-3 text-[var(--color-text-primary)]">Latest Analysis</h4>
          
          {/* Signal */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{getSignalIcon(analysis.signal)}</span>
            <div>
              <div className={`text-xl font-bold ${getSignalColor(analysis.signal)}`}>
                {analysis.signal.toUpperCase()}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {analysis.symbol} • ${analysis.current_price?.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Indicators */}
          {analysis.indicators && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(analysis.indicators).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)] capitalize">{key.replace('_', ' ')}:</span>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Entry/Exit Signals */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)]">Entry:</span>
              <span className={analysis.entry_signals?.enter_long ? 'text-green-400' : 'text-gray-400'}>
                Long {analysis.entry_signals?.enter_long ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)]">Exit:</span>
              <span className={analysis.exit_signals?.exit_long ? 'text-red-400' : 'text-gray-400'}>
                Long {analysis.exit_signals?.exit_long ? '✅' : '❌'}
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-[var(--color-text-tertiary)]">
            Updated: {new Date(analysis.analysis_time).toLocaleTimeString()}
          </div>
        </div>
      )}

      {strategies.length === 0 && !showCreateForm && (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          <div className="text-4xl mb-2">🤖</div>
          <p>No freqtrade strategies yet.</p>
          <p className="text-sm">Create your first automated trading strategy!</p>
        </div>
      )}
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
        <span>BTC/USD</span>
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

// Freqtrade Trading Panel Component (Main Feature)
const FreqtradeTradingPanel = ({ 
  freqtradeStrategies = [], 
  selectedStrategy, 
  onSelectStrategy, 
  onCreateStrategy, 
  onAnalyzeStrategy, 
  strategyAnalysis,
  isAnalyzing = false,
  tradeHistory = [],
  analysisHistory = []
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('strategies'); // 'strategies', 'analysis', 'trades'

  const getSignalColor = (signal) => {
    switch(signal) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      case 'exit': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getSignalIcon = (signal) => {
    switch(signal) {
      case 'buy': return '📈';
      case 'sell': return '📉';
      case 'exit': return '🚪';
      default: return '⏸️';
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
          🤖 Freqtrade Trading Bot
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)] rounded-lg font-medium hover:opacity-80"
        >
          {showCreateForm ? 'Cancel' : 'Create Strategy'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-4 bg-[var(--color-surface-elevated)] rounded-lg p-1">
        {[
          { key: 'strategies', label: 'Strategies', icon: '🤖' },
          { key: 'analysis', label: 'Analysis', icon: '📊' },
          { key: 'trades', label: 'Signals', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Create Strategy Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-[var(--color-surface-elevated)] rounded-lg">
          <h4 className="text-lg font-medium mb-3 text-[var(--color-text-primary)]">New Trading Strategy</h4>
          <div className="space-y-3">
            <button
              onClick={async () => {
                const result = await onCreateStrategy({
                  name: "BTC SMA-RSI Strategy",
                  type: "sample",
                  symbol: "BTC/USD",
                  timeframe: "5m",
                  stake_amount: 100,
                  dry_run: true
                });
                if (result) {
                  setShowCreateForm(false);
                }
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              📈 Create BTC SMA-RSI Bot
            </button>
            <button
              onClick={async () => {
                const result = await onCreateStrategy({
                  name: "ETH MACD Strategy", 
                  type: "sample",
                  symbol: "ETH/USD",
                  timeframe: "15m",
                  stake_amount: 50,
                  dry_run: true
                });
                if (result) {
                  setShowCreateForm(false);
                }
              }}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              📊 Create ETH MACD Bot  
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'strategies' && (
        <div className="space-y-3">
          {freqtradeStrategies.length > 0 ? (
            freqtradeStrategies.map((strategy, index) => (
              <div
                key={strategy.id || index}
                className="p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent-lime)]/50 cursor-pointer"
                onClick={() => onSelectStrategy && onSelectStrategy(strategy)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[var(--color-text-primary)]">
                    {strategy.name || 'Trading Strategy'}
                  </h4>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (onAnalyzeStrategy) {
                        await onAnalyzeStrategy(strategy.id);
                      }
                    }}
                    disabled={isAnalyzing}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      isAnalyzing
                        ? 'bg-gray-500 text-white opacity-50 cursor-not-allowed'
                        : 'bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)] hover:opacity-80'
                    }`}
                  >
                    {isAnalyzing ? '⏳ Analyzing...' : 'Analyze'}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <span>{strategy.timeframe || '5m'}</span>
                  <span>Stop: {((strategy.stoploss || -0.1) * 100).toFixed(1)}%</span>
                  <span>Trades: {strategy.trade_count || 0}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <div className="text-6xl mb-3">🤖</div>
              <p className="text-lg mb-2">No Trading Bots Yet</p>
              <p className="text-sm">Create your first automated trading strategy!</p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {/* Current Analysis */}
          {strategyAnalysis && (
            <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg">
              <h4 className="text-lg font-medium mb-3 text-[var(--color-text-primary)]">
                🔍 Live Analysis
              </h4>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">
                  {getSignalIcon(strategyAnalysis.signal)}
                </span>
                <div>
                  <div className={`text-xl font-bold ${getSignalColor(strategyAnalysis.signal)}`}>
                    {(strategyAnalysis.signal || 'hold').toUpperCase()}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {strategyAnalysis.symbol} • ${(strategyAnalysis.current_price || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Technical Indicators */}
              {strategyAnalysis.indicators && Object.keys(strategyAnalysis.indicators).length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Technical Indicators</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(strategyAnalysis.indicators).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)] capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="text-[var(--color-text-primary)] font-medium">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entry/Exit Signals */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Entry/Exit Signals</h5>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-secondary)]">Entry Long:</span>
                    <span className={strategyAnalysis.entry_signals?.enter_long ? 'text-green-400' : 'text-gray-400'}>
                      {strategyAnalysis.entry_signals?.enter_long ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-secondary)]">Exit Long:</span>
                    <span className={strategyAnalysis.exit_signals?.exit_long ? 'text-red-400' : 'text-gray-400'}>
                      {strategyAnalysis.exit_signals?.exit_long ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--color-text-tertiary)]">
                Updated: {strategyAnalysis.analysis_time ? new Date(strategyAnalysis.analysis_time).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          )}

          {/* Analysis History */}
          {analysisHistory.length > 0 && (
            <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg">
              <h5 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Recent Analysis History</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysisHistory.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSignalIcon(analysis.signal)}</span>
                      <span className={getSignalColor(analysis.signal)}>
                        {analysis.signal.toUpperCase()}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">
                        ${analysis.price?.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[var(--color-text-tertiary)]">
                      {new Date(analysis.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trades/Signals Tab */}
      {activeTab === 'trades' && (
        <div className="space-y-4">
          {tradeHistory.length > 0 ? (
            <div className="p-4 bg-[var(--color-surface-elevated)] rounded-lg">
              <h4 className="text-lg font-medium mb-3 text-[var(--color-text-primary)]">
                📈 Trading Signals History
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tradeHistory.slice(0, 10).map((trade) => (
                  <div key={trade.id} className="p-3 bg-[var(--color-primary-bg)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSignalIcon(trade.type)}</span>
                        <span className={`font-bold ${getSignalColor(trade.type)}`}>
                          {trade.type.toUpperCase()}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {trade.symbol}
                        </span>
                      </div>
                      <span className="text-[var(--color-text-primary)] font-medium">
                        ${trade.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">
                      {trade.reason}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">
                      {new Date(trade.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <div className="text-6xl mb-3">📈</div>
              <p className="text-lg mb-2">No Trading Signals Yet</p>
              <p className="text-sm">Analyze strategies to generate buy/sell signals!</p>
            </div>
          )}
        </div>
      )}
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
  const [selectedCrypto, setSelectedCrypto] = useState("BTC/USD");
  const [isLoading, setIsLoading] = useState(true);
  const [walletType, setWalletType] = useState("");
  const [dydxMarkets, setDydxMarkets] = useState([]);
  
  // Freqtrade integration state
  const [freqtradeStrategies, setFreqtradeStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyAnalysis, setStrategyAnalysis] = useState(null);
  const [showFreqtradePanel, setShowFreqtradePanel] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);

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
    crypto.symbol === selectedCrypto
  ) || { price: 108948, price_24h_change: 0.10 };

  const handleCryptoSelect = (cryptoSymbol) => {
    setSelectedCrypto(cryptoSymbol);
  };

  // Freqtrade API functions
  const fetchFreqtradeStrategies = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/freqtrade/strategies`);
      const data = await response.json();
      if (data.success) {
        setFreqtradeStrategies(data.strategies);
      }
    } catch (error) {
      console.error('Error fetching freqtrade strategies:', error);
    }
  };

  const createFreqtradeStrategy = async (strategyData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/freqtrade/strategy/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchFreqtradeStrategies();
        return data;
      }
    } catch (error) {
      console.error('Error creating freqtrade strategy:', error);
    }
  };

  const analyzeStrategy = async (strategyId) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/freqtrade/strategy/${strategyId}/analyze`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        const analysis = data.analysis;
        setStrategyAnalysis(analysis);
        
        // Add to analysis history
        const newAnalysis = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          strategyId,
          signal: analysis.signal,
          price: analysis.current_price,
          indicators: analysis.indicators,
          entry_signals: analysis.entry_signals,
          exit_signals: analysis.exit_signals
        };
        setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 9)]); // Keep last 10
        
        // Simulate potential trade if this was a buy/sell signal
        if (analysis.signal === 'buy' || analysis.signal === 'sell') {
          const potentialTrade = {
            id: Date.now(),
            type: analysis.signal,
            price: analysis.current_price,
            symbol: analysis.symbol,
            timestamp: new Date().toISOString(),
            indicators: analysis.indicators,
            reason: getTradeReason(analysis)
          };
          setTradeHistory(prev => [potentialTrade, ...prev.slice(0, 19)]); // Keep last 20
        }
        
        return analysis;
      }
    } catch (error) {
      console.error('Error analyzing strategy:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to explain why a trade signal was generated
  const getTradeReason = (analysis) => {
    const { indicators, signal } = analysis;
    const rsi = indicators?.rsi;
    const sma30 = indicators?.sma30;
    const currentPrice = analysis.current_price;
    
    if (signal === 'buy') {
      if (rsi && rsi < 30) {
        return `RSI oversold (${rsi.toFixed(1)}) + Price above SMA30`;
      } else if (sma30 && currentPrice > sma30) {
        return `Price above SMA30 trend`;
      }
      return 'Entry conditions met';
    } else if (signal === 'sell') {
      if (rsi && rsi > 70) {
        return `RSI overbought (${rsi.toFixed(1)})`;
      }
      return 'Exit conditions met';
    }
    return 'Signal generated';
  };

  // Load freqtrade strategies on mount
  useEffect(() => {
    fetchFreqtradeStrategies();
  }, []);

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
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-3">
          <PriceDisplay 
            symbol={selectedCrypto}
            price={currentPrice?.price || 108948}
            change={currentPrice?.price_24h_change || 0.10}
            cryptoData={cryptoData}
            onCryptoSelect={handleCryptoSelect}
          />
          
          {/* Crypto Selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {cryptoData.slice(0, 8).map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => handleCryptoSelect(crypto.symbol)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCrypto === crypto.symbol
                    ? 'bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)]'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                }`}
              >
                {crypto.symbol.replace('/USD', '')}
              </button>
            ))}
          </div>
          
          <Chart 
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            symbol={selectedCrypto}
          />
          <ExchangeList exchanges={exchangeData} />
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Freqtrade Trading Panel - MAIN FEATURE */}
            <FreqtradeTradingPanel
              freqtradeStrategies={freqtradeStrategies}
              selectedStrategy={selectedStrategy}
              onSelectStrategy={setSelectedStrategy}
              onCreateStrategy={createFreqtradeStrategy}
              onAnalyzeStrategy={analyzeStrategy}
              strategyAnalysis={strategyAnalysis}
            />

            {/* dYdX Connection for Real Trading */}
            <div className="bg-[var(--color-surface)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  💰 Live Trading Wallet
                </h3>
                <button
                  onClick={handleConnectWallet}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    walletConnected
                      ? 'bg-green-600 text-white'
                      : 'bg-[var(--color-accent-lime)] text-[var(--color-primary-bg)] hover:opacity-80'
                  }`}
                >
                  {walletConnected ? `Connected: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : 'Connect Phantom Wallet'}
                </button>
              </div>
              
              <div className="text-sm text-[var(--color-text-secondary)]">
                {walletConnected ? (
                  <div>
                    <p className="mb-2">✅ Wallet connected! You can now execute real trades.</p>
                    <button
                      onClick={handleOpenDyDx}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Open dYdX Trading Platform
                    </button>
                  </div>
                ) : (
                  <p>Connect your Phantom wallet to enable live trading with real money. Test strategies above first!</p>
                )}
              </div>
            </div>
          </div>
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