import React from 'react';
import { MarketQuote, CurrencyRates, DisplayCurrency } from '../types/market.js';
import { PriceTicker } from './PriceTicker.js';
import { Sparkline } from './Sparkline.js';
import { formatTime, formatVolume } from '../utils/formatters.js';
import { Radio } from 'lucide-react';

interface MarketCardProps {
  quote: MarketQuote;
  rates?: CurrencyRates | null;
  displayCurrency?: DisplayCurrency;
  onClick?: () => void;
  featured?: boolean;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  quote,
  rates,
  displayCurrency = 'USD',
  onClick,
  featured = false,
}) => {
  const isPositive = quote.change24hPct >= 0;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer overflow-hidden ${
        featured
          ? 'glass-card border border-slate-700/60 hover:border-cyan-500/50 hover:shadow-card-dark'
          : 'bg-dark-850/80 hover:bg-dark-800 border border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Subtle background glow on hover */}
      <div
        className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-25 pointer-events-none ${
          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />

      {/* Header: Symbol & Market Tag */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-dark-750 flex items-center justify-center font-bold text-xs text-cyan-400 border border-slate-700/50">
            {quote.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-400 transition-colors">
                {quote.symbol}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono px-1.5 py-0.2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[120px]">{quote.name}</p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-slate-400 px-2 py-0.5 rounded bg-dark-750 border border-slate-800 uppercase">
          {quote.exchange}
        </span>
      </div>

      {/* Price & Sparkline Row */}
      <div className="flex items-end justify-between mt-3">
        <div>
          <PriceTicker
            price={quote.price}
            change24hPct={quote.change24hPct}
            baseCurrency={quote.currency}
            displayCurrency={displayCurrency}
            rates={rates}
            size={featured ? 'lg' : 'md'}
          />
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span>Vol: {formatVolume(quote.volume24h)}</span>
            <span>•</span>
            <span>{formatTime(quote.lastUpdated)}</span>
          </div>
        </div>

        <div className="shrink-0">
          <Sparkline
            data={quote.sparkline}
            isPositive={isPositive}
            width={featured ? 95 : 80}
            height={featured ? 36 : 30}
          />
        </div>
      </div>
    </div>
  );
};
