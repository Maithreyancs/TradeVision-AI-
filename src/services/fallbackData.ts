import { MarketQuote, MarketsResponse, Candle, CurrencyRates } from '../types/market.js';
import { TrendAnalysis, IndicatorResults, SupportResistanceResult, MultiTimeframeSummary } from '../types/analysis.js';
import { DrawingItem } from '../charts/drawingTypes.js';

export const FALLBACK_CURRENCY_RATES: CurrencyRates = {
  USD: 1.0,
  INR: 86.85,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
};

export const FALLBACK_MARKETS: MarketQuote[] = [
  // Crypto
  {
    id: 'crypto-btc',
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    price: 91420.5,
    change24h: 1850.2,
    change24hPct: 2.06,
    high24h: 92400.0,
    low24h: 89350.0,
    volume24h: 38450120,
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'Binance',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '89500 89800 90200 90100 91420',
  },
  {
    id: 'crypto-eth',
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    price: 3380.25,
    change24h: 65.4,
    change24hPct: 1.97,
    high24h: 3420.0,
    low24h: 3290.0,
    volume24h: 18230400,
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'Binance',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '3300 3320 3340 3360 3380',
  },
  {
    id: 'crypto-sol',
    symbol: 'SOLUSDT',
    name: 'Solana',
    price: 198.4,
    change24h: 7.2,
    change24hPct: 3.77,
    high24h: 202.5,
    low24h: 188.0,
    volume24h: 12450800,
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'Binance',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '189 191 193 196 198.4',
  },
  {
    id: 'crypto-bnb',
    symbol: 'BNBUSDT',
    name: 'BNB',
    price: 645.8,
    change24h: 5.6,
    change24hPct: 0.87,
    high24h: 652.0,
    low24h: 638.0,
    volume24h: 2340500,
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'Binance',
    isPopular: false,
    lastUpdated: Date.now(),
    sparkline: '640 642 641 644 645.8',
  },
  {
    id: 'crypto-xrp',
    symbol: 'XRPUSDT',
    name: 'XRP',
    price: 1.48,
    change24h: -0.03,
    change24hPct: -1.98,
    high24h: 1.55,
    low24h: 1.44,
    volume24h: 170646719,
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'Binance',
    isPopular: false,
    lastUpdated: Date.now(),
    sparkline: '1.52 1.50 1.49 1.47 1.48',
  },
  {
    id: 'crypto-doge',
    symbol: 'DOGEUSDT',
    name: 'Dogecoin',
    price: 0.093,
    change24h: -0.002,
    change24hPct: -2.1,
    high24h: 0.098,
    low24h: 0.09,
    volume24h: 947933012,
    assetClass: 'crypto',
    currency: 'USDT',
    exchange: 'Binance',
    isPopular: false,
    lastUpdated: Date.now(),
    sparkline: '0.096 0.095 0.094 0.092 0.093',
  },

  // Indian Equities
  {
    id: 'in-reliance',
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries',
    price: 1167.7,
    change24h: -29.9,
    change24hPct: -2.5,
    high24h: 1183.9,
    low24h: 1160.8,
    volume24h: 16667234,
    assetClass: 'indian_stocks',
    currency: 'INR',
    exchange: 'NSE',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '1197 1182 1187 1167',
  },
  {
    id: 'in-tcs',
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    price: 3840.5,
    change24h: 42.1,
    change24hPct: 1.11,
    high24h: 3865.0,
    low24h: 3790.0,
    volume24h: 2154300,
    assetClass: 'indian_stocks',
    currency: 'INR',
    exchange: 'NSE',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '3795 3810 3825 3840',
  },
  {
    id: 'in-infy',
    symbol: 'INFY.NS',
    name: 'Infosys Ltd',
    price: 1035.0,
    change24h: 31.8,
    change24hPct: 3.17,
    high24h: 1035.0,
    low24h: 999.15,
    volume24h: 15061214,
    assetClass: 'indian_stocks',
    currency: 'INR',
    exchange: 'NSE',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '1003 1015 994 1035',
  },
  {
    id: 'in-hdfc',
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    price: 1720.0,
    change24h: 12.5,
    change24hPct: 0.73,
    high24h: 1735.0,
    low24h: 1705.0,
    volume24h: 8940300,
    assetClass: 'indian_stocks',
    currency: 'INR',
    exchange: 'NSE',
    isPopular: false,
    lastUpdated: Date.now(),
    sparkline: '1708 1712 1715 1720',
  },

  // US Equities
  {
    id: 'us-nvda',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 233.95,
    change24h: 8.88,
    change24hPct: 3.95,
    high24h: 237.87,
    low24h: 233.6,
    volume24h: 134470648,
    assetClass: 'us_stocks',
    currency: 'USD',
    exchange: 'NASDAQ',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '228 227 228 230 233.95',
  },
  {
    id: 'us-aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 228.4,
    change24h: 1.8,
    change24hPct: 0.79,
    high24h: 230.1,
    low24h: 226.5,
    volume24h: 48920100,
    assetClass: 'us_stocks',
    currency: 'USD',
    exchange: 'NASDAQ',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '226 227 227.5 228.4',
  },
  {
    id: 'us-tsla',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 242.6,
    change24h: 6.2,
    change24hPct: 2.62,
    high24h: 245.5,
    low24h: 236.0,
    volume24h: 65430200,
    assetClass: 'us_stocks',
    currency: 'USD',
    exchange: 'NASDAQ',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '236 238 240 242.6',
  },

  // Indices
  {
    id: 'idx-gspc',
    symbol: '^GSPC',
    name: 'S&P 500',
    price: 5885.2,
    change24h: -15.4,
    change24hPct: -0.26,
    high24h: 5910.0,
    low24h: 5870.0,
    volume24h: 3130028000,
    assetClass: 'indices',
    currency: 'USD',
    exchange: 'CBOE',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '5890 5895 5880 5885',
  },
  {
    id: 'idx-nsei',
    symbol: '^NSEI',
    name: 'NIFTY 50',
    price: 24350.0,
    change24h: 110.5,
    change24hPct: 0.46,
    high24h: 24420.0,
    low24h: 24280.0,
    volume24h: 1540300000,
    assetClass: 'indices',
    currency: 'INR',
    exchange: 'NSE',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '24290 24320 24310 24350',
  },

  // Commodities
  {
    id: 'com-gold',
    symbol: 'GC=F',
    name: 'Gold Futures (XAU/USD)',
    price: 2680.4,
    change24h: 14.8,
    change24hPct: 0.55,
    high24h: 2692.0,
    low24h: 2665.0,
    volume24h: 248900,
    assetClass: 'commodities',
    currency: 'USD',
    exchange: 'COMEX',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '2668 2672 2675 2680.4',
  },

  // Forex
  {
    id: 'fx-eurusd',
    symbol: 'EURUSD=X',
    name: 'EUR / USD',
    price: 1.085,
    change24h: 0.0015,
    change24hPct: 0.14,
    high24h: 1.088,
    low24h: 1.082,
    volume24h: 954000,
    assetClass: 'forex',
    currency: 'USD',
    exchange: 'FX',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '1.083 1.084 1.084 1.085',
  },
  {
    id: 'fx-usdinr',
    symbol: 'USDINR=X',
    name: 'USD / INR',
    price: 86.85,
    change24h: 0.08,
    change24hPct: 0.09,
    high24h: 86.95,
    low24h: 86.75,
    volume24h: 420000,
    assetClass: 'forex',
    currency: 'INR',
    exchange: 'FX',
    isPopular: true,
    lastUpdated: Date.now(),
    sparkline: '86.78 86.80 86.82 86.85',
  },
];

