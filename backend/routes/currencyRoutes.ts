import { Router, Request, Response } from 'express';
import { CurrencyService } from '../services/currencyService.js';

const router = Router();

router.get('/rates', async (req: Request, res: Response) => {
  try {
    const rates = await CurrencyService.getRates();
    res.json({ rates, base: 'USD', timestamp: Date.now() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch currency rates' });
  }
});

router.get('/convert', async (req: Request, res: Response): Promise<void> => {
  try {
    const amount = parseFloat(req.query.amount as string) || 1;
    const from = (req.query.from as string) || 'USD';
    const to = (req.query.to as string) || 'INR';

    const converted = await CurrencyService.convert(amount, from, to);
    res.json({ amount, from, to, result: converted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

export default router;
