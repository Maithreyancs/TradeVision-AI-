import React, { useState } from 'react';
import {
  MarketQuote,
  MarketsResponse,
  AssetClass,
  DisplayCurrency,
  CurrencyRates,
} from '../types/market.js';
import { MarketCard } from '../components/MarketCard.js';
import { PriceTicker } from '../components/PriceTicker.js';
import { Sparkline } from '../components/Sparkline.js';
import { formatPrice, formatPercentage, formatVolume, formatTime } from '../utils/formatters.js';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Bot,
  Sparkles,
  Shield,
  Layers,
  Flame,
  Globe,
  RefreshCw,
  ExternalLink,
  Wallet,
} from 'lucide-react';

interface HomePageProps {
  marketsData: MarketsResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectAsset: (symbol: string) => void;
  onNavigatePortfolio?: () => void;
  displayCurrency: DisplayCurrency;
  rates?: CurrencyRates | null;
  onOpenAIChat: (symbol: string) => void;
}

const CATEGORIES: { id: AssetClass; label: string }[] = [
  { id: 'all', label: 'All Assets' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'indian_stocks', label: 'Indian Stocks' },
  { id: 'us_stocks', label: 'US Equities' },
  { id: 'indices', label: 'Indices' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'forex', label: 'Forex' },
];

export const HomePage: React.FC<HomePageProps> = ({
  marketsData,
  loading,
  onRefresh,
  onSelectAsset,
  onNavigatePortfolio,
  displayCurrency,
  rates,
  onOpenAIChat,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'gainers' | 'losers' | 'active' | 'trending'>('all');
  const [selectedClass, setSelectedClass] = useState<AssetClass>('all');

  const heroMarkets = marketsData?.heroCards || [];
  const allMarkets = marketsData?.markets || [];

  // Filter and sort for the main table
  let displayList: MarketQuote[] = [];
  if (activeTab === 'gainers') {
    displayList = marketsData?.topGainers || [];
  } else if (activeTab === 'losers') {
    displayList = marketsData?.topLosers || [];
  } else if (activeTab === 'active') {
    displayList = marketsData?.mostActive || [];
  } else if (activeTab === 'trending') {
    displayList = marketsData?.trending || [];
  } else {
    displayList = allMarkets.filter((m) => selectedClass === 'all' || m.assetClass === selectedClass);
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Welcome & Global Ticker Bar */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-slate-800/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Institutional Grade Live Feed
              </span>
              <span className="text-xs text-slate-500">• 100% Real Market Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              TradeVision <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span> Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time multi-asset market analytics, algorithmic support & resistance detection, and transparent technical AI signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 border border-slate-700/80 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Quotes'}</span>
            </button>

            {onNavigatePortfolio && (
              <button
                onClick={onNavigatePortfolio}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
              >
                <Wallet size={14} />
                <span>My Portfolio</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: HERO MARKET AREA - "Markets at a glance" */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-amber-400" />
            <h2 className="font-bold text-base text-slate-100">Markets at a Glance</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {marketsData?.timestamp ? `Synced at ${formatTime(marketsData.timestamp)}` : 'Streaming'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {heroMarkets.map((quote) => (
            <MarketCard
              key={quote.symbol}
              quote={quote}
              featured={true}
              rates={rates}
              displayCurrency={displayCurrency}
              onClick={() => onSelectAsset(quote.symbol)}
            />
          ))}
        </div>
      </section>

      {/* AI Market Insight Spotlight Card */}
      <section className="glass-card rounded-2xl p-5 border border-cyan-500/30 shadow-card-dark relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan shrink-0">
              <Bot size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-100">TradeVision AI Pulse</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  REAL-TIME INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Algorithmic models are actively evaluating momentum, EMA ribbon expansion, order absorption at pivot zones, and multi-timeframe concordance across all tracked assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onOpenAIChat('BTCUSDT')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
            >
              <Sparkles size={14} />
              <span>Ask AI About Markets</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: LIVE MARKET OVERVIEW (Trending, Top Gainers, Top Losers, Most Active, All) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              All Assets ({allMarkets.length})
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'trending'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              <Flame size={13} className="text-amber-400" />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setActiveTab('gainers')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'gainers'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              <TrendingUp size={13} className="text-emerald-400" />
              <span>Top Gainers</span>
            </button>
            <button
              onClick={() => setActiveTab('losers')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'losers'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              <TrendingDown size={13} className="text-rose-400" />
              <span>Top Losers</span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'active'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
              }`}
            >
              <Activity size={13} className="text-blue-400" />
              <span>Most Active</span>
            </button>
          </div>

          {/* Category Filter for 'All' tab */}
          {activeTab === 'all' && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto text-xs">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    selectedClass === c.id
                      ? 'bg-dark-750 text-cyan-400 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Market Table */}
        <div className="bg-dark-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-850/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Asset</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">24h Change</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">24h High / Low</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">24h Volume</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Trend Sparkline</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayList.map((item) => {
                  const isPositive = item.change24hPct >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => onSelectAsset(item.symbol)}
                      className="hover:bg-dark-800/70 transition-colors cursor-pointer group"
                    >
                      {/* Asset & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-dark-800 border border-slate-700/60 group-hover:border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-400">
                            {item.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-400 transition-colors">
                                {item.symbol}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-750 text-slate-400 uppercase font-mono">
                                {item.exchange}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px] sm:max-w-[200px]">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
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

                      {/* 24h Change */}
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

                      {/* 24h High / Low */}
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="text-[11px] font-mono text-slate-300">
                          <div>H: {formatPrice(item.high24h, item.currency)}</div>
                          <div className="text-slate-500">L: {formatPrice(item.low24h, item.currency)}</div>
                        </div>
                      </td>

                      {/* 24h Volume */}
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="font-mono text-slate-300 text-xs">
                          {formatVolume(item.volume24h)} {item.currency}
                        </span>
                      </td>

                      {/* Mini Sparkline */}
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <Sparkline data={item.sparkline} isPositive={isPositive} width={85} height={28} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(item.symbol);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-dark-750 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/60 text-xs font-semibold transition-colors"
                        >
                          Trade / Chart
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Market Heatmap Visual Overview */}
      <section className="bg-dark-900 rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-cyan-400" />
            <h2 className="font-bold text-base text-slate-100">Market Performance Heatmap</h2>
          </div>
          <span className="text-xs text-slate-400">Relative 24h strength</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          {allMarkets.slice(0, 12).map((item) => {
            const isPos = item.change24hPct >= 0;
            const absChange = Math.min(6, Math.abs(item.change24hPct));
            const opacity = 0.2 + (absChange / 6) * 0.7;

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectAsset(item.symbol)}
                style={{
                  backgroundColor: isPos ? `rgba(16, 185, 129, ${opacity})` : `rgba(244, 63, 94, ${opacity})`,
                }}
                className="p-3 rounded-xl border border-white/10 hover:border-white/40 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-20 text-white"
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{item.symbol}</span>
                  <span className="font-mono text-[11px]">{formatPercentage(item.change24hPct)}</span>
                </div>
                <div className="font-mono text-[11px] font-semibold opacity-95">
                  {formatPrice(item.price, item.currency)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mandatory Disclaimer (Section 29) */}
      <section className="p-4 rounded-xl bg-dark-900/60 border border-slate-800 text-center">
        <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
          <span className="font-semibold text-slate-400">Important Disclaimer:</span> Market analysis and AI-generated signals are for informational and educational purposes only. They are not financial advice and do not guarantee future market movements.
        </p>
      </section>
    </div>
  );
};
