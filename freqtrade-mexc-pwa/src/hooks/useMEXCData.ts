'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface MEXCTicker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: number;
}

interface MEXCOrderBook {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  lastUpdate: number;
}

interface MEXCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const useMEXCData = (pair: string) => {
  const [ticker, setTicker] = useState<MEXCTicker | null>(null);
  const [orderBook, setOrderBook] = useState<MEXCOrderBook | null>(null);
  const [candles, setCandles] = useState<MEXCCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demo - in real implementation, this would connect to MEXC WebSocket
  const generateMockTicker = useCallback((symbol: string): MEXCTicker => {
    const basePrices: Record<string, number> = {
      'BTCUSDT': 97234.56,
      'ETHUSDT': 3615.86,
      'SOLUSDT': 211.68,
      'ADAUSDT': 0.8934,
      'DOGEUSDT': 0.22201,
    };

    const basePrice = basePrices[symbol.replace('/', '')] || 100;
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const price = basePrice * (1 + variation);
    const change = (Math.random() - 0.3) * 0.1; // Slightly bullish bias

    return {
      symbol,
      price,
      change: price * change,
      changePercent: change * 100,
      high24h: price * 1.05,
      low24h: price * 0.95,
      volume24h: Math.random() * 1000000,
      lastUpdate: Date.now(),
    };
  }, []);

  const generateMockOrderBook = useCallback((symbol: string, price: number): MEXCOrderBook => {
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    // Generate 10 levels of bids and asks
    for (let i = 0; i < 10; i++) {
      const bidPrice = price * (1 - (i + 1) * 0.0001);
      const askPrice = price * (1 + (i + 1) * 0.0001);
      const bidAmount = Math.random() * 10;
      const askAmount = Math.random() * 10;

      bids.push([bidPrice, bidAmount]);
      asks.push([askPrice, askAmount]);
    }

    return {
      symbol,
      bids: bids.sort((a, b) => b[0] - a[0]), // Descending price order
      asks: asks.sort((a, b) => a[0] - b[0]), // Ascending price order
      lastUpdate: Date.now(),
    };
  }, []);

  const generateMockCandles = useCallback((symbol: string): MEXCCandle[] => {
    const candles: MEXCCandle[] = [];
    const now = Date.now();
    const basePrices: Record<string, number> = {
      'BTCUSDT': 97234.56,
      'ETHUSDT': 3615.86,
      'SOLUSDT': 211.68,
      'ADAUSDT': 0.8934,
      'DOGEUSDT': 0.22201,
    };

    let currentPrice = basePrices[symbol.replace('/', '')] || 100;

    // Generate 100 1-minute candles
    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * 60 * 1000);
      const variation = (Math.random() - 0.5) * 0.02;
      const open = currentPrice;
      const close = currentPrice * (1 + variation);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000;

      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });

      currentPrice = close;
    }

    return candles;
  }, []);

  // Simulate data fetching
  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockTicker = generateMockTicker(pair);
        const mockOrderBook = generateMockOrderBook(pair, mockTicker.price);
        const mockCandles = generateMockCandles(pair);

        setTicker(mockTicker);
        setOrderBook(mockOrderBook);
        setCandles(mockCandles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pair, generateMockTicker, generateMockOrderBook, generateMockCandles]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (ticker) {
        const updatedTicker = generateMockTicker(pair);
        setTicker(updatedTicker);
        
        if (orderBook) {
          const updatedOrderBook = generateMockOrderBook(pair, updatedTicker.price);
          setOrderBook(updatedOrderBook);
        }
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [pair, ticker, orderBook, generateMockTicker, generateMockOrderBook]);

  // Extract commonly used values
  const price = ticker?.price;
  const change = ticker?.change;
  const changePercent = ticker?.changePercent;
  const volume24h = ticker?.volume24h;
  const high24h = ticker?.high24h;
  const low24h = ticker?.low24h;

  return {
    // Raw data
    ticker,
    orderBook,
    candles,
    
    // Extracted values
    price,
    change,
    changePercent,
    volume24h,
    high24h,
    low24h,
    
    // State
    loading,
    error,
    
    // Methods
    refresh: () => {
      setLoading(true);
      // Trigger re-fetch
    },
  };
};