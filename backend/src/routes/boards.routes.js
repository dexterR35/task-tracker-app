/**
 * Boards Routes
 */

import express from 'express';
import {
  getBoards,
  getBoardById,
  getBoardByMonthId,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boards.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, createBoardSchema } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getBoards);
router.get('/:id', getBoardById);
router.get('/month/:monthId', getBoardByMonthId);

// Only admins can create/update/delete boards
router.post('/', authorize('ADMIN'), validate(createBoardSchema), createBoard);
router.put('/:id', authorize('ADMIN'), updateBoard);
router.delete('/:id', authorize('ADMIN'), deleteBoard);

export default router;
