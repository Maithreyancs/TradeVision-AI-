export interface SRLevel {
  level: 'S1' | 'S2' | 'S3' | 'R1' | 'R2' | 'R3';
  type: 'SUPPORT' | 'RESISTANCE';
  price: number;
  strength: number;
  touches: number;
  distance: number;
  distancePct: number;
  method: string;
}

export interface SupportResistanceResult {
  currentPrice: number;
  pivot: number;
  supports: SRLevel[];
  resistances: SRLevel[];
  nearestSupport: SRLevel | null;
  nearestResistance: SRLevel | null;
  calculationMethod: string;
}

export interface IndicatorResults {
  sma: {
    sma20: number | null;
    sma50: number | null;
    sma100: number | null;
    sma200: number | null;
  };
  ema: {
    ema9: number | null;
    ema20: number | null;
    ema50: number | null;
  };
  rsi: {
    value: number | null;
    condition: 'OVERSOLD' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'OVERBOUGHT';
  };
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
    cross: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE';
  };
  stochRsi: {
    k: number | null;
    d: number | null;
  };
  bollingerBands: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
    bandwidth: number | null;
  };
  atr: {
    value: number | null;
    percentage: number | null;
  };
  volume: {
    current: number;
    average20: number;
    ratio: number;
    isSpike: boolean;
  };
  vwap: {
    value: number | null;
  };
  adx: {
    adx: number | null;
    plusDI: number | null;
    minusDI: number | null;
    strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  };
}

export interface SignalDetail {
  indicator: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  weight: number;
  description: string;
}

export interface TrendAnalysis {
  symbol: string;
  timeframe: string;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  condition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  score: number;
  maxPossibleScore: number;
  confidence: number;
  signals: SignalDetail[];
  bullishSignals: string[];
  bearishSignals: string[];
  riskFactors: string[];
  keySignals: string[];
  indicators: IndicatorResults;
  supportResistance: SupportResistanceResult;
  aiMarketView: {
    title: string;
    summary: string;
    disclaimer: string;
  };
}

export interface TimeframeAnalysisItem {
  timeframe: string;
  condition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  score: number;
  confidence: number;
  rsi: number | null;
  macdCross: string;
}

export interface MultiTimeframeSummary {
  symbol: string;
  overallCondition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  overallScore: number;
  timeframes: TimeframeAnalysisItem[];
  concordanceRate: number;
  conflictSummary: string;
}
