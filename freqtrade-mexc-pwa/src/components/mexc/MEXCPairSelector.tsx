'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, Star, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  isFavorite: boolean;
}

const mockPairs: TradingPair[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 97234.56,
    change24h: 2.34,
    volume24h: 1234567890,
    isFavorite: true,
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3615.86,
    change24h: 3.27,
    volume24h: 567890123,
    isFavorite: true,
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 211.68,
    change24h: -1.45,
    volume24h: 234567891,
    isFavorite: false,
  },
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    price: 0.8934,
    change24h: 4.12,
    volume24h: 123456789,
    isFavorite: false,
  },
];

interface MEXCPairSelectorProps {
  selectedPair: string;
  onPairSelect: (pair: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MEXCPairSelector: React.FC<MEXCPairSelectorProps> = ({
  selectedPair,
  onPairSelect,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'favorites' | 'spot' | 'futures'>('spot');

  const filteredPairs = mockPairs.filter(pair => {
    const matchesSearch = pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.baseAsset.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'favorites' ? pair.isFavorite : true;
    return matchesSearch && matchesTab;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-x-4 top-4 bottom-4 bg-bg-surface rounded-2xl max-w-2xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Select Trading Pair</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-border transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <Input
            placeholder="Search pairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          {/* Tabs */}
          <div className="flex mt-4 bg-bg-primary rounded-lg p-1">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'favorites'
                  ? 'bg-accent-lime text-bg-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <Star className="w-4 h-4" />
              Favorites
            </button>
            <button
              onClick={() => setActiveTab('spot')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                activeTab === 'spot'
                  ? 'bg-accent-lime text-bg-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Spot
            </button>
            <button
              onClick={() => setActiveTab('futures')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                activeTab === 'futures'
                  ? 'bg-accent-lime text-bg-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Futures
            </button>
          </div>
        </div>

        {/* Pairs List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 pb-3 border-b border-border text-sm font-medium text-text-tertiary">
              <div>Pair</div>
              <div className="text-right">Price</div>
              <div className="text-right">24h Change</div>
              <div className="text-right">Volume</div>
            </div>

            {/* Pairs */}
            <div className="space-y-1 mt-3">
              {filteredPairs.map((pair) => (
                <button
                  key={pair.symbol}
                  onClick={() => {
                    onPairSelect(`${pair.baseAsset}/${pair.quoteAsset}`);
                    onClose();
                  }}
                  className={`w-full grid grid-cols-4 gap-4 py-3 px-3 rounded-lg hover:bg-bg-elevated transition-colors text-left ${
                    selectedPair === `${pair.baseAsset}/${pair.quoteAsset}` ? 'bg-accent-lime/10 border border-accent-lime' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button className={`w-4 h-4 ${pair.isFavorite ? 'text-yellow-400' : 'text-text-muted'}`}>
                      <Star className="w-4 h-4" fill={pair.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <div>
                      <div className="font-medium text-text-primary">{pair.baseAsset}</div>
                      <div className="text-xs text-text-muted">{pair.quoteAsset}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-text-primary">
                      ${pair.price.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${pair.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                      {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-text-secondary text-sm">
                      ${(pair.volume24h / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};