import React, { useState } from 'react';
import { Calculator, ShieldAlert, ArrowUpRight, ArrowDownRight, DollarSign, Target } from 'lucide-react';
import { formatPrice } from '../utils/formatters.js';

export const RiskPage: React.FC = () => {
  const [balance, setBalance] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(85000);
  const [stopLoss, setStopLoss] = useState<number>(83500);
  const [takeProfit, setTakeProfit] = useState<number>(88500);

  // Math
  const maxRiskCapital = (balance * riskPercent) / 100;
  const isLong = entryPrice >= stopLoss;
  const riskPerShare = Math.abs(entryPrice - stopLoss) || 0.001;
  const units = maxRiskCapital / riskPerShare;
  const totalInvestment = units * entryPrice;

  const rewardPerShare = Math.abs(takeProfit - entryPrice);
  const totalReward = units * rewardPerShare;
  const rrRatio = riskPerShare > 0 ? Number((rewardPerShare / riskPerShare).toFixed(2)) : 0;

  // Milestone targets
  const target1 = isLong ? entryPrice + riskPerShare * 1.5 : entryPrice - riskPerShare * 1.5;
  const target2 = isLong ? entryPrice + riskPerShare * 2.5 : entryPrice - riskPerShare * 2.5;
  const target3 = isLong ? entryPrice + riskPerShare * 4.0 : entryPrice - riskPerShare * 4.0;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="bg-dark-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-cyan-400" />
            <h1 className="font-black text-xl text-slate-100">Trade Risk Management Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculate exact mathematical position sizing to control downside risk and structure high-expectancy setups.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters */}
        <div className="bg-dark-850 rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 pb-2 border-b border-slate-800">
            Account & Trade Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Account Portfolio Equity ($)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400">Risk Allocation Per Trade (%)</label>
                <span className="font-mono text-cyan-400 font-bold">{riskPercent}%</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="5.0"
                step="0.25"
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1)}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Planned Entry Price ($)</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Stop-Loss Invalidation Price ($)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Target Take-Profit Price ($)</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Calculated Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-dark-900 rounded-xl p-4 border border-rose-500/20">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Dollar Risk</span>
              <span className="font-mono text-xl font-black text-rose-400 mt-1 block">
                {formatPrice(maxRiskCapital)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Exact capital at stake</span>
            </div>

            <div className="bg-dark-900 rounded-xl p-4 border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Recommended Size</span>
              <span className="font-mono text-xl font-black text-cyan-400 mt-1 block">
                {units < 1 ? units.toFixed(4) : units.toFixed(2)} units
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Total value: {formatPrice(totalInvestment)}</span>
            </div>

            <div className="bg-dark-900 rounded-xl p-4 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risk / Reward Ratio</span>
              <span className="font-mono text-xl font-black text-emerald-400 mt-1 block">
                1 : {rrRatio}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Potential: +{formatPrice(totalReward)}</span>
            </div>
          </div>

          {/* Staged Take-Profit Milestones */}
          <div className="bg-dark-850 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-cyan-400" />
              <h4 className="font-bold text-xs text-slate-200">Algorithmic Target Milestones</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-dark-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Target 1 (1:1.5 RR)</span>
                <span className="font-mono text-sm font-bold text-slate-200 block mt-1">
                  {formatPrice(target1)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Reward: +{formatPrice(maxRiskCapital * 1.5)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-dark-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Target 2 (1:2.5 RR)</span>
                <span className="font-mono text-sm font-bold text-slate-200 block mt-1">
                  {formatPrice(target2)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Reward: +{formatPrice(maxRiskCapital * 2.5)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-dark-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Target 3 (1:4.0 RR)</span>
                <span className="font-mono text-sm font-bold text-slate-200 block mt-1">
                  {formatPrice(target3)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Reward: +{formatPrice(maxRiskCapital * 4.0)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-dark-900/60 border border-slate-800 text-[11px] text-slate-500 italic leading-relaxed">
            * Risk Management Note: Capital preservation is the highest priority. Never risk more than 1-2% of total portfolio equity on any single asset idea. Stop-loss orders should always be placed at structural invalidation levels.
          </div>
        </div>
      </div>
    </div>
  );
};
