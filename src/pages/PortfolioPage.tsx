import React, { useState, useEffect } from 'react';
import {
  PortfolioData,
  DisplayCurrency,
  CurrencyRates,
  MarketQuote,
} from '../types/market.js';
import { apiClient } from '../services/apiClient.js';
import { Sparkline } from '../components/Sparkline.js';
import {
  convertAndFormatPrice,
  formatPrice,
  formatPercentage,
  formatTime,
} from '../utils/formatters.js';
import {
  Wallet,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Repeat,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  LineChart,
  ShieldCheck,
  PieChart,
  History,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PortfolioPageProps {
  onSelectAsset: (symbol: string) => void;
  displayCurrency: DisplayCurrency;
  rates?: CurrencyRates | null;
  allMarkets?: MarketQuote[];
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  onSelectAsset,
  displayCurrency,
  rates,
  allMarkets = [],
}) => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('tv_hide_balance') === 'true';
  });

  // Modals
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isTradeOpen, setIsTradeOpen] = useState<boolean>(false);
  const [selectedTradeSymbol, setSelectedTradeSymbol] = useState<string>('BTCUSDT');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQuantity, setTradeQuantity] = useState<string>('0.1');
  const [tradeSubmitting, setTradeSubmitting] = useState<boolean>(false);
  const [tradeFeedback, setTradeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState<string>('5000');
  const [depositSubmitting, setDepositSubmitting] = useState<boolean>(false);
  const [depositFeedback, setDepositFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadPortfolio = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await apiClient.getPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
    // Auto-refresh portfolio data every 10 seconds to reflect live market movements
    const interval = setInterval(() => {
      loadPortfolio(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleHideBalance = () => {
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem('tv_hide_balance', String(next));
  };

  const handleResetPortfolio = async () => {
    if (!window.confirm('Reset portfolio to initial demo balance ($25,000 cash + starting holdings)?')) {
      return;
    }
    setLoading(true);
    try {
      await apiClient.resetPortfolio();
      await loadPortfolio();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositFeedback({ type: 'error', message: 'Please enter a valid deposit amount.' });
      return;
    }
    setDepositSubmitting(true);
    setDepositFeedback(null);
    try {
      await apiClient.depositPortfolio(amount);
      setDepositFeedback({ type: 'success', message: `Successfully deposited $${amount.toLocaleString()} into your wallet!` });
      await loadPortfolio(true);
      setTimeout(() => {
        setIsDepositOpen(false);
        setDepositFeedback(null);
      }, 1500);
    } catch (err: any) {
      setDepositFeedback({ type: 'error', message: err.message || 'Deposit failed.' });
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(tradeQuantity);
    if (isNaN(qty) || qty <= 0) {
      setTradeFeedback({ type: 'error', message: 'Please enter a valid quantity.' });
      return;
    }
    setTradeSubmitting(true);
    setTradeFeedback(null);
    try {
      const res = await apiClient.tradePortfolio(selectedTradeSymbol, tradeType, qty);
      setTradeFeedback({ type: 'success', message: res.message || 'Order executed successfully!' });
      await loadPortfolio(true);
      setTimeout(() => {
        setIsTradeOpen(false);
        setTradeFeedback(null);
      }, 1800);
    } catch (err: any) {
      setTradeFeedback({ type: 'error', message: err.message || 'Trade execution failed.' });
    } finally {
      setTradeSubmitting(false);
    }
  };

  const openTradeModal = (symbol?: string, type: 'BUY' | 'SELL' = 'BUY') => {
    if (symbol) setSelectedTradeSymbol(symbol);
    setTradeType(type);
    setTradeFeedback(null);
    setIsTradeOpen(true);
  };

  // Find quote for the selected trade asset
  const tradeQuote = allMarkets.find((m) => m.symbol === selectedTradeSymbol) || portfolio?.holdings.find((h) => h.symbol === selectedTradeSymbol);
  const tradePrice = (tradeQuote as any)?.price ?? (tradeQuote as any)?.currentPrice ?? 0;
  const tradeCurrency = tradeQuote?.currency || 'USD';
  const estimatedTotal = (parseFloat(tradeQuantity) || 0) * tradePrice;

  // Selected asset holding quantity if any
  const currentHolding = portfolio?.holdings.find((h) => h.symbol === selectedTradeSymbol);
  const availableQtyToSell = currentHolding ? currentHolding.quantity : 0;

  // Filtered holdings
  const filteredHoldings = (portfolio?.holdings || []).filter((h) => {
    const matchesFilter =
      activeFilter === 'all' ||
      h.assetClass === activeFilter;
    const matchesSearch =
      !searchQuery ||
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isTodayPositive = (portfolio?.todayPnL.amount ?? 0) >= 0;
  const isAllTimePositive = (portfolio?.allTimePnL.amount ?? 0) >= 0;

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
              <Wallet size={12} />
              Live Real-Market Portfolio
            </span>
            <span className="text-xs text-slate-500">• Instant Execution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <span>Portfolio & Assets</span>
            <button
              onClick={() => loadPortfolio(true)}
              disabled={refreshing}
              title="Refresh Portfolio"
              className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-cyan-400 border border-slate-700/60 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
            </button>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time portfolio valuation priced against live market ticks across crypto, equities, and commodities.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDepositOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle size={15} />
            <span>Deposit Cash</span>
          </button>

          <button
            onClick={() => openTradeModal('BTCUSDT', 'BUY')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white text-xs font-bold shadow-glow-cyan transition-all"
          >
            <Repeat size={15} />
            <span>Trade / Buy & Sell</span>
          </button>

          <button
            onClick={handleResetPortfolio}
            title="Reset to default demo funds"
            className="px-2.5 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-rose-400 border border-slate-700/70 text-xs transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2. Main Portfolio Banner Card (Matches Mobile Reference Inspiration) */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-slate-800/80 bg-gradient-to-br from-dark-900/90 via-dark-950/80 to-dark-900/90 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left Column: Total Balance */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Total Portfolio Balance</span>
              <button
                onClick={toggleHideBalance}
                className="p-1 rounded-md hover:bg-dark-800 text-slate-400 hover:text-slate-200 transition-colors"
                title={hideBalance ? 'Show Balance' : 'Hide Balance'}
              >
                {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <span className="text-[10px] text-slate-500 font-mono">
                (Display Currency: {displayCurrency})
              </span>
            </div>

            {/* Big Balance Number */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 font-mono tracking-tight">
                {hideBalance ? (
                  '••••••••'
                ) : portfolio ? (
                  convertAndFormatPrice(portfolio.totalPortfolioValue, portfolio.currency, displayCurrency, rates)
                ) : (
                  'Loading...'
                )}
              </span>
            </div>

            {/* Today's P&L and All-Time P&L Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
                  isTodayPositive
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                {isTodayPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>Today's P&L:</span>
                <span>
                  {hideBalance
                    ? '••••'
                    : `${convertAndFormatPrice(
                        portfolio?.todayPnL.amount ?? 0,
                        portfolio?.currency || 'USD',
                        displayCurrency,
                        rates
                      )} (${formatPercentage(portfolio?.todayPnL.percentage)})`}
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
                  isAllTimePositive
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}
              >
                <span>All-Time Return:</span>
                <span>
                  {hideBalance
                    ? '••••'
                    : `${convertAndFormatPrice(
                        portfolio?.allTimePnL.amount ?? 0,
                        portfolio?.currency || 'USD',
                        displayCurrency,
                        rates
                      )} (${formatPercentage(portfolio?.allTimePnL.percentage)})`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Cash & Holdings Value Stats */}
          <div className="lg:border-l lg:border-slate-800/80 lg:pl-6 space-y-3">
            <div className="p-3 rounded-xl bg-dark-850/80 border border-slate-800/70">
              <div className="text-[11px] text-slate-400 font-medium">Available Cash (Buying Power)</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {hideBalance
                  ? '••••••'
                  : convertAndFormatPrice(portfolio?.cashBalance ?? 0, portfolio?.currency || 'USD', displayCurrency, rates)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-850/80 border border-slate-800/70">
              <div className="text-[11px] text-slate-400 font-medium">Invested Holdings Value</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                {hideBalance
                  ? '••••••'
                  : convertAndFormatPrice(portfolio?.totalHoldingsValue ?? 0, portfolio?.currency || 'USD', displayCurrency, rates)}
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Breakdown Bar */}
        {portfolio?.allocation && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold flex items-center gap-1.5">
                <PieChart size={13} className="text-cyan-400" />
                Asset Allocation
              </span>
              <span className="text-[11px] text-slate-500">Live Portfolio Distribution</span>
            </div>

            {/* Segmented Color Bar */}
            {(portfolio?.totalPortfolioValue ?? 0) === 0 ? (
              <div className="h-3 w-full bg-dark-850 rounded-full border border-slate-700/50 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                No active assets • Deposit funds to begin
              </div>
            ) : (
              <div className="h-3 w-full bg-dark-800 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${portfolio.allocation.crypto}%` }}
                  className="bg-amber-400 hover:opacity-90 transition-all"
                  title={`Crypto: ${portfolio.allocation.crypto}%`}
                />
                <div
                  style={{ width: `${portfolio.allocation.indian_stocks}%` }}
                  className="bg-blue-500 hover:opacity-90 transition-all"
                  title={`Indian Equities: ${portfolio.allocation.indian_stocks}%`}
                />
                <div
                  style={{ width: `${portfolio.allocation.us_stocks}%` }}
                  className="bg-purple-500 hover:opacity-90 transition-all"
                  title={`US Equities: ${portfolio.allocation.us_stocks}%`}
                />
                <div
                  style={{ width: `${portfolio.allocation.commodities}%` }}
                  className="bg-yellow-500 hover:opacity-90 transition-all"
                  title={`Commodities: ${portfolio.allocation.commodities}%`}
                />
                <div
                  style={{ width: `${portfolio.allocation.cash}%` }}
                  className="bg-emerald-500 hover:opacity-90 transition-all"
                  title={`Cash: ${portfolio.allocation.cash}%`}
                />
              </div>
            )}

            {/* Allocation Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300">Crypto:</span>
                <span className="text-slate-400 font-bold">{portfolio?.allocation.crypto ?? 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300">Indian Equities:</span>
                <span className="text-slate-400 font-bold">{portfolio?.allocation.indian_stocks ?? 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-300">US Equities:</span>
                <span className="text-slate-400 font-bold">{portfolio?.allocation.us_stocks ?? 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-slate-300">Commodities:</span>
                <span className="text-slate-400 font-bold">{portfolio?.allocation.commodities ?? 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Cash:</span>
                <span className="text-slate-400 font-bold">{portfolio?.allocation.cash ?? 0}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Holdings Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Your Active Holdings</h2>
            <span className="px-2 py-0.5 rounded-full bg-dark-800 text-[11px] font-mono text-cyan-400 font-semibold border border-slate-700/60">
              {portfolio?.holdings.length ?? 0} Assets
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search holdings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center gap-1 bg-dark-900 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'crypto', label: 'Crypto' },
                { id: 'indian_stocks', label: 'India' },
                { id: 'us_stocks', label: 'US' },
                { id: 'commodities', label: 'Metals' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    activeFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-dark-950/60 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-dark-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4 text-right">Live Price</th>
                <th className="py-3.5 px-4 text-right">Holdings</th>
                <th className="py-3.5 px-4 text-right">Avg Cost</th>
                <th className="py-3.5 px-4 text-right">Total Value</th>
                <th className="py-3.5 px-4 text-right">Unrealized P&L</th>
                <th className="py-3.5 px-4 text-center">Trend (24h)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {loading && !portfolio ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    <RefreshCw className="animate-spin inline-block mr-2 text-cyan-400" size={18} />
                    Fetching real-time market valuations...
                  </td>
                </tr>
              ) : filteredHoldings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Wallet size={22} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-sm">Portfolio Balance is 0</div>
                        <p className="text-xs text-slate-400 mt-1">
                          You haven't deposited or traded any assets yet. Deposit funds to start trading real market assets.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsDepositOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <PlusCircle size={14} />
                        <span>Deposit Funds</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHoldings.map((h) => {
                  const isPositive = h.pnl >= 0;
                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-dark-850/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectAsset(h.symbol)}
                    >
                      {/* Asset Symbol & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-dark-800 border border-slate-700/80 flex items-center justify-center font-bold text-[11px] text-cyan-400 shrink-0">
                            {h.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                              <span>{h.symbol}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 border border-slate-700">
                                {h.assetClass.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans truncate max-w-[140px]">
                              {h.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Live Market Price & 24h change */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-100">
                          {convertAndFormatPrice(h.currentPrice, h.currency, displayCurrency, rates)}
                        </div>
                        <div
                          className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                            h.change24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {h.change24hPct >= 0 ? '+' : ''}
                          {h.change24hPct.toFixed(2)}%
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-slate-200">
                          {h.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">Units</div>
                      </td>

                      {/* Avg Buy Price */}
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        {convertAndFormatPrice(h.avgBuyPrice, h.currency, displayCurrency, rates)}
                      </td>

                      {/* Current Value */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                        {hideBalance
                          ? '••••'
                          : convertAndFormatPrice(h.currentValue, h.currency, displayCurrency, rates)}
                      </td>

                      {/* P&L */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-bold flex items-center justify-end gap-1 ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {hideBalance
                            ? '••••'
                            : convertAndFormatPrice(h.pnl, h.currency, displayCurrency, rates)}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isPositive ? 'text-emerald-400/80' : 'text-rose-400/80'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {h.pnlPct.toFixed(2)}%
                        </div>
                      </td>

                      {/* Sparkline */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-20 mx-auto">
                          <Sparkline
                            data={h.sparkline || [h.avgBuyPrice, h.currentPrice]}
                            isPositive={isPositive}
                            width={80}
                            height={24}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openTradeModal(h.symbol, 'BUY')}
                            className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-semibold text-[11px] transition-colors"
                          >
                            Trade
                          </button>
                          <button
                            onClick={() => onSelectAsset(h.symbol)}
                            title="Open Real-time Candlestick Chart"
                            className="p-1 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <LineChart size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recent Transactions Log */}
      {portfolio?.transactions && portfolio.transactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <History size={14} className="text-cyan-400" />
              Recent Portfolio Activity
            </h3>
            <span className="text-[11px] text-slate-500">Live order executions</span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-dark-950/40 divide-y divide-slate-800/50">
            {portfolio.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : tx.type === 'SELL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {tx.type}
                  </span>
                  <div className="font-sans">
                    <span className="font-bold text-slate-100">{tx.symbol}</span>
                    <span className="text-slate-400 text-[11px] ml-2 font-mono">
                      {tx.quantity} units @ {formatPrice(tx.price, tx.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="font-bold text-slate-200">
                    {formatPrice(tx.total, tx.currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    {formatTime(tx.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEPOSIT MODAL */}
      {/* ========================================================================= */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-700/80 shadow-2xl bg-dark-900">
            <button
              onClick={() => setIsDepositOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-dark-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Deposit Virtual Funds</h3>
                <p className="text-xs text-slate-400">Add capital to trade against live real market data</p>
              </div>
            </div>

            {depositFeedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                  depositFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {depositFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{depositFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Deposit Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-dark-850 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Quick Presets:</span>
                <div className="grid grid-cols-4 gap-2">
                  {['1000', '5000', '10000', '25000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(preset)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                        depositAmount === preset
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-dark-800 border-slate-700/80 text-slate-300 hover:bg-dark-750'
                      }`}
                    >
                      +${parseInt(preset).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={depositSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {depositSubmitting ? 'Processing Deposit...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRADE MODAL (BUY / SELL AT REAL MARKET PRICES) */}
      {/* ========================================================================= */}
      {isTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-700/80 shadow-2xl bg-dark-900">
            <button
              onClick={() => setIsTradeOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-dark-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Repeat size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Trade Live Market Order</h3>
                <p className="text-xs text-slate-400">Priced at real-time institutional quote</p>
              </div>
            </div>

            {/* Buy / Sell Tab Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-dark-850 rounded-xl mb-4 border border-slate-800">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tradeType === 'BUY'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tradeType === 'SELL'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {tradeFeedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                  tradeFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {tradeFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{tradeFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleTradeSubmit} className="space-y-4">
              {/* Asset Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Asset
                </label>
                <select
                  value={selectedTradeSymbol}
                  onChange={(e) => setSelectedTradeSymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                >
                  <optgroup label="Crypto">
                    <option value="BTCUSDT">BTCUSDT - Bitcoin</option>
                    <option value="ETHUSDT">ETHUSDT - Ethereum</option>
                    <option value="SOLUSDT">SOLUSDT - Solana</option>
                  </optgroup>
                  <optgroup label="Indian Stocks">
                    <option value="RELIANCE.NS">RELIANCE.NS - Reliance</option>
                    <option value="TCS.NS">TCS.NS - Tata Consultancy</option>
                    <option value="INFY.NS">INFY.NS - Infosys</option>
                    <option value="SBIN.NS">SBIN.NS - State Bank of India</option>
                  </optgroup>
                  <optgroup label="US Equities">
                    <option value="AAPL">AAPL - Apple Inc.</option>
                    <option value="TSLA">TSLA - Tesla Inc.</option>
                    <option value="NVDA">NVDA - NVIDIA Corp.</option>
                  </optgroup>
                  <optgroup label="Commodities">
                    <option value="GC=F">GC=F - Gold Futures</option>
                    <option value="CL=F">CL=F - Crude Oil</option>
                  </optgroup>
                  <optgroup label="Forex">
                    <option value="EURUSD=X">EURUSD=X - Euro / USD</option>
                    <option value="USDINR=X">USDINR=X - USD / INR</option>
                  </optgroup>
                </select>
              </div>

              {/* Real-time Price Indicator */}
              <div className="p-3 rounded-xl bg-dark-850/80 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Real Market Price:</span>
                  <div className="font-bold text-slate-100 font-mono mt-0.5">
                    {formatPrice(tradePrice, tradeCurrency)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Available:</span>
                  <div className="font-bold font-mono text-cyan-400 mt-0.5">
                    {tradeType === 'BUY'
                      ? formatPrice(portfolio?.cashBalance, 'USD')
                      : `${availableQtyToSell} ${selectedTradeSymbol}`}
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Quantity
                  </label>
                  {tradeType === 'SELL' && availableQtyToSell > 0 && (
                    <button
                      type="button"
                      onClick={() => setTradeQuantity(String(availableQtyToSell))}
                      className="text-[10px] text-cyan-400 hover:underline font-mono"
                    >
                      Max: {availableQtyToSell}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0.000001"
                  step="any"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="0.00"
                />
              </div>

              {/* Estimated Total Calculation */}
              <div className="p-3 rounded-xl bg-dark-850 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans">Estimated Order Total:</span>
                <span className="font-bold text-slate-100 text-sm">
                  {formatPrice(estimatedTotal, tradeCurrency)}
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={tradeSubmitting || tradePrice <= 0}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all disabled:opacity-50 ${
                    tradeType === 'BUY'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/20'
                  }`}
                >
                  {tradeSubmitting
                    ? 'Executing Order at Live Price...'
                    : `Execute ${tradeType} Order`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
