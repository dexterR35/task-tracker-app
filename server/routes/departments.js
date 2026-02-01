/**
 * Departments API routes (list)
 */

import { Router } from 'express';
import * as departmentsController from '../controllers/departmentsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', departmentsController.list);

export default router;
