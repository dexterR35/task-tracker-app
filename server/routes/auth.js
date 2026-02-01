/**
 * Auth API routes
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

/** Stricter limit for refresh to prevent token abuse (per IP) */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_REFRESH_RATE_LIMIT_MAX, 10) || 50,
  message: { error: 'Too many refresh attempts. Try again later.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', optionalAuthenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
