/**
 * Order boards API – one per department per month (year/month).
 * Food department only (route guarded by requireDepartmentSlug('food')).
 * Scoped by user's department.
 */

import { query } from '../config/db.js';

export function resolveDepartmentId(req) {
  return req.user?.departmentId ?? null;
}

function toBoard(row) {
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

/** GET /api/order-boards – list boards for department (optional year, month filter) */
export async function list(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const { year, month } = req.query;
    let sql = `SELECT id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at, updated_at
      FROM order_boards WHERE department_id = $1`;
    const params = [departmentId];
    if (year != null && year !== '') {
      params.push(parseInt(year, 10));
      sql += ` AND year = $${params.length}`;
    }
    if (month != null && month !== '') {
      params.push(parseInt(month, 10));
      sql += ` AND month = $${params.length}`;
    }
    sql += ` ORDER BY year DESC, month DESC`;
    const result = await query(sql, params);
    res.json({ boards: result.rows.map(toBoard) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/order-boards/:id – get one board */
export async function getOne(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const result = await query(
      `SELECT id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at, updated_at
       FROM order_boards WHERE id = $1 AND department_id = $2`,
      [req.params.id, departmentId]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Board not found.', code: 'NOT_FOUND' });
    }
    res.json(toBoard(row));
  } catch (err) {
    next(err);
  }
}

/** POST /api/order-boards – get or create board. Body: { year, month, monthName?, status? } */
export async function getOrCreate(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const { year, month, monthName, name, status: bodyStatus } = req.body ?? {};
    const monthNameVal = monthName ?? name ?? null;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Valid year and month (1–12) required.', code: 'INVALID_INPUT' });
    }
    const createdBy = req.user?.id ?? null;
    const status = bodyStatus ?? 'active';
    const startDate = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
    const endDate = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    const result = await query(
      `INSERT INTO order_boards (department_id, year, month, month_name, created_by, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (department_id, year, month) DO UPDATE SET updated_at = NOW()
       RETURNING id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at, updated_at`,
      [departmentId, y, m, monthNameVal, createdBy, status, startDate, endDate]
    );
    res.status(201).json(toBoard(result.rows[0]));
  } catch (err) {
    next(err);
  }
}
