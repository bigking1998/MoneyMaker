'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={clsx(
            'w-full bg-bg-primary border border-border rounded-lg px-3 py-3 text-text-primary text-sm appearance-none cursor-pointer transition-colors focus:outline-none focus:border-accent-lime focus:ring-2 focus:ring-accent-lime/20',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
};