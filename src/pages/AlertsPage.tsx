import React, { useState } from 'react';
import { Bell, Plus, Trash2, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPrice, formatTime } from '../utils/formatters.js';

interface AlertItem {
  id: string;
  symbol: string;
  condition: string;
  targetValue: number;
  currentPrice: number | null;
  currency: string;
  isTriggered: boolean;
  triggeredAt: string | null;
  isActive: boolean;
}

interface AlertsPageProps {
  alerts: AlertItem[];
  onCreateAlert: (symbol: string, condition: string, targetValue: number) => void;
  onDeleteAlert: (id: string) => void;
  defaultSymbol?: string;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onCreateAlert,
  onDeleteAlert,
  defaultSymbol = 'BTCUSDT',
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [condition, setCondition] = useState('ABOVE');
  const [targetValue, setTargetValue] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !targetValue) return;
    onCreateAlert(symbol, condition, parseFloat(targetValue));
    setShowCreateModal(false);
    setTargetValue('');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-dark-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-cyan-400" />
            <h1 className="font-black text-xl text-slate-100">Price & Technical Alerts</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time triggers pushed via WebSocket when prices or technical thresholds are breached.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
        >
          <Plus size={15} />
          <span>New Alert</span>
        </button>
      </div>

      {/* Alerts Grid / List */}
      {alerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                alert.isTriggered
                  ? 'bg-dark-850/60 border-emerald-500/30'
                  : 'bg-dark-850 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{alert.symbol}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        alert.isTriggered
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {alert.isTriggered ? 'TRIGGERED' : 'ACTIVE'}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteAlert(alert.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400"
                    title="Delete alert"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Condition:</span>
                    <span className="font-semibold text-slate-200">
                      Price {alert.condition === 'ABOVE' ? '≥ (Above)' : '≤ (Below)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Level:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {formatPrice(alert.targetValue, alert.currency)}
                    </span>
                  </div>

                  {alert.currentPrice && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Current Price:</span>
                      <span className="font-mono text-slate-200">
                        {formatPrice(alert.currentPrice, alert.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {alert.isTriggered && alert.triggeredAt && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Triggered at {formatTime(alert.triggeredAt)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-900 rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <Bell size={32} className="mx-auto text-slate-600" />
          <h3 className="font-bold text-base text-slate-200">No Active Alerts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set price threshold alerts to be notified instantly when Bitcoin, Nifty 50, Reliance, Apple, or Gold hit critical levels.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-bold"
          >
            Create Your First Alert
          </button>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 mb-1">Create Price Alert</h3>
            <p className="text-xs text-slate-400 mb-4">
              Receive a live alert when target criteria is met.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Symbol</label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="BTCUSDT, AAPL, RELIANCE.NS, GC=F..."
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ABOVE">Price Rises Above Target (≥)</option>
                  <option value="BELOW">Price Drops Below Target (≤)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Target Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 86000 or 1250"
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
                >
                  Save Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
