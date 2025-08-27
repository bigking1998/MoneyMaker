'use client';

import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-bg-surface rounded-2xl border border-border transition-all duration-200',
        paddingClasses[padding],
        hover && 'hover:border-accent-lime hover:shadow-glow',
        className
      )}
    >
      {children}
    </div>
  );
};