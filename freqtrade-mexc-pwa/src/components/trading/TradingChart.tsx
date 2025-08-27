'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, Maximize2, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TradingChartProps {
  pair?: string;
  height?: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({ 
  pair = 'ETH/USDT', 
  height = 480 
}) => {
  const chartContainer = useRef<HTMLDivElement>(null);
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);

  const timeframes = [
    { id: '1m', label: '1m' },
    { id: '5m', label: '5m' },
    { id: '15m', label: '15m' },
    { id: '1h', label: '1h' },
    { id: '4h', label: '4h' },
    { id: '1d', label: '1d' },
  ];

  useEffect(() => {
    // Simulate chart loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pair, activeTimeframe]);

  // Placeholder chart data - in real implementation, this would use lightweight-charts
  const generateChartData = () => {
    const data = [];
    const basePrice = 3615.86;
    const now = Date.now();
    
    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * 3600000); // 1 hour intervals
      const variation = (Math.random() - 0.5) * 200;
      const price = basePrice + variation;
      
      data.push({
        time: timestamp,
        open: price + (Math.random() - 0.5) * 20,
        high: price + Math.random() * 30,
        low: price - Math.random() * 30,
        close: price,
        volume: Math.random() * 1000000,
      });
    }
    
    return data;
  };

  return (
    <div className="bg-bg-surface rounded-2xl p-6 relative">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Timeframe Selector */}
          <div className="flex bg-bg-primary rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setActiveTimeframe(tf.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTimeframe === tf.id
                    ? 'bg-accent-lime text-bg-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainer}
        className="relative rounded-lg overflow-hidden bg-bg-primary"
        style={{ height: `${height}px` }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-4 w-full px-6">
              <div className="skeleton h-8 w-full"></div>
              <div className="skeleton h-12 w-full"></div>
              <div className="skeleton h-16 w-full"></div>
              <div className="skeleton h-8 w-full"></div>
              <div className="skeleton h-12 w-full"></div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 p-4">
            {/* Placeholder Chart Visualization */}
            <div className="w-full h-full relative">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-rows-6 grid-cols-8 opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-chart-grid border-opacity-30"></div>
                ))}
              </div>
              
              {/* Price Line Simulation */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  points="20,300 60,250 100,280 140,200 180,220 220,180 260,160 300,140 340,120 380,100 420,80 460,60"
                  className="animate-pulse"
                />
                <polyline
                  fill="none"
                  stroke="rgba(34, 197, 94, 0.1)"
                  strokeWidth="40"
                  points="20,300 60,250 100,280 140,200 180,220 220,180 260,160 300,140 340,120 380,100 420,80 460,60"
                />
              </svg>
              
              {/* Current Price Indicator */}
              <div className="absolute right-0 top-16 bg-success text-white px-2 py-1 rounded-l text-sm font-mono">
                $3,615.86
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer with Volume */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Volume (24h)</span>
          <span className="text-text-primary font-semibold">142,345 ETH</span>
        </div>
      </div>
    </div>
  );
};