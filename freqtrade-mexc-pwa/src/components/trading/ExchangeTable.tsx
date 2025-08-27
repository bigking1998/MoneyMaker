'use client';

import React from 'react';
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

const mockExchanges: Exchange[] = [
  {
    id: 'uniswap',
    name: 'UniSwap',
    icon: '🦄',
    price: 3615.32,
    amount: 1.6254,
    status: 'limited',
    volume: 5875.00,
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    icon: '🍣',
    price: 3617.12,
    amount: 1.6203,
    status: 'trending',
    volume: 5860.12,
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    icon: '🥞',
    price: 3620.00,
    amount: 1.5000,
    status: 'rising',
    volume: 5430.00,
  },
  {
    id: 'mexc',
    name: 'MEXC Global',
    icon: '🔶',
    price: 3614.28,
    amount: 1.6280,
    status: 'rising',
    volume: 5920.45,
  },
];

export const ExchangeTable: React.FC = () => {
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
        <div className="text-sm font-medium text-text-tertiary">BNB/USD</div>
        <div className="text-sm font-medium text-text-tertiary">Amount</div>
        <div className="text-sm font-medium text-text-tertiary">Diff</div>
        <div className="text-sm font-medium text-text-tertiary">Volume</div>
      </div>

      {/* Exchange Rows */}
      <div className="space-y-3">
        {mockExchanges.map((exchange) => (
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
              ${exchange.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
              ${exchange.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">
            Showing {mockExchanges.length} exchanges • Updated 2s ago
          </span>
          <button className="text-accent-lime hover:text-accent-lime-hover font-medium">
            View All Markets
          </button>
        </div>
      </div>
    </div>
  );
};