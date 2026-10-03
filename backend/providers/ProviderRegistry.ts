import { IMarketDataProvider, MarketQuote, Candle, MarketDetails } from './MarketDataProvider.js';
import { BinanceProvider } from './BinanceProvider.js';
import { YahooFinanceProvider } from './YahooFinanceProvider.js';

export class ProviderRegistry {
  private providers: IMarketDataProvider[] = [];
  private binanceProvider: BinanceProvider;
  private yahooProvider: YahooFinanceProvider;

  constructor() {
    this.binanceProvider = new BinanceProvider();
    this.yahooProvider = new YahooFinanceProvider();

    // Register in preferred order
    this.providers = [this.binanceProvider, this.yahooProvider];
  }

  public getProviderFor(symbol: string): IMarketDataProvider {
    for (const provider of this.providers) {
      if (provider.canHandle(symbol)) {
        return provider;
      }
    }
    // Default to Yahoo Finance which handles wide variety of equities/currencies
    return this.yahooProvider;
  }

  public async getQuote(symbol: string): Promise<MarketQuote | null> {
    const provider = this.getProviderFor(symbol);
    const quote = await provider.getQuote(symbol);
    if (quote) return quote;

    // Fallback try other provider
    for (const p of this.providers) {
      if (p !== provider) {
        const fallback = await p.getQuote(symbol);
        if (fallback) return fallback;
      }
    }
    return null;
  }

  public async getHistoricalCandles(symbol: string, timeframe: string, limit?: number): Promise<Candle[]> {
    const provider = this.getProviderFor(symbol);
    const candles = await provider.getHistoricalCandles(symbol, timeframe, limit);
    if (candles && candles.length > 0) return candles;

    for (const p of this.providers) {
      if (p !== provider) {
        const fallbackCandles = await p.getHistoricalCandles(symbol, timeframe, limit);
        if (fallbackCandles && fallbackCandles.length > 0) return fallbackCandles;
      }
    }
    return [];
  }

  public async getMarketDetails(symbol: string): Promise<MarketDetails | null> {
    const provider = this.getProviderFor(symbol);
    return provider.getMarketDetails(symbol);
  }

  public subscribeTicker(symbol: string, callback: (quote: MarketQuote) => void): () => void {
    const provider = this.getProviderFor(symbol);
    return provider.subscribeTicker(symbol, callback);
  }

  public unsubscribeTicker(symbol: string): void {
    const provider = this.getProviderFor(symbol);
    provider.unsubscribeTicker(symbol);
  }
}

export const providerRegistry = new ProviderRegistry();
export default providerRegistry;
