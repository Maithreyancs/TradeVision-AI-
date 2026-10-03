import { Router } from 'express';
import { ChartController } from '../controllers/chartController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuthMiddleware);

router.get('/:symbol', ChartController.getDrawings);
router.post('/', ChartController.saveDrawing);
router.delete('/:id', ChartController.deleteDrawing);
router.delete('/:symbol/clear', ChartController.clearDrawings);

export default router;
