/**
 * Orders API – Food department only.
 */

import { Router } from 'express';
import * as ordersController from '../controllers/ordersController.js';
import { authenticate, requireDepartmentSlug } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireDepartmentSlug('food'));

router.get('/', ordersController.list);
router.get('/:id', ordersController.getOne);
router.post('/', ordersController.create);
router.patch('/:id', ordersController.update);
router.delete('/:id', ordersController.remove);

export default router;
