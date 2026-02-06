/**
 * Production-ready Auth API routes
 * Includes rate limiting, validation, and security middleware
 */

import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/** Login rate limiter - per email to prevent brute force attacks */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_LOGIN_RATE_LIMIT_MAX, 10) || 5, // 5 attempts per 15 min
  message: { error: 'Too many login attempts. Try again in 15 minutes.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req) => {
    const email = req.body?.email;
    if (email && typeof email === 'string') {
      return `login:${email.toLowerCase().trim()}`;
    }
    return ipKeyGenerator(req);
  },
});

/** Refresh rate limiter - per IP to prevent token abuse */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_REFRESH_RATE_LIMIT_MAX, 10) || 30, // 30 refreshes per 15 min
  message: { error: 'Too many refresh attempts. Try again later.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Logout rate limiter - prevent abuse */
const logoutLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.AUTH_LOGOUT_RATE_LIMIT_MAX, 10) || 10, // 10 logouts per minute
  message: { error: 'Too many logout attempts. Try again later.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login - Login with email and password
router.post(
  '/login',
  loginLimiter,
  validateBody({
    email: 'required|email',
    password: 'required|string|min:1|max:1000',
  }),
  asyncHandler(authController.login)
);

// GET /api/auth/me - Get current user (requires authentication)
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me)
);

// POST /api/auth/refresh - Refresh access token using refresh token cookie
router.post(
  '/refresh',
  refreshLimiter,
  asyncHandler(authController.refresh)
);

// POST /api/auth/logout - Logout current session
router.post(
  '/logout',
  logoutLimiter,
  optionalAuthenticate,
  asyncHandler(authController.logout)
);

// POST /api/auth/logout-all - Logout all sessions (requires authentication)
router.post(
  '/logout-all',
  logoutLimiter,
  authenticate,
  asyncHandler(authController.logoutAll)
);

export default router;
