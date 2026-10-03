import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';

const router = Router();

router.post('/analyze', AIController.analyze);
router.post('/chat', AIController.chat);

export default router;
