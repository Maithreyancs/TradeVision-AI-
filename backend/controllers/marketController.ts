import { Request, Response } from 'express';
import prisma from '../database/prismaClient.js';
import { providerRegistry } from '../providers/ProviderRegistry.js';
import { TrendDetectionEngine } from '../analysis/trendDetectionEngine.js';
import { TechnicalIndicators } from '../analysis/technicalIndicators.js';
import { SupportResistanceEngine } from '../analysis/supportResistanceEngine.js';
import { MultiTimeframeAnalysis } from '../analysis/multiTimeframe.js';

export class MarketController {
  public static async getMarkets(req: Request, res: Response): Promise<void> {
    try {
      const assetClass = req.query.class as string | undefined;
      const search = req.query.search as string | undefined;

      const whereClause: any = {};
      if (assetClass && assetClass !== 'all') {
        whereClause.assetClass = assetClass;
      }
      if (search) {
        whereClause.OR = [
          { symbol: { contains: search } },
          { name: { contains: search } },
        ];
      }

      const assets = await prisma.asset.findMany({
        where: whereClause,
        orderBy: [{ isPopular: 'desc' }, { symbol: 'asc' }],
      });

      // Fetch live quotes for assets in parallel with error tolerance
      const quotesPromises = assets.map(async (asset) => {
        try {
          const q = await providerRegistry.getQuote(asset.symbol);
          if (q) {
            return {
              ...q,
              id: asset.id,
              assetClass: asset.assetClass,
              isPopular: asset.isPopular,
            };
          }
          return null;
        } catch {
          return null;
        }
      });

      const rawQuotes = await Promise.all(quotesPromises);
      const quotes = rawQuotes.filter((q): q is NonNullable<typeof q> => q !== null);

      // Hero assets requested in prompt: BTC, ETH, NIFTY 50, GOLD, S&P 500
      const heroSymbols = ['BTCUSDT', 'ETHUSDT', '^NSEI', 'GC=F', '^GSPC'];
      const heroCards = heroSymbols
        .map((s) => quotes.find((q) => q.symbol === s))
        .filter((q): q is NonNullable<typeof q> => q !== null);

      // Top gainers (positive change sorted descending)
      const topGainers = [...quotes]
        .filter((q) => q.change24hPct > 0)
        .sort((a, b) => b.change24hPct - a.change24hPct)
        .slice(0, 5);

      // Top losers (negative change sorted ascending)
      const topLosers = [...quotes]
        .filter((q) => q.change24hPct < 0)
        .sort((a, b) => a.change24hPct - b.change24hPct)
        .slice(0, 5);

      // Most active by volume
      const mostActive = [...quotes]
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 5);

      // Trending (highest absolute change)
      const trending = [...quotes]
        .sort((a, b) => Math.abs(b.change24hPct) - Math.abs(a.change24hPct))
        .slice(0, 5);

      res.json({
        markets: quotes,
        heroCards,
        topGainers,
        topLosers,
        mostActive,
        trending,
        total: quotes.length,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('getMarkets error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch markets' });
    }
  }

  public static async getMarketBySymbol(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.params.symbol as string;
      const quote = await providerRegistry.getQuote(symbol);
      if (!quote) {
        res.status(404).json({ error: 'Market data temporarily unavailable' });
        return;
      }

      const details = await providerRegistry.getMarketDetails(symbol);

      res.json({
        quote,
        details,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Market data temporarily unavailable' });
    }
  }

  public static async getMarketCandles(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.params.symbol as string;
      const timeframe = (req.query.timeframe as string) || '1h';
      const limit = parseInt(req.query.limit as string) || 120;

      const candles = await providerRegistry.getHistoricalCandles(symbol, timeframe, limit);

      if (!candles || candles.length === 0) {
        res.status(404).json({ error: 'Historical candle data temporarily unavailable' });
        return;
      }

      res.json({
        symbol,
        timeframe,
        candles,
        count: candles.length,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch market candles' });
    }
  }

  public static async getMarketAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.params.symbol as string;
      const timeframe = (req.query.timeframe as string) || '1h';

      const candles = await providerRegistry.getHistoricalCandles(symbol, timeframe, 120);
      if (!candles || candles.length < 20) {
        res.status(404).json({ error: 'Insufficient candle data for analysis' });
        return;
      }

      const quote = await providerRegistry.getQuote(symbol);
      const trend = TrendDetectionEngine.analyze(symbol, candles, timeframe);
      const multiTf = await MultiTimeframeAnalysis.analyzeAll(symbol);

      res.json({
        quote,
        trend,
        multiTf,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to calculate market analysis' });
    }
  }

  public static async getMarketIndicators(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.params.symbol as string;
      const timeframe = (req.query.timeframe as string) || '1h';

      const candles = await providerRegistry.getHistoricalCandles(symbol, timeframe, 120);
      if (!candles || candles.length < 20) {
        res.status(404).json({ error: 'Insufficient candle data for indicators' });
        return;
      }

      const indicators = TechnicalIndicators.computeAll(candles);
      res.json({ symbol, timeframe, indicators, timestamp: Date.now() });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to compute indicators' });
    }
  }

  public static async getMarketSupportResistance(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.params.symbol as string;
      const timeframe = (req.query.timeframe as string) || '1h';

      const candles = await providerRegistry.getHistoricalCandles(symbol, timeframe, 120);
      if (!candles || candles.length < 20) {
        res.status(404).json({ error: 'Insufficient candle data for support/resistance' });
        return;
      }

      const sr = SupportResistanceEngine.calculate(candles);
      res.json({ symbol, timeframe, ...sr, timestamp: Date.now() });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to compute support/resistance' });
    }
  }

  public static async getMarketTrend(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.params.symbol as string;
      const timeframe = (req.query.timeframe as string) || '1h';

      const candles = await providerRegistry.getHistoricalCandles(symbol, timeframe, 120);
      if (!candles || candles.length < 20) {
        res.status(404).json({ error: 'Insufficient candle data for trend analysis' });
        return;
      }

      const trend = TrendDetectionEngine.analyze(symbol, candles, timeframe);
      res.json({
        symbol,
        timeframe,
        direction: trend.direction,
        condition: trend.condition,
        score: trend.score,
        confidence: trend.confidence,
        signals: trend.signals,
        bullishSignals: trend.bullishSignals,
        bearishSignals: trend.bearishSignals,
        riskFactors: trend.riskFactors,
        keySignals: trend.keySignals,
        aiMarketView: trend.aiMarketView,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to evaluate trend' });
    }
  }
}
