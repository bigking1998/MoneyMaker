# 🚀 LumaTrade - Freqtrade MEXC PWA

A beautiful, mobile-first Progressive Web App (PWA) for crypto trading that integrates seamlessly with your existing Freqtrade + MEXC backend.

![LumaTrade Preview](https://via.placeholder.com/800x400/c4d82d/1a1a1a?text=LumaTrade+PWA)

## ✨ Features

### 🎨 **Pixel-Perfect Design**
- **LumaTrade Design System** - Exact replica of the provided design tokens
- **Dark Theme** with lime accent (#c4d82d) 
- **Mobile-First** responsive design
- **Professional Trading Interface** with modern gradients and animations

### 📱 **Progressive Web App**
- **Installable** on mobile devices and desktop
- **Offline Capability** for monitoring trades
- **Push Notifications** for trade alerts and price updates
- **App-like Experience** with native feel

### ⚡ **Real-Time Trading**
- **Live Price Updates** via WebSocket connections
- **Interactive Charts** with TradingView Lightweight Charts
- **Real-Time Order Book** depth visualization
- **MEXC Market Data** integration

### 🔄 **Freqtrade Integration**
- **JWT Authentication** with your Freqtrade instance
- **Live Trade Monitoring** and management
- **Balance Tracking** across MEXC accounts
- **Strategy Performance** analytics

### 🏦 **MEXC Exchange Features**
- **Multi-Account Support** for different trading strategies
- **Spot & Futures Trading** capabilities
- **Advanced Order Types** (Market, Limit, Stop-Loss)
- **Portfolio Management** tools

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + Custom Design System
- **PWA**: next-pwa plugin for offline functionality
- **Charts**: Lightweight Charts by TradingView
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **API Integration**: Freqtrade REST API + MEXC WebSocket

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Running Freqtrade instance with MEXC integration
- MEXC API keys configured in Freqtrade

### Installation

```bash
# Clone or navigate to the PWA directory
cd freqtrade-mexc-pwa

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Freqtrade API URL

# Run development server
yarn dev
```

### Environment Variables

```bash
# .env.local
FREQTRADE_API_URL=http://localhost:8080/api/v1
```

## 📂 Project Structure

```
freqtrade-mexc-pwa/
├── public/
│   ├── icons/              # PWA icons (auto-generated)
│   ├── manifest.json       # PWA manifest
│   └── favicon.ico         # Favicon
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── page.tsx        # Dashboard (main trading view)
│   │   ├── trade/          # Trading interface
│   │   ├── market/         # Market overview
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   ├── layout/         # Header, Navigation, Mobile nav
│   │   ├── trading/        # Trading-specific components
│   │   └── mexc/           # MEXC-specific components  
│   ├── hooks/              # Custom React hooks
│   │   ├── useFreqtradeAPI.ts
│   │   ├── useMEXCData.ts
│   │   └── useWebSocket.ts
│   ├── lib/                # Utilities and configurations
│   └── types/              # TypeScript type definitions
├── tailwind.config.js      # Tailwind + Design System config
├── next.config.js          # Next.js + PWA configuration
└── package.json
```

## 🎨 Design System

The PWA implements the exact **LumaTrade Design System** with:

### Colors
```css
--bg-primary: #1a1a1a;        /* Main background */
--bg-surface: #2a2a2a;        /* Card surfaces */
--accent-lime: #c4d82d;       /* Primary accent */
--text-primary: #ffffff;      /* Primary text */
--success: #22c55e;           /* Positive values */
--danger: #ef4444;            /* Negative values */
```

### Components
- **Gradient Container** - Lime gradient outer container
- **Trading Cards** - Dark surfaces with hover effects  
- **Interactive Charts** - Professional candlestick charts
- **Price Displays** - Large, clear price information
- **Order Book** - Real-time depth visualization

## 📱 PWA Features

### Installation
- **Add to Home Screen** on mobile devices
- **Desktop Installation** via browser prompt
- **Standalone Mode** for app-like experience

### Offline Capability
- **Cached UI** for offline viewing
- **Trade History** stored locally
- **Service Worker** for background updates

### Push Notifications
- **Price Alerts** for favorite trading pairs
- **Trade Notifications** when orders execute
- **Market Updates** for significant moves

## 🔌 API Integration

### Freqtrade Connection
```typescript
const { getStatus, getBalance, getOpenTrades } = useFreqtradeAPI({
  baseUrl: process.env.FREQTRADE_API_URL
});
```

### MEXC Real-Time Data
```typescript
const { price, change, orderBook } = useMEXCData('ETH/USDT');
```

### WebSocket Streams
- **Price Tickers** - Real-time price updates
- **Order Book** - Live depth changes
- **Trade Stream** - Recent trades feed

## 📊 Trading Features

### Dashboard
- **Price Overview** with 24h statistics
- **Interactive Charts** with multiple timeframes
- **Exchange Comparison** table
- **Portfolio Summary** cards

### Trading Interface
- **Buy/Sell Panels** with order types
- **Balance Management** across accounts
- **Order History** and trade tracking
- **Quick Actions** for common operations

### Market Analysis
- **Market Overview** with top movers
- **Search & Filter** functionality
- **Favorites Management** 
- **Sorting Options** by various metrics

## 🔧 Configuration

### Tailwind Design Tokens
All design tokens from `design.json` are implemented in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'bg-primary': '#1a1a1a',
      'accent-lime': '#c4d82d',
      // ... full design system
    }
  }
}
```

### PWA Manifest
```json
{
  "name": "LumaTrade - MEXC Trading Interface",
  "short_name": "LumaTrade",
  "theme_color": "#c4d82d",
  "background_color": "#1a1a1a",
  "display": "standalone"
}
```

## 🚀 Deployment

### Build for Production
```bash
yarn build
yarn start
```

### Vercel Deployment
```bash
# Connect to Vercel
vercel

