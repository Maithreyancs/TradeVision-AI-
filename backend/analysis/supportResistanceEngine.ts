import { Candle } from '../providers/MarketDataProvider.js';

export interface SRLevel {
  level: 'S1' | 'S2' | 'S3' | 'R1' | 'R2' | 'R3';
  type: 'SUPPORT' | 'RESISTANCE';
  price: number;
  strength: number; // 1 to 10
  touches: number;
  distance: number; // absolute difference
  distancePct: number; // percentage difference from current price
  method: 'SWING_CLUSTER' | 'PIVOT_POINT' | 'VOLUME_NODE';
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

export class SupportResistanceEngine {
  /**
   * Identifies swing points, clusters them, combines with classical pivot points,
   * and computes S1-S3 and R1-R3 levels.
   */
  public static calculate(candles: Candle[], lookback: number = 60): SupportResistanceResult {
    if (candles.length === 0) {
      throw new Error('No candles provided for support/resistance calculation');
    }

    const currentCandle = candles[candles.length - 1];
    const currentPrice = currentCandle.close;
    const recentCandles = candles.slice(-lookback);

    // 1. Classical Floor Pivot Points from high/low/close of the window
    let maxHigh = -Infinity;
    let minLow = Infinity;
    for (const c of recentCandles) {
      if (c.high > maxHigh) maxHigh = c.high;
      if (c.low < minLow) minLow = c.low;
    }

    const pivotP = Number(((maxHigh + minLow + currentPrice) / 3).toFixed(4));
    const pivotR1 = Number((2 * pivotP - minLow).toFixed(4));
    const pivotS1 = Number((2 * pivotP - maxHigh).toFixed(4));
    const pivotR2 = Number((pivotP + (maxHigh - minLow)).toFixed(4));
    const pivotS2 = Number((pivotP - (maxHigh - minLow)).toFixed(4));
    const pivotR3 = Number((maxHigh + 2 * (pivotP - minLow)).toFixed(4));
    const pivotS3 = Number((minLow - 2 * (maxHigh - pivotP)).toFixed(4));

    // 2. Swing High and Low detection with price clustering
    const swingHighs: { price: number; volume: number; index: number }[] = [];
    const swingLows: { price: number; volume: number; index: number }[] = [];
    const window = 3; // pivot window size

    for (let i = window; i < recentCandles.length - window; i++) {
      const c = recentCandles[i];
      let isHigh = true;
      let isLow = true;

      for (let j = 1; j <= window; j++) {
        if (recentCandles[i - j].high >= c.high || recentCandles[i + j].high > c.high) {
          isHigh = false;
        }
        if (recentCandles[i - j].low <= c.low || recentCandles[i + j].low < c.low) {
          isLow = false;
        }
      }

      if (isHigh) {
        swingHighs.push({ price: c.high, volume: c.volume, index: i });
      }
      if (isLow) {
        swingLows.push({ price: c.low, volume: c.volume, index: i });
      }
    }

    // Function to cluster prices within a 0.75% tolerance
    const clusterPrices = (points: { price: number; volume: number }[]) => {
      const clusters: { price: number; count: number; totalVolume: number }[] = [];
      const tolerance = 0.008; // 0.8% threshold

      for (const pt of points) {
        let matched = false;
        for (const cluster of clusters) {
          if (Math.abs(cluster.price - pt.price) / cluster.price <= tolerance) {
            cluster.price = (cluster.price * cluster.count + pt.price) / (cluster.count + 1);
            cluster.count += 1;
            cluster.totalVolume += pt.volume;
            matched = true;
            break;
          }
        }
        if (!matched) {
          clusters.push({ price: pt.price, count: 1, totalVolume: pt.volume });
        }
      }
      return clusters;
    };

    const highClusters = clusterPrices(swingHighs);
    const lowClusters = clusterPrices(swingLows);

    // Filter clusters relative to current price
    const potentialResistances = highClusters
      .filter((c) => c.price > currentPrice)
      .sort((a, b) => a.price - b.price); // nearest to furthest

    const potentialSupports = lowClusters
      .filter((c) => c.price < currentPrice)
      .sort((a, b) => b.price - a.price); // nearest to furthest (descending)

    // Build S1, S2, S3
    const supportCandidates: { price: number; touches: number; strength: number; method: 'SWING_CLUSTER' | 'PIVOT_POINT' }[] = [];
    potentialSupports.forEach((s) => {
      supportCandidates.push({
        price: Number(s.price.toFixed(4)),
        touches: s.count,
        strength: Math.min(10, Math.max(3, s.count * 2 + 2)),
        method: 'SWING_CLUSTER',
      });
    });

    // Fallbacks from pivot points if not enough swing clusters
    if (supportCandidates.length < 1 && pivotS1 < currentPrice) {
      supportCandidates.push({ price: pivotS1, touches: 2, strength: 6, method: 'PIVOT_POINT' });
    }
    if (supportCandidates.length < 2 && pivotS2 < currentPrice) {
      supportCandidates.push({ price: pivotS2, touches: 2, strength: 7, method: 'PIVOT_POINT' });
    }
    if (supportCandidates.length < 3 && pivotS3 < currentPrice) {
      supportCandidates.push({ price: pivotS3, touches: 1, strength: 5, method: 'PIVOT_POINT' });
    }

    // Build R1, R2, R3
    const resistanceCandidates: { price: number; touches: number; strength: number; method: 'SWING_CLUSTER' | 'PIVOT_POINT' }[] = [];
    potentialResistances.forEach((r) => {
      resistanceCandidates.push({
        price: Number(r.price.toFixed(4)),
        touches: r.count,
        strength: Math.min(10, Math.max(3, r.count * 2 + 2)),
        method: 'SWING_CLUSTER',
      });
    });

    if (resistanceCandidates.length < 1 && pivotR1 > currentPrice) {
      resistanceCandidates.push({ price: pivotR1, touches: 2, strength: 6, method: 'PIVOT_POINT' });
    }
    if (resistanceCandidates.length < 2 && pivotR2 > currentPrice) {
      resistanceCandidates.push({ price: pivotR2, touches: 2, strength: 7, method: 'PIVOT_POINT' });
    }
    if (resistanceCandidates.length < 3 && pivotR3 > currentPrice) {
      resistanceCandidates.push({ price: pivotR3, touches: 1, strength: 5, method: 'PIVOT_POINT' });
    }

    // Ensure we have exactly 3 supports and 3 resistances
    const sLevels: ('S1' | 'S2' | 'S3')[] = ['S1', 'S2', 'S3'];
    const rLevels: ('R1' | 'R2' | 'R3')[] = ['R1', 'R2', 'R3'];

    const supports: SRLevel[] = [];
    for (let i = 0; i < 3; i++) {
      const cand = supportCandidates[i] || {
        price: Number((currentPrice * (1 - 0.015 * (i + 1))).toFixed(4)),
        touches: 1,
        strength: 5,
        method: 'PIVOT_POINT' as const,
      };
      const dist = Math.abs(currentPrice - cand.price);
      supports.push({
        level: sLevels[i],
        type: 'SUPPORT',
        price: cand.price,
        strength: cand.strength,
        touches: cand.touches,
        distance: Number(dist.toFixed(4)),
        distancePct: Number(((dist / currentPrice) * 100).toFixed(2)),
        method: cand.method,
      });
    }

    const resistances: SRLevel[] = [];
    for (let i = 0; i < 3; i++) {
      const cand = resistanceCandidates[i] || {
        price: Number((currentPrice * (1 + 0.015 * (i + 1))).toFixed(4)),
        touches: 1,
        strength: 5,
        method: 'PIVOT_POINT' as const,
      };
      const dist = Math.abs(cand.price - currentPrice);
      resistances.push({
        level: rLevels[i],
        type: 'RESISTANCE',
        price: cand.price,
        strength: cand.strength,
        touches: cand.touches,
        distance: Number(dist.toFixed(4)),
        distancePct: Number(((dist / currentPrice) * 100).toFixed(2)),
        method: cand.method,
      });
    }

    return {
      currentPrice,
      pivot: pivotP,
      supports,
      resistances,
      nearestSupport: supports[0] || null,
      nearestResistance: resistances[0] || null,
      calculationMethod: 'Algorithmically detected via Swing Clusters & Pivot Points',
    };
  }
}
