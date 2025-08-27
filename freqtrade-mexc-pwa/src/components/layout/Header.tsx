'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MobileNav } from './MobileNav';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-bg-surface border-b border-border px-4 md:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-lime rounded-lg flex items-center justify-center">
              <span className="text-bg-primary font-bold text-sm">⚡</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary">LumaTrade</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-text-secondary hover:text-text-primary transition-colors py-2 px-4 rounded-lg hover:bg-bg-elevated"
            >
              Dashboard
            </Link>
            <Link 
              href="/trade" 
              className="text-text-secondary hover:text-text-primary transition-colors py-2 px-4 rounded-lg hover:bg-bg-elevated"
            >
              Trade
            </Link>
            <Link 
              href="/market" 
              className="text-text-secondary hover:text-text-primary transition-colors py-2 px-4 rounded-lg hover:bg-bg-elevated"
            >
              Market
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              <Settings className="w-4 h-4" />
            </Button>
            
            {/* User Profile */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-orange rounded-full"></div>
              <span className="text-text-muted text-sm font-mono">
                0xA7F3d4B8c62369B0fEa...
              </span>
            </div>

            <Button className="hidden md:inline-flex">
              Log in
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
};