import { Request, Response } from 'express';
import { AIService } from '../services/aiService.js';

export class AIController {
  public static async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { symbol, timeframe } = req.body;
      if (!symbol) {
        res.status(400).json({ error: 'symbol is required' });
        return;
      }

      const result = await AIService.analyzeMarket(symbol, timeframe || '1h');
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'AI market analysis failed' });
    }
  }

  public static async chat(req: Request, res: Response): Promise<void> {
    try {
      const { symbol, message, history } = req.body;
      if (!symbol || !message) {
        res.status(400).json({ error: 'symbol and message are required' });
        return;
      }

      const reply = await AIService.chat(symbol, message, history || []);
      res.json({
        reply,
        symbol,
        timestamp: Date.now(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'AI chat failed' });
    }
  }
}
