import { Request, Response } from 'express';
import prisma from '../database/prismaClient.js';
import { providerRegistry } from '../providers/ProviderRegistry.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CurrencyService } from '../services/currencyService.js';

export class PortfolioController {
  public static async getPortfolio(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId || null;

      // 1. Get or create Cash Balance (starts at 0.0 by default)
      let cash = await prisma.portfolioCash.findFirst({ where: { userId } });
      if (!cash) {
        cash = await prisma.portfolioCash.create({
          data: {
            userId,
            balance: 0.0,
            currency: 'USD',
          },
        });
      }

      // 2. Fetch Holdings
      const rawHoldings = await prisma.portfolioHolding.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      // 3. Enrich holdings with live real market data & multi-currency normalization
      let totalHoldingsValueUSD = 0;
      let totalCostBasisUSD = 0;
      let todayPnLAmountUSD = 0;

      const enrichedHoldings = await Promise.all(
        rawHoldings.map(async (h) => {
          const quote = await providerRegistry.getQuote(h.symbol);
          const currentPrice = quote?.price ?? h.avgBuyPrice;
          const change24hPct = quote?.change24hPct ?? 0;
          const holdingCurrency = quote?.currency || h.currency || 'USD';

          const currentValue = Number((h.quantity * currentPrice).toFixed(2));
          const costBasis = Number((h.quantity * h.avgBuyPrice).toFixed(2));
          const pnl = Number((currentValue - costBasis).toFixed(2));
          const pnlPct = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

          // Normalize each holding's values to USD for accurate portfolio aggregation
          const currentValueInUSD = await CurrencyService.convert(currentValue, holdingCurrency, 'USD');
          const costBasisInUSD = await CurrencyService.convert(costBasis, holdingCurrency, 'USD');
          const todayHoldingPnLInUSD = currentValueInUSD * (change24hPct / 100);

          totalHoldingsValueUSD += currentValueInUSD;
          totalCostBasisUSD += costBasisInUSD;
          todayPnLAmountUSD += todayHoldingPnLInUSD;

          return {
            id: h.id,
            symbol: h.symbol,
            name: h.name,
            assetClass: h.assetClass,
            quantity: h.quantity,
            avgBuyPrice: h.avgBuyPrice,
            currentPrice,
            change24hPct,
            currentValue,
            costBasis,
            pnl,
            pnlPct,
            currency: holdingCurrency,
            currentValueInUSD,
            sparkline: quote?.sparkline,
          };
        })
      );

      const totalHoldingsValue = Number(totalHoldingsValueUSD.toFixed(2));
      const totalCostBasis = Number(totalCostBasisUSD.toFixed(2));
      const totalPortfolioValue = Number((cash.balance + totalHoldingsValue).toFixed(2));
      const totalAllTimePnL = Number((totalHoldingsValue - totalCostBasis).toFixed(2));
      const totalAllTimePnLPct =
        totalCostBasis > 0 ? Number(((totalAllTimePnL / totalCostBasis) * 100).toFixed(2)) : 0;
      const todayPnLPct =
        totalPortfolioValue > 0 ? Number(((todayPnLAmountUSD / totalPortfolioValue) * 100).toFixed(2)) : 0;

      // Calculate asset allocation percentages in USD
      const allocation = {
        crypto: 0,
        indian_stocks: 0,
        us_stocks: 0,
        commodities: 0,
        forex: 0,
        cash: totalPortfolioValue > 0 ? Number(((cash.balance / totalPortfolioValue) * 100).toFixed(1)) : 0,
      };

      enrichedHoldings.forEach((h) => {
        const cls = h.assetClass as keyof typeof allocation;
        if (allocation[cls] !== undefined && totalPortfolioValue > 0) {
          allocation[cls] = Number(
            (allocation[cls] + (h.currentValueInUSD / totalPortfolioValue) * 100).toFixed(1)
          );
        }
      });

      // Fetch recent transactions
      const transactions = await prisma.portfolioTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json({
        cashBalance: cash.balance,
        currency: cash.currency,
        totalHoldingsValue,
        totalPortfolioValue,
        todayPnL: {
          amount: Number(todayPnLAmountUSD.toFixed(2)),
          percentage: todayPnLPct,
        },
        allTimePnL: {
          amount: totalAllTimePnL,
          percentage: totalAllTimePnLPct,
        },
        holdings: enrichedHoldings,
        allocation,
        transactions,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('[PortfolioController] Error:', err);
      res.status(500).json({ error: 'Failed to retrieve portfolio' });
    }
  }

  public static async deposit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { amount } = req.body;
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        res.status(400).json({ error: 'Valid positive deposit amount is required' });
        return;
      }

      const userId = req.userId || null;
      let cash = await prisma.portfolioCash.findFirst({ where: { userId } });
      if (!cash) {
        cash = await prisma.portfolioCash.create({
          data: { userId, balance: depositAmount, currency: 'USD' },
        });
      } else {
        cash = await prisma.portfolioCash.update({
          where: { id: cash.id },
          data: { balance: cash.balance + depositAmount },
        });
      }

