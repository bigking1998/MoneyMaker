'use client';

import React, { useState, useEffect } from 'react';
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

// MEXC API for real market data
const MEXC_API_BASE = 'https://api.mexc.com/api/v3';

type SortField = 'symbol' | 'price' | 'change24h' | 'volume24h' | 'marketCap';
type SortOrder = 'asc' | 'desc';

export default function MarketPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'spot' | 'futures'>('all');
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [favorites, setFavorites] = useState<string[]>(['BTCUSDT', 'ETHUSDT']);

  // Fetch real MEXC market data
  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // Fetch 24hr ticker statistics for all symbols
        const response = await fetch(`${MEXC_API_BASE}/ticker/24hr`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }

        const data = await response.json();
        
        // Filter for USDT pairs and convert to our format
        const usdtPairs = data
          .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
          .slice(0, 50) // Limit to top 50 for performance
          .map((ticker: any) => ({
            symbol: ticker.symbol,
            baseAsset: ticker.symbol.replace('USDT', ''),
            quoteAsset: 'USDT',
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            volume24h: parseFloat(ticker.volume),
            isFavorite: favorites.includes(ticker.symbol),
          }));

        setMarketData(usdtPairs);
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Set some default pairs if API fails
        setMarketData([
          {
            symbol: 'BTCUSDT',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            price: 97000,
            change24h: 2.34,
            high24h: 98500,
            low24h: 94800,
            volume24h: 15000,
            isFavorite: true,
          },
          {
            symbol: 'ETHUSDT',
            baseAsset: 'ETH',
            quoteAsset: 'USDT',
            price: 3600,
            change24h: 3.27,
            high24h: 3680,
            low24h: 3520,
            volume24h: 85000,
            isFavorite: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [favorites]);

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

  const filteredAndSortedData = marketData
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

  const formatVolume = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
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
                  <div className="text-2xl font-bold text-text-primary">
                    {loading ? '...' : marketData.length}
                  </div>
                  <div className="text-sm text-text-muted">Markets Tracked</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    marketData.length > 0 && marketData.filter(m => m.change24h > 0).length > marketData.length / 2
                      ? 'text-success'
                      : 'text-danger'
                  }`}>
                    {loading ? '...' : marketData.length > 0 
                      ? `${((marketData.filter(m => m.change24h > 0).length / marketData.length) * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </div>
                  <div className="text-sm text-text-muted">Markets Rising</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {loading ? '...' : marketData.length > 0
                      ? `${(marketData.reduce((sum, m) => sum + m.volume24h, 0) / 1e6).toFixed(1)}M`
                      : '0'
                    }
                  </div>
                  <div className="text-sm text-text-muted">Total Volume (24h)</div>
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
                <div className="text-right">Actions</div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4 py-3">
                      <div className="skeleton h-4 w-16"></div>
                      <div className="skeleton h-4 w-12 ml-auto"></div>
                      <div className="skeleton h-4 w-12 ml-auto"></div>
                      <div className="skeleton h-4 w-20 ml-auto"></div>
                      <div className="skeleton h-4 w-16 ml-auto"></div>
                      <div className="skeleton h-4 w-8 ml-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table Body */
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
                            : item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          {formatVolume(item.volume24h)} {item.baseAsset}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="text-right">
                        <Button variant="ghost" size="sm" className="text-accent-lime hover:text-accent-lime-hover">
                          Trade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    Live data from MEXC API • Updates every 30 seconds
                  </span>
                  <span className="text-accent-lime">
                    {filteredAndSortedData.length} markets shown
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}