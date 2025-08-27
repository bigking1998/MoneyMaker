'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, Maximize2, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TradingChartProps {
  pair?: string;
  height?: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({ 
  pair = 'ETH/USDT', 
  height = 480 
}) => {
  const chartContainer = useRef<HTMLDivElement>(null);
  const chart = useRef<any>(null);
  const candleSeries = useRef<any>(null);
  const volumeSeries = useRef<any>(null);
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [candleData, setCandleData] = useState<CandleData[]>([]);

  const timeframes = [
    { id: '1m', label: '1m', mexcInterval: '1m' },
    { id: '5m', label: '5m', mexcInterval: '5m' },
    { id: '15m', label: '15m', mexcInterval: '15m' },
    { id: '1h', label: '1h', mexcInterval: '1h' },
    { id: '4h', label: '4h', mexcInterval: '4h' },
    { id: '1d', label: '1d', mexcInterval: '1d' },
  ];

  // Convert pair to MEXC symbol format
  const mexcSymbol = pair.replace('/', '');

  // Fetch real candlestick data from MEXC
  const fetchCandleData = async (interval: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/mexc/klines?symbol=${mexcSymbol}&interval=${interval}&limit=200`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candle data');
      }
      
      const data: CandleData[] = await response.json();
      console.log('Fetched candle data:', data.length, 'candles');
      setCandleData(data);
      return data;
    } catch (error) {
      console.error('Error fetching candle data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize TradingView Lightweight Charts
  useEffect(() => {
    const initChart = async () => {
      if (typeof window !== 'undefined' && chartContainer.current) {
        // Dynamically import lightweight-charts to avoid SSR issues
        const { createChart, ColorType } = await import('lightweight-charts');
        
        // Create chart
        chart.current = createChart(chartContainer.current, {
          width: chartContainer.current.clientWidth,
          height: height - 100, // Account for header space
          layout: {
            background: { type: ColorType.Solid, color: '#1a1a1a' },
            textColor: '#9ca3af',
          },
          grid: {
            vertLines: { color: '#333333' },
            horzLines: { color: '#333333' },
          },
          crosshair: {
            mode: 1, // CrosshairMode.Normal
          },
          timeScale: {
            borderColor: '#404040',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: '#404040',
          },
        });

        // Add candlestick series
        candleSeries.current = chart.current.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        });

        // Add volume series
        volumeSeries.current = chart.current.addHistogramSeries({
          color: 'rgba(196, 216, 45, 0.3)',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        });

        // Set volume scale
        chart.current.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.7,
            bottom: 0,
          },
        });

        // Handle resize
        const handleResize = () => {
          if (chart.current && chartContainer.current) {
            chart.current.applyOptions({ 
              width: chartContainer.current.clientWidth 
            });
          }
        };

        window.addEventListener('resize', handleResize);

        // Initial data fetch
        const currentInterval = timeframes.find(tf => tf.id === activeTimeframe)?.mexcInterval || '1h';
        const data = await fetchCandleData(currentInterval);
        
        if (data.length > 0) {
          // Set candlestick data
          const candleData = data.map(candle => ({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }));
          candleSeries.current.setData(candleData);

          // Set volume data
          const volumeData = data.map(candle => ({
            time: candle.time,
            value: candle.volume,
            color: candle.close >= candle.open 
              ? 'rgba(34, 197, 94, 0.3)' 
              : 'rgba(239, 68, 68, 0.3)'
          }));
          volumeSeries.current.setData(volumeData);

          // Fit content
          chart.current.timeScale().fitContent();
        }

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    };

    initChart();

    // Cleanup
    return () => {
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, [height]);

  // Handle timeframe changes
  const handleTimeframeChange = async (timeframeId: string) => {
    setActiveTimeframe(timeframeId);
    const timeframe = timeframes.find(tf => tf.id === timeframeId);
    if (timeframe && candleSeries.current && volumeSeries.current) {
      const data = await fetchCandleData(timeframe.mexcInterval);
      
      if (data.length > 0) {
        // Update candlestick data
        const candleData = data.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        candleSeries.current.setData(candleData);

        // Update volume data
        const volumeData = data.map(candle => ({
          time: candle.time,
          value: candle.volume,
          color: candle.close >= candle.open 
            ? 'rgba(34, 197, 94, 0.3)' 
            : 'rgba(239, 68, 68, 0.3)'
        }));
        volumeSeries.current.setData(volumeData);

        // Fit content
        chart.current.timeScale().fitContent();
      }
    }
  };

  // Real-time updates
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      if (candleSeries.current && volumeSeries.current) {
        const timeframe = timeframes.find(tf => tf.id === activeTimeframe);
        if (timeframe) {
          // Get just the latest data
          const data = await fetchCandleData(timeframe.mexcInterval);
          if (data.length > 0) {
            const latestCandle = data[data.length - 1];
            
            // Update the latest candle
            candleSeries.current.update({
              time: latestCandle.time,
              open: latestCandle.open,
              high: latestCandle.high,
              low: latestCandle.low,
              close: latestCandle.close,
            });

            volumeSeries.current.update({
              time: latestCandle.time,
              value: latestCandle.volume,
              color: latestCandle.close >= latestCandle.open 
                ? 'rgba(34, 197, 94, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)'
            });
          }
        }
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  }, [activeTimeframe]);

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
                onClick={() => handleTimeframeChange(tf.id)}
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
          
          {isLoading && (
            <div className="flex items-center gap-2 text-text-muted">
              <div className="w-4 h-4 border-2 border-accent-lime border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading {pair} data...</span>
            </div>
          )}
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
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height - 100}px` }}
      />

      {/* Chart Footer */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">
            {candleData.length > 0 
              ? `${candleData.length} candles • Live MEXC data` 
              : 'Loading chart data...'}
          </span>
          <span className="text-text-primary font-semibold">
            {pair} • {activeTimeframe}
          </span>
        </div>
      </div>
    </div>
  );
};