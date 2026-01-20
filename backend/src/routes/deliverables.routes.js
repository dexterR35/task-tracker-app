/**
 * Deliverables Routes
 */

import express from 'express';
import {
  getDeliverables,
  getDeliverableById,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
} from '../controllers/deliverables.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, createDeliverableSchema, updateDeliverableSchema } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getDeliverables);
router.get('/:id', getDeliverableById);

// Only admins can create/update/delete deliverables
router.post('/', authorize('ADMIN'), validate(createDeliverableSchema), createDeliverable);
router.put('/:id', authorize('ADMIN'), validate(updateDeliverableSchema), updateDeliverable);
router.delete('/:id', authorize('ADMIN'), deleteDeliverable);

export default router;
