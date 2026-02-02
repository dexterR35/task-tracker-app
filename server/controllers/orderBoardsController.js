/**
 * Order boards API – one per department per month (year/month).
 * Food department only (route guarded by requireDepartmentSlug('food')).
 * Scoped by user's department.
 */

import { resolveDepartmentId } from '../utils/boardUtils.js';
import { createBoardController } from '../utils/boardControllerFactory.js';

export { resolveDepartmentId };

const { list, getOne, getOrCreate } = createBoardController('order_boards');

export { list, getOne, getOrCreate };
