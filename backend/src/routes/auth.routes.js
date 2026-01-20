/**
 * Authentication Routes
 * Routes for user authentication and authorization
 */

import express from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
