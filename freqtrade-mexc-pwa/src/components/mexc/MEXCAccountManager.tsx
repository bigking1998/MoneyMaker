'use client';

import React, { useState } from 'react';
import { Wallet, RefreshCw, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface MEXCAccount {
  id: string;
  name: string;
  balance: {
    usdt: number;
    btc: number;
    eth: number;
  };
  pnl24h: number;
  status: 'connected' | 'disconnected' | 'error';
}

const mockAccounts: MEXCAccount[] = [
  {
    id: 'main',
    name: 'Main Account',
    balance: {
      usdt: 12987.21,
      btc: 0.25,
      eth: 2.847,
    },
    pnl24h: 234.56,
    status: 'connected',
  },
  {
    id: 'futures',
    name: 'Futures Account',
    balance: {
      usdt: 5420.00,
      btc: 0.0,
      eth: 0.0,
    },
    pnl24h: -45.23,
    status: 'connected',
  },
];

export const MEXCAccountManager: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState('main');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getStatusIcon = (status: MEXCAccount['status']) => {
    switch (status) {
      case 'connected':
        return <div className="w-2 h-2 bg-success rounded-full" />;
      case 'disconnected':
        return <div className="w-2 h-2 bg-neutral rounded-full" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger" />;
    }
  };

  const selectedAccountData = mockAccounts.find(acc => acc.id === selectedAccount);

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">MEXC Accounts</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Account Selector */}
      <div className="space-y-2">
        {mockAccounts.map((account) => (
          <button
            key={account.id}
            onClick={() => setSelectedAccount(account.id)}
            className={`w-full p-3 rounded-lg border transition-all text-left ${
              selectedAccount === account.id
                ? 'border-accent-lime bg-accent-lime/5'
                : 'border-border hover:border-accent-lime/50 hover:bg-bg-elevated'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(account.status)}
                <div>
                  <div className="font-medium text-text-primary">{account.name}</div>
                  <div className="text-sm text-text-muted">
                    ${account.balance.usdt.toLocaleString()} USDT
                  </div>
                </div>
              </div>
              <div className={`text-right ${
                account.pnl24h >= 0 ? 'text-success' : 'text-danger'
              }`}>
                <div className="text-sm font-medium">
                  {account.pnl24h >= 0 ? '+' : ''}${account.pnl24h.toFixed(2)}
                </div>
                <div className="text-xs">24h PnL</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Account Details */}
      {selectedAccountData && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium text-text-primary">Balance Details</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-primary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-lime rounded-full flex items-center justify-center">
                  <span className="text-bg-primary text-xs font-bold">$</span>
                </div>
                <span className="text-sm font-medium text-text-primary">USDT</span>
              </div>
              <div className="text-lg font-bold text-text-primary">
                {selectedAccountData.balance.usdt.toLocaleString()}
              </div>
            </div>

            <div className="bg-bg-primary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">₿</span>
                </div>
                <span className="text-sm font-medium text-text-primary">BTC</span>
              </div>
              <div className="text-lg font-bold text-text-primary">
                {selectedAccountData.balance.btc.toFixed(6)}
              </div>
            </div>

            <div className="bg-bg-primary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Ξ</span>
                </div>
                <span className="text-sm font-medium text-text-primary">ETH</span>
              </div>
              <div className="text-lg font-bold text-text-primary">
                {selectedAccountData.balance.eth.toFixed(3)}
              </div>
            </div>

            <div className="bg-bg-primary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-5 h-5 ${selectedAccountData.pnl24h >= 0 ? 'text-success' : 'text-danger'}`} />
                <span className="text-sm font-medium text-text-primary">24h PnL</span>
              </div>
              <div className={`text-lg font-bold ${selectedAccountData.pnl24h >= 0 ? 'text-success' : 'text-danger'}`}>
                {selectedAccountData.pnl24h >= 0 ? '+' : ''}${selectedAccountData.pnl24h.toFixed(2)}
              </div>
            </div>
          </div>

          <Button variant="secondary" className="w-full">
            <Wallet className="w-4 h-4" />
            Transfer Funds
          </Button>
        </div>
      )}
    </Card>
  );
};