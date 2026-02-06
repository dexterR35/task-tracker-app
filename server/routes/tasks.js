/**
 * Tasks API – list by board, get one, create, update, delete.
 * Production-ready with validation and error handling
 */

import { Router } from 'express';
import * as tasksController from '../controllers/tasksController.js';
import { authenticate, rejectDepartmentSlug } from '../middleware/auth.js';
import { validateUuidParam } from '../utils/validate.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);
router.use(rejectDepartmentSlug('food')); // Food department uses orders, not tasks

// GET /api/tasks?boardId=uuid - List tasks for a board
router.get(
  '/',
  validateQuery({ boardId: 'required|uuid' }),
  asyncHandler(tasksController.list)
);

// GET /api/tasks/:id - Get one task
router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(tasksController.getOne)
);

// POST /api/tasks - Create task
router.post(
  '/',
  validateBody({
    boardId: 'required|uuid',
    title: 'required|string|min:1|max:500',
    description: 'optional|string|max:5000',
    status: 'optional|enum:todo,in-progress,completed,done',
    dueDate: 'optional|date',
    position: 'optional|integer',
    assigneeId: 'optional|uuid',
  }),
  asyncHandler(tasksController.create)
);

// PATCH /api/tasks/:id - Update task
router.patch(
  '/:id',
  validateUuidParam('id'),
  validateBody({
    title: 'optional|string|min:1|max:500',
    description: 'optional|string|max:5000',
    status: 'optional|enum:todo,in-progress,completed,done',
    dueDate: 'optional|date',
    position: 'optional|integer',
    assigneeId: 'optional|uuid',
  }),
  asyncHandler(tasksController.update)
);

// DELETE /api/tasks/:id - Delete task
router.delete(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(tasksController.remove)
);

export default router;