      await prisma.portfolioTransaction.create({
        data: {
          userId,
          symbol: 'USD',
          type: 'DEPOSIT',
          quantity: depositAmount,
          price: 1.0,
          total: depositAmount,
          currency: 'USD',
        },
      });

      res.json({ message: 'Deposit successful', newBalance: cash.balance });
    } catch (err: any) {
      res.status(500).json({ error: 'Deposit failed' });
    }
  }

  public static async trade(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { symbol, type, quantity } = req.body;
      const cleanSymbol = symbol?.toUpperCase();
      const tradeType = type?.toUpperCase();
      const qty = parseFloat(quantity);

      if (!cleanSymbol || !['BUY', 'SELL'].includes(tradeType) || isNaN(qty) || qty <= 0) {
        res.status(400).json({ error: 'Invalid trade parameters: symbol, type (BUY/SELL), and positive quantity required' });
        return;
      }

      const quote = await providerRegistry.getQuote(cleanSymbol);
      if (!quote) {
        res.status(404).json({ error: 'Market data unavailable for symbol' });
        return;
      }

      const currentPrice = quote.price;
      const totalCostNative = qty * currentPrice;
      const totalCostUSD = await CurrencyService.convert(totalCostNative, quote.currency, 'USD');
      const userId = req.userId || null;

      let cash = await prisma.portfolioCash.findFirst({ where: { userId } });
      if (!cash) {
        cash = await prisma.portfolioCash.create({ data: { userId, balance: 0.0, currency: 'USD' } });
      }

      if (tradeType === 'BUY') {
        if (cash.balance < totalCostUSD) {
          res.status(400).json({
            error: `Insufficient cash balance. Required: $${totalCostUSD.toFixed(2)}, Available: $${cash.balance.toFixed(2)}. Please deposit funds first.`,
          });
          return;
        }

        // Deduct cash in USD
        await prisma.portfolioCash.update({
          where: { id: cash.id },
          data: { balance: cash.balance - totalCostUSD },
        });

        // Upsert holding
        const existingHolding = await prisma.portfolioHolding.findFirst({
          where: { symbol: cleanSymbol, userId },
        });

        if (existingHolding) {
          const newQty = existingHolding.quantity + qty;
          const newAvgPrice = (existingHolding.quantity * existingHolding.avgBuyPrice + totalCostNative) / newQty;
          await prisma.portfolioHolding.update({
            where: { id: existingHolding.id },
            data: { quantity: newQty, avgBuyPrice: newAvgPrice },
          });
        } else {
          await prisma.portfolioHolding.create({
            data: {
              userId,
              symbol: cleanSymbol,
              name: quote.name,
              assetClass: quote.assetClass,
              quantity: qty,
              avgBuyPrice: currentPrice,
              currency: quote.currency,
            },
          });
        }
      } else {
        // SELL
        const existingHolding = await prisma.portfolioHolding.findFirst({
          where: { symbol: cleanSymbol, userId },
        });

        if (!existingHolding || existingHolding.quantity < qty) {
          res.status(400).json({
            error: `Insufficient holdings to sell. Available: ${existingHolding?.quantity ?? 0} ${cleanSymbol}`,
          });
          return;
        }

        // Add proceeds in USD to cash
        await prisma.portfolioCash.update({
          where: { id: cash.id },
          data: { balance: cash.balance + totalCostUSD },
        });

        const remainingQty = existingHolding.quantity - qty;
        if (remainingQty <= 0.000001) {
          await prisma.portfolioHolding.delete({ where: { id: existingHolding.id } });
        } else {
          await prisma.portfolioHolding.update({
            where: { id: existingHolding.id },
            data: { quantity: remainingQty },
          });
        }
      }

      // Record transaction
      await prisma.portfolioTransaction.create({
        data: {
          userId,
          symbol: cleanSymbol,
          type: tradeType,
          quantity: qty,
          price: currentPrice,
          total: totalCostNative,
          currency: quote.currency,
        },
      });

      res.json({
        message: `${tradeType} order executed successfully at real market price of ${quote.currency} ${currentPrice}`,
        symbol: cleanSymbol,
        quantity: qty,
        price: currentPrice,
        total: totalCostNative,
        totalUSD: totalCostUSD,
      });
    } catch (err: any) {
      console.error('[Portfolio Trade] Error:', err);
      res.status(500).json({ error: 'Trade execution failed' });
    }
  }

  public static async reset(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId || null;
      await prisma.portfolioHolding.deleteMany({ where: { userId } });
      await prisma.portfolioTransaction.deleteMany({ where: { userId } });

      let cash = await prisma.portfolioCash.findFirst({ where: { userId } });
      if (cash) {
        await prisma.portfolioCash.update({
          where: { id: cash.id },
          data: { balance: 0.0 },
        });
      } else {
        await prisma.portfolioCash.create({
          data: { userId, balance: 0.0 },
        });
      }

      res.json({ message: 'Portfolio reset to 0 balance and 0 holdings' });
    } catch (err: any) {
      res.status(500).json({ error: 'Reset failed' });
    }
  }
}
