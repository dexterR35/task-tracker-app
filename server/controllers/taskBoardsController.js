/**
 * Task boards API – one board per department per month (year/month).
 * Scoped by user's department.
 */

import { query } from '../config/db.js';

export function resolveDepartmentId(req) {
  return req.user?.departmentId ?? null;
}

function toBoard(row) {
  if (!row) return null;
  return {
    id: row.id,
    departmentId: row.department_id,
    year: row.year,
    month: row.month,
    name: row.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** GET /api/task-boards – list boards for department (optional year, month filter) */
export async function list(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const { year, month } = req.query;
    let sql = `SELECT id, department_id, year, month, name, created_at, updated_at
      FROM task_boards WHERE department_id = $1`;
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

/** GET /api/task-boards/:id – get one board (must belong to resolved department) */
export async function getOne(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const result = await query(
      `SELECT id, department_id, year, month, name, created_at, updated_at
       FROM task_boards WHERE id = $1 AND department_id = $2`,
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

/** POST /api/task-boards – get or create board for department + year + month. Body: { year, month, name? } */
export async function getOrCreate(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const { year, month, name } = req.body ?? {};
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Valid year and month (1–12) required.', code: 'INVALID_INPUT' });
    }
    const result = await query(
      `INSERT INTO task_boards (department_id, year, month, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (department_id, year, month) DO UPDATE SET updated_at = NOW()
       RETURNING id, department_id, year, month, name, created_at, updated_at`,
      [departmentId, y, m, name ?? null]
    );
    res.status(201).json(toBoard(result.rows[0]));
  } catch (err) {
    next(err);
  }
}
