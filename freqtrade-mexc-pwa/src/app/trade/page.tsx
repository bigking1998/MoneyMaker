'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { PriceDisplay } from '@/components/trading/PriceDisplay';
import { TradingChart } from '@/components/trading/TradingChart';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { MEXCPairSelector } from '@/components/mexc/MEXCPairSelector';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

interface TradeHistory {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'completed' | 'pending' | 'cancelled';
  timestamp: Date;
  profit?: number;
}

const mockTradeHistory: TradeHistory[] = [
  {
    id: '1',
    pair: 'ETH/USDT',
    type: 'buy',
    amount: 0.5,
    price: 3620.00,
    status: 'completed',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    profit: 45.30,
  },
  {
    id: '2',
    pair: 'BTC/USDT',
    type: 'sell',
    amount: 0.025,
    price: 97100.00,
    status: 'completed',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    profit: -12.45,
  },
  {
    id: '3',
    pair: 'SOL/USDT',
    type: 'buy',
    amount: 10,
    price: 212.50,
    status: 'pending',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
];

export default function TradePage() {
  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [pairSelectorOpen, setPairSelectorOpen] = useState(false);

  const getStatusIcon = (status: TradeHistory['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'cancelled':
        return <div className="w-4 h-4 rounded-full bg-danger" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-lime p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-bg-primary rounded-3xl min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] overflow-hidden">
          <Header />
          
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Area */}
              <div className="lg:col-span-2 space-y-6">
                <PriceDisplay 
                  pair={selectedPair}
                  onPairChange={() => setPairSelectorOpen(true)}
                />
                
                <TradingChart pair={selectedPair} height={400} />

                {/* Trade History */}
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-text-primary">Recent Trades</h3>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {mockTradeHistory.map((trade) => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-4 bg-bg-primary rounded-lg hover:bg-bg-elevated transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(trade.status)}
                          <div className="flex items-center gap-2">
                            {trade.type === 'buy' ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-danger" />
                            )}
                            <span className="text-text-primary font-medium">
                              {trade.type.toUpperCase()} {trade.pair}
                            </span>
                          </div>
                          <div className="text-sm text-text-muted">
                            {trade.amount} @ ${trade.price.toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right">
                          {trade.profit !== undefined && (
                            <div className={`text-sm font-medium ${
                              trade.profit >= 0 ? 'text-success' : 'text-danger'
                            }`}>
                              {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                            </div>
                          )}
                          <div className="text-xs text-text-muted">
                            {trade.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Trading Panel */}
              <div className="lg:col-span-1">
                <TradingPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Navigation />

      <MEXCPairSelector
        selectedPair={selectedPair}
        onPairSelect={setSelectedPair}
        isOpen={pairSelectorOpen}
        onClose={() => setPairSelectorOpen(false)}
      />
    </div>
  );
}