'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp, Wallet, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/' as const,
      label: 'Dashboard',
      icon: BarChart3,
      active: pathname === '/',
    },
    {
      href: '/trade' as const,
      label: 'Trade',
      icon: TrendingUp,
      active: pathname === '/trade',
    },
    {
      href: '/market' as const,
      label: 'Market',
      icon: Wallet,
      active: pathname === '/market',
    },
    {
      href: '/settings' as const,
      label: 'Settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-surface border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
              active
                ? 'text-accent-lime bg-accent-lime/10'
                : 'text-text-tertiary hover:text-text-primary hover:bg-bg-elevated'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};