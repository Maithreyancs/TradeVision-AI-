import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { MarketQuote, AssetClass, DisplayCurrency, CurrencyRates } from '../types/market.js';
import { PriceTicker } from './PriceTicker.js';

interface SearchMarketProps {
  isOpen: boolean;
  onClose: () => void;
  markets: MarketQuote[];
  onSelectAsset: (symbol: string) => void;
  displayCurrency: DisplayCurrency;
  rates?: CurrencyRates | null;
}

const CATEGORIES: { id: AssetClass; label: string }[] = [
  { id: 'all', label: 'All Markets' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'indian_stocks', label: 'Indian Stocks' },
  { id: 'us_stocks', label: 'US Stocks' },
  { id: 'indices', label: 'Indices' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'forex', label: 'Forex' },
];

export const SearchMarket: React.FC<SearchMarketProps> = ({
  isOpen,
  onClose,
  markets,
  onSelectAsset,
  displayCurrency,
  rates,
}) => {
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<AssetClass>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = markets.filter((m) => {
    const matchClass = selectedClass === 'all' || m.assetClass === selectedClass;
    const matchQuery =
      m.symbol.toLowerCase().includes(query.toLowerCase()) ||
      m.name.toLowerCase().includes(query.toLowerCase());
    return matchClass && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[550px]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-dark-850">
          <Search size={18} className="text-cyan-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crypto, Indian stocks, US equities, gold, forex (e.g. BTC, RELIANCE, AAPL)..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-200">
              <X size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-dark-800">
            <X size={18} />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800/80 bg-dark-900 overflow-x-auto scrollbar-none text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedClass(cat.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedClass === cat.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.symbol}
                onClick={() => {
                  onSelectAsset(item.symbol);
                  onClose();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-dark-800/90 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dark-800 group-hover:bg-dark-750 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-cyan-400">
                    {item.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-400">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-750 text-slate-400 uppercase">
                        {item.exchange}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-[240px]">{item.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <PriceTicker
                    price={item.price}
                    change24hPct={item.change24hPct}
                    baseCurrency={item.currency}
                    displayCurrency={displayCurrency}
                    rates={rates}
                    size="sm"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching assets found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
