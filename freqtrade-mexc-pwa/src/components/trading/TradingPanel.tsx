'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Wallet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export const TradingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  return (
    <Card className="sticky top-6">
      <div className="space-y-6">
        {/* Buy/Sell Tabs */}
        <div className="flex bg-bg-primary rounded-lg p-1">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'buy'
                ? 'bg-success text-white'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'sell'
                ? 'bg-danger text-white'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Balance Cards */}
        <div className="space-y-3">
          {/* ETH Balance */}
          <div className="bg-bg-primary rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-blue rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">Ξ</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">You Buy</span>
                <ArrowUpDown className="w-4 h-4 text-text-muted" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-text-primary">12.695</span>
                <span className="text-text-muted text-sm">Balance: 293.0187</span>
              </div>
            </div>
          </div>

          {/* USD Balance */}
          <div className="bg-bg-primary rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-lime rounded-full flex items-center justify-center">
              <span className="text-bg-primary font-bold text-sm">$</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">You Spend</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-text-primary">9,853.00</span>
                <span className="text-text-muted text-sm">Balance: 12,987.21</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="space-y-3">
          <div className="flex bg-bg-primary rounded-lg p-1">
            <button
              onClick={() => setOrderType('market')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                orderType === 'market'
                  ? 'bg-accent-lime text-bg-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                orderType === 'limit'
                  ? 'bg-accent-lime text-bg-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Limit
            </button>
          </div>

          {/* Order Inputs */}
          <div className="space-y-3">
            {orderType === 'limit' && (
              <Input
                label="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3,615.86"
                rightIcon={<span className="text-xs text-text-muted">USDT</span>}
              />
            )}
            
            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              rightIcon={<span className="text-xs text-text-muted">ETH</span>}
            />

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {['25%', '50%', '75%', 'Max'].map((percent) => (
                <button
                  key={percent}
                  className="py-2 px-3 text-xs font-medium bg-bg-primary rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  {percent}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trading Button */}
        <Button className={`w-full py-4 text-base font-semibold ${
          activeTab === 'buy' 
            ? 'bg-success hover:bg-success/90 text-white' 
            : 'bg-danger hover:bg-danger/90 text-white'
        }`}>
          {activeTab === 'buy' ? 'Buy ETH' : 'Sell ETH'}
        </Button>

        {/* Connect Wallet */}
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-bg-elevated rounded-lg text-text-secondary hover:bg-border transition-colors">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>

        {/* Trade Info */}
        <div className="bg-bg-primary rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-sm">Available Balance</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-text-primary">293.0187 ETH</div>
              <div className="text-xs text-success">+7.46%</div>
            </div>
          </div>
          
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Estimate fee</span>
              <span className="text-text-muted">4.28 USD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">You will receive</span>
              <span className="text-text-muted">108.35 USD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Spread</span>
              <span className="text-text-muted">0%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};