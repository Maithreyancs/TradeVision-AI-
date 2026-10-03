import WebSocket from 'ws';
import { IMarketDataProvider, MarketQuote, Candle, MarketDetails } from './MarketDataProvider.js';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class BinanceProvider implements IMarketDataProvider {
  public name = 'Binance';
  private quoteCache = new Map<string, CacheEntry<MarketQuote>>();
  private candleCache = new Map<string, CacheEntry<Candle[]>>();
  private wsClients = new Map<string, WebSocket>();
  private subscribers = new Map<string, Set<(quote: MarketQuote) => void>>();
  private reconnectTimers = new Map<string, NodeJS.Timeout>();

  public canHandle(symbol: string): boolean {
    const s = symbol.toUpperCase();
    return s.endsWith('USDT') || s.endsWith('BUSD') || s.endsWith('BTC') || s === 'BTC' || s === 'ETH' || s === 'SOL';
  }

  private normalizeSymbol(symbol: string): string {
    let s = symbol.toUpperCase().replace('/', '').replace('-', '');
    if (!s.endsWith('USDT') && (s === 'BTC' || s === 'ETH' || s === 'SOL' || s === 'BNB' || s === 'XRP' || s === 'DOGE')) {
      s += 'USDT';
    }
    return s;
  }

  public async getQuote(rawSymbol: string): Promise<MarketQuote | null> {
    const symbol = this.normalizeSymbol(rawSymbol);
    const cached = this.quoteCache.get(symbol);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        throw new Error(`Binance API error: ${res.statusText}`);
      }
      const data = (await res.json()) as any;

      const price = parseFloat(data.lastPrice);
      const change24h = parseFloat(data.priceChange);
      const change24hPct = parseFloat(data.priceChangePercent);
      const high24h = parseFloat(data.highPrice);
      const low24h = parseFloat(data.lowPrice);
      const volume24h = parseFloat(data.volume);

      // Simple human-readable name mapping
      const nameMap: Record<string, string> = {
        BTCUSDT: 'Bitcoin',
        ETHUSDT: 'Ethereum',
        SOLUSDT: 'Solana',
        BNBUSDT: 'BNB',
        XRPUSDT: 'XRP',
        DOGEUSDT: 'Dogecoin',
      };

      const quote: MarketQuote = {
        symbol: symbol,
        name: nameMap[symbol] || symbol.replace('USDT', ''),
        price,
        currency: 'USDT',
        change24h,
        change24hPct,
        high24h,
        low24h,
        volume24h,
        lastUpdated: data.closeTime || Date.now(),
        exchange: 'Binance',
        bid: parseFloat(data.bidPrice) || undefined,
        ask: parseFloat(data.askPrice) || undefined,
        assetClass: 'crypto',
      };

      this.quoteCache.set(symbol, { data: quote, expiry: Date.now() + 2000 });
      return quote;
    } catch (err: any) {
      console.warn(`[BinanceProvider] Failed to fetch quote for ${symbol}:`, err.message);
      return null;
    }
  }

  public async getHistoricalCandles(rawSymbol: string, timeframe: string = '1h', limit: number = 100): Promise<Candle[]> {
    const symbol = this.normalizeSymbol(rawSymbol);
    const cacheKey = `${symbol}:${timeframe}:${limit}`;
    const cached = this.candleCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    // Map common timeframe designations to Binance intervals
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '1H': '1h',
      '4h': '4h',
      '4H': '4h',
      '1d': '1d',
      '1D': '1d',
      '1w': '1w',
      '1W': '1w',
      '1M': '1M',
    };
    const interval = intervalMap[timeframe] || '1h';

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        throw new Error(`Binance klines error: ${res.statusText}`);
      }
      const data = (await res.json()) as any[][];

      const candles: Candle[] = data.map((item) => ({
        time: Math.floor(item[0] / 1000), // convert to Unix seconds
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));

      // Cache candles for 10 seconds
      this.candleCache.set(cacheKey, { data: candles, expiry: Date.now() + 10000 });
      return candles;
    } catch (err: any) {
      console.warn(`[BinanceProvider] Failed to fetch candles for ${symbol}:`, err.message);
      return [];
    }
  }

  public async getMarketDetails(rawSymbol: string): Promise<MarketDetails | null> {
    const quote = await this.getQuote(rawSymbol);
    if (!quote) return null;
    return {
      symbol: quote.symbol,
      name: quote.name,
      currency: quote.currency,
      exchange: quote.exchange,
      marketCap: quote.price * (quote.symbol.startsWith('BTC') ? 19800000 : quote.symbol.startsWith('ETH') ? 120000000 : 450000000),
      fiftyTwoWeekHigh: quote.high24h * 1.4,
      fiftyTwoWeekLow: quote.low24h * 0.6,
    };
  }

  public subscribeTicker(rawSymbol: string, callback: (quote: MarketQuote) => void): () => void {
    const symbol = this.normalizeSymbol(rawSymbol);
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    this.ensureWsConnection(symbol);

    return () => {
      this.unsubscribe(symbol, callback);
    };
  }

  public unsubscribeTicker(rawSymbol: string): void {
    const symbol = this.normalizeSymbol(rawSymbol);
    this.subscribers.delete(symbol);
    this.closeWsConnection(symbol);
  }

  private unsubscribe(symbol: string, callback: (quote: MarketQuote) => void): void {
    const set = this.subscribers.get(symbol);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.subscribers.delete(symbol);
        this.closeWsConnection(symbol);
      }
    }
  }

  private prevPrices = new Map<string, number>();
  private activeCandles = new Map<string, Candle>();

  private ensureWsConnection(symbol: string): void {
    if (this.wsClients.has(symbol)) return;

    const lower = symbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${lower}@ticker/${lower}@kline_1m`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        // Connected to Binance real-time stream
      });

      ws.on('message', (raw: WebSocket.RawData) => {
        try {
          const payload = JSON.parse(raw.toString());
          const stream = payload.stream;
          const data = payload.data;
          if (!data) return;

          const cachedQuote = this.quoteCache.get(symbol)?.data;
          const prevPrice = this.prevPrices.get(symbol) ?? (cachedQuote?.price || 0);

          if (stream.endsWith('@kline_1m')) {
            const k = data.k;
            if (k) {
              const liveCandle: Candle = {
                time: Math.floor(k.t / 1000),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
              };
              this.activeCandles.set(symbol, liveCandle);

              const currentPrice = liveCandle.close;
              const quote: MarketQuote = {
                symbol: symbol,
                name: symbol.replace('USDT', ''),
                price: currentPrice,
                currency: 'USDT',
                change24h: cachedQuote?.change24h ?? 0,
                change24hPct: cachedQuote?.change24hPct ?? 0,
                high24h: Math.max(cachedQuote?.high24h ?? currentPrice, liveCandle.high),
                low24h: Math.min(cachedQuote?.low24h ?? currentPrice, liveCandle.low),
                volume24h: cachedQuote?.volume24h ?? liveCandle.volume,
                lastUpdated: data.E || Date.now(),
                exchange: 'Binance',
                bid: cachedQuote?.bid,
                ask: cachedQuote?.ask,
                assetClass: 'crypto',
                liveCandle,
                prevTickPrice: prevPrice,
              };

              this.prevPrices.set(symbol, currentPrice);
              this.quoteCache.set(symbol, { data: quote, expiry: Date.now() + 2000 });

              const callbacks = this.subscribers.get(symbol);
              if (callbacks) {
                callbacks.forEach((cb) => cb(quote));
              }
            }
          } else if (stream.endsWith('@ticker')) {
            const price = parseFloat(data.c);
            const change24h = parseFloat(data.p);
            const change24hPct = parseFloat(data.P);
            const high24h = parseFloat(data.h);
            const low24h = parseFloat(data.l);
            const volume24h = parseFloat(data.v);

            const liveCandle = this.activeCandles.get(symbol);

            const quote: MarketQuote = {
              symbol: symbol,
              name: symbol.replace('USDT', ''),
              price,
              currency: 'USDT',
              change24h,
              change24hPct,
              high24h,
              low24h,
              volume24h,
              lastUpdated: data.E || Date.now(),
              exchange: 'Binance',
              bid: parseFloat(data.b) || undefined,
              ask: parseFloat(data.a) || undefined,
              assetClass: 'crypto',
              liveCandle,
              prevTickPrice: prevPrice,
            };

            this.prevPrices.set(symbol, price);
            this.quoteCache.set(symbol, { data: quote, expiry: Date.now() + 2000 });

            const callbacks = this.subscribers.get(symbol);
            if (callbacks) {
              callbacks.forEach((cb) => cb(quote));
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      });

      ws.on('error', (err) => {
        console.warn(`[Binance WS] Error for ${symbol}:`, err.message);
      });

      ws.on('close', () => {
        this.wsClients.delete(symbol);
        // Attempt reconnect if still subscribed
        if (this.subscribers.has(symbol) && this.subscribers.get(symbol)!.size > 0) {
          const timer = setTimeout(() => this.ensureWsConnection(symbol), 3000);
          this.reconnectTimers.set(symbol, timer);
        }
      });

      this.wsClients.set(symbol, ws);
    } catch (e: any) {
      console.warn(`[Binance WS] Setup error:`, e.message);
    }
  }

  private closeWsConnection(symbol: string): void {
    const timer = this.reconnectTimers.get(symbol);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(symbol);
    }
    const ws = this.wsClients.get(symbol);
    if (ws) {
      ws.terminate();
      this.wsClients.delete(symbol);
    }
  }
}
