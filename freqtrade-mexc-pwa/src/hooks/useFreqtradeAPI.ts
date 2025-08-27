'use client';

import { useState, useEffect, useCallback } from 'react';

interface FreqtradeConfig {
  baseUrl?: string;
  token?: string;
}

interface FreqtradeStatus {
  bot_start_date: string;
  dry_run: boolean;
  exchange: string;
  state: string;
  strategy: string;
  trade_count: number;
  uptime: number;
}

interface FreqtradeBalance {
  currencies: Record<string, {
    free: number;
    used: number;
    total: number;
  }>;
  total: number;
  symbol: string;
  value: number;
}

interface FreqtradeTrade {
  trade_id: number;
  pair: string;
  base_currency: string;
  quote_currency: string;
  is_open: boolean;
  exchange: string;
  amount: number;
  amount_requested: number;
  stake_amount: number;
  strategy: string;
  enter_tag: string | null;
  timeframe: number;
  fee_open: number;
  fee_close: number;
  open_date: string;
  open_timestamp: number;
  open_rate: number;
  close_date: string | null;
  close_timestamp: number | null;
  close_rate: number | null;
  current_rate: number;
  current_profit: number;
  current_profit_abs: number;
  profit_ratio: number;
  profit_pct: number;
  profit_abs: number;
  stop_loss_abs: number;
  stop_loss_ratio: number;
  stoploss_order_id: string | null;
  initial_stop_loss_abs: number;
  initial_stop_loss_ratio: number;
}

export const useFreqtradeAPI = (config: FreqtradeConfig = {}) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const baseUrl = config.baseUrl || process.env.FREQTRADE_API_URL || 'http://localhost:8080/api/v1';

  // Initialize token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('freqtrade_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/token/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('freqtrade_token', data.access_token);
        setIsAuthenticated(true);
        return data;
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const logout = useCallback(() => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('freqtrade_token');
  }, []);

  const apiCall = useCallback(async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const authToken = token || localStorage.getItem('freqtrade_token');
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }, [baseUrl, token, logout]);

  // API methods
  const getStatus = useCallback((): Promise<FreqtradeStatus> => {
    return apiCall('/status');
  }, [apiCall]);

  const getBalance = useCallback((): Promise<FreqtradeBalance> => {
    return apiCall('/balance');
  }, [apiCall]);

  const getMEXCPairs = useCallback((): Promise<string[]> => {
    return apiCall('/available_pairs?exchange=mexc');
  }, [apiCall]);

  const getOpenTrades = useCallback((): Promise<FreqtradeTrade[]> => {
    return apiCall('/trades');
  }, [apiCall]);

  const getClosedTrades = useCallback((): Promise<FreqtradeTrade[]> => {
    return apiCall('/trades?status=closed');
  }, [apiCall]);

  const getPerformance = useCallback((): Promise<any> => {
    return apiCall('/performance');
  }, [apiCall]);

  const getDaily = useCallback((): Promise<any> => {
    return apiCall('/daily');
  }, [apiCall]);

  const getStats = useCallback((): Promise<any> => {
    return apiCall('/stats');
  }, [apiCall]);

  const forceBuy = useCallback((pair: string, price?: number): Promise<any> => {
    return apiCall('/forcebuy', {
      method: 'POST',
      body: JSON.stringify({ pair, price }),
    });
  }, [apiCall]);

  const forceSell = useCallback((tradeid: number): Promise<any> => {
    return apiCall('/forcesell', {
      method: 'POST',
      body: JSON.stringify({ tradeid }),
    });
  }, [apiCall]);

  const startBot = useCallback((): Promise<any> => {
    return apiCall('/start', { method: 'POST' });
  }, [apiCall]);

  const stopBot = useCallback((): Promise<any> => {
    return apiCall('/stop', { method: 'POST' });
  }, [apiCall]);

  const reloadConfig = useCallback((): Promise<any> => {
    return apiCall('/reload_config', { method: 'POST' });
  }, [apiCall]);

  return {
    // Auth state
    isAuthenticated,
    token,
    loading,
    error,
    
    // Auth methods
    login,
    logout,
    
    // API methods
    getStatus,
    getBalance,
    getMEXCPairs,
    getOpenTrades,
    getClosedTrades,
    getPerformance,
    getDaily,
    getStats,
    forceBuy,
    forceSell,
    startBot,
    stopBot,
    reloadConfig,
    
    // Raw API call method
    apiCall,
  };
};