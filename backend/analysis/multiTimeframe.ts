import { providerRegistry } from '../providers/ProviderRegistry.js';
import { TrendDetectionEngine, TrendAnalysisResult } from './trendDetectionEngine.js';

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
  concordanceRate: number; // percentage of timeframes in agreement
  conflictSummary: string;
}

export class MultiTimeframeAnalysis {
  public static async analyzeAll(symbol: string): Promise<MultiTimeframeSummary> {
    const timeframes = ['5m', '15m', '1h', '4h', '1d', '1w'];
    const results: TimeframeAnalysisItem[] = [];

    // Weights: higher timeframes carry slightly more weight for macro trend
    const weights: Record<string, number> = {
      '5m': 0.8,
      '15m': 1.0,
      '1h': 1.2,
      '4h': 1.5,
      '1d': 1.8,
      '1w': 1.5,
    };

    let weightedScoreSum = 0;
    let totalWeight = 0;
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    for (const tf of timeframes) {
      try {
        const candles = await providerRegistry.getHistoricalCandles(symbol, tf, 60);
        if (candles && candles.length >= 20) {
          const analysis = TrendDetectionEngine.analyze(symbol, candles, tf);
          results.push({
            timeframe: tf,
            condition: analysis.condition,
            direction: analysis.direction,
            score: analysis.score,
            confidence: analysis.confidence,
            rsi: analysis.indicators.rsi.value,
            macdCross: analysis.indicators.macd.cross,
          });

          const w = weights[tf] || 1.0;
          weightedScoreSum += analysis.score * w;
          totalWeight += w;

          if (analysis.condition === 'BULLISH') bullishCount++;
          else if (analysis.condition === 'BEARISH') bearishCount++;
          else neutralCount++;
        }
      } catch (err: any) {
        // If specific timeframe fails, skip gracefully
      }
    }

    const overallScore = totalWeight > 0 ? Number((weightedScoreSum / totalWeight).toFixed(2)) : 0;
    let overallCondition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
    if (overallScore >= 1.5) overallCondition = 'BULLISH';
    else if (overallScore <= -1.5) overallCondition = 'BEARISH';

    const maxAgreed = Math.max(bullishCount, bearishCount, neutralCount);
    const concordanceRate = results.length > 0 ? Math.round((maxAgreed / results.length) * 100) : 50;

    let conflictSummary = 'Timeframes are largely in agreement.';
    if (bullishCount > 0 && bearishCount > 0) {
      conflictSummary = `Divergence observed: ${bullishCount} timeframes bullish vs ${bearishCount} bearish. Lower timeframes may be counter-trending against higher timeframe bias.`;
    }

    return {
      symbol,
      overallCondition,
      overallScore,
      timeframes: results,
      concordanceRate,
      conflictSummary,
    };
  }
}
