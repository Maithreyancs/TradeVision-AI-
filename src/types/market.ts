export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AssetClass = 'all' | 'crypto' | 'indian_stocks' | 'us_stocks' | 'forex' | 'commodities' | 'indices';

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: number;
  exchange: string;
  bid?: number;
  ask?: number;
  marketCap?: number;
  sparkline?: number[];
  assetClass: AssetClass;
  isPopular?: boolean;
  liveCandle?: Candle;
  prevTickPrice?: number;
}

export interface MarketsResponse {
  markets: MarketQuote[];
  heroCards: MarketQuote[];
  topGainers: MarketQuote[];
  topLosers: MarketQuote[];
  mostActive: MarketQuote[];
  trending: MarketQuote[];
  total: number;
  timestamp: number;
}

export interface CurrencyRates {
  USD: number;
  INR: number;
  EUR: number;
  GBP: number;
  JPY: number;
}

export type DisplayCurrency = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY';

export interface PortfolioHoldingItem {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  change24hPct: number;
  currentValue: number;
  costBasis: number;
  pnl: number;
  pnlPct: number;
  currency: string;
  sparkline?: number[];
}

export interface PortfolioTransactionItem {
  id: string;
  symbol: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  currency: string;
  createdAt: string;
}

export interface PortfolioData {
  cashBalance: number;
  currency: string;
  totalHoldingsValue: number;
  totalPortfolioValue: number;
  todayPnL: {
    amount: number;
    percentage: number;
  };
  allTimePnL: {
    amount: number;
    percentage: number;
  };
  holdings: PortfolioHoldingItem[];
  allocation: {
    crypto: number;
    indian_stocks: number;
    us_stocks: number;
    commodities: number;
    forex: number;
    cash: number;
  };
  transactions: PortfolioTransactionItem[];
  timestamp: number;
}

