import React, { useEffect, useRef, useState } from 'react';
import { formatPercentage, convertAndFormatPrice } from '../utils/formatters.js';
import { CurrencyRates, DisplayCurrency } from '../types/market.js';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceTickerProps {
  price: number;
  change24hPct: number;
  baseCurrency?: string;
  displayCurrency?: DisplayCurrency;
  rates?: CurrencyRates | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

export const PriceTicker: React.FC<PriceTickerProps> = ({
  price,
  change24hPct,
  baseCurrency = 'USD',
  displayCurrency = 'USD',
  rates,
  size = 'md',
  showBadge = true,
}) => {
  const prevPriceRef = useRef<number>(price);
  const [flash, setFlash] = useState<'flash-up' | 'flash-down' | ''>('');

  useEffect(() => {
    if (prevPriceRef.current !== price) {
      if (price > prevPriceRef.current) {
        setFlash('flash-up');
      } else if (price < prevPriceRef.current) {
        setFlash('flash-down');
      }
      prevPriceRef.current = price;

      const timer = setTimeout(() => setFlash(''), 800);
      return () => clearTimeout(timer);
    }
  }, [price]);

  const isPositive = change24hPct >= 0;

  const fontSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
    xl: 'text-3xl font-extrabold tracking-tight',
  };

  const badgeSizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
    xl: 'text-base px-3 py-1 font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-2 transition-colors rounded px-1 -mx-1 ${flash}`}>
      <span className={`font-mono text-slate-100 ${fontSizes[size]}`}>
        {convertAndFormatPrice(price, baseCurrency, displayCurrency, rates)}
      </span>

      {showBadge && (
        <span
          className={`inline-flex items-center gap-1 rounded font-mono font-medium ${badgeSizes[size]} ${
            isPositive
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
          }`}
        >
          {isPositive ? <TrendingUp size={size === 'xl' ? 16 : 12} /> : <TrendingDown size={size === 'xl' ? 16 : 12} />}
          {formatPercentage(change24hPct)}
        </span>
      )}
    </div>
  );
};
