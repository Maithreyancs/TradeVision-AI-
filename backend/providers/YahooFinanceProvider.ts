import { IMarketDataProvider, MarketQuote, Candle, MarketDetails } from './MarketDataProvider.js';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class YahooFinanceProvider implements IMarketDataProvider {
  public name = 'YahooFinance';
  private quoteCache = new Map<string, CacheEntry<MarketQuote>>();
  private candleCache = new Map<string, CacheEntry<Candle[]>>();
  private subscribers = new Map<string, Set<(quote: MarketQuote) => void>>();
  private pollIntervals = new Map<string, NodeJS.Timeout>();

  public canHandle(symbol: string): boolean {
    const s = symbol.toUpperCase();
    return (
      s.includes('.NS') ||
      s.includes('.BO') ||
      s.startsWith('^') ||
      s.includes('=X') ||
      s.includes('=F') ||
      ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ'].includes(s) ||
      ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'TATAMOTORS'].includes(s)
    );
  }

  public normalizeSymbol(symbol: string): string {
    let s = symbol.trim().toUpperCase();
    // Map common Indian stock shorthand without .NS
    if (['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'TATAMOTORS', 'SBIN', 'ICICIBANK'].includes(s)) {
      return `${s}.NS`;
    }
    // Map NIFTY / BANKNIFTY shorthands
    if (s === 'NIFTY' || s === 'NIFTY50' || s === 'NIFTY 50') return '^NSEI';
    if (s === 'BANKNIFTY' || s === 'BANK NIFTY') return '^NSEBANK';
    if (s === 'SP500' || s === 'S&P 500' || s === 'S&P500') return '^GSPC';
    if (s === 'NASDAQ') return '^IXIC';
    if (s === 'GOLD' || s === 'XAUUSD' || s === 'XAU/USD') return 'GC=F';
    if (s === 'SILVER') return 'SI=F';
    if (s === 'CRUDE' || s === 'OIL' || s === 'WTI') return 'CL=F';
    if (s === 'EURUSD' || s === 'EUR/USD') return 'EURUSD=X';
    if (s === 'GBPUSD' || s === 'GBP/USD') return 'GBPUSD=X';
    if (s === 'USDINR' || s === 'USD/INR') return 'USDINR=X';
    if (s === 'USDJPY' || s === 'USD/JPY') return 'USDJPY=X';
    return s;
  }

  private detectAssetClass(symbol: string): 'crypto' | 'indian_stocks' | 'us_stocks' | 'forex' | 'commodities' | 'indices' {
    if (symbol.includes('.NS') || symbol.includes('.BO')) return 'indian_stocks';
    if (symbol.startsWith('^')) return 'indices';
    if (symbol.endsWith('=X')) return 'forex';
    if (symbol.endsWith('=F')) return 'commodities';
    return 'us_stocks';
  }

  private getFriendlyName(symbol: string): string {
    const names: Record<string, string> = {
      '^NSEI': 'NIFTY 50',
      '^NSEBANK': 'BANK NIFTY',
      '^GSPC': 'S&P 500',
      '^IXIC': 'NASDAQ Composite',
      '^DJI': 'Dow Jones Industrial',
      'RELIANCE.NS': 'Reliance Industries',
      'TCS.NS': 'Tata Consultancy Services',
      'INFY.NS': 'Infosys Ltd',
      'HDFCBANK.NS': 'HDFC Bank Ltd',
      'TATAMOTORS.NS': 'Tata Motors Ltd',
      'AAPL': 'Apple Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corp.',
      'MSFT': 'Microsoft Corp.',
      'AMZN': 'Amazon.com Inc.',
      'GOOGL': 'Alphabet Inc.',
      'META': 'Meta Platforms Inc.',
      'GC=F': 'Gold (XAU/USD)',
      'CL=F': 'Crude Oil (WTI)',
      'SI=F': 'Silver Futures',
      'EURUSD=X': 'EUR / USD',
      'GBPUSD=X': 'GBP / USD',
      'USDINR=X': 'USD / INR',
      'USDJPY=X': 'USD / JPY',
    };
    return names[symbol] || symbol;
  }

  public async getQuote(rawSymbol: string): Promise<MarketQuote | null> {
    const symbol = this.normalizeSymbol(rawSymbol);
    const cached = this.quoteCache.get(symbol);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Yahoo Finance chart error: ${res.statusText}`);
      }

      const json = (await res.json()) as any;
      const result = json.chart?.result?.[0];
      if (!result || !result.meta) {
        return null;
      }

      const meta = result.meta;
      const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
      const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
      const change24h = price - prevClose;
      const change24hPct = prevClose !== 0 ? (change24h / prevClose) * 100 : 0;
      const high24h = meta.regularMarketDayHigh ?? price;
      const low24h = meta.regularMarketDayLow ?? price;
      const volume24h = meta.regularMarketVolume ?? 0;

      // Extract small sparkline from recent closes if available
      let sparkline: number[] | undefined;
      const quotes = result.indicators?.quote?.[0];
      if (quotes && quotes.close) {
        sparkline = quotes.close.filter((c: any) => typeof c === 'number' && !isNaN(c)).slice(-10);
      }

      const quote: MarketQuote = {
        symbol: symbol,
        name: this.getFriendlyName(symbol),
        price,
        currency: meta.currency || 'USD',
        change24h,
        change24hPct,
        high24h,
        low24h,
        volume24h,
        lastUpdated: (meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()),
        exchange: meta.exchangeName || 'Global',
        assetClass: this.detectAssetClass(symbol),
        sparkline,
      };

      this.quoteCache.set(symbol, { data: quote, expiry: Date.now() + 3000 });
      return quote;
    } catch (err: any) {
      console.warn(`[YahooFinanceProvider] Quote error for ${symbol}:`, err.message);
      return null;
    }
  }

  public async getHistoricalCandles(rawSymbol: string, timeframe: string = '1d', limit: number = 100): Promise<Candle[]> {
    const symbol = this.normalizeSymbol(rawSymbol);
    const cacheKey = `${symbol}:${timeframe}:${limit}`;
    const cached = this.candleCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    // Determine interval and range for Yahoo Finance
    let interval = '1d';
    let range = '3mo';

    switch (timeframe) {
      case '1m':
        interval = '1m';
        range = '1d';
        break;
      case '5m':
        interval = '5m';
        range = '5d';
        break;
      case '15m':
        interval = '15m';
        range = '5d';
        break;
      case '30m':
        interval = '30m';
        range = '1mo';
        break;
      case '1h':
      case '1H':
        interval = '60m';
        range = '1mo';
        break;
      case '4h':
      case '4H':
        interval = '60m';
        range = '3mo';
        break;
      case '1d':
      case '1D':
        interval = '1d';
        range = '1y';
        break;
      case '1w':
      case '1W':
        interval = '1wk';
        range = '2y';
        break;
      case '1M':
        interval = '1mo';
        range = '5y';
        break;
      default:
        interval = '1d';
        range = '6mo';
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Yahoo Finance klines error: ${res.statusText}`);
      }

      const json = (await res.json()) as any;
      const result = json.chart?.result?.[0];
      if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
        return [];
      }

      const timestamps: number[] = result.timestamp;
      const quote = result.indicators.quote[0];
      const opens: number[] = quote.open || [];
      const highs: number[] = quote.high || [];
      const lows: number[] = quote.low || [];
      const closes: number[] = quote.close || [];
      const volumes: number[] = quote.volume || [];

      const rawCandles: Candle[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const o = opens[i];
        const h = highs[i];
        const l = lows[i];
        const c = closes[i];
        const v = volumes[i] ?? 0;

        // Skip missing or invalid points
        if (
          o === null || o === undefined || isNaN(o) ||
          h === null || h === undefined || isNaN(h) ||
          l === null || l === undefined || isNaN(l) ||
          c === null || c === undefined || isNaN(c)
        ) {
          continue;
        }

        rawCandles.push({
          time: timestamps[i],
          open: Number(o.toFixed(4)),
          high: Number(h.toFixed(4)),
          low: Number(l.toFixed(4)),
          close: Number(c.toFixed(4)),
          volume: Number(v.toFixed(2)),
        });
      }

      // Sort and take requested limit
      rawCandles.sort((a, b) => a.time - b.time);
      const candles = limit > 0 ? rawCandles.slice(-limit) : rawCandles;

      this.candleCache.set(cacheKey, { data: candles, expiry: Date.now() + 15000 });
      return candles;
    } catch (err: any) {
      console.warn(`[YahooFinanceProvider] Candles error for ${symbol}:`, err.message);
      return [];
    }
  }

  public async getMarketDetails(rawSymbol: string): Promise<MarketDetails | null> {
    const symbol = this.normalizeSymbol(rawSymbol);
    const quote = await this.getQuote(symbol);
    if (!quote) return null;

    return {
      symbol: quote.symbol,
      name: quote.name,
      currency: quote.currency,
      exchange: quote.exchange,
      marketCap: quote.marketCap,
      fiftyTwoWeekHigh: quote.high24h,
      fiftyTwoWeekLow: quote.low24h,
    };
  }

  public subscribeTicker(rawSymbol: string, callback: (quote: MarketQuote) => void): () => void {
    const symbol = this.normalizeSymbol(rawSymbol);
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    // Start polling if not already started
    if (!this.pollIntervals.has(symbol)) {
      // Immediate initial quote fetch
      this.getQuote(symbol).then((q) => {
        if (q && this.subscribers.has(symbol)) {
          this.subscribers.get(symbol)!.forEach((cb) => cb(q));
        }
      });

      const interval = setInterval(async () => {
        const q = await this.getQuote(symbol);
        if (q && this.subscribers.has(symbol)) {
          this.subscribers.get(symbol)!.forEach((cb) => cb(q));
        }
      }, 4000);

      this.pollIntervals.set(symbol, interval);
    }

    return () => {
      this.unsubscribeTicker(symbol);
    };
  }

  public unsubscribeTicker(rawSymbol: string): void {
    const symbol = this.normalizeSymbol(rawSymbol);
    const set = this.subscribers.get(symbol);
    if (set) {
      this.subscribers.delete(symbol);
    }
    const interval = this.pollIntervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(symbol);
    }
  }
}
