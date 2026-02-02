/**
 * Task boards API – one board per department per month (year/month).
 * Scoped by user's department.
 */

import { resolveDepartmentId } from '../utils/boardUtils.js';
import { createBoardController } from '../utils/boardControllerFactory.js';

export { resolveDepartmentId };

const { list, getOne, getOrCreate } = createBoardController('task_boards');

export { list, getOne, getOrCreate };
