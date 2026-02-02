/**
 * Shared board utilities – task_boards and order_boards use identical patterns.
 * Table names are not interpolated; only parameterized queries are used.
 */

import { query } from '../config/db.js';

const BOARD_QUERIES = {
  task_boards: 'SELECT id FROM task_boards WHERE id = $1 AND department_id = $2',
  order_boards: 'SELECT id FROM order_boards WHERE id = $1 AND department_id = $2',
};

export function resolveDepartmentId(req) {
  return req.user?.departmentId ?? null;
}

/** Ensure board exists and belongs to resolved department. tableName must be 'task_boards' or 'order_boards'. */
export async function getBoardIfAllowed(req, boardId, tableName) {
  const sql = BOARD_QUERIES[tableName];
  if (!sql) {
    throw new Error(`Invalid board table: ${tableName}`);
  }
  const departmentId = resolveDepartmentId(req);
  if (!departmentId) return null;
  const result = await query(sql, [boardId, departmentId]);
  return result.rows[0] ?? null;
}

export function toBoard(row) {
  if (!row) return null;
  const monthName = row.month_name ?? null;
  const y = row.year;
  const m = row.month;
  const monthId = y != null && m != null ? `${y}-${String(m).padStart(2, '0')}` : null;
  const start = y != null && m != null ? new Date(Date.UTC(y, m - 1, 1)) : null;
  const end = y != null && m != null ? new Date(Date.UTC(y, m, 0)) : null;
  const daysInMonth = end ? end.getUTCDate() : null;
  return {
    id: row.id,
    departmentId: row.department_id,
    year: row.year,
    month: row.month,
    monthId,
    monthName,
    name: monthName,
    createdBy: row.created_by ?? null,
    status: row.status ?? 'active',
    startDate: row.start_date ?? (start ? start.toISOString().slice(0, 10) : null),
    endDate: row.end_date ?? (end ? end.toISOString().slice(0, 10) : null),
    daysInMonth,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
