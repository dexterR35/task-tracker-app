/**
 * Users API routes (list, get one, update)
 */

import { Router } from 'express';
import * as usersController from '../controllers/usersController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', usersController.list);
router.get('/:id', usersController.getOne);
router.patch('/:id', usersController.update);

export default router;
