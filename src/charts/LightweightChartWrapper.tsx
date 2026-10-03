import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  UTCTimestamp,
  LineStyle,
} from 'lightweight-charts';
import { Candle } from '../types/market.js';
import { DrawingOverlay } from './DrawingOverlay.js';
import { DrawingItem, DrawingToolType } from './drawingTypes.js';
import { SRLevel } from '../types/analysis.js';

interface ChartProps {
  candles: Candle[];
  liveCandle?: Candle | null;
  prevTickPrice?: number;
  symbol: string;
  timeframe: string;
  chartType: 'candle' | 'line' | 'area';
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
  supportResistanceLevels?: SRLevel[];
  activeTool: DrawingToolType;
  drawings: DrawingItem[];
  onDrawingsChange: (drawings: DrawingItem[]) => void;
  selectedColor: string;
}

export const LightweightChartWrapper: React.FC<ChartProps> = ({
  candles,
  liveCandle,
  prevTickPrice,
  symbol,
  timeframe,
  chartType,
  activeIndicators,
  supportResistanceLevels = [],
  activeTool,
  drawings,
  onDrawingsChange,
  selectedColor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const indicatorSeriesRef = useRef<{ [key: string]: ISeriesApi<any> }>({});
  const srLinesRef = useRef<any[]>([]);

  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [activeBar, setActiveBar] = useState<Candle | null>(null);
  const [tickDirection, setTickDirection] = useState<'UP' | 'DOWN' | 'EQUAL'>('EQUAL');

  // 1. Initialize Chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth || 800,
      height: containerRef.current.clientHeight || 500,
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E14' },
        textColor: '#94A3B8',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, Inter, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: {
          color: '#06B6D4',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#141A26',
        },
        horzLine: {
          color: '#06B6D4',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#141A26',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chart.applyOptions({ width, height });
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // 2. Render Main Series (Candle, Line, or Area)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    if (mainSeriesRef.current) {
      try {
        chart.removeSeries(mainSeriesRef.current);
      } catch {}
      mainSeriesRef.current = null;
    }

    // Format candle data for lightweight charts
    const formattedData = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      value: c.close,
    }));

    if (chartType === 'candle') {
      const series = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#F43F5E',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#F43F5E',
      });
      series.setData(formattedData);
      mainSeriesRef.current = series;
    } else if (chartType === 'line') {
      const series = chart.addLineSeries({
        color: '#06B6D4',
        lineWidth: 2,
      });
      series.setData(formattedData);
      mainSeriesRef.current = series;
    } else {
      const series = chart.addAreaSeries({
        topColor: 'rgba(6, 182, 212, 0.4)',
        bottomColor: 'rgba(6, 182, 212, 0.0)',
        lineColor: '#06B6D4',
        lineWidth: 2,
      });
      series.setData(formattedData);
      mainSeriesRef.current = series;
    }

    // Volume series
    if (activeIndicators.volume) {
      if (!volumeSeriesRef.current) {
        const volSeries = chart.addHistogramSeries({
          color: '#3B82F6',
          priceFormat: { type: 'volume' },
          priceScaleId: '', // overlay
        });
        volSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        volumeSeriesRef.current = volSeries;
      }

      const volData = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
      }));
      volumeSeriesRef.current.setData(volData);
    } else if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    chart.timeScale().fitContent();
  }, [candles, chartType, activeIndicators.volume]);

  // 3. Render Indicator Overlays (SMA, EMA, Bollinger)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    // Helper to calculate SMA series
    const computeSMA = (period: number) => {
      const result: { time: UTCTimestamp; value: number }[] = [];
      for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, c) => acc + c.close, 0);
        result.push({
          time: candles[i].time as UTCTimestamp,
          value: Number((sum / period).toFixed(4)),
        });
      }
      return result;
    };

    // Helper to calculate EMA series
    const computeEMA = (period: number) => {
      if (candles.length < period) return [];
      const k = 2 / (period + 1);
      const result: { time: UTCTimestamp; value: number }[] = [];

      let prevEMA = candles.slice(0, period).reduce((a, b) => a + b.close, 0) / period;
      result.push({ time: candles[period - 1].time as UTCTimestamp, value: Number(prevEMA.toFixed(4)) });

      for (let i = period; i < candles.length; i++) {
        const val = candles[i].close * k + prevEMA * (1 - k);
        result.push({ time: candles[i].time as UTCTimestamp, value: Number(val.toFixed(4)) });
        prevEMA = val;
      }
      return result;
    };

    const updateIndicatorLine = (key: string, enabled: boolean, color: string, dataFn: () => any[]) => {
      if (enabled) {
        if (!indicatorSeriesRef.current[key]) {
          indicatorSeriesRef.current[key] = chart.addLineSeries({
            color,
            lineWidth: 2,
            crosshairMarkerVisible: false,
          });
        }
        indicatorSeriesRef.current[key].setData(dataFn());
      } else if (indicatorSeriesRef.current[key]) {
        chart.removeSeries(indicatorSeriesRef.current[key]);
        delete indicatorSeriesRef.current[key];
      }
    };

    updateIndicatorLine('sma20', activeIndicators.sma20, '#F59E0B', () => computeSMA(20));
    updateIndicatorLine('sma50', activeIndicators.sma50, '#3B82F6', () => computeSMA(50));
    updateIndicatorLine('sma200', activeIndicators.sma200, '#EC4899', () => computeSMA(200));
    updateIndicatorLine('ema20', activeIndicators.ema20, '#10B981', () => computeEMA(20));
    updateIndicatorLine('ema50', activeIndicators.ema50, '#8B5CF6', () => computeEMA(50));
  }, [candles, activeIndicators]);

  // 4. Render Dynamic Support & Resistance Price Lines on Chart
  useEffect(() => {
    const mainSeries = mainSeriesRef.current;
    if (!mainSeries) return;

    // Clear previous price lines
    srLinesRef.current.forEach((line) => {
      try {
        mainSeries.removePriceLine(line);
      } catch {}
    });
    srLinesRef.current = [];

    if (activeIndicators.supportResistance && supportResistanceLevels.length > 0) {
      supportResistanceLevels.forEach((level) => {
        const isSupport = level.type === 'SUPPORT';
        const color = isSupport ? '#10B981' : '#F43F5E';
        const line = mainSeries.createPriceLine({
          price: level.price,
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `${level.level} (${level.strength}/10)`,
        });
        srLinesRef.current.push(line);
      });
    }
  }, [supportResistanceLevels, activeIndicators.supportResistance]);

  // 5. Dynamic Live Candle Update (Animates active candlestick up and down live!)
  useEffect(() => {
    if (!liveCandle || !mainSeriesRef.current) return;

    setActiveBar(liveCandle);

    if (prevTickPrice !== undefined) {
      if (liveCandle.close > prevTickPrice) {
        setTickDirection('UP');
      } else if (liveCandle.close < prevTickPrice) {
        setTickDirection('DOWN');
      }
    }

    try {
      mainSeriesRef.current.update({
        time: liveCandle.time as UTCTimestamp,
        open: liveCandle.open,
        high: liveCandle.high,
        low: liveCandle.low,
        close: liveCandle.close,
        value: liveCandle.close,
      });

      if (volumeSeriesRef.current && liveCandle.volume) {
        volumeSeriesRef.current.update({
          time: liveCandle.time as UTCTimestamp,
          value: liveCandle.volume,
          color: liveCandle.close >= liveCandle.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
        });
      }
    } catch (e) {
      // ignore
    }
  }, [liveCandle, prevTickPrice]);

  // Determine active candlestick pattern
  const currentBar = activeBar || (candles.length > 0 ? candles[candles.length - 1] : null);
  let patternTag = 'Consolidating';
  let patternColor = 'text-slate-400 bg-dark-800 border-slate-700';

  if (currentBar) {
    const range = currentBar.high - currentBar.low || 0.001;
    const body = Math.abs(currentBar.close - currentBar.open);
    const upperWick = currentBar.high - Math.max(currentBar.open, currentBar.close);
    const lowerWick = Math.min(currentBar.open, currentBar.close) - currentBar.low;
    const isGreen = currentBar.close >= currentBar.open;

    if (body / range < 0.1) {
      patternTag = '⚖️ Doji (Indecision)';
      patternColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (lowerWick > 2 * body && upperWick < body * 0.5) {
      patternTag = '🔨 Bullish Hammer / Pin Bar';
      patternColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    } else if (upperWick > 2 * body && lowerWick < body * 0.5) {
      patternTag = '⭐ Shooting Star (Rejection)';
      patternColor = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    } else if (isGreen && body / range > 0.65) {
      patternTag = '🟢 Bullish Momentum Bar';
      patternColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    } else if (!isGreen && body / range > 0.65) {
      patternTag = '🔴 Bearish Expansion Bar';
      patternColor = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    } else if (lowerWick / range > 0.45) {
      patternTag = '⚡ Lower Wick Absorption';
      patternColor = 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    } else if (upperWick / range > 0.45) {
      patternTag = '⚡ Upper Wick Rejection';
      patternColor = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    }
  }

  const isBarGreen = currentBar ? currentBar.close >= currentBar.open : true;
  const barChangePct = currentBar && currentBar.open > 0
    ? (((currentBar.close - currentBar.open) / currentBar.open) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="relative w-full h-full min-h-[480px] bg-dark-900 rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl">
      {/* Live Market Movement & Candlestick Pattern HUD */}
      <div className="absolute top-3 left-3 z-30 pointer-events-none flex flex-wrap items-center gap-2 font-mono text-[11px] bg-dark-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg">
        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
          <span
            className={`w-2 h-2 rounded-full animate-ping ${
              tickDirection === 'UP' ? 'bg-emerald-400' : tickDirection === 'DOWN' ? 'bg-rose-400' : 'bg-cyan-400'
            }`}
          />
          <span className="font-sans font-bold text-slate-200 uppercase tracking-wider text-[10px]">
            LIVE TICK
          </span>
          <span
            className={`font-bold ${
              tickDirection === 'UP' ? 'text-emerald-400' : tickDirection === 'DOWN' ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {tickDirection === 'UP' ? '▲ UP' : tickDirection === 'DOWN' ? '▼ DOWN' : '—'}
          </span>
        </div>

        {/* Current Candle OHLC Values */}
        {currentBar && (
          <div className="flex items-center gap-2 text-slate-300">
            <span>O: <strong className="text-slate-100">{currentBar.open}</strong></span>
            <span>H: <strong className="text-slate-100">{currentBar.high}</strong></span>
            <span>L: <strong className="text-slate-100">{currentBar.low}</strong></span>
            <span>C: <strong className={isBarGreen ? 'text-emerald-400' : 'text-rose-400'}>{currentBar.close}</strong></span>
            <span className={`font-bold px-1 rounded ${isBarGreen ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
              {isBarGreen ? '+' : ''}{barChangePct}%
            </span>
          </div>
        )}

        {/* Live Candlestick Pattern Tag */}
        <div className="pl-2 border-l border-slate-800">
          <span className={`px-2 py-0.5 rounded font-sans font-semibold text-[10px] border ${patternColor}`}>
            {patternTag}
          </span>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />
      <DrawingOverlay
        width={dimensions.width}
        height={dimensions.height}
        activeTool={activeTool}
        drawings={drawings}
        onDrawingsChange={onDrawingsChange}
        selectedColor={selectedColor}
      />
    </div>
  );
};
