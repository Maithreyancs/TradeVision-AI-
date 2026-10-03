import React, { useState } from 'react';
import { Calculator, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPrice } from '../utils/formatters.js';

interface RiskCalculatorProps {
  currentPrice: number;
  currency?: string;
  defaultStopLoss?: number;
}

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({
  currentPrice,
  currency = 'USD',
  defaultStopLoss,
}) => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice || 100);
  const [stopLoss, setStopLoss] = useState<number>(defaultStopLoss || currentPrice * 0.97);
  const [targetPrice, setTargetPrice] = useState<number>(currentPrice * 1.06);

  // Calculations
  const isLong = entryPrice >= stopLoss;
  const maxRiskAmount = (accountBalance * riskPercent) / 100;
  const riskPerUnit = Math.abs(entryPrice - stopLoss) || 0.0001;
  const positionSize = maxRiskAmount / riskPerUnit;
  const positionValue = positionSize * entryPrice;

  const rewardPerUnit = Math.abs(targetPrice - entryPrice);
  const totalReward = positionSize * rewardPerUnit;
  const riskRewardRatio = riskPerUnit > 0 ? Number((rewardPerUnit / riskPerUnit).toFixed(2)) : 0;

  return (
    <div className="bg-dark-850/90 rounded-xl p-4 border border-slate-800 backdrop-blur space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-100">Risk Management & Position Sizing</h3>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            isLong ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}
        >
          {isLong ? 'Long Setup' : 'Short Setup'}
        </span>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Account Balance ({currency})</label>
          <input
            type="number"
            value={accountBalance}
            onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
            className="w-full bg-dark-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Risk Per Trade (%)</label>
          <input
            type="number"
            step="0.1"
            value={riskPercent}
            onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
            className="w-full bg-dark-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Entry Price ({currency})</label>
          <input
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
            className="w-full bg-dark-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Stop Loss ({currency})</label>
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
            className="w-full bg-dark-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Analytical Output Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-2.5 rounded-lg bg-dark-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Max Risk Amount</span>
          <span className="font-mono font-bold text-sm text-rose-400">
            {formatPrice(maxRiskAmount, currency)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-dark-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Calculated Position Size</span>
          <span className="font-mono font-bold text-sm text-cyan-400">
            {positionSize.toFixed(positionSize < 1 ? 4 : 2)} units
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-dark-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Risk / Reward Ratio</span>
          <span className="font-mono font-bold text-sm text-emerald-400">
            1 : {riskRewardRatio}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-dark-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Potential Reward</span>
          <span className="font-mono font-bold text-sm text-emerald-400">
            +{formatPrice(totalReward, currency)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 text-[10px] text-slate-500 italic pt-1">
        <ShieldAlert size={12} className="shrink-0 mt-0.5 text-slate-400" />
        <span>
          These are mathematical risk reference calculations to protect capital, not guaranteed trade instructions.
        </span>
      </div>
    </div>
  );
};
