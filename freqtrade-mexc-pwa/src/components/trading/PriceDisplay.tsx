'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useMEXCData } from '@/hooks/useMEXCData';

interface PriceDisplayProps {
  pair?: string;
  onPairChange?: (pair: string) => void;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  pair = 'ETH/USDT',
  onPairChange 
}) => {
  const { price, change, changePercent, loading } = useMEXCData(pair);
  const [isPositive, setIsPositive] = useState(true);

  useEffect(() => {
    setIsPositive((changePercent || 0) >= 0);
  }, [changePercent]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Pair Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-gradient-blue rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">Ξ</span>
          </div>
          <div className="w-8 h-8 bg-gradient-lime rounded-full flex items-center justify-center shadow-lg">
            <span className="text-bg-primary font-bold text-sm">$</span>
          </div>
        </div>
        
        <button 
          className="flex items-center gap-2 hover:bg-bg-elevated rounded-lg px-2 py-1 transition-colors"
          onClick={() => onPairChange && onPairChange(pair)}
        >
          <span className="text-2xl font-semibold text-text-primary">{pair}</span>
          <ChevronDown className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {/* Price Information */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-4 flex-wrap">
          <span className="text-4xl md:text-5xl font-bold text-text-primary">
            {loading ? (
              <div className="skeleton h-12 w-48"></div>
            ) : (
              `$${price?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '3,615.86'}`
            )}
          </span>
          
          <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">
              {loading ? (
                <div className="skeleton h-4 w-16"></div>
              ) : (
                `${isPositive ? '+' : ''}${changePercent?.toFixed(2) || '3.27'}% today`
              )}
            </span>
          </div>
        </div>
        
        <p className="text-text-muted">
          {loading ? (
            <div className="skeleton h-4 w-24"></div>
          ) : (
            `$${price ? (price * 0.999).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '3,630.00'}`
          )}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        <div className="text-center">
          <p className="text-text-muted text-sm">24h High</p>
          <p className="text-text-primary font-semibold">
            {loading ? <div className="skeleton h-4 w-16 mx-auto"></div> : '$3,680.50'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-text-muted text-sm">24h Low</p>
          <p className="text-text-primary font-semibold">
            {loading ? <div className="skeleton h-4 w-16 mx-auto"></div> : '$3,520.30'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-text-muted text-sm">Volume</p>
          <p className="text-text-primary font-semibold">
            {loading ? <div className="skeleton h-4 w-16 mx-auto"></div> : '142.3K ETH'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-text-muted text-sm">Market Cap</p>
          <p className="text-text-primary font-semibold">
            {loading ? <div className="skeleton h-4 w-16 mx-auto"></div> : '$435.2B'}
          </p>
        </div>
      </div>
    </div>
  );
};