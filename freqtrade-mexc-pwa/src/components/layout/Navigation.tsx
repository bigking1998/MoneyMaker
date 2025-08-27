'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp, Wallet, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-surface border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        <Link
          href="/"
          className={clsx(
            'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
            pathname === '/'
              ? 'text-accent-lime bg-accent-lime/10'
              : 'text-text-tertiary hover:text-text-primary hover:bg-bg-elevated'
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>

        <Link
          href="/trade"
          className={clsx(
            'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
            pathname === '/trade'
              ? 'text-accent-lime bg-accent-lime/10'
              : 'text-text-tertiary hover:text-text-primary hover:bg-bg-elevated'
          )}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs font-medium">Trade</span>
        </Link>

        <Link
          href="/market"
          className={clsx(
            'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
            pathname === '/market'
              ? 'text-accent-lime bg-accent-lime/10'
              : 'text-text-tertiary hover:text-text-primary hover:bg-bg-elevated'
          )}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-xs font-medium">Market</span>
        </Link>

        <button
          className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};