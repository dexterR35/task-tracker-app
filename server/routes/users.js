/**
 * Users API routes (list, get one, update)
 */

import { Router } from 'express';
import * as usersController from '../controllers/usersController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateUuidParam } from '../utils/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin'), usersController.list);
router.get('/:id', validateUuidParam('id'), usersController.getOne);
router.patch('/:id', validateUuidParam('id'), usersController.update);

export default router;
