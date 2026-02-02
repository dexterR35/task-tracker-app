/**
 * Order boards API – Food department only.
 */

import { Router } from 'express';
import * as orderBoardsController from '../controllers/orderBoardsController.js';
import { authenticate, requireDepartmentSlug } from '../middleware/auth.js';
import { validateUuidParam } from '../utils/validate.js';

const router = Router();
router.use(authenticate);
router.use(requireDepartmentSlug('food'));

router.get('/', orderBoardsController.list);
router.get('/:id', validateUuidParam('id'), orderBoardsController.getOne);
router.post('/', orderBoardsController.getOrCreate);

export default router;
