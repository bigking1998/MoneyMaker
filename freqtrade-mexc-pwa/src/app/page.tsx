'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { PriceDisplay } from '@/components/trading/PriceDisplay';
import { TradingChart } from '@/components/trading/TradingChart';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { ExchangeTable } from '@/components/trading/ExchangeTable';
import { MEXCPairSelector } from '@/components/mexc/MEXCPairSelector';
import { MEXCAccountManager } from '@/components/mexc/MEXCAccountManager';

export default function Dashboard() {
  const [selectedPair, setSelectedPair] = useState('ETH/USDT');
  const [pairSelectorOpen, setPairSelectorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-lime p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-bg-primary rounded-3xl min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] overflow-hidden">
          <Header />
          
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Trading Area */}
              <div className="xl:col-span-3 space-y-6">
                {/* Price Display */}
                <PriceDisplay 
                  pair={selectedPair}
                  onPairChange={() => setPairSelectorOpen(true)}
                />
                
                {/* Trading Chart */}
                <TradingChart pair={selectedPair} />
                
                {/* Exchange Comparison Table */}
                <ExchangeTable />
              </div>

              {/* Sidebar */}
              <div className="xl:col-span-1 space-y-6">
                {/* Trading Panel */}
                <TradingPanel />
                
                {/* MEXC Account Manager - Desktop only */}
                <div className="hidden xl:block">
                  <MEXCAccountManager />
                </div>
              </div>
            </div>

            {/* Mobile Account Manager */}
            <div className="xl:hidden mt-6">
              <MEXCAccountManager />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation />

      {/* Pair Selector Modal */}
      <MEXCPairSelector
        selectedPair={selectedPair}
        onPairSelect={setSelectedPair}
        isOpen={pairSelectorOpen}
        onClose={() => setPairSelectorOpen(false)}
      />
    </div>
  );
}