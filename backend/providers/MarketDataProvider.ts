export interface Candle {
  time: number; // seconds (Unix timestamp)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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
  lastUpdated: number; // milliseconds
  exchange: string;
  bid?: number;
  ask?: number;
  marketCap?: number;
  sparkline?: number[];
  assetClass: 'crypto' | 'indian_stocks' | 'us_stocks' | 'forex' | 'commodities' | 'indices';
  liveCandle?: Candle;
  prevTickPrice?: number;
}

export interface MarketDetails {
  symbol: string;
  name: string;
  description?: string;
  currency: string;
  exchange: string;
  marketCap?: number;
  peRatio?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  circulatingSupply?: number;
  allTimeHigh?: number;
}

export interface IMarketDataProvider {
  name: string;
  canHandle(symbol: string): boolean;
  getQuote(symbol: string): Promise<MarketQuote | null>;
  getHistoricalCandles(symbol: string, timeframe: string, limit?: number): Promise<Candle[]>;
  getMarketDetails(symbol: string): Promise<MarketDetails | null>;
  subscribeTicker(symbol: string, callback: (quote: MarketQuote) => void): () => void;
  unsubscribeTicker(symbol: string): void;
}
