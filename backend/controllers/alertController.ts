import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../database/prismaClient.js';
import { providerRegistry } from '../providers/ProviderRegistry.js';

export class AlertController {
  public static async getAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alerts = await prisma.priceAlert.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Enrich with current price
      const enriched = await Promise.all(
        alerts.map(async (alert) => {
          const quote = await providerRegistry.getQuote(alert.symbol);
          return {
            ...alert,
            currentPrice: quote?.price ?? null,
            currency: quote?.currency ?? 'USD',
          };
        })
      );

      res.json({ alerts: enriched });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }

  public static async createAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { symbol, condition, targetValue } = req.body;
      if (!symbol || !condition || targetValue === undefined) {
        res.status(400).json({ error: 'symbol, condition, and targetValue are required' });
        return;
      }

      const alert = await prisma.priceAlert.create({
        data: {
          symbol: symbol.toUpperCase(),
          condition,
          targetValue: parseFloat(targetValue),
          userId: req.userId || null,
        },
      });

      res.status(201).json({ alert });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to create alert' });
    }
  }

  public static async deleteAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await prisma.priceAlert.delete({ where: { id } });
      res.json({ message: 'Alert deleted successfully', id });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to delete alert' });
    }
  }
}
