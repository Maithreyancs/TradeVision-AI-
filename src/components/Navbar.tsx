import React from 'react';
import {
  TrendingUp,
  Search,
  Bookmark,
  Bell,
  SlidersHorizontal,
  Calculator,
  User,
  LogOut,
  LineChart,
  Wallet,
} from 'lucide-react';
import { DisplayCurrency } from '../types/market.js';
import { CurrencySelector } from './CurrencySelector.js';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  displayCurrency: DisplayCurrency;
  onCurrencyChange: (curr: DisplayCurrency) => void;
  user: any;
  onLogout: () => void;
  alertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenAuth,
  displayCurrency,
  onCurrencyChange,
  user,
  onLogout,
  alertsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-dark-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan">
            <TrendingUp size={20} className="group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-100 group-hover:text-cyan-400 transition-colors">
                TradeVision
              </span>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase font-semibold">
              Live Market Intelligence
            </p>
          </div>
        </div>

        {/* Global Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'home'
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-dark-850'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'chart'
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-dark-850'
            }`}
          >
            <LineChart size={14} />
            <span>Chart & Analysis</span>
          </button>

          <button
            onClick={() => onSelectTab('screener')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'screener'
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-dark-850'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Screener</span>
          </button>

          <button
            onClick={() => onSelectTab('watchlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'watchlist'
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-dark-850'
            }`}
          >
            <Bookmark size={14} />
            <span>Watchlist</span>
          </button>

          <button
            onClick={() => onSelectTab('alerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'alerts'
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-dark-850'
            }`}
          >
            <Bell size={14} />
            <span>Alerts</span>
            {alertsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                {alertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('portfolio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'portfolio'
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-dark-850'
            }`}
          >
            <Wallet size={14} />
            <span>Portfolio</span>
          </button>

          <button
            onClick={() => onSelectTab('risk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'risk'
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-slate-100 hover:bg-dark-850'
            }`}
          >
            <Calculator size={14} />
            <span>Risk Calculator</span>
          </button>
        </nav>

        {/* Right Action Icons: Search, Currency, Auth */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-700/80 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Search size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Search markets...</span>
            <kbd className="hidden lg:inline text-[10px] bg-dark-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* Currency Selector */}
          <CurrencySelector
            currentCurrency={displayCurrency}
            onCurrencyChange={onCurrencyChange}
          />

          {/* User Account / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-850 border border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-200 font-medium max-w-[90px] truncate">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-dark-800 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
            >
              <User size={14} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
