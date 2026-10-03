import React from 'react';
import { SupportResistanceResult } from '../types/analysis.js';
import { Shield, Target, Info } from 'lucide-react';
import { formatPrice } from '../utils/formatters.js';

interface SRPanelProps {
  sr: SupportResistanceResult | null;
  currency?: string;
}

export const SupportResistancePanel: React.FC<SRPanelProps> = ({ sr, currency = 'USD' }) => {
  if (!sr) {
    return (
      <div className="bg-dark-850/90 rounded-xl p-4 border border-slate-800 text-center text-slate-500 text-xs">
        Calculating algorithmic support & resistance...
      </div>
    );
  }

  return (
    <div className="bg-dark-850/90 rounded-xl p-4 border border-slate-800 backdrop-blur">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-100">Algorithmic Support & Resistance</h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Info size={12} />
          <span>Swing Cluster & Pivot Method</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resistances (R3, R2, R1) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400 px-1">
            <span>RESISTANCE LEVELS (OVERHEAD)</span>
            <span>DISTANCE</span>
          </div>

          {[...sr.resistances].reverse().map((r) => (
            <div
              key={r.level}
              className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-rose-500/10 text-rose-400 font-bold text-xs flex items-center justify-center font-mono border border-rose-500/30">
                  {r.level}
                </span>
                <div>
                  <div className="font-mono font-bold text-slate-100 text-sm">
                    {formatPrice(r.price, currency)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Touches: {r.touches}</span>
                    <span>•</span>
                    <span>Strength: {r.strength}/10</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-medium text-rose-400">
                  +{r.distancePct.toFixed(2)}%
                </span>
                <div className="w-16 h-1.5 bg-dark-750 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, r.strength * 10)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Supports (S1, S2, S3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 px-1">
            <span>SUPPORT LEVELS (DEMAND)</span>
            <span>DISTANCE</span>
          </div>

          {sr.supports.map((s) => (
            <div
              key={s.level}
              className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono border border-emerald-500/30">
                  {s.level}
                </span>
                <div>
                  <div className="font-mono font-bold text-slate-100 text-sm">
                    {formatPrice(s.price, currency)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Touches: {s.touches}</span>
                    <span>•</span>
                    <span>Strength: {s.strength}/10</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-medium text-emerald-400">
                  -{s.distancePct.toFixed(2)}%
                </span>
                <div className="w-16 h-1.5 bg-dark-750 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, s.strength * 10)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500 italic text-center">
        * Levels algorithmically identified via swing clustering, pivot points, and historical order absorption.
      </p>
    </div>
  );
};
