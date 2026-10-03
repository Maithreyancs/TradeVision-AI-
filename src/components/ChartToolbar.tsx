import React from 'react';
import { DrawingToolType } from '../charts/drawingTypes.js';
import {
  MousePointer,
  TrendingUp,
  Minus,
  Maximize2,
  Minimize2,
  Square,
  Divide,
  Activity,
  Trash2,
  RotateCcw,
  Palette,
  CandlestickChart,
  LineChart,
  AreaChart,
} from 'lucide-react';

interface ChartToolbarProps {
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  chartType: 'candle' | 'line' | 'area';
  onChartTypeChange: (type: 'candle' | 'line' | 'area') => void;
  activeTool: DrawingToolType;
  onToolSelect: (tool: DrawingToolType) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onClearDrawings: () => void;
  onUndoDrawing: () => void;
  drawingsCount: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];

const DRAWING_TOOLS: { id: DrawingToolType; label: string; icon: any }[] = [
  { id: 'cursor', label: 'Cursor', icon: MousePointer },
  { id: 'trendline', label: 'Trend Line', icon: TrendingUp },
  { id: 'horizontal', label: 'Horizontal Line', icon: Minus },
  { id: 'support', label: 'Support Level', icon: Minus },
  { id: 'resistance', label: 'Resistance Level', icon: Minus },
  { id: 'fibonacci', label: 'Fibonacci Retracement', icon: Divide },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'price_range', label: 'Price Range', icon: Maximize2 },
  { id: 'measure', label: 'Measure Tool', icon: Activity },
];

const COLORS = ['#06B6D4', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6', '#FFFFFF'];

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  activeTool,
  onToolSelect,
  selectedColor,
  onColorChange,
  onClearDrawings,
  onUndoDrawing,
  drawingsCount,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-dark-900/90 backdrop-blur border-b border-slate-800 rounded-t-xl text-xs">
      {/* Timeframes */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2.5 py-1 rounded font-mono font-medium transition-colors ${
              timeframe === tf
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Types */}
      <div className="flex items-center gap-1 border-x border-slate-800/80 px-2">
        <button
          onClick={() => onChartTypeChange('candle')}
          title="Candlestick"
          className={`p-1.5 rounded transition-colors ${chartType === 'candle' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <CandlestickChart size={16} />
        </button>
        <button
          onClick={() => onChartTypeChange('line')}
          title="Line"
          className={`p-1.5 rounded transition-colors ${chartType === 'line' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <LineChart size={16} />
        </button>
        <button
          onClick={() => onChartTypeChange('area')}
          title="Area"
          className={`p-1.5 rounded transition-colors ${chartType === 'area' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <AreaChart size={16} />
        </button>
      </div>

      {/* Drawing Tools */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
        {DRAWING_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              title={tool.label}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`}
            >
              <Icon size={14} />
              <span className="hidden xl:inline text-[11px]">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Color Palette, Actions & Fullscreen */}
      <div className="flex items-center gap-2">
        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              style={{ backgroundColor: c }}
              className={`w-3.5 h-3.5 rounded-full transition-transform ${
                selectedColor === c ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        {/* Undo */}
        <button
          onClick={onUndoDrawing}
          disabled={drawingsCount === 0}
          title="Undo drawing"
          className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
        </button>

        {/* Clear All */}
        <button
          onClick={onClearDrawings}
          disabled={drawingsCount === 0}
          title="Clear all drawings"
          className="p-1 rounded text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
        </button>

        {/* Fullscreen Button */}
        {onToggleFullscreen && (
          <div className="border-l border-slate-800 pl-2">
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen Market View'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                isFullscreen
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-glow-cyan font-bold'
                  : 'bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-cyan-400 border-slate-700/80 hover:border-cyan-500/40'
              }`}
            >
              {isFullscreen ? <Minimize2 size={14} className="text-cyan-400" /> : <Maximize2 size={14} />}
              <span className="hidden sm:inline text-[11px] font-medium">
                {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
