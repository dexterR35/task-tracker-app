/**
 * Task boards API – list, get one, get-or-create by year/month.
 */

import { Router } from 'express';
import * as taskBoardsController from '../controllers/taskBoardsController.js';
import { authenticate, rejectDepartmentSlug } from '../middleware/auth.js';
import { validateUuidParam } from '../utils/validate.js';

const router = Router();
router.use(authenticate);
router.use(rejectDepartmentSlug('food')); // Food department uses order-boards, not task-boards

router.get('/', taskBoardsController.list);
router.get('/:id', validateUuidParam('id'), taskBoardsController.getOne);
router.post('/', taskBoardsController.getOrCreate);

export default router;
