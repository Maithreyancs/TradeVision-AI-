import { Router } from 'express';
import { AlertController } from '../controllers/alertController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuthMiddleware);

router.get('/', AlertController.getAlerts);
router.post('/', AlertController.createAlert);
router.delete('/:id', AlertController.deleteAlert);

export default router;
