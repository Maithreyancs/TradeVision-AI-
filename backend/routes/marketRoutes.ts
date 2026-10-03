import { Router } from 'express';
import { MarketController } from '../controllers/marketController.js';

const router = Router();

router.get('/', MarketController.getMarkets);
router.get('/:symbol', MarketController.getMarketBySymbol);
router.get('/:symbol/candles', MarketController.getMarketCandles);
router.get('/:symbol/analysis', MarketController.getMarketAnalysis);
router.get('/:symbol/indicators', MarketController.getMarketIndicators);
router.get('/:symbol/support-resistance', MarketController.getMarketSupportResistance);
router.get('/:symbol/trend', MarketController.getMarketTrend);

export default router;
