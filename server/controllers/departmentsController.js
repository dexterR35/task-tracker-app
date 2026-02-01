/**
 * Departments API - list (PERN)
 * Used for Departments page and dropdowns.
 */

import { query } from '../config/db.js';

function toDepartment(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** GET /api/departments - list all departments (auth required); returns id, name only (no slug). */
export async function list(req, res, next) {
  try {
    const result = await query(
      'SELECT id, name, created_at, updated_at FROM departments ORDER BY name ASC'
    );
    res.json({ departments: result.rows.map(toDepartment) });
  } catch (err) {
    next(err);
  }
}
