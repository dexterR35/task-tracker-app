/**
 * Reporters Routes
 */

import express from 'express';
import {
  getReporters,
  getReporterById,
  createReporter,
  updateReporter,
  deleteReporter,
} from '../controllers/reporters.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, createReporterSchema, updateReporterSchema } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getReporters);
router.get('/:id', getReporterById);

// Only admins can create/update/delete reporters
router.post('/', authorize('ADMIN'), validate(createReporterSchema), createReporter);
router.put('/:id', authorize('ADMIN'), validate(updateReporterSchema), updateReporter);
router.delete('/:id', authorize('ADMIN'), deleteReporter);

export default router;
