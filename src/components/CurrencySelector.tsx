import React, { useState, useRef, useEffect } from 'react';
import { DisplayCurrency } from '../types/market.js';
import { Globe, ChevronDown } from 'lucide-react';

interface CurrencySelectorProps {
  currentCurrency: DisplayCurrency;
  onCurrencyChange: (curr: DisplayCurrency) => void;
}

const CURRENCIES: { code: DisplayCurrency; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currentCurrency,
  onCurrencyChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-200 border border-slate-700/80 text-xs font-mono font-medium transition-colors"
      >
        <Globe size={13} className="text-cyan-400" />
        <span>{currentCurrency}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-36 bg-dark-850 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                onCurrencyChange(c.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono text-left transition-colors ${
                currentCurrency === c.code
                  ? 'bg-cyan-500/15 text-cyan-400 font-bold'
                  : 'text-slate-300 hover:bg-dark-750'
              }`}
            >
              <span>{c.code} ({c.symbol})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
