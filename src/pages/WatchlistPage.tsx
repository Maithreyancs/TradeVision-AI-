import React, { useState } from 'react';
import { MarketQuote, DisplayCurrency, CurrencyRates } from '../types/market.js';
import { PriceTicker } from '../components/PriceTicker.js';
import { Sparkline } from '../components/Sparkline.js';
import { Bookmark, Plus, Trash2, ArrowRight } from 'lucide-react';
import { formatPrice, formatPercentage, formatVolume } from '../utils/formatters.js';

interface WatchlistPageProps {
  watchlistItems: { id: string; symbol: string; quote: MarketQuote }[];
  onRemoveFromWatchlist: (symbol: string) => void;
  onOpenSearch: () => void;
  onSelectAsset: (symbol: string) => void;
  displayCurrency: DisplayCurrency;
  rates?: CurrencyRates | null;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  watchlistItems,
  onRemoveFromWatchlist,
  onOpenSearch,
  onSelectAsset,
  displayCurrency,
  rates,
}) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-dark-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark size={20} className="text-cyan-400" />
            <h1 className="font-black text-xl text-slate-100">My Watchlists</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track and monitor selected cross-market instruments in real-time.
          </p>
        </div>

        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
        >
          <Plus size={15} />
          <span>Add Asset</span>
        </button>
      </div>

      {watchlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistItems.map((item) => {
            const quote = item.quote;
            if (!quote) return null;
            const isPositive = quote.change24hPct >= 0;

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectAsset(item.symbol)}
                className="bg-dark-850 hover:bg-dark-800 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-dark-750 flex items-center justify-center font-bold text-xs text-cyan-400 border border-slate-700/60">
                        {item.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-400">
                          {item.symbol}
                        </span>
                        <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{quote.name}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromWatchlist(item.symbol);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <PriceTicker
                        price={quote.price}
                        change24hPct={quote.change24hPct}
                        baseCurrency={quote.currency}
                        displayCurrency={displayCurrency}
                        rates={rates}
                        size="md"
                      />
                      <div className="text-[11px] text-slate-500 mt-1">
                        Vol: {formatVolume(quote.volume24h)} {quote.currency}
                      </div>
                    </div>

                    <Sparkline
                      data={quote.sparkline}
                      isPositive={isPositive}
                      width={80}
                      height={30}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-dark-750 border border-slate-800">
                    {quote.exchange}
                  </span>
                  <span className="group-hover:text-cyan-400 flex items-center gap-1 font-semibold text-[11px]">
                    Open Chart <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-dark-900 rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <Bookmark size={32} className="mx-auto text-slate-600" />
          <h3 className="font-bold text-base text-slate-200">Your Watchlist is Empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Search for assets across crypto, Indian equities, US tech stocks, gold, or forex to add them to your watchlist.
          </p>
          <button
            onClick={onOpenSearch}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
          >
            Explore Markets
          </button>
        </div>
      )}
    </div>
  );
};