# Deploy
vercel --prod
```

### Environment Setup
- Set `FREQTRADE_API_URL` in production
- Configure CORS in Freqtrade for your domain
- Enable PWA manifest serving

## 📱 Mobile Experience

### Responsive Design
- **Mobile-First** approach with breakpoints
- **Touch-Friendly** interfaces
- **Swipe Gestures** for navigation
- **Bottom Navigation** for mobile

### Performance
- **60fps Animations** with hardware acceleration
- **Lazy Loading** for optimal performance  
- **Image Optimization** with Next.js
- **Code Splitting** for faster loads

## 🔒 Security

- **JWT Authentication** with secure token storage
- **API Rate Limiting** protection
- **Input Validation** and sanitization
- **HTTPS Enforcement** in production

## 🆘 Troubleshooting

### Common Issues

**PWA Not Installing**
```bash
# Check manifest.json is accessible
curl https://your-domain.com/manifest.json

# Verify HTTPS is enabled
# Check console for PWA errors
```

**API Connection Issues**
```bash
# Test Freqtrade API directly
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/status

# Check CORS configuration in Freqtrade
```

**WebSocket Connection Problems**
```bash
# Verify WebSocket endpoint
# Check network connectivity
# Review browser console for errors
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LumaTrade Design System** for the beautiful UI design
- **Freqtrade** for the powerful trading bot framework
- **MEXC** for the comprehensive crypto exchange API
- **TradingView** for the lightweight charts library

---

## 🎯 Next Steps

### Immediate Enhancements
- [ ] Real TradingView charts integration
- [ ] Advanced order types (OCO, Trailing stops)
- [ ] Portfolio analytics dashboard
- [ ] Push notification implementation

### Future Features  
- [ ] Multi-exchange aggregation
- [ ] Social trading features
- [ ] Advanced technical indicators
- [ ] Mobile app (React Native)

---

**Built with ❤️ for the crypto trading community**

*Ready to trade on MEXC with the power of Freqtrade and the beauty of LumaTrade design!*