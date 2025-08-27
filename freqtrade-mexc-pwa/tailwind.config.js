/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors from design.json
        'bg-primary': '#1a1a1a',
        'bg-surface': '#2a2a2a',
        'bg-elevated': '#333333',
        'border': '#404040',
        'border-subtle': '#2a2a2a',
        
        // Accent colors
        'accent-lime': '#c4d82d',
        'accent-lime-hover': '#b8cc28',
        'accent-lime-dark': '#a3b821',
        'accent-lime-light': '#d9e847',
        
        // Semantic colors
        'success': '#22c55e',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'info': '#3b82f6',
        'neutral': '#6b7280',
        
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#d1d5db',
        'text-tertiary': '#9ca3af',
        'text-muted': '#6b7280',
        'text-accent': '#c4d82d',
        
        // Chart colors
        'chart-positive': '#22c55e',
        'chart-negative': '#ef4444',
        'chart-grid': '#404040',
        'chart-axis': '#9ca3af',
        'chart-wick': '#666666',
        
        // Status colors
        'status-limited': '#f59e0b',
        'status-trending': '#8b5cf6',
        'status-rising': '#22c55e',
        'status-falling': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(196, 216, 45, 0.3)',
        'glow-strong': '0 0 30px rgba(196, 216, 45, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(196, 216, 45, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(196, 216, 45, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      backgroundImage: {
        'gradient-lime': 'linear-gradient(135deg, #c4d82d 0%, #a3b821 100%)',
        'gradient-orange': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, #2a2a2a 25%, #333333 50%, #2a2a2a 75%)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};