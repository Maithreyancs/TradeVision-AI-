import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolioController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuthMiddleware);

router.get('/', PortfolioController.getPortfolio);
router.post('/deposit', PortfolioController.deposit);
router.post('/trade', PortfolioController.trade);
router.post('/reset', PortfolioController.reset);

export default router;
