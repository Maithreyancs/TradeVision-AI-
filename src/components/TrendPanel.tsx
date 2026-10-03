import React from 'react';
import { TrendAnalysis, MultiTimeframeSummary } from '../types/analysis.js';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TrendPanelProps {
  trend: TrendAnalysis | null;
  multiTf: MultiTimeframeSummary | null;
}

export const TrendPanel: React.FC<TrendPanelProps> = ({ trend, multiTf }) => {
  if (!trend) {
    return (
      <div className="bg-dark-850/90 rounded-xl p-4 border border-slate-800 text-center text-slate-500 text-xs">
        Evaluating multi-factor trend signals...
      </div>
    );
  }

  const isBullish = trend.condition === 'BULLISH';
  const isBearish = trend.condition === 'BEARISH';

  return (
    <div className="bg-dark-850/90 rounded-xl p-4 border border-slate-800 backdrop-blur space-y-4">
      {/* Top Banner: Condition & Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg ${
              isBullish
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10'
                : isBearish
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {isBullish ? <TrendingUp size={24} /> : isBearish ? <TrendingDown size={24} /> : <Minus size={24} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wide text-slate-100">
                {trend.condition} MARKET
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  isBullish
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : isBearish
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {trend.score > 0 ? `+${trend.score}` : trend.score} Score
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Direction: <span className="font-semibold text-slate-200">{trend.direction}TREND</span> on {trend.timeframe} timeframe
            </p>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-dark-900 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Model Confidence</span>
            <span className="font-mono font-extrabold text-lg text-cyan-400">{trend.confidence}%</span>
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400 transition-all duration-1000"
                strokeDasharray={`${trend.confidence}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <ShieldCheck size={14} className="absolute text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Multi-Timeframe Alignment Matrix (Section 12) */}
      {multiTf && multiTf.timeframes && multiTf.timeframes.length > 0 && (
        <div className="p-3 bg-dark-900 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Multi-Timeframe Alignment</span>
            <span className="text-[11px] text-slate-400">
              Concordance: <span className="font-mono text-cyan-400">{multiTf.concordanceRate}%</span>
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 text-center text-xs">
            {multiTf.timeframes.map((tf) => (
              <div
                key={tf.timeframe}
                className={`p-2 rounded-lg border transition-colors ${
                  tf.condition === 'BULLISH'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : tf.condition === 'BEARISH'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-dark-800 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-mono font-bold text-[11px] text-slate-300 mb-0.5">{tf.timeframe}</div>
                <div className="text-[10px] font-semibold">{tf.condition}</div>
              </div>
            ))}
          </div>

          {multiTf.conflictSummary && (
            <p className="text-[11px] text-slate-400 mt-2 italic bg-dark-850 p-2 rounded border border-slate-800/60">
              {multiTf.conflictSummary}
            </p>
          )}
        </div>
      )}

      {/* Transparent Scoring Breakdown Table (Section 10) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-300 block">Transparent Signal Scoring</span>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {trend.signals.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-dark-900/80 border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-6 rounded-full shrink-0 ${
                    s.sentiment === 'BULLISH'
                      ? 'bg-emerald-500'
                      : s.sentiment === 'BEARISH'
                      ? 'bg-rose-500'
                      : 'bg-slate-600'
                  }`}
                />
                <div>
                  <span className="font-semibold text-slate-200 block text-[11px]">{s.indicator}</span>
                  <p className="text-[11px] text-slate-400">{s.description}</p>
                </div>
              </div>

              <span
                className={`font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded ${
                  s.score > 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : s.score < 0
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {s.score > 0 ? `+${s.score}` : s.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
