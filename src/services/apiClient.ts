import { MarketsResponse, MarketQuote, Candle, CurrencyRates } from '../types/market.js';
import { TrendAnalysis, IndicatorResults, SupportResistanceResult, MultiTimeframeSummary } from '../types/analysis.js';
import { DrawingItem } from '../charts/drawingTypes.js';
import {
  FALLBACK_MARKETS,
  FALLBACK_CURRENCY_RATES,
  generateFallbackCandles,
  generateFallbackAnalysis,
} from './fallbackData.js';

// Base API: supports custom remote backend (e.g. Render / Railway) or local /api proxy
const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? (import.meta as any).env.VITE_API_URL.replace(/\/$/, '') + '/api'
  : '/api';

// Helper for local storage persistence when backend is offline or static on GitHub Pages
const LOCAL_STORAGE_KEYS = {
  WATCHLIST: 'tv_local_watchlist',
  ALERTS: 'tv_local_alerts',
  PORTFOLIO_CASH: 'tv_local_cash',
  PORTFOLIO_HOLDINGS: 'tv_local_holdings',
  DRAWINGS: 'tv_local_drawings_',
};

export const apiClient = {
  async getMarkets(assetClass?: string, search?: string): Promise<MarketsResponse> {
    try {
      const params = new URLSearchParams();
      if (assetClass && assetClass !== 'all') params.append('class', assetClass);
      if (search) params.append('search', search);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE}/markets?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback for GitHub Pages or offline backend
    }

    // Attempt direct live Binance price update for crypto when running standalone
    let markets = [...FALLBACK_MARKETS];
    try {
      const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
      const binanceRes = await Promise.race([
        fetch('https://api.binance.com/api/v3/ticker/24hr'),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
      ]);
      if (binanceRes && (binanceRes as Response).ok) {
        const binanceData = await (binanceRes as Response).json();
        if (Array.isArray(binanceData)) {
          const bMap = new Map(binanceData.map((b: any) => [b.symbol, b]));
          markets = markets.map((m) => {
            if (cryptoSymbols.includes(m.symbol) && bMap.has(m.symbol)) {
              const b = bMap.get(m.symbol);
              const price = parseFloat(b.lastPrice);
              const change24h = parseFloat(b.priceChange);
              const change24hPct = parseFloat(b.priceChangePercent);
              return {
                ...m,
                price,
                change24h,
                change24hPct,
                high24h: parseFloat(b.highPrice),
                low24h: parseFloat(b.lowPrice),
                volume24h: parseFloat(b.volume),
                lastUpdated: Date.now(),
              };
            }
            return m;
          });
        }
      }
    } catch {}

    // Filter by asset class
    if (assetClass && assetClass !== 'all') {
      markets = markets.filter((m) => m.assetClass === assetClass);
    }
    if (search) {
      const q = search.toLowerCase();
      markets = markets.filter((m) => m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
    }

    const sortedByChange = [...markets].sort((a, b) => b.change24hPct - a.change24hPct);
    const sortedByVolume = [...markets].sort((a, b) => b.volume24h - a.volume24h);

    return {
      markets,
      heroCards: markets.filter((m) => m.isPopular).slice(0, 4),
      topGainers: sortedByChange.filter((m) => m.change24hPct > 0).slice(0, 5),
      topLosers: [...sortedByChange].reverse().filter((m) => m.change24hPct < 0).slice(0, 5),
      mostActive: sortedByVolume.slice(0, 5),
      trending: markets.slice(0, 5),
      total: markets.length,
      timestamp: Date.now(),
    };
  },

  async getMarketBySymbol(symbol: string): Promise<{ quote: MarketQuote; details: any }> {
    try {
      const res = await fetch(`${API_BASE}/markets/${encodeURIComponent(symbol)}`);
      if (res.ok) return await res.json();
    } catch {}

    const found = FALLBACK_MARKETS.find((m) => m.symbol.toUpperCase() === symbol.toUpperCase()) || {
      id: symbol,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: 100.0,
      currency: 'USD',
      change24h: 0,
      change24hPct: 0,
      high24h: 105,
      low24h: 95,
      volume24h: 100000,
      lastUpdated: Date.now(),
      exchange: 'Global',
      assetClass: 'us_stocks' as const,
      isPopular: false,
    };

    return { quote: found, details: {} };
  },

  async getCandles(symbol: string, timeframe: string = '1h', limit: number = 120): Promise<Candle[]> {
    try {
      const res = await fetch(
        `${API_BASE}/markets/${encodeURIComponent(symbol)}/candles?timeframe=${timeframe}&limit=${limit}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.candles && data.candles.length > 0) return data.candles;
      }
    } catch {}

    // If it's a crypto symbol, try fetching live klines directly from Binance Public API
    if (symbol.toUpperCase().endsWith('USDT')) {
      try {
        const tfMap: Record<string, string> = {
          '1m': '1m',
          '5m': '5m',
          '15m': '15m',
          '30m': '30m',
          '1h': '1h',
          '4h': '4h',
          '1d': '1d',
          '1w': '1w',
        };
        const interval = tfMap[timeframe.toLowerCase()] || '1h';
        const bRes = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
        );
        if (bRes.ok) {
          const raw = await bRes.json();
          if (Array.isArray(raw)) {
            return raw.map((k: any) => ({
              time: Math.floor(k[0] / 1000),
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
              volume: parseFloat(k[5]),
            }));
          }
        }
      } catch {}
    }

    return generateFallbackCandles(symbol, limit);
  },

  async getAnalysis(
    symbol: string,
    timeframe: string = '1h'
  ): Promise<{ quote: MarketQuote; trend: TrendAnalysis; multiTf: MultiTimeframeSummary }> {
    try {
      const res = await fetch(`${API_BASE}/markets/${encodeURIComponent(symbol)}/analysis?timeframe=${timeframe}`);
      if (res.ok) return await res.json();
    } catch {}

    const { quote } = await this.getMarketBySymbol(symbol);
    const { trend, multiTf } = generateFallbackAnalysis(symbol, quote.price);
    return { quote, trend, multiTf };
  },

  async getIndicators(symbol: string, timeframe: string = '1h'): Promise<IndicatorResults> {
    try {
      const res = await fetch(`${API_BASE}/markets/${encodeURIComponent(symbol)}/indicators?timeframe=${timeframe}`);
      if (res.ok) {
        const data = await res.json();
        return data.indicators;
      }
    } catch {}

    const { quote } = await this.getMarketBySymbol(symbol);
    return generateFallbackAnalysis(symbol, quote.price).trend.indicators;
  },

  async getSupportResistance(symbol: string, timeframe: string = '1h'): Promise<SupportResistanceResult> {
    try {
      const res = await fetch(
        `${API_BASE}/markets/${encodeURIComponent(symbol)}/support-resistance?timeframe=${timeframe}`
      );
      if (res.ok) return await res.json();
    } catch {}

    const { quote } = await this.getMarketBySymbol(symbol);
    return generateFallbackAnalysis(symbol, quote.price).trend.supportResistance;
  },

  async getCurrencyRates(): Promise<CurrencyRates> {
    try {
      const res = await fetch(`${API_BASE}/currencies/rates`);
      if (res.ok) {
        const data = await res.json();
        return data.rates;
      }
    } catch {}

    return FALLBACK_CURRENCY_RATES;
  },

  async getWatchlist(): Promise<{ id: string; name: string; items: { id: string; symbol: string; quote: MarketQuote }[] }> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/watchlist`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) return await res.json();
    } catch {}

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.WATCHLIST);
    let symbols: string[] = saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', '^NSEI', 'AAPL', 'GC=F'];

    const items = await Promise.all(
      symbols.map(async (s) => {
        const { quote } = await this.getMarketBySymbol(s);
        return { id: `wl-${s}`, symbol: s, quote };
      })
    );

    return { id: 'default-watchlist', name: 'Core Watchlist', items };
  },

  async addToWatchlist(symbol: string): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ symbol }),
      });
      if (res.ok) return await res.json();
    } catch {}

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.WATCHLIST);
    const symbols: string[] = saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', '^NSEI', 'AAPL', 'GC=F'];
    if (!symbols.includes(symbol)) {
      symbols.push(symbol);
      localStorage.setItem(LOCAL_STORAGE_KEYS.WATCHLIST, JSON.stringify(symbols));
    }
    return { success: true };
  },

  async removeFromWatchlist(symbol: string): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) return await res.json();
    } catch {}

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.WATCHLIST);
    if (saved) {
      let symbols: string[] = JSON.parse(saved);
      symbols = symbols.filter((s) => s !== symbol);
      localStorage.setItem(LOCAL_STORAGE_KEYS.WATCHLIST, JSON.stringify(symbols));
    }
    return { success: true };
  },

  async getAlerts(): Promise<any[]> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/alerts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        return data.alerts || [];
      }
    } catch {}

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ALERTS);
    return saved ? JSON.parse(saved) : [];
  },

  async createAlert(symbol: string, condition: string, targetValue: number): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ symbol, condition, targetValue }),
      });
      if (res.ok) return await res.json();
    } catch {}

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ALERTS);
    const alerts: any[] = saved ? JSON.parse(saved) : [];
    const newAlert = {
      id: `alert-${Date.now()}`,
      symbol,
      condition,
      targetValue,
      createdAt: new Date().toISOString(),
      isTriggered: false,
    };
    alerts.push(newAlert);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    return newAlert;
  },

  async deleteAlert(id: string): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/alerts/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) return await res.json();
    } catch {}

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ALERTS);
    if (saved) {
      let alerts: any[] = JSON.parse(saved);
      alerts = alerts.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    }
    return { success: true };
  },

  async sendAIChat(symbol: string, message: string, _history: any[] = []): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, message, history: _history }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.reply;
      }
    } catch {}

    const { quote } = await this.getMarketBySymbol(symbol);
    return `TradeVision Assistant Analysis for ${symbol}:
Currently trading at ${quote.price} ${quote.currency} (${quote.change24hPct >= 0 ? '+' : ''}${quote.change24hPct.toFixed(2)}% in 24h).
Technical indicators reflect sustained momentum above short-term support levels with key resistance overhead. Always apply strict stop-losses and risk management.`;
  },

  async getDrawings(symbol: string, timeframe: string): Promise<DrawingItem[]> {
    try {
      const res = await fetch(`${API_BASE}/drawings/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
      if (res.ok) {
        const data = await res.json();
        return (data.drawings || []).map((d: any) => ({
          id: d.id,
          toolType: d.toolType,
          points: d.coordinates || [],
          color: d.styles?.color || '#06B6D4',
          lineWidth: d.styles?.lineWidth || 2,
          isCompleted: true,
        }));
      }
    } catch {}

    const key = `${LOCAL_STORAGE_KEYS.DRAWINGS}${symbol}_${timeframe}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },

  async saveDrawing(symbol: string, timeframe: string, drawing: DrawingItem): Promise<any> {
    try {
      await fetch(`${API_BASE}/drawings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          toolType: drawing.toolType,
          coordinates: drawing.points,
          styles: { color: drawing.color, lineWidth: drawing.lineWidth },
        }),
      });
    } catch {}

    const key = `${LOCAL_STORAGE_KEYS.DRAWINGS}${symbol}_${timeframe}`;
    const saved = localStorage.getItem(key);
    const drawings: DrawingItem[] = saved ? JSON.parse(saved) : [];
    const idx = drawings.findIndex((d) => d.id === drawing.id);
    if (idx >= 0) drawings[idx] = drawing;
    else drawings.push(drawing);
    localStorage.setItem(key, JSON.stringify(drawings));
    return { success: true };
  },

  async clearDrawings(symbol: string, timeframe: string): Promise<any> {
    try {
      await fetch(`${API_BASE}/drawings/${encodeURIComponent(symbol)}/clear?timeframe=${timeframe}`, {
        method: 'DELETE',
      });
    } catch {}

    const key = `${LOCAL_STORAGE_KEYS.DRAWINGS}${symbol}_${timeframe}`;
    localStorage.removeItem(key);
    return { success: true };
  },

  async getPortfolio(): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/portfolio`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) return await res.json();
    } catch {}

    // Fallback virtual portfolio stored in localStorage
    const savedCash = localStorage.getItem(LOCAL_STORAGE_KEYS.PORTFOLIO_CASH);
    const cash = savedCash !== null ? parseFloat(savedCash) : 10000.0; // Starts with $10,000 virtual balance

    const savedHoldings = localStorage.getItem(LOCAL_STORAGE_KEYS.PORTFOLIO_HOLDINGS);
    let holdings: any[] = savedHoldings
      ? JSON.parse(savedHoldings)
      : [
          {
            id: 'h-btc',
            symbol: 'BTCUSDT',
            name: 'Bitcoin',
            assetClass: 'crypto',
            quantity: 0.15,
            avgBuyPrice: 88500.0,
            currency: 'USDT',
          },
          {
            id: 'h-nvda',
            symbol: 'NVDA',
            name: 'NVIDIA Corp.',
            assetClass: 'us_stocks',
            quantity: 20,
            avgBuyPrice: 220.0,
            currency: 'USD',
          },
        ];

    let totalHoldingsValue = 0;
    let totalCostBasis = 0;

    const enriched = await Promise.all(
      holdings.map(async (h) => {
        const { quote } = await this.getMarketBySymbol(h.symbol);
        const currentPrice = quote.price || h.avgBuyPrice;
        const currentValue = Number((h.quantity * currentPrice).toFixed(2));
        const costBasis = Number((h.quantity * h.avgBuyPrice).toFixed(2));
        const pnl = Number((currentValue - costBasis).toFixed(2));
        const pnlPct = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

        totalHoldingsValue += currentValue;
        totalCostBasis += costBasis;

        return {
          ...h,
          currentPrice,
          change24hPct: quote.change24hPct,
          currentValue,
          costBasis,
          pnl,
          pnlPct,
          currentValueInUSD: currentValue,
          sparkline: quote.sparkline,
        };
      })
    );

    const totalPortfolioValue = Number((cash + totalHoldingsValue).toFixed(2));
    const totalAllTimePnL = Number((totalHoldingsValue - totalCostBasis).toFixed(2));
    const totalAllTimePnLPct = totalCostBasis > 0 ? Number(((totalAllTimePnL / totalCostBasis) * 100).toFixed(2)) : 0;

    return {
      cashBalance: cash,
      currency: 'USD',
      holdings: enriched,
      totalHoldingsValue,
      totalPortfolioValue,
      totalCostBasis,
      totalAllTimePnL,
      totalAllTimePnLPct,
      todayPnLPct: 1.45,
      allocation: {
        crypto: totalPortfolioValue > 0 ? Number(((totalHoldingsValue * 0.5) / totalPortfolioValue * 100).toFixed(1)) : 0,
        indian_stocks: 0,
        us_stocks: totalPortfolioValue > 0 ? Number(((totalHoldingsValue * 0.5) / totalPortfolioValue * 100).toFixed(1)) : 0,
        commodities: 0,
        forex: 0,
        cash: totalPortfolioValue > 0 ? Number(((cash / totalPortfolioValue) * 100).toFixed(1)) : 100,
      },
      recentTransactions: [],
    };
  },

  async depositPortfolio(amount: number): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/portfolio/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) return await res.json();
    } catch {}

    const savedCash = localStorage.getItem(LOCAL_STORAGE_KEYS.PORTFOLIO_CASH);
    const current = savedCash !== null ? parseFloat(savedCash) : 10000.0;
    const updated = current + amount;
    localStorage.setItem(LOCAL_STORAGE_KEYS.PORTFOLIO_CASH, updated.toString());
    return { success: true, balance: updated };
  },

  async tradePortfolio(symbol: string, type: 'BUY' | 'SELL', quantity: number): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/portfolio/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ symbol, type, quantity }),
      });
      if (res.ok) return await res.json();
    } catch {}

    const { quote } = await this.getMarketBySymbol(symbol);
    const price = quote.price || 100;
    const totalAmount = price * quantity;

    const savedCash = localStorage.getItem(LOCAL_STORAGE_KEYS.PORTFOLIO_CASH);
    let cash = savedCash !== null ? parseFloat(savedCash) : 10000.0;

    const savedHoldings = localStorage.getItem(LOCAL_STORAGE_KEYS.PORTFOLIO_HOLDINGS);
    let holdings: any[] = savedHoldings ? JSON.parse(savedHoldings) : [];

    if (type === 'BUY') {
      if (cash < totalAmount) {
        throw new Error(`Insufficient funds. You have $${cash.toFixed(2)} but order requires $${totalAmount.toFixed(2)}.`);
      }
      cash -= totalAmount;
      const existing = holdings.find((h) => h.symbol === symbol);
      if (existing) {
        const newQty = existing.quantity + quantity;
        existing.avgBuyPrice = (existing.quantity * existing.avgBuyPrice + totalAmount) / newQty;
        existing.quantity = newQty;
      } else {
        holdings.push({
          id: `h-${Date.now()}`,
          symbol,
          name: quote.name,
          assetClass: quote.assetClass,
          quantity,
          avgBuyPrice: price,
          currency: quote.currency || 'USD',
        });
      }
    } else {
      const existing = holdings.find((h) => h.symbol === symbol);
      if (!existing || existing.quantity < quantity) {
        throw new Error(`Insufficient position. You only hold ${existing?.quantity || 0} ${symbol}.`);
      }
      cash += totalAmount;
      existing.quantity -= quantity;
      if (existing.quantity <= 0.000001) {
        holdings = holdings.filter((h) => h.symbol !== symbol);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.PORTFOLIO_CASH, cash.toString());
    localStorage.setItem(LOCAL_STORAGE_KEYS.PORTFOLIO_HOLDINGS, JSON.stringify(holdings));

    return { success: true, message: `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} ${symbol}` };
  },

  async resetPortfolio(): Promise<any> {
    try {
      const token = localStorage.getItem('tv_token');
      const res = await fetch(`${API_BASE}/portfolio/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) return await res.json();
    } catch {}

    localStorage.setItem(LOCAL_STORAGE_KEYS.PORTFOLIO_CASH, '10000.0');
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PORTFOLIO_HOLDINGS);
    return { success: true, message: 'Portfolio reset' };
  },
};
