/**
 * Tasks API – list by board, get one, create, update, delete.
 */

import { Router } from 'express';
import * as tasksController from '../controllers/tasksController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', tasksController.list);
router.get('/:id', tasksController.getOne);
router.post('/', tasksController.create);
router.patch('/:id', tasksController.update);
router.delete('/:id', tasksController.remove);

export default router;
