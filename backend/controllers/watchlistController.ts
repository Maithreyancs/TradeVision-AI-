import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../database/prismaClient.js';
import { providerRegistry } from '../providers/ProviderRegistry.js';

export class WatchlistController {
  public static async getWatchlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      let watchlist = null;
      if (userId) {
        watchlist = await prisma.watchlist.findFirst({
          where: { userId },
          include: { items: { orderBy: { displayOrder: 'asc' } } },
        });
      }

      if (!watchlist) {
        watchlist = await prisma.watchlist.findFirst({
          where: { isDefault: true },
          include: { items: { orderBy: { displayOrder: 'asc' } } },
        });
      }

      if (!watchlist) {
        res.json({ watchlist: [], items: [] });
        return;
      }

      // Populate live market quotes for items
      const itemsWithQuotes = await Promise.all(
        watchlist.items.map(async (item) => {
          const quote = await providerRegistry.getQuote(item.symbol);
          return {
            id: item.id,
            symbol: item.symbol,
            displayOrder: item.displayOrder,
            quote,
          };
        })
      );

      res.json({
        id: watchlist.id,
        name: watchlist.name,
        items: itemsWithQuotes,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve watchlist' });
    }
  }

  public static async addToWatchlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { symbol } = req.body;
      if (!symbol) {
        res.status(400).json({ error: 'Symbol is required' });
        return;
      }

      const userId = req.userId;
      let watchlist = null;

      if (userId) {
        watchlist = await prisma.watchlist.findFirst({ where: { userId } });
        if (!watchlist) {
          watchlist = await prisma.watchlist.create({
            data: { name: 'My Watchlist', userId },
          });
        }
      } else {
        watchlist = await prisma.watchlist.findFirst({ where: { isDefault: true } });
        if (!watchlist) {
          watchlist = await prisma.watchlist.create({
            data: { name: 'Core Watchlist', isDefault: true },
          });
        }
      }

      // Check if already in watchlist
      const existing = await prisma.watchlistItem.findFirst({
        where: { watchlistId: watchlist.id, symbol: symbol.toUpperCase() },
      });

      if (existing) {
        res.status(200).json({ message: 'Symbol already in watchlist', item: existing });
        return;
      }

      const count = await prisma.watchlistItem.count({ where: { watchlistId: watchlist.id } });
      const item = await prisma.watchlistItem.create({
        data: {
          watchlistId: watchlist.id,
          symbol: symbol.toUpperCase(),
          displayOrder: count,
        },
      });

      res.status(201).json({ message: 'Added to watchlist', item });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add item to watchlist' });
    }
  }

  public static async removeFromWatchlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const symbol = (req.params.symbol as string)?.toUpperCase();
      if (!symbol) {
        res.status(400).json({ error: 'Symbol parameter required' });
        return;
      }

      const userId = req.userId;
      let watchlist = null;
      if (userId) {
        watchlist = await prisma.watchlist.findFirst({ where: { userId } });
      } else {
        watchlist = await prisma.watchlist.findFirst({ where: { isDefault: true } });
      }

      if (watchlist) {
        await prisma.watchlistItem.deleteMany({
          where: { watchlistId: watchlist.id, symbol },
        });
      }

      res.json({ message: 'Removed from watchlist', symbol });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to remove item from watchlist' });
    }
  }
}
