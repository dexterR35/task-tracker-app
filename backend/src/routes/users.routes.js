/**
 * Users Routes
 */

import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
} from '../controllers/users.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, updateUserSchema, updatePasswordSchema } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('ADMIN'), getUsers);

// User-specific routes
router.get('/:id', getUserById);
router.put('/:id', validate(updateUserSchema), updateUser);
router.put('/:id/password', validate(updatePasswordSchema), updatePassword);

// Admin only
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
