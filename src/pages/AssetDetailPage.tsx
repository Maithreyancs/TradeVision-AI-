import React, { useState, useEffect } from 'react';
import { MarketQuote, Candle, DisplayCurrency, CurrencyRates } from '../types/market.js';
import { TrendAnalysis, IndicatorResults, SupportResistanceResult, MultiTimeframeSummary } from '../types/analysis.js';
import { DrawingItem, DrawingToolType } from '../charts/drawingTypes.js';
import { LightweightChartWrapper } from '../charts/LightweightChartWrapper.js';
import { ChartToolbar } from '../components/ChartToolbar.js';
import { IndicatorPanel } from '../components/IndicatorPanel.js';
import { SupportResistancePanel } from '../components/SupportResistancePanel.js';
import { TrendPanel } from '../components/TrendPanel.js';
import { AIAnalysisCard } from '../components/AIAnalysisCard.js';
import { RiskCalculator } from '../components/RiskCalculator.js';
import { PriceTicker } from '../components/PriceTicker.js';
import { AIChatModal } from '../components/AIChatModal.js';
import { apiClient } from '../services/apiClient.js';
import { socketService } from '../services/socketClient.js';
import { formatPrice, formatTime, formatVolume } from '../utils/formatters.js';
import {
  Bookmark,
  Bell,
  MessageSquare,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface AssetDetailPageProps {
  symbol: string;
  onBack: () => void;
  displayCurrency: DisplayCurrency;
  rates?: CurrencyRates | null;
  onAddToWatchlist: (symbol: string) => void;
  onOpenAlertModal: (symbol: string) => void;
}

export const AssetDetailPage: React.FC<AssetDetailPageProps> = ({
  symbol,
  onBack,
  displayCurrency,
  rates,
  onAddToWatchlist,
  onOpenAlertModal,
}) => {
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [multiTf, setMultiTf] = useState<MultiTimeframeSummary | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('candle');
  const [loading, setLoading] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen toggle and listeners
  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor');
  const [selectedColor, setSelectedColor] = useState<string>('#06B6D4');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingItem[][]>([]);

  // Indicators State
  const [activeIndicators, setActiveIndicators] = useState({
    sma20: true,
    sma50: true,
    sma200: false,
    ema20: false,
    ema50: false,
    bollinger: false,
    volume: true,
    supportResistance: true,
  });

  // 1. Initial Load for Asset Quote, Candles, Analysis, and Drawings
  const loadAssetData = async (tf: string = timeframe) => {
    setLoading(true);
    try {
      const [marketRes, candleRes, analysisRes, drawingsRes] = await Promise.allSettled([
        apiClient.getMarketBySymbol(symbol),
        apiClient.getCandles(symbol, tf, 140),
        apiClient.getAnalysis(symbol, tf),
        apiClient.getDrawings(symbol, tf),
      ]);

      if (marketRes.status === 'fulfilled' && marketRes.value.quote) {
        setQuote(marketRes.value.quote);
      }
      if (candleRes.status === 'fulfilled') {
        setCandles(candleRes.value);
      }
      if (analysisRes.status === 'fulfilled') {
        setTrendAnalysis(analysisRes.value.trend);
        setMultiTf(analysisRes.value.multiTf);
      }
      if (drawingsRes.status === 'fulfilled') {
        setDrawings(drawingsRes.value);
      }
    } catch (err: any) {
      console.warn('Error fetching asset data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssetData(timeframe);

    // Subscribe to real-time WebSocket ticker updates for this symbol
    const unsubscribe = socketService.subscribeTicker(symbol, (liveQuote: MarketQuote) => {
      setQuote(liveQuote);
      // Append or update latest candle close
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        last.close = liveQuote.price;
        if (liveQuote.price > last.high) last.high = liveQuote.price;
        if (liveQuote.price < last.low) last.low = liveQuote.price;
        return [...prev.slice(0, -1), last];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [symbol, timeframe]);

  // Drawing Handlers
  const handleDrawingsChange = (newDrawings: DrawingItem[]) => {
    setUndoStack((prev) => [...prev, drawings]);
    setDrawings(newDrawings);
    // Persist latest completed drawing to backend
    const latest = newDrawings[newDrawings.length - 1];
    if (latest && latest.isCompleted) {
      apiClient.saveDrawing(symbol, timeframe, latest);
    }
  };

  const handleUndoDrawing = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setDrawings(prev);
    setUndoStack((s) => s.slice(0, -1));
  };

  const handleClearDrawings = async () => {
    setUndoStack((prev) => [...prev, drawings]);
    setDrawings([]);
    await apiClient.clearDrawings(symbol, timeframe);
  };

  const handleToggleIndicator = (key: string) => {
    setActiveIndicators((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleResetIndicators = () => {
    setActiveIndicators({
      sma20: true,
      sma50: true,
      sma200: false,
      ema20: false,
      ema50: false,
      bollinger: false,
      volume: true,
      supportResistance: true,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="bg-dark-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Asset Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
              {symbol.slice(0, 3)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl text-slate-100">{quote?.name || symbol}</h1>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-dark-750 text-cyan-400 border border-slate-700 uppercase">
                  {symbol}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE TICKER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exchange: <span className="text-slate-200 uppercase">{quote?.exchange || 'Global'}</span> • Updated: {formatTime(quote?.lastUpdated)}
              </p>
            </div>
          </div>

          {/* Real-Time Price Statistics */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-dark-850 px-4 py-2.5 rounded-xl border border-slate-800 w-full lg:w-auto justify-between lg:justify-end">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Price</span>
              {quote ? (
                <PriceTicker
                  price={quote.price}
                  change24hPct={quote.change24hPct}
                  baseCurrency={quote.currency}
                  displayCurrency={displayCurrency}
                  rates={rates}
                  size="xl"
                />
              ) : (
                <div className="font-mono text-xl text-slate-500">Loading...</div>
              )}
            </div>

            <div className="hidden sm:block border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">24h High</span>
              <span className="font-mono text-sm font-bold text-slate-200">
                {formatPrice(quote?.high24h, quote?.currency)}
              </span>
            </div>

            <div className="hidden sm:block border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">24h Low</span>
              <span className="font-mono text-sm font-bold text-slate-200">
                {formatPrice(quote?.low24h, quote?.currency)}
              </span>
            </div>

            <div className="hidden sm:block border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">24h Volume</span>
              <span className="font-mono text-sm font-bold text-slate-200">
                {formatVolume(quote?.volume24h)}
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <button
                onClick={() => onAddToWatchlist(symbol)}
                title="Add to Watchlist"
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors"
              >
                <Bookmark size={15} />
              </button>

              <button
                onClick={() => onOpenAlertModal(symbol)}
                title="Set Alert"
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors"
              >
                <Bell size={15} />
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:opacity-95 shadow-glow-cyan transition-all"
              >
                <MessageSquare size={14} />
                <span>Ask AI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 bg-[#07090E] p-3 flex flex-col h-screen w-screen overflow-hidden shadow-2xl animate-in fade-in duration-200'
            : 'space-y-2'
        }
      >
        {/* Fullscreen Market Bar */}
        {isFullscreen && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-dark-900 border border-slate-800 rounded-t-xl mb-1 text-xs shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm text-slate-100">{quote?.name || symbol}</span>
              <span className="font-mono text-cyan-400 font-bold uppercase text-xs px-2 py-0.5 rounded bg-dark-800 border border-slate-700">
                {symbol}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE MARKET FEED
              </span>
              <span className="hidden md:inline text-slate-400 text-[11px]">
                Exchange: <strong className="text-slate-200 uppercase">{quote?.exchange || 'Global'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4">
              {quote && (
                <div className="flex items-center gap-3">
                  <PriceTicker
                    price={quote.price}
                    change24hPct={quote.change24hPct}
                    baseCurrency={quote.currency}
                    displayCurrency={displayCurrency}
                    rates={rates}
                    size="md"
                  />
                  <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 pl-3 border-l border-slate-800">
                    <span>H: {formatPrice(quote.high24h, quote.currency)}</span>
                    <span>L: {formatPrice(quote.low24h, quote.currency)}</span>
                    <span>Vol: {formatVolume(quote.volume24h)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleToggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 text-xs font-bold transition-all shadow-glow-cyan"
              >
                <span>Exit Full Screen (Esc)</span>
              </button>
            </div>
          </div>
        )}

        <ChartToolbar
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf)}
          chartType={chartType}
          onChartTypeChange={(t) => setChartType(t)}
          activeTool={activeTool}
          onToolSelect={(tool) => setActiveTool(tool)}
          selectedColor={selectedColor}
          onColorChange={(c) => setSelectedColor(c)}
          onClearDrawings={handleClearDrawings}
          onUndoDrawing={handleUndoDrawing}
          drawingsCount={drawings.length}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />

        <div className={`w-full relative ${isFullscreen ? 'flex-1 h-full min-h-0' : 'h-[520px]'}`}>
          {loading && candles.length === 0 ? (
            <div className="absolute inset-0 bg-dark-900 rounded-xl flex items-center justify-center text-cyan-400 gap-2 z-20 border border-slate-800">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm font-semibold">Loading real market candles for {symbol}...</span>
            </div>
          ) : null}

          <LightweightChartWrapper
            candles={candles}
            liveCandle={quote?.liveCandle}
            prevTickPrice={quote?.prevTickPrice}
            symbol={symbol}
            timeframe={timeframe}
            chartType={chartType}
            activeIndicators={activeIndicators}
            supportResistanceLevels={trendAnalysis?.supportResistance?.supports ? [
              ...trendAnalysis.supportResistance.supports,
              ...trendAnalysis.supportResistance.resistances,
            ] : []}
            activeTool={activeTool}
            drawings={drawings}
            onDrawingsChange={handleDrawingsChange}
            selectedColor={selectedColor}
          />
        </div>
      </div>

      {/* Indicator Controls Panel */}
      <IndicatorPanel
        indicators={trendAnalysis?.indicators || null}
        activeIndicators={activeIndicators}
        onToggleIndicator={handleToggleIndicator}
        onResetIndicators={handleResetIndicators}
      />

      {/* AI Market View & Support / Resistance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIAnalysisCard
          trend={trendAnalysis}
          symbol={symbol}
          onOpenChat={() => setIsChatOpen(true)}
        />
        <SupportResistancePanel
          sr={trendAnalysis?.supportResistance || null}
          currency={quote?.currency}
        />
      </div>

      {/* Trend Detection & Scoring Breakdown */}
      <TrendPanel
        trend={trendAnalysis}
        multiTf={multiTf}
      />

      {/* Risk Management Panel (Section 14) */}
      <RiskCalculator
        currentPrice={quote?.price || 100}
        currency={quote?.currency}
        defaultStopLoss={trendAnalysis?.supportResistance?.nearestSupport?.price}
      />

      {/* AI Chat Modal Dialog */}
      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        symbol={symbol}
      />
    </div>
  );
};
