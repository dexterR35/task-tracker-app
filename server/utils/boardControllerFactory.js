/**
 * Shared board controller logic – task_boards and order_boards use identical list/getOne/getOrCreate.
 * tableName must be 'task_boards' or 'order_boards'.
 */

import { query } from '../config/db.js';
import { resolveDepartmentId, toBoard } from './boardUtils.js';

const ALLOWED_TABLES = ['task_boards', 'order_boards'];

/**
 * Create list, getOne, getOrCreate handlers for a board table.
 * @param {string} tableName - 'task_boards' or 'order_boards'
 * @returns {{ list: Function, getOne: Function, getOrCreate: Function }}
 */
export function createBoardController(tableName) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Invalid board table: ${tableName}`);
  }

  async function list(req, res, next) {
    try {
      const departmentId = resolveDepartmentId(req);
      // Super-users can have null departmentId (see all departments)
      // Admin/user roles must have departmentId
      if (departmentId === null && req.user?.role !== 'super-user') {
        return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
      }
      const { year, month } = req.query;
      let sql = `SELECT id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at, updated_at
        FROM ${tableName}`;
      const params = [];
      // Only filter by department if not super-user
      if (departmentId !== null) {
        sql += ` WHERE department_id = $1`;
        params.push(departmentId);
      } else {
        sql += ` WHERE 1=1`; // Super-user sees all departments
      }
      if (year != null && year !== '') {
        const y = parseInt(year, 10);
        if (Number.isNaN(y)) {
          return res.status(400).json({ error: 'Invalid year.', code: 'INVALID_INPUT' });
        }
        params.push(y);
        sql += ` AND year = $${params.length}`;
      }
      if (month != null && month !== '') {
        const m = parseInt(month, 10);
        if (Number.isNaN(m) || m < 1 || m > 12) {
          return res.status(400).json({ error: 'Invalid month (1–12).', code: 'INVALID_INPUT' });
        }
        params.push(m);
        sql += ` AND month = $${params.length}`;
      }
      sql += ` ORDER BY year DESC, month DESC`;
      const result = await query(sql, params);
      res.json({ boards: result.rows.map(toBoard) });
    } catch (err) {
      next(err);
    }
  }

  async function getOne(req, res, next) {
    try {
      const departmentId = resolveDepartmentId(req);
      // Super-users can access any board (no department filter)
      // Admin/user roles must have departmentId
      if (departmentId === null && req.user?.role !== 'super-user') {
        return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
      }
      let sql = `SELECT id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at, updated_at
         FROM ${tableName} WHERE id = $1`;
      const params = [req.params.id];
      // Only filter by department if not super-user
      if (departmentId !== null) {
        sql += ` AND department_id = $2`;
        params.push(departmentId);
      }
      const result = await query(sql, params);
      const row = result.rows[0];
      if (!row) {
        return res.status(404).json({ error: 'Board not found.', code: 'NOT_FOUND' });
      }
      res.json(toBoard(row));
    } catch (err) {
      next(err);
    }
  }

  async function getOrCreate(req, res, next) {
    try {
      const departmentId = resolveDepartmentId(req);
      // Super-users cannot create boards without specifying a department
      // They can view all, but must specify department when creating
      if (!departmentId) {
        // Check if super-user is trying to create - they need to specify department in body
        if (req.user?.role === 'super-user' && req.body?.departmentId) {
          // Allow super-user to create board for any department
          const targetDeptId = req.body.departmentId;
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
            `INSERT INTO ${tableName} (department_id, year, month, month_name, created_by, status, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (department_id, year, month) DO UPDATE SET updated_at = NOW()
             RETURNING id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at, updated_at`,
            [targetDeptId, y, m, monthNameVal, createdBy, status, startDate, endDate]
          );
          return res.status(201).json(toBoard(result.rows[0]));
        }
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
        `INSERT INTO ${tableName} (department_id, year, month, month_name, created_by, status, start_date, end_date)
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

  return { list, getOne, getOrCreate };
}
