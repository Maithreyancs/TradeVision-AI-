import { CurrencyRates, DisplayCurrency } from '../types/market.js';

export function formatPrice(price: number | null | undefined, currency: string = 'USD'): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Data unavailable';
  }

  const symbolMap: Record<string, string> = {
    USD: '$',
    USDT: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };

  const symbol = symbolMap[currency.toUpperCase()] || `${currency} `;

  let decimals = 2;
  if (price < 0.001) decimals = 6;
  else if (price < 1) decimals = 4;
  else if (price >= 1000) decimals = 2;

  // For INR, use Indian Numbering format if available
  if (currency.toUpperCase() === 'INR') {
    return `${symbol}${price.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${symbol}${price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function convertAndFormatPrice(
  price: number | null | undefined,
  baseCurrency: string,
  targetCurrency: DisplayCurrency,
  rates?: CurrencyRates | null
): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Data unavailable';
  }

  if (!rates || baseCurrency.toUpperCase().replace('USDT', 'USD') === targetCurrency) {
    return formatPrice(price, baseCurrency);
  }

  const from = baseCurrency.toUpperCase().replace('USDT', 'USD') as keyof CurrencyRates;
  const to = targetCurrency as keyof CurrencyRates;

  const fromRate = rates[from] || 1.0;
  const toRate = rates[to] || 1.0;

  const priceInUSD = price / fromRate;
  const converted = priceInUSD * toRate;

  return formatPrice(converted, targetCurrency);
}

export function formatPercentage(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || isNaN(pct)) {
    return '0.00%';
  }
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatVolume(vol: number | null | undefined): string {
  if (vol === null || vol === undefined || isNaN(vol)) {
    return '0';
  }
  if (vol >= 1_000_000_000) {
    return `${(vol / 1_000_000_000).toFixed(2)}B`;
  }
  if (vol >= 1_000_000) {
    return `${(vol / 1_000_000).toFixed(2)}M`;
  }
  if (vol >= 1_000) {
    return `${(vol / 1_000).toFixed(2)}K`;
  }
  return vol.toFixed(0);
}

export function formatTime(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return 'Just now';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return 'Just now';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
