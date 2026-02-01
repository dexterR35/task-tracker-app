/**
 * Task boards API – list, get one, get-or-create by year/month.
 */

import { Router } from 'express';
import * as taskBoardsController from '../controllers/taskBoardsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', taskBoardsController.list);
router.get('/:id', taskBoardsController.getOne);
router.post('/', taskBoardsController.getOrCreate);

export default router;
