import { Candle } from '../providers/MarketDataProvider.js';

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

export class TechnicalIndicators {
  public static calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, p) => acc + p, 0);
    return Number((sum / period).toFixed(4));
  }

  public static calculateSMASeries(prices: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, p) => acc + p, 0);
        result.push(Number((sum / period).toFixed(4)));
      }
    }
    return result;
  }

  public static calculateEMASeries(prices: number[], period: number): (number | null)[] {
    if (prices.length < period) return prices.map(() => null);
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    // Initial SMA for first EMA seed
    let firstSMA = 0;
    for (let i = 0; i < period; i++) {
      firstSMA += prices[i];
      if (i < period - 1) {
        result.push(null);
      }
    }
    firstSMA /= period;
    result.push(Number(firstSMA.toFixed(4)));

    let prevEMA = firstSMA;
    for (let i = period; i < prices.length; i++) {
      const currentEMA = (prices[i] - prevEMA) * multiplier + prevEMA;
      result.push(Number(currentEMA.toFixed(4)));
      prevEMA = currentEMA;
    }

    return result;
  }

  public static calculateEMA(prices: number[], period: number): number | null {
    const series = this.calculateEMASeries(prices, period);
    return series.length > 0 ? series[series.length - 1] : null;
  }

  public static calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length <= period) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return Number(rsi.toFixed(2));
  }

  public static calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): { macd: number | null; signal: number | null; histogram: number | null; cross: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE' } {
    if (prices.length < slowPeriod + signalPeriod) {
      return { macd: null, signal: null, histogram: null, cross: 'NONE' };
    }

    const fastEMA = this.calculateEMASeries(prices, fastPeriod);
    const slowEMA = this.calculateEMASeries(prices, slowPeriod);

    const macdLine: (number | null)[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (fastEMA[i] !== null && slowEMA[i] !== null) {
        macdLine.push(Number((fastEMA[i]! - slowEMA[i]!).toFixed(4)));
      } else {
        macdLine.push(null);
      }
    }

    const validMacdValues = macdLine.filter((v): v is number => v !== null);
    if (validMacdValues.length < signalPeriod) {
      return { macd: null, signal: null, histogram: null, cross: 'NONE' };
    }

    const signalSeries = this.calculateEMASeries(validMacdValues, signalPeriod);
    const currentMacd = validMacdValues[validMacdValues.length - 1];
    const prevMacd = validMacdValues.length > 1 ? validMacdValues[validMacdValues.length - 2] : null;
    const currentSignal = signalSeries[signalSeries.length - 1];
    const prevSignal = signalSeries.length > 1 ? signalSeries[signalSeries.length - 2] : null;

    const histogram = currentMacd !== null && currentSignal !== null ? Number((currentMacd - currentSignal).toFixed(4)) : null;

    let cross: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE' = 'NONE';
    if (prevMacd !== null && prevSignal !== null && currentMacd !== null && currentSignal !== null) {
      if (prevMacd <= prevSignal && currentMacd > currentSignal) {
        cross = 'BULLISH_CROSS';
      } else if (prevMacd >= prevSignal && currentMacd < currentSignal) {
        cross = 'BEARISH_CROSS';
      }
    }

    return { macd: currentMacd, signal: currentSignal, histogram, cross };
  }

  public static calculateStochRSI(
    prices: number[],
    rsiPeriod: number = 14,
    stochPeriod: number = 14,
    kPeriod: number = 3,
    dPeriod: number = 3
  ): { k: number | null; d: number | null } {
    if (prices.length < rsiPeriod + stochPeriod + kPeriod + dPeriod) {
      return { k: null, d: null };
    }

    // Generate rolling RSI series
    const rsiSeries: number[] = [];
    for (let i = rsiPeriod + 1; i <= prices.length; i++) {
      const slice = prices.slice(0, i);
      const r = this.calculateRSI(slice, rsiPeriod);
      if (r !== null) rsiSeries.push(r);
    }

    if (rsiSeries.length < stochPeriod) {
      return { k: null, d: null };
    }

    const stochSeries: number[] = [];
    for (let i = stochPeriod - 1; i < rsiSeries.length; i++) {
      const window = rsiSeries.slice(i - stochPeriod + 1, i + 1);
      const minRsi = Math.min(...window);
      const maxRsi = Math.max(...window);
      const currentRsi = window[window.length - 1];
      const stoch = maxRsi === minRsi ? 50 : ((currentRsi - minRsi) / (maxRsi - minRsi)) * 100;
      stochSeries.push(stoch);
    }

    const kValues = this.calculateSMASeries(stochSeries, kPeriod).filter((v): v is number => v !== null);
    const dValues = this.calculateSMASeries(kValues, dPeriod).filter((v): v is number => v !== null);

    const k = kValues.length > 0 ? Number(kValues[kValues.length - 1].toFixed(2)) : null;
    const d = dValues.length > 0 ? Number(dValues[dValues.length - 1].toFixed(2)) : null;

    return { k, d };
  }

  public static calculateBollingerBands(
    prices: number[],
    period: number = 20,
    multiplier: number = 2
  ): { upper: number | null; middle: number | null; lower: number | null; bandwidth: number | null } {
    if (prices.length < period) {
      return { upper: null, middle: null, lower: null, bandwidth: null };
    }

    const slice = prices.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;

    const variance = slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = middle + multiplier * stdDev;
    const lower = middle - multiplier * stdDev;
    const bandwidth = middle > 0 ? ((upper - lower) / middle) * 100 : 0;

    return {
      upper: Number(upper.toFixed(4)),
      middle: Number(middle.toFixed(4)),
      lower: Number(lower.toFixed(4)),
      bandwidth: Number(bandwidth.toFixed(2)),
    };
  }

  public static calculateATR(candles: Candle[], period: number = 14): { value: number | null; percentage: number | null } {
    if (candles.length < period + 1) {
      return { value: null, percentage: null };
    }

    const trueRanges: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const prev = candles[i - 1];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - prev.close),
        Math.abs(current.low - prev.close)
      );
      trueRanges.push(tr);
    }

    const atrSlice = trueRanges.slice(-period);
    const atr = atrSlice.reduce((a, b) => a + b, 0) / period;
    const currentClose = candles[candles.length - 1].close;
    const percentage = currentClose > 0 ? (atr / currentClose) * 100 : 0;

    return {
      value: Number(atr.toFixed(4)),
      percentage: Number(percentage.toFixed(2)),
    };
  }

  public static calculateVWAP(candles: Candle[]): number | null {
    if (candles.length === 0) return null;
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (const c of candles) {
      const typicalPrice = (c.high + c.low + c.close) / 3;
      cumulativeTPV += typicalPrice * c.volume;
      cumulativeVolume += c.volume;
    }

    return cumulativeVolume > 0 ? Number((cumulativeTPV / cumulativeVolume).toFixed(4)) : null;
  }

  public static calculateADX(candles: Candle[], period: number = 14): { adx: number | null; plusDI: number | null; minusDI: number | null; strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' } {
    if (candles.length < period * 2) {
      return { adx: null, plusDI: null, minusDI: null, strength: 'MODERATE' };
    }

    const tr: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const curr = candles[i];
      const prev = candles[i - 1];

      const upMove = curr.high - prev.high;
      const downMove = prev.low - curr.low;

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

      const trueRange = Math.max(
        curr.high - curr.low,
        Math.abs(curr.high - prev.close),
        Math.abs(curr.low - prev.close)
      );
      tr.push(trueRange);
    }

    const smoothedTR = tr.slice(-period).reduce((a, b) => a + b, 0);
    const smoothedPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0);
    const smoothedMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0);

    if (smoothedTR === 0) {
      return { adx: null, plusDI: null, minusDI: null, strength: 'WEAK' };
    }

    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = (smoothedMinusDM / smoothedTR) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;

    const adx = Number(dx.toFixed(2));
    let strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' = 'WEAK';
    if (adx > 40) strength = 'VERY_STRONG';
    else if (adx > 25) strength = 'STRONG';
    else if (adx > 18) strength = 'MODERATE';

    return {
      adx,
      plusDI: Number(plusDI.toFixed(2)),
      minusDI: Number(minusDI.toFixed(2)),
      strength,
    };
  }

  public static computeAll(candles: Candle[]): IndicatorResults {
    if (candles.length === 0) {
      throw new Error('No candles provided for technical calculation');
    }

    const closes = candles.map((c) => c.close);
    const volumes = candles.map((c) => c.volume);
    const currentPrice = closes[closes.length - 1];

    // Moving Averages
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma100 = this.calculateSMA(closes, 100);
    const sma200 = this.calculateSMA(closes, 200);

    const ema9 = this.calculateEMA(closes, 9);
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, 50);

    // RSI
    const rsiVal = this.calculateRSI(closes, 14);
    let rsiCondition: 'OVERSOLD' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'OVERBOUGHT' = 'NEUTRAL';
    if (rsiVal !== null) {
      if (rsiVal >= 70) rsiCondition = 'OVERBOUGHT';
      else if (rsiVal >= 55) rsiCondition = 'BULLISH';
      else if (rsiVal <= 30) rsiCondition = 'OVERSOLD';
      else if (rsiVal <= 45) rsiCondition = 'BEARISH';
    }

    // MACD
    const macdResult = this.calculateMACD(closes);

    // Stoch RSI
    const stochRsiResult = this.calculateStochRSI(closes);

    // Bollinger Bands
    const bb = this.calculateBollingerBands(closes, 20, 2);

    // ATR
    const atr = this.calculateATR(candles, 14);

    // Volume
    const currentVol = volumes[volumes.length - 1];
    const vol20Slice = volumes.slice(-20);
    const avgVol = vol20Slice.reduce((a, b) => a + b, 0) / (vol20Slice.length || 1);
    const volRatio = avgVol > 0 ? currentVol / avgVol : 1;

    // VWAP
    const vwapVal = this.calculateVWAP(candles);

    // ADX
    const adxResult = this.calculateADX(candles, 14);

    return {
      sma: { sma20, sma50, sma100, sma200 },
      ema: { ema9, ema20, ema50 },
      rsi: { value: rsiVal, condition: rsiCondition },
      macd: macdResult,
      stochRsi: stochRsiResult,
      bollingerBands: bb,
      atr,
      volume: {
        current: currentVol,
        average20: Number(avgVol.toFixed(2)),
        ratio: Number(volRatio.toFixed(2)),
        isSpike: volRatio >= 1.5,
      },
      vwap: { value: vwapVal },
      adx: adxResult,
    };
  }
}