export function generateFallbackCandles(symbol: string, count = 120): Candle[] {
  const quote = FALLBACK_MARKETS.find((m) => m.symbol.toUpperCase() === symbol.toUpperCase());
  const basePrice = quote ? quote.price : 100;
  const now = Math.floor(Date.now() / 1000);
  const step = 3600; // 1h step

  const candles: Candle[] = [];
  let currentClose = basePrice * 0.95;

  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const volatility = currentClose * 0.012;
    const change = (Math.random() - 0.48) * volatility;
    const open = currentClose;
    const close = Math.max(open + change, 0.0001);
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.max(Math.min(open, close) - Math.random() * volatility * 0.5, 0.0001);
    const volume = Math.floor(Math.random() * 50000 + 10000);

    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentClose = close;
  }

  // Ensure last candle matches quote price closely
  if (quote && candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = quote.price;
    last.high = Math.max(last.high, quote.price);
    last.low = Math.min(last.low, quote.price);
  }

  return candles;
}

export function generateFallbackAnalysis(symbol: string, currentPrice: number): {
  trend: TrendAnalysis;
  multiTf: MultiTimeframeSummary;
} {
  const s1 = Number((currentPrice * 0.97).toFixed(2));
  const s2 = Number((currentPrice * 0.94).toFixed(2));
  const s3 = Number((currentPrice * 0.90).toFixed(2));
  const r1 = Number((currentPrice * 1.03).toFixed(2));
  const r2 = Number((currentPrice * 1.06).toFixed(2));
  const r3 = Number((currentPrice * 1.10).toFixed(2));

  const indicators: IndicatorResults = {
    sma: {
      sma20: Number((currentPrice * 0.99).toFixed(2)),
      sma50: Number((currentPrice * 0.98).toFixed(2)),
      sma100: Number((currentPrice * 0.96).toFixed(2)),
      sma200: Number((currentPrice * 0.93).toFixed(2)),
    },
    ema: {
      ema9: Number((currentPrice * 1.005).toFixed(2)),
      ema20: Number((currentPrice * 0.995).toFixed(2)),
      ema50: Number((currentPrice * 0.985).toFixed(2)),
    },
    rsi: {
      value: 58.4,
      condition: 'BULLISH',
    },
    macd: {
      macd: 1.42,
      signal: 0.98,
      histogram: 0.44,
      cross: 'BULLISH_CROSS',
    },
    stochRsi: {
      k: 62.5,
      d: 58.0,
    },
    bollingerBands: {
      upper: Number((currentPrice * 1.04).toFixed(2)),
      middle: Number((currentPrice * 1.00).toFixed(2)),
      lower: Number((currentPrice * 0.96).toFixed(2)),
      bandwidth: 8.0,
    },
    atr: {
      value: Number((currentPrice * 0.02).toFixed(2)),
      percentage: 2.0,
    },
    volume: {
      current: 450000,
      average20: 380000,
      ratio: 1.18,
      isSpike: false,
    },
    vwap: {
      value: Number((currentPrice * 0.998).toFixed(2)),
    },
    adx: {
      adx: 28.5,
      plusDI: 24.1,
      minusDI: 16.3,
      strength: 'STRONG',
    },
  };

  const srResult: SupportResistanceResult = {
    currentPrice,
    pivot: Number(currentPrice.toFixed(2)),
    calculationMethod: 'Algorithmic Clustering & Floor Pivots',
    nearestSupport: {
      level: 'S1',
      type: 'SUPPORT',
      price: s1,
      strength: 8,
      touches: 4,
      distance: Number((currentPrice - s1).toFixed(2)),
      distancePct: 3.0,
      method: 'Rolling Cluster High/Low',
    },
    nearestResistance: {
      level: 'R1',
      type: 'RESISTANCE',
      price: r1,
      strength: 7,
      touches: 3,
      distance: Number((r1 - currentPrice).toFixed(2)),
      distancePct: 3.0,
      method: 'Rolling Cluster High/Low',
    },
    supports: [
      { level: 'S1', type: 'SUPPORT', price: s1, strength: 8, touches: 4, distance: Number((currentPrice - s1).toFixed(2)), distancePct: 3.0, method: 'Cluster' },
      { level: 'S2', type: 'SUPPORT', price: s2, strength: 6, touches: 2, distance: Number((currentPrice - s2).toFixed(2)), distancePct: 6.0, method: 'Pivot' },
      { level: 'S3', type: 'SUPPORT', price: s3, strength: 5, touches: 1, distance: Number((currentPrice - s3).toFixed(2)), distancePct: 10.0, method: 'Swing Low' },
    ],
    resistances: [
      { level: 'R1', type: 'RESISTANCE', price: r1, strength: 7, touches: 3, distance: Number((r1 - currentPrice).toFixed(2)), distancePct: 3.0, method: 'Cluster' },
      { level: 'R2', type: 'RESISTANCE', price: r2, strength: 5, touches: 2, distance: Number((r2 - currentPrice).toFixed(2)), distancePct: 6.0, method: 'Pivot' },
      { level: 'R3', type: 'RESISTANCE', price: r3, strength: 4, touches: 1, distance: Number((r3 - currentPrice).toFixed(2)), distancePct: 10.0, method: 'Swing High' },
    ],
  };

  const trend: TrendAnalysis = {
    symbol,
    timeframe: '1h',
    direction: 'UP',
    condition: 'BULLISH',
    score: 7.5,
    maxPossibleScore: 10,
    confidence: 78,
    indicators,
    supportResistance: srResult,
    signals: [
      { indicator: 'EMA Ribbon', sentiment: 'BULLISH', score: 2.0, weight: 2.0, description: 'Price is trending above EMA 20 and EMA 50' },
      { indicator: 'MACD', sentiment: 'BULLISH', score: 1.5, weight: 1.5, description: 'MACD line crossed above signal line with positive histogram' },
      { indicator: 'RSI', sentiment: 'BULLISH', score: 1.0, weight: 1.0, description: 'RSI is holding above 50 showing sustained bullish momentum' },
      { indicator: 'ADX', sentiment: 'BULLISH', score: 1.0, weight: 1.0, description: 'ADX at 28.5 indicates a strong directional trend' },
    ],
    bullishSignals: ['Price above 20 EMA', 'Positive MACD Histogram', 'RSI momentum > 50', 'Expanding volume ratio'],
    bearishSignals: ['Near minor resistance band'],
    riskFactors: ['Watch for pullbacks towards the S1 support level'],
    keySignals: ['Golden Cross alignment active', 'Bullish trend intact'],
    aiMarketView: {
      title: `${symbol} Trend Overview`,
      summary: `${symbol} is showing positive momentum above key short-term exponential moving averages. Key support is identified at ${s1} with primary resistance at ${r1}.`,
      disclaimer: 'Educational algorithmic analysis only. Not investment advice.',
    },
  };

  const multiTf: MultiTimeframeSummary = {
    symbol,
    overallCondition: 'BULLISH',
    overallScore: 82,
    concordanceRate: 83,
    conflictSummary: 'Strong alignment across 1h, 4h, and daily timeframes.',
    timeframes: [
      { timeframe: '5m', condition: 'SIDEWAYS', direction: 'SIDEWAYS', score: 50, confidence: 60, rsi: 51, macdCross: 'NEUTRAL' },
      { timeframe: '15m', condition: 'BULLISH', direction: 'UP', score: 75, confidence: 70, rsi: 55, macdCross: 'BULLISH' },
      { timeframe: '1h', condition: 'BULLISH', direction: 'UP', score: 85, confidence: 80, rsi: 58, macdCross: 'BULLISH' },
      { timeframe: '4h', condition: 'BULLISH', direction: 'UP', score: 80, confidence: 78, rsi: 61, macdCross: 'BULLISH' },
      { timeframe: '1d', condition: 'BULLISH', direction: 'UP', score: 85, confidence: 85, rsi: 64, macdCross: 'BULLISH' },
      { timeframe: '1w', condition: 'BULLISH', direction: 'UP', score: 78, confidence: 75, rsi: 60, macdCross: 'BULLISH' },
    ],
  };

  return { trend, multiTf };
}
