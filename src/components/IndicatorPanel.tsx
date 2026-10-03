import React from 'react';
import { IndicatorResults } from '../types/analysis.js';
import { Sliders, Check } from 'lucide-react';

interface IndicatorPanelProps {
  indicators: IndicatorResults | null;
  activeIndicators: {
    sma20: boolean;
    sma50: boolean;
    sma200: boolean;
    ema20: boolean;
    ema50: boolean;
    bollinger: boolean;
    volume: boolean;
    supportResistance: boolean;
  };
  onToggleIndicator: (key: string) => void;
  onResetIndicators: () => void;
}

export const IndicatorPanel: React.FC<IndicatorPanelProps> = ({
  indicators,
  activeIndicators,
  onToggleIndicator,
  onResetIndicators,
}) => {
  return (
    <div className="bg-dark-850/90 rounded-xl p-4 border border-slate-800 backdrop-blur">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-100">Technical Indicators</h3>
        </div>
        <button
          onClick={onResetIndicators}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline"
        >
          Reset Defaults
        </button>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Moving Averages */}
        <div className="space-y-1.5 p-2.5 rounded-lg bg-dark-900 border border-slate-800/60">
          <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider block">
            Moving Averages
          </span>

          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
              SMA 20
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">{indicators?.sma.sma20 ?? '—'}</span>
              <input
                type="checkbox"
                checked={activeIndicators.sma20}
                onChange={() => onToggleIndicator('sma20')}
                className="rounded accent-cyan-500"
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
              SMA 50
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">{indicators?.sma.sma50 ?? '—'}</span>
              <input
                type="checkbox"
                checked={activeIndicators.sma50}
                onChange={() => onToggleIndicator('sma50')}
                className="rounded accent-cyan-500"
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
              EMA 20
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">{indicators?.ema.ema20 ?? '—'}</span>
              <input
                type="checkbox"
                checked={activeIndicators.ema20}
                onChange={() => onToggleIndicator('ema20')}
                className="rounded accent-cyan-500"
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
              EMA 50
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">{indicators?.ema.ema50 ?? '—'}</span>
              <input
                type="checkbox"
                checked={activeIndicators.ema50}
                onChange={() => onToggleIndicator('ema50')}
                className="rounded accent-cyan-500"
              />
            </div>
          </label>
        </div>

        {/* Momentum & Volatility */}
        <div className="space-y-1.5 p-2.5 rounded-lg bg-dark-900 border border-slate-800/60">
          <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider block">
            Oscillators & Volatility
          </span>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300">RSI (14)</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                (indicators?.rsi.value || 50) > 70
                  ? 'bg-rose-500/20 text-rose-400'
                  : (indicators?.rsi.value || 50) < 30
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {indicators?.rsi.value ?? '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300">MACD Histogram</span>
            <span
              className={`font-mono font-medium ${
                (indicators?.macd.histogram || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {indicators?.macd.histogram ?? '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300">ADX (Trend Strength)</span>
            <span className="font-mono text-slate-300">
              {indicators?.adx.adx ?? '—'} ({indicators?.adx.strength ?? '—'})
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300">ATR Volatility</span>
            <span className="font-mono text-slate-300">
              {indicators?.atr.value ?? '—'} ({indicators?.atr.percentage ?? '—'}%)
            </span>
          </div>
        </div>

        {/* Volume & Overlays */}
        <div className="space-y-1.5 p-2.5 rounded-lg bg-dark-900 border border-slate-800/60">
          <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider block">
            Chart Overlays
          </span>

          <label className="flex items-center justify-between cursor-pointer py-1">
            <span className="text-slate-300">Volume Histogram</span>
            <input
              type="checkbox"
              checked={activeIndicators.volume}
              onChange={() => onToggleIndicator('volume')}
              className="rounded accent-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer py-1">
            <span className="text-slate-300">Auto Support & Resistance</span>
            <input
              type="checkbox"
              checked={activeIndicators.supportResistance}
              onChange={() => onToggleIndicator('supportResistance')}
              className="rounded accent-cyan-500"
            />
          </label>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300">VWAP</span>
            <span className="font-mono text-slate-300">{indicators?.vwap.value ?? '—'}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300">Volume Ratio (20 MA)</span>
            <span
              className={`font-mono ${indicators?.volume.isSpike ? 'text-amber-400 font-bold' : 'text-slate-300'}`}
            >
              {indicators?.volume.ratio ?? 1}x {indicators?.volume.isSpike && '🔥 Spike'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
