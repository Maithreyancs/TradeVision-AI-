import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../database/prismaClient.js';

export class ChartController {
  public static async getDrawings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const symbol = (req.params.symbol as string)?.toUpperCase();
      const timeframe = (req.query.timeframe as string) || '1h';

      const drawings = await prisma.chartDrawing.findMany({
        where: {
          symbol,
          timeframe,
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        drawings: drawings.map((d) => ({
          id: d.id,
          symbol: d.symbol,
          timeframe: d.timeframe,
          toolType: d.toolType,
          coordinates: JSON.parse(d.coordinatesJson || '[]'),
          styles: JSON.parse(d.stylesJson || '{}'),
          createdAt: d.createdAt,
        })),
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch chart drawings' });
    }
  }

  public static async saveDrawing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { symbol, timeframe, toolType, coordinates, styles } = req.body;
      if (!symbol || !toolType || !coordinates) {
        res.status(400).json({ error: 'symbol, toolType, and coordinates are required' });
        return;
      }

      const drawing = await prisma.chartDrawing.create({
        data: {
          userId: req.userId || null,
          symbol: symbol.toUpperCase(),
          timeframe: timeframe || '1h',
          toolType,
          coordinatesJson: JSON.stringify(coordinates),
          stylesJson: JSON.stringify(styles || {}),
        },
      });

      res.status(201).json({
        drawing: {
          id: drawing.id,
          symbol: drawing.symbol,
          timeframe: drawing.timeframe,
          toolType: drawing.toolType,
          coordinates,
          styles: styles || {},
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to save drawing' });
    }
  }

  public static async deleteDrawing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await prisma.chartDrawing.delete({ where: { id } });
      res.json({ message: 'Drawing deleted', id });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to delete drawing' });
    }
  }

  public static async clearDrawings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const symbol = (req.params.symbol as string)?.toUpperCase();
      const timeframe = (req.query.timeframe as string) || '1h';

      await prisma.chartDrawing.deleteMany({
        where: {
          symbol,
          timeframe,
        },
      });

      res.json({ message: 'All drawings cleared for symbol', symbol });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to clear drawings' });
    }
  }
}
