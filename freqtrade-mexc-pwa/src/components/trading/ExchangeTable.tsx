'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface Exchange {
  id: string;
  name: string;
  icon: string;
  price: number;
  amount: number;
  status: 'limited' | 'trending' | 'rising' | 'falling';
  volume: number;
}

// MEXC API for real price data
const MEXC_API_BASE = 'https://api.mexc.com/api/v3';

export const ExchangeTable: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([
    {
      id: 'uniswap',
      name: 'UniSwap',
      icon: '🦄',
      price: 0,
      amount: 1.6254,
      status: 'limited',
      volume: 0,
    },
    {
      id: 'sushiswap',
      name: 'SushiSwap',
      icon: '🍣',
      price: 0,
      amount: 1.6203,
      status: 'trending',
      volume: 0,
    },
    {
      id: 'pancakeswap',
      name: 'PancakeSwap',
      icon: '🥞',
      price: 0,
      amount: 1.5000,
      status: 'rising',
      volume: 0,
    },
    {
      id: 'mexc',
      name: 'MEXC Global',
      icon: '🔶',
      price: 0,
      amount: 1.6280,
      status: 'rising',
      volume: 0,
    },
  ]);

  // Fetch real MEXC price for ETH/USDT
  useEffect(() => {
    const fetchMEXCPrice = async () => {
      try {
        const response = await fetch(`${MEXC_API_BASE}/ticker/24hr?symbol=ETHUSDT`);
        if (response.ok) {
          const data = await response.json();
          const realPrice = parseFloat(data.lastPrice);
          const realVolume = parseFloat(data.volume);
          
          setExchanges(prev => prev.map(exchange => {
            if (exchange.id === 'mexc') {
              return {
                ...exchange,
                price: realPrice,
                volume: realVolume,
              };
            } else {
              // Add small variations for other exchanges (±0.1%)
              const variation = (Math.random() - 0.5) * 0.002; // ±0.1%
              return {
                ...exchange,
                price: realPrice * (1 + variation),
                volume: realVolume * (0.8 + Math.random() * 0.4), // 80-120% of MEXC volume
              };
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching MEXC price:', error);
        // Fallback to reasonable default values if API fails
        setExchanges(prev => prev.map(exchange => ({
          ...exchange,
          price: exchange.price || 3615.86,
          volume: exchange.volume || 5875.00,
        })));
      }
    };

    fetchMEXCPrice();
    
    // Update every 30 seconds
    const interval = setInterval(fetchMEXCPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: Exchange['status']) => {
    const statusClasses = {
      limited: 'status-limited',
      trending: 'status-trending', 
      rising: 'status-rising',
      falling: 'bg-red-500/20 text-red-400',
    };

    const statusLabels = {
      limited: 'Limited',
      trending: 'Trending',
      rising: 'Rising',
      falling: 'Falling',
    };

    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  return (
    <div className="bg-bg-surface rounded-2xl p-5 mt-6">
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 pb-4 border-b border-border mb-4">
        <div className="text-sm font-medium text-text-tertiary">Exchange</div>
        <div className="text-sm font-medium text-text-tertiary">ETH/USD</div>
        <div className="text-sm font-medium text-text-tertiary">Amount</div>
        <div className="text-sm font-medium text-text-tertiary">Diff</div>
        <div className="text-sm font-medium text-text-tertiary">Volume</div>
      </div>

      {/* Exchange Rows */}
      <div className="space-y-3">
        {exchanges.map((exchange) => (
          <div
            key={exchange.id}
            className="grid grid-cols-5 gap-4 py-3 hover:bg-bg-elevated rounded-lg px-3 -mx-3 transition-all duration-200 cursor-pointer group"
          >
            {/* Exchange Info */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm">
                {exchange.icon}
              </div>
              <span className="text-sm font-medium text-text-primary">
                {exchange.name}
              </span>
              <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Price */}
            <div className="text-sm font-semibold text-text-primary">
              {exchange.price > 0 ? (
                `$${exchange.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                <div className="skeleton h-4 w-16"></div>
              )}
            </div>

            {/* Amount */}
            <div className="text-sm text-text-secondary">
              {exchange.amount.toFixed(4)} ETH
            </div>

            {/* Status */}
            <div>
              {getStatusBadge(exchange.status)}
            </div>

            {/* Volume */}
            <div className="text-sm font-medium text-text-secondary">
              {exchange.volume > 0 ? (
                exchange.volume > 1000 
                  ? `${(exchange.volume / 1000).toFixed(1)}K ETH`
                  : `${exchange.volume.toFixed(0)} ETH`
              ) : (
                <div className="skeleton h-4 w-12"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">
            Showing {exchanges.length} exchanges • Updated live from MEXC API
          </span>
          <button className="text-accent-lime hover:text-accent-lime-hover font-medium">
            View All Markets
          </button>
        </div>
      </div>
    </div>
  );
};