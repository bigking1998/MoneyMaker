'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, TrendingUp, TrendingDown, Star, Filter, ArrowUpDown } from 'lucide-react';

interface MarketData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  isFavorite: boolean;
}

const mockMarketData: MarketData[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 97234.56,
    change24h: 2.34,
    high24h: 98500.00,
    low24h: 94800.00,
    volume24h: 1234567890,
    marketCap: 1920000000000,
    isFavorite: true,
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3615.86,
    change24h: 3.27,
    high24h: 3680.50,
    low24h: 3520.30,
    volume24h: 567890123,
    marketCap: 435200000000,
    isFavorite: true,
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 211.68,
    change24h: -1.45,
    high24h: 218.90,
    low24h: 205.30,
    volume24h: 234567891,
    marketCap: 102300000000,
    isFavorite: false,
  },
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    price: 0.8934,
    change24h: 4.12,
    high24h: 0.9200,
    low24h: 0.8650,
    volume24h: 123456789,
    marketCap: 31400000000,
    isFavorite: false,
  },
  {
    symbol: 'DOGEUSDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    price: 0.22201,
    change24h: -2.88,
    high24h: 0.23100,
    low24h: 0.21800,
    volume24h: 987654321,
    marketCap: 32600000000,
    isFavorite: false,
  },
];

type SortField = 'symbol' | 'price' | 'change24h' | 'volume24h' | 'marketCap';
type SortOrder = 'asc' | 'desc';

export default function MarketPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'spot' | 'futures'>('all');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [favorites, setFavorites] = useState<string[]>(['BTCUSDT', 'ETHUSDT']);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedData = mockMarketData
    .filter(item => {
      const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.baseAsset.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'favorites' ? favorites.includes(item.symbol) : true;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortField) {
        case 'symbol':
          return sortOrder === 'asc' 
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change24h':
          aValue = a.change24h;
          bValue = b.change24h;
          break;
        case 'volume24h':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-lime p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-bg-primary rounded-3xl min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] overflow-hidden">
          <Header />
          
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            {/* Market Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">3,021</div>
                  <div className="text-sm text-text-muted">Total Markets</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">+2.34%</div>
                  <div className="text-sm text-text-muted">Market Change</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">$2.4T</div>
                  <div className="text-sm text-text-muted">Total Volume 24h</div>
                </div>
              </Card>
            </div>

            {/* Market Table */}
            <Card>
              {/* Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search markets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                    />
                  </div>
                  <Button variant="secondary">
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                </div>

                {/* Tabs */}
                <div className="flex bg-bg-primary rounded-lg p-1 overflow-x-auto">
                  {[
                    { id: 'all', label: 'All Markets' },
                    { id: 'favorites', label: 'Favorites' },
                    { id: 'spot', label: 'Spot' },
                    { id: 'futures', label: 'Futures' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 min-w-0 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab.id
                          ? 'bg-accent-lime text-bg-primary'
                          : 'text-text-tertiary hover:text-text-primary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 pb-4 border-b border-border mb-4 text-sm font-medium text-text-tertiary">
                <button
                  onClick={() => handleSort('symbol')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  Market
                  {sortField === 'symbol' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors text-right justify-end"
                >
                  Price
                  {sortField === 'price' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleSort('change24h')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors text-right justify-end"
                >
                  24h Change
                  {sortField === 'change24h' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <div className="text-right">24h High/Low</div>
                <button
                  onClick={() => handleSort('volume24h')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors text-right justify-end"
                >
                  Volume
                  {sortField === 'volume24h' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleSort('marketCap')}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors text-right justify-end"
                >
                  Market Cap
                  {sortField === 'marketCap' && <ArrowUpDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Table Body */}
              <div className="space-y-2">
                {filteredAndSortedData.map((item) => (
                  <div
                    key={item.symbol}
                    className="grid grid-cols-6 gap-4 py-3 hover:bg-bg-elevated rounded-lg px-3 -mx-3 transition-colors cursor-pointer group"
                  >
                    {/* Market */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.symbol);
                        }}
                        className={`w-4 h-4 ${favorites.includes(item.symbol) ? 'text-yellow-400' : 'text-text-muted group-hover:text-text-tertiary'}`}
                      >
                        <Star className="w-4 h-4" fill={favorites.includes(item.symbol) ? 'currentColor' : 'none'} />
                      </button>
                      <div>
                        <div className="font-medium text-text-primary">{item.baseAsset}</div>
                        <div className="text-xs text-text-muted">{item.quoteAsset}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-medium text-text-primary">
                        ${item.price < 1 
                          ? item.price.toFixed(6) 
                          : item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* 24h Change */}
                    <div className="text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        item.change24h >= 0 ? 'text-success' : 'text-danger'
                      }`}>
                        {item.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="font-medium">
                          {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* 24h High/Low */}
                    <div className="text-right text-sm">
                      <div className="text-text-primary">${item.high24h.toLocaleString()}</div>
                      <div className="text-text-muted">${item.low24h.toLocaleString()}</div>
                    </div>

                    {/* Volume */}
                    <div className="text-right">
                      <div className="text-text-primary font-medium">
                        {formatVolume(item.volume24h)}
                      </div>
                    </div>

                    {/* Market Cap */}
                    <div className="text-right">
                      <div className="text-text-primary font-medium">
                        {item.marketCap ? formatMarketCap(item.marketCap) : '--'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}