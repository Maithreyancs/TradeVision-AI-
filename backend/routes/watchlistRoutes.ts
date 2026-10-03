import { Router } from 'express';
import { WatchlistController } from '../controllers/watchlistController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuthMiddleware);

router.get('/', WatchlistController.getWatchlist);
router.post('/', WatchlistController.addToWatchlist);
router.delete('/:symbol', WatchlistController.removeFromWatchlist);

export default router;
