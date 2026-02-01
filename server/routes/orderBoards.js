/**
 * Order boards API – Food department only.
 */

import { Router } from 'express';
import * as orderBoardsController from '../controllers/orderBoardsController.js';
import { authenticate, requireDepartmentSlug } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireDepartmentSlug('food'));

router.get('/', orderBoardsController.list);
router.get('/:id', orderBoardsController.getOne);
router.post('/', orderBoardsController.getOrCreate);

export default router;
