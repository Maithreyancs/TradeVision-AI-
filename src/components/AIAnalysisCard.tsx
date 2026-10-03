import React from 'react';
import { TrendAnalysis } from '../types/analysis.js';
import { Bot, Sparkles, AlertCircle, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

interface AIAnalysisCardProps {
  trend: TrendAnalysis | null;
  symbol: string;
  onOpenChat: () => void;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ trend, symbol, onOpenChat }) => {
  if (!trend) {
    return (
      <div className="glass-card rounded-xl p-5 border border-slate-800 text-center text-slate-500 text-xs">
        Loading TradeVision AI intelligence...
      </div>
    );
  }

  const isUp = trend.direction === 'UP';
  const isDown = trend.direction === 'DOWN';

  return (
    <div className="glass-card rounded-xl p-5 border border-slate-700/80 shadow-card-dark relative overflow-hidden space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-slate-100">TradeVision AI Market View</h3>
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">Algorithmic Synthesis & Reasoning</p>
          </div>
        </div>

        <button
          onClick={onOpenChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
        >
          <MessageSquare size={13} />
          <span>Ask AI</span>
        </button>
      </div>

      {/* Main Direction & Confidence */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-dark-900/90 border border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Market Direction
          </span>
          <span
            className={`font-black text-xl tracking-wide ${
              isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {isUp ? 'UPTREND' : isDown ? 'DOWNTREND' : 'SIDEWAYS'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
            Model Confidence
          </span>
          <span className="font-mono font-extrabold text-xl text-cyan-400">
            {trend.confidence}%
          </span>
        </div>
      </div>

      {/* AI Synthesis Summary */}
      <div className="p-3 bg-dark-850/60 rounded-lg border border-slate-800/60">
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {trend.aiMarketView?.summary || 'Algorithmic indicators are actively scanning incoming tick data.'}
        </p>
      </div>

      {/* Bullish & Bearish Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Bullish */}
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
          <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
            <CheckCircle2 size={13} />
            Bullish Signals
          </span>
          {trend.bullishSignals.length > 0 ? (
            <ul className="space-y-1">
              {trend.bullishSignals.map((s, idx) => (
                <li key={idx} className="text-slate-300 text-[11px] flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-slate-500 text-[11px] italic">No dominant bullish signals detected</span>
          )}
        </div>

        {/* Bearish */}
        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
          <span className="font-bold text-rose-400 text-[11px] flex items-center gap-1">
            <XCircle size={13} />
            Bearish Signals
          </span>
          {trend.bearishSignals.length > 0 ? (
            <ul className="space-y-1">
              {trend.bearishSignals.map((s, idx) => (
                <li key={idx} className="text-slate-300 text-[11px] flex items-start gap-1.5">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-slate-500 text-[11px] italic">No dominant bearish signals detected</span>
          )}
        </div>
      </div>

      {/* Risk Factors */}
      {trend.riskFactors.length > 0 && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs">
          <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 text-[11px] block">Risk Factors to Monitor:</span>
            <ul className="mt-1 space-y-0.5 text-slate-300 text-[11px]">
              {trend.riskFactors.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer (Section 29) */}
      <p className="text-[10px] text-slate-500 text-center leading-normal pt-1 border-t border-slate-800/80">
        Market analysis and AI-generated signals are for informational and educational purposes only. They are not financial advice and do not guarantee future market movements.
      </p>
    </div>
  );
};
