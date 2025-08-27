// Trading-related type definitions

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'TRADING' | 'BREAK' | 'HALT';
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  orderTypes: OrderType[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: TradingFilter[];
}

export interface TradingFilter {
  filterType: string;
  minPrice?: string;
  maxPrice?: string;
  tickSize?: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  minNotional?: string;
  applyToMarket?: boolean;
  avgPriceMins?: number;
}

export type OrderType = 
  | 'LIMIT'
  | 'MARKET' 
  | 'STOP_LOSS'
  | 'STOP_LOSS_LIMIT'
  | 'TAKE_PROFIT'
  | 'TAKE_PROFIT_LIMIT'
  | 'LIMIT_MAKER';

export type OrderSide = 'BUY' | 'SELL';

export type OrderStatus = 
  | 'NEW'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'PENDING_CANCEL'
  | 'REJECTED'
  | 'EXPIRED';

export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export interface Order {
  orderId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: TimeInForce;
  status: OrderStatus;
  executedQty: number;
  cummulativeQuoteQty: number;
  avgPrice?: number;
  createTime: number;
  updateTime: number;
  fills?: OrderFill[];
}

export interface OrderFill {
  price: number;
  qty: number;
  commission: number;
  commissionAsset: string;
  tradeId: number;
}

export interface Ticker {
  symbol: string;
  priceChange: number;
  priceChangePercent: number;
  weightedAvgPrice: number;
  prevClosePrice: number;
  lastPrice: number;
  lastQty: number;
  bidPrice: number;
  bidQty: number;
  askPrice: number;
  askQty: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface OrderBook {
  symbol: string;
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
}

export interface Trade {
  id: number;
  price: number;
  qty: number;
  quoteQty: number;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteAssetVolume: number;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface Account {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Balance[];
  permissions: string[];
}

// Futures-specific types
export interface FuturesPosition {
  symbol: string;
  positionAmt: number;
  entryPrice: number;
  markPrice: number;
  unRealizedProfit: number;
  liquidationPrice: number;
  leverage: number;
  maxNotionalValue: number;
  marginType: 'isolated' | 'cross';
  isolatedMargin: number;
  isAutoAddMargin: boolean;
  positionSide: 'BOTH' | 'LONG' | 'SHORT';
  notional: number;
  isolatedWallet: number;
  updateTime: number;
}

export interface FuturesAccount {
  feeTier: number;
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  updateTime: number;
  totalInitialMargin: number;
  totalMaintMargin: number;
  totalWalletBalance: number;
  totalUnrealizedProfit: number;
  totalMarginBalance: number;
  totalPositionInitialMargin: number;
  totalOpenOrderInitialMargin: number;
  totalCrossWalletBalance: number;
  totalCrossUnPnl: number;
  availableBalance: number;
  maxWithdrawAmount: number;
  assets: FuturesBalance[];
  positions: FuturesPosition[];
}

export interface FuturesBalance {
  asset: string;
  walletBalance: number;
  unrealizedProfit: number;
  marginBalance: number;
  maintMargin: number;
  initialMargin: number;
  positionInitialMargin: number;
  openOrderInitialMargin: number;
  maxWithdrawAmount: number;
  crossWalletBalance: number;
  crossUnPnl: number;
  availableBalance: number;
}

// Chart data types
export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  values: number[];
  color: string;
  visible: boolean;
}

// Trading strategy types
export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  parameters: StrategyParameter[];
  isActive: boolean;
  performance: StrategyPerformance;
}

export interface StrategyParameter {
  name: string;
  value: any;
  type: 'number' | 'string' | 'boolean' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface StrategyPerformance {
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
  returnsAnnualized: number;
}

// WebSocket message types
export interface WebSocketMessage<T = any> {
  stream: string;
  data: T;
}

export interface TickerMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  P: string; // Price change percent
  p: string; // Price change
}

export interface DepthMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID in event
  u: number; // Final update ID in event
  b: [string, string][]; // Bids to be updated
  a: [string, string][]; // Asks to be updated
}

export interface TradeMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
}

// Error types
export interface TradingError {
  code: number;
  message: string;
  details?: string;
  timestamp: number;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: TradingError;
  timestamp: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Market data aggregation
export interface MarketSummary {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
  rank?: number;
}

export interface ExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: RateLimit[];
  exchangeFilters: any[];
  symbols: TradingPair[];
}

export interface RateLimit {
  rateLimitType: string;
  interval: string;
  intervalNum: number;
  limit: number;
}

// Portfolio types
export interface Portfolio {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: PortfolioPosition[];
  history: PortfolioHistory[];
}

export interface PortfolioPosition {
  asset: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
}

export interface PortfolioHistory {
  timestamp: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}