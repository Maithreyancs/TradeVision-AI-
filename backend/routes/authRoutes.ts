import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', optionalAuthMiddleware, AuthController.me);

export default router;
