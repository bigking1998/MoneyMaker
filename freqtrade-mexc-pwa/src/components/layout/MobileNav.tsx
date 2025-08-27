'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Settings, User, TrendingUp, BarChart3, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-bg-surface border-l border-border animate-slide-in">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-orange rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-text-primary font-medium">Trading Account</p>
                <p className="text-text-muted text-sm font-mono">0xA7F3...fEa</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-accent-lime" />
                <span className="text-text-primary font-medium">Dashboard</span>
              </Link>
              <Link
                href="/trade"
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-accent-lime" />
                <span className="text-text-primary font-medium">Trade</span>
              </Link>
              <Link
                href="/market"
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <Wallet className="w-5 h-5 text-accent-lime" />
                <span className="text-text-primary font-medium">Market</span>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="space-y-2">
                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated transition-colors w-full text-left">
                  <Bell className="w-5 h-5 text-text-tertiary" />
                  <span className="text-text-secondary">Notifications</span>
                </button>
                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated transition-colors w-full text-left">
                  <Settings className="w-5 h-5 text-text-tertiary" />
                  <span className="text-text-secondary">Settings</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-border">
            <Button className="w-full">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};