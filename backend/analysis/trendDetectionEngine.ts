import { Candle } from '../providers/MarketDataProvider.js';
import { TechnicalIndicators, IndicatorResults } from './technicalIndicators.js';
import { SupportResistanceEngine, SupportResistanceResult } from './supportResistanceEngine.js';

export interface SignalDetail {
  indicator: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  weight: number;
  description: string;
}

export interface TrendAnalysisResult {
  symbol: string;
  timeframe: string;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  condition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  score: number; // e.g. +4.5 or -3.0
  maxPossibleScore: number;
  confidence: number; // 0 to 100 percentage
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

export class TrendDetectionEngine {
  public static analyze(
    symbol: string,
    candles: Candle[],
    timeframe: string = '1h'
  ): TrendAnalysisResult {
    if (candles.length < 20) {
      throw new Error(`Insufficient candle data for ${symbol} to perform comprehensive trend analysis`);
    }

    const currentPrice = candles[candles.length - 1].close;
    const indicators = TechnicalIndicators.computeAll(candles);
    const sr = SupportResistanceEngine.calculate(candles);

    const signals: SignalDetail[] = [];
    const bullishSignals: string[] = [];
    const bearishSignals: string[] = [];
    const riskFactors: string[] = [];

    // 1. EMA Trend Signal (Weight: 2.0)
    const ema20 = indicators.ema.ema20;
    const ema50 = indicators.ema.ema50;
    if (ema20 !== null && ema50 !== null) {
      if (currentPrice > ema20 && ema20 > ema50) {
        signals.push({
          indicator: 'EMA Structure',
          sentiment: 'BULLISH',
          score: 2.0,
          weight: 2.0,
          description: `Price (${currentPrice}) is above EMA 20 (${ema20}) and EMA 50 (${ema50}) indicating upward momentum.`,
        });
        bullishSignals.push(`Price trading above EMA 20 & EMA 50 upward alignment`);
      } else if (currentPrice < ema20 && ema20 < ema50) {
        signals.push({
          indicator: 'EMA Structure',
          sentiment: 'BEARISH',
          score: -2.0,
          weight: 2.0,
          description: `Price (${currentPrice}) is below EMA 20 (${ema20}) and EMA 50 (${ema50}) indicating downward pressure.`,
        });
        bearishSignals.push(`Price trading below EMA 20 & EMA 50 downward alignment`);
      } else {
        signals.push({
          indicator: 'EMA Structure',
          sentiment: 'NEUTRAL',
          score: 0.0,
          weight: 2.0,
          description: `Price is oscillating between EMA 20 (${ema20}) and EMA 50 (${ema50}).`,
        });
      }
    }

    // 2. MACD Signal (Weight: 1.5)
    const macd = indicators.macd;
    if (macd.macd !== null && macd.signal !== null && macd.histogram !== null) {
      if (macd.histogram > 0 && macd.macd > macd.signal) {
        signals.push({
          indicator: 'MACD',
          sentiment: 'BULLISH',
          score: 1.5,
          weight: 1.5,
          description: `MACD line (${macd.macd}) is above Signal (${macd.signal}) with positive histogram expansion (${macd.histogram}).`,
        });
        bullishSignals.push(`MACD positive histogram with bullish divergence`);
      } else if (macd.histogram < 0 && macd.macd < macd.signal) {
        signals.push({
          indicator: 'MACD',
          sentiment: 'BEARISH',
          score: -1.5,
          weight: 1.5,
          description: `MACD line (${macd.macd}) is below Signal (${macd.signal}) with negative histogram (${macd.histogram}).`,
        });
        bearishSignals.push(`MACD negative histogram with bearish crossover`);
      } else {
        signals.push({
          indicator: 'MACD',
          sentiment: 'NEUTRAL',
          score: 0.0,
          weight: 1.5,
          description: `MACD momentum is flat or converging near zero.`,
        });
      }
    }

    // 3. RSI Confirmation (Weight: 1.5)
    const rsi = indicators.rsi.value;
    if (rsi !== null) {
      if (rsi > 70) {
        signals.push({
          indicator: 'RSI (14)',
          sentiment: 'NEUTRAL',
          score: -0.5,
          weight: 1.5,
          description: `RSI is at ${rsi} (Overbought region > 70). Risk of near-term consolidation or pullback.`,
        });
        riskFactors.push(`RSI is at ${rsi} (Overbought territory, elevated reversal risk)`);
      } else if (rsi < 30) {
        signals.push({
          indicator: 'RSI (14)',
          sentiment: 'NEUTRAL',
          score: 0.5,
          weight: 1.5,
          description: `RSI is at ${rsi} (Oversold region < 30). Potential for technical bounce.`,
        });
        riskFactors.push(`RSI is at ${rsi} (Oversold territory, heavy selling pressure)`);
      } else if (rsi >= 54) {
        signals.push({
          indicator: 'RSI (14)',
          sentiment: 'BULLISH',
          score: 1.0,
          weight: 1.5,
          description: `RSI is at ${rsi}, sustaining bullish control above 50 midline.`,
        });
        bullishSignals.push(`RSI (${rsi}) reflects sustained buyer momentum`);
      } else if (rsi <= 46) {
        signals.push({
          indicator: 'RSI (14)',
          sentiment: 'BEARISH',
          score: -1.0,
          weight: 1.5,
          description: `RSI is at ${rsi}, sustaining bearish control below 50 midline.`,
        });
        bearishSignals.push(`RSI (${rsi}) reflects seller dominance below midline`);
      } else {
        signals.push({
          indicator: 'RSI (14)',
          sentiment: 'NEUTRAL',
          score: 0.0,
          weight: 1.5,
          description: `RSI is at ${rsi}, neutral equilibrium.`,
        });
      }
    }

    // 4. SMA Long-Term Trend (Weight: 1.5)
    const sma50 = indicators.sma.sma50;
    const sma200 = indicators.sma.sma200;
    if (sma50 !== null) {
      if (sma200 !== null && sma50 > sma200 && currentPrice > sma50) {
        signals.push({
          indicator: 'SMA Golden Alignment',
          sentiment: 'BULLISH',
          score: 1.5,
          weight: 1.5,
          description: `SMA 50 (${sma50}) is above SMA 200 (${sma200}) with price holding above both.`,
        });
        bullishSignals.push(`Long-term SMA 50 / SMA 200 golden trend posture`);
      } else if (sma200 !== null && sma50 < sma200 && currentPrice < sma50) {
        signals.push({
          indicator: 'SMA Death Alignment',
          sentiment: 'BEARISH',
          score: -1.5,
          weight: 1.5,
          description: `SMA 50 (${sma50}) is below SMA 200 (${sma200}) with price held down.`,
        });
        bearishSignals.push(`Long-term SMA 50 / SMA 200 death cross alignment`);
      } else if (currentPrice > sma50) {
        signals.push({
          indicator: 'SMA 50',
          sentiment: 'BULLISH',
          score: 1.0,
          weight: 1.0,
          description: `Price is holding above intermediate SMA 50 (${sma50}).`,
        });
        bullishSignals.push(`Price established above intermediate SMA 50`);
      } else {
        signals.push({
          indicator: 'SMA 50',
          sentiment: 'BEARISH',
          score: -1.0,
          weight: 1.0,
          description: `Price is capped below intermediate SMA 50 (${sma50}).`,
        });
        bearishSignals.push(`Price rejected below intermediate SMA 50`);
      }
    }

    // 5. Price Action: Swings (Higher Highs / Lower Lows) (Weight: 1.5)
    const last10 = candles.slice(-10);
    const firstHalfHigh = Math.max(...last10.slice(0, 5).map((c) => c.high));
    const secondHalfHigh = Math.max(...last10.slice(5).map((c) => c.high));
    const firstHalfLow = Math.min(...last10.slice(0, 5).map((c) => c.low));
    const secondHalfLow = Math.min(...last10.slice(5).map((c) => c.low));

    if (secondHalfHigh > firstHalfHigh && secondHalfLow > firstHalfLow) {
      signals.push({
        indicator: 'Price Action',
        sentiment: 'BULLISH',
        score: 1.5,
        weight: 1.5,
        description: `Structure exhibits consecutive Higher Highs and Higher Lows.`,
      });
      bullishSignals.push(`Consecutive Higher Highs and Higher Lows confirmed`);
    } else if (secondHalfHigh < firstHalfHigh && secondHalfLow < firstHalfLow) {
      signals.push({
        indicator: 'Price Action',
        sentiment: 'BEARISH',
        score: -1.5,
        weight: 1.5,
        description: `Structure exhibits consecutive Lower Highs and Lower Lows.`,
      });
      bearishSignals.push(`Consecutive Lower Highs and Lower Lows confirmed`);
    } else {
      signals.push({
        indicator: 'Price Action',
        sentiment: 'NEUTRAL',
        score: 0.0,
        weight: 1.5,
        description: `Range-bound or compressing price structure.`,
      });
    }

    // 6. ADX Trend Strength Check (Weight: 1.0)
    const adx = indicators.adx;
    if (adx.adx !== null && adx.plusDI !== null && adx.minusDI !== null) {
      if (adx.adx >= 25) {
        if (adx.plusDI > adx.minusDI) {
          signals.push({
            indicator: 'ADX Trend Strength',
            sentiment: 'BULLISH',
            score: 1.0,
            weight: 1.0,
            description: `ADX at ${adx.adx} indicates a strong active bullish trend (+DI > -DI).`,
          });
          bullishSignals.push(`ADX trend strength (${adx.adx}) confirms upward conviction`);
        } else {
          signals.push({
            indicator: 'ADX Trend Strength',
            sentiment: 'BEARISH',
            score: -1.0,
            weight: 1.0,
            description: `ADX at ${adx.adx} indicates a strong active bearish trend (-DI > +DI).`,
          });
          bearishSignals.push(`ADX trend strength (${adx.adx}) confirms downward conviction`);
        }
      } else {
        signals.push({
          indicator: 'ADX Trend Strength',
          sentiment: 'NEUTRAL',
          score: 0.0,
          weight: 1.0,
          description: `ADX at ${adx.adx} indicates a weak or sideways market consolidation.`,
        });
      }
    }

    // 7. Volume Activity (Weight: 1.0)
    if (indicators.volume.isSpike) {
      riskFactors.push(`Unusual volume expansion (${indicators.volume.ratio}x 20-period average) - monitor for volatility`);
    }

    // 8. Support / Resistance proximity risk
    if (sr.nearestResistance && sr.nearestResistance.distancePct < 1.0) {
      riskFactors.push(`Price is within ${sr.nearestResistance.distancePct}% of immediate resistance level ${sr.nearestResistance.level} (${sr.nearestResistance.price})`);
    }
    if (sr.nearestSupport && sr.nearestSupport.distancePct < 1.0) {
      riskFactors.push(`Price is within ${sr.nearestSupport.distancePct}% of immediate support level ${sr.nearestSupport.level} (${sr.nearestSupport.price})`);
    }

    // Aggregate Score
    const totalScore = Number(signals.reduce((acc, s) => acc + s.score, 0).toFixed(2));
    const maxPossibleScore = Number(signals.reduce((acc, s) => acc + s.weight, 0).toFixed(2));

    // Classification
    let direction: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
    let condition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';

    if (totalScore >= 2.0) {
      direction = 'UP';
      condition = 'BULLISH';
    } else if (totalScore <= -2.0) {
      direction = 'DOWN';
      condition = 'BEARISH';
    } else {
      direction = 'SIDEWAYS';
      condition = 'SIDEWAYS';
    }

    // Calculate confidence percentage (normalized ratio of conviction)
    const absoluteScore = Math.abs(totalScore);
    const confidencePct = Math.min(94, Math.max(48, Math.round(50 + (absoluteScore / maxPossibleScore) * 44)));

    // Generate balanced AI synthesis summary obeying section 28 non-dogmatic standards
    let aiTitle = '';
    let aiSummary = '';

    if (condition === 'BULLISH') {
      aiTitle = `Technical signals currently lean bullish for ${symbol}`;
      aiSummary = `Current technical indicators across moving averages, momentum oscillators, and volume reflect an upward bias on the ${timeframe} timeframe. Key dynamic support is monitored around ${sr.nearestSupport ? sr.nearestSupport.price : 'local lows'}.`;
    } else if (condition === 'BEARISH') {
      aiTitle = `Bearish pressure is visible on the ${timeframe} timeframe`;
      aiSummary = `Technical structure shows prevailing downward alignment, with sellers maintaining pressure below key moving averages. Immediate overhead resistance stands near ${sr.nearestResistance ? sr.nearestResistance.price : 'local highs'}.`;
    } else {
      aiTitle = `Several technical signals conflict, indicating sideways equilibrium`;
      aiSummary = `Price action is oscillating within a consolidation range between support at ${sr.nearestSupport?.price ?? 'support'} and resistance at ${sr.nearestResistance?.price ?? 'resistance'}, lacking clear directional breakout conviction.`;
    }

    const keySignals = [
      ...bullishSignals.slice(0, 2),
      ...bearishSignals.slice(0, 2),
      ...riskFactors.slice(0, 2),
    ];

    return {
      symbol,
      timeframe,
      direction,
      condition,
      score: totalScore,
      maxPossibleScore,
      confidence: confidencePct,
      signals,
      bullishSignals,
      bearishSignals,
      riskFactors,
      keySignals,
      indicators,
      supportResistance: sr,
      aiMarketView: {
        title: aiTitle,
        summary: aiSummary,
        disclaimer: 'Market analysis and AI-generated signals are for informational and educational purposes only. They are not financial advice and do not guarantee future market movements.',
      },
    };
  }
}
