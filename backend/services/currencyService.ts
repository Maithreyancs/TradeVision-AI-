interface ExchangeRates {
  USD: number;
  INR: number;
  EUR: number;
  GBP: number;
  JPY: number;
}

export class CurrencyService {
  private static rates: ExchangeRates = {
    USD: 1.0,
    INR: 87.2,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 153.5,
  };

  private static lastUpdated: number = 0;
  private static cacheTTL: number = 1000 * 60 * 10; // 10 minutes

  public static async getRates(): Promise<ExchangeRates> {
    if (Date.now() - this.lastUpdated < this.cacheTTL) {
      return this.rates;
    }

    try {
      // Fetch USD exchange rates from open access endpoint
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,EUR,GBP,JPY');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.rates) {
          this.rates = {
            USD: 1.0,
            INR: data.rates.INR || this.rates.INR,
            EUR: data.rates.EUR || this.rates.EUR,
            GBP: data.rates.GBP || this.rates.GBP,
            JPY: data.rates.JPY || this.rates.JPY,
          };
          this.lastUpdated = Date.now();
        }
      }
    } catch (e: any) {
      console.warn('[CurrencyService] Using fallback rates:', e.message);
    }

    return this.rates;
  }

  public static async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const from = fromCurrency.toUpperCase().replace('USDT', 'USD');
    const to = toCurrency.toUpperCase().replace('USDT', 'USD');

    if (from === to) return amount;

    const rates = await this.getRates();
    const fromRate = rates[from as keyof ExchangeRates] || 1.0;
    const toRate = rates[to as keyof ExchangeRates] || 1.0;

    // Convert from -> USD -> to
    const amountInUSD = amount / fromRate;
    return Number((amountInUSD * toRate).toFixed(4));
  }
}
