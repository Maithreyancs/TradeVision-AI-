import React, { useState } from 'react';
import { MarketQuote, AssetClass, DisplayCurrency, CurrencyRates } from '../types/market.js';
import { PriceTicker } from '../components/PriceTicker.js';
import { Sparkline } from '../components/Sparkline.js';
import { formatPrice, formatPercentage, formatVolume } from '../utils/formatters.js';
import { SlidersHorizontal, Search, ArrowUpDown, Filter, TrendingUp, TrendingDown } from 'lucide-react';

interface ScreenerPageProps {
  markets: MarketQuote[];
  onSelectAsset: (symbol: string) => void;
  displayCurrency: DisplayCurrency;
  rates?: CurrencyRates | null;
}

export const ScreenerPage: React.FC<ScreenerPageProps> = ({
  markets,
  onSelectAsset,
  displayCurrency,
  rates,
}) => {
  const [selectedClass, setSelectedClass] = useState<AssetClass>('all');
  const [changeFilter, setChangeFilter] = useState<'all' | 'gainers' | 'losers' | 'big_gainers' | 'big_losers'>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change'>('change');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const filtered = markets
    .filter((m) => {
      if (selectedClass !== 'all' && m.assetClass !== selectedClass) return false;
      if (search && !m.symbol.toLowerCase().includes(search.toLowerCase()) && !m.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (changeFilter === 'gainers' && m.change24hPct <= 0) return false;
      if (changeFilter === 'losers' && m.change24hPct >= 0) return false;
      if (changeFilter === 'big_gainers' && m.change24hPct < 3.0) return false;
      if (changeFilter === 'big_losers' && m.change24hPct > -3.0) return false;
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'price') diff = a.price - b.price;
      else if (sortBy === 'change') diff = a.change24hPct - b.change24hPct;
      else if (sortBy === 'volume') diff = a.volume24h - b.volume24h;
      return sortOrder === 'desc' ? -diff : diff;
    });

  const toggleSort = (field: 'volume' | 'price' | 'change') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-dark-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-cyan-400" />
            <h1 className="font-black text-xl text-slate-100">Market Screener</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scan and filter cross-market assets by momentum, price movement, volume, and performance.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or name..."
            className="w-full bg-dark-850 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-dark-850 rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter size={13} /> Asset Class:
          </span>
          {(['all', 'crypto', 'indian_stocks', 'us_stocks', 'indices', 'commodities', 'forex'] as AssetClass[]).map((ac) => (
            <button
              key={ac}
              onClick={() => setSelectedClass(ac)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedClass === ac
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`}
            >
              {ac === 'all' ? 'All' : ac.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-2">Momentum:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'gainers', label: 'Gainers (>0%)' },
            { id: 'losers', label: 'Losers (<0%)' },
            { id: 'big_gainers', label: 'Strong Uptrend (>+3%)' },
            { id: 'big_losers', label: 'Strong Downtrend (<-3%)' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setChangeFilter(btn.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                changeFilter === btn.id
                  ? 'bg-dark-750 text-cyan-400 border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-dark-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-850/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset</th>
                <th
                  onClick={() => toggleSort('price')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Price</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('change')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('volume')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200 hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>24h Volume</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4 hidden lg:table-cell">24h High / Low</th>
                <th className="py-3 px-4 hidden lg:table-cell">Sparkline</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => {
                const isPositive = item.change24hPct >= 0;
                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectAsset(item.symbol)}
                    className="hover:bg-dark-800/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-dark-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-cyan-400">
                          {item.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-400">
                            {item.symbol}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <PriceTicker
                        price={item.price}
                        change24hPct={item.change24hPct}
                        baseCurrency={item.currency}
                        displayCurrency={displayCurrency}
                        rates={rates}
                        size="sm"
                        showBadge={false}
                      />
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        }`}
                      >
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {formatPercentage(item.change24hPct)}
                      </span>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell font-mono text-slate-300">
                      {formatVolume(item.volume24h)} {item.currency}
                    </td>

                    <td className="py-3 px-4 hidden lg:table-cell font-mono text-[11px] text-slate-300">
                      <div>H: {formatPrice(item.high24h, item.currency)}</div>
                      <div className="text-slate-500">L: {formatPrice(item.low24h, item.currency)}</div>
                    </td>

                    <td className="py-3 px-4 hidden lg:table-cell">
                      <Sparkline data={item.sparkline} isPositive={isPositive} width={80} height={26} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAsset(item.symbol);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-dark-750 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/60 text-xs font-semibold"
                      >
                        View Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
