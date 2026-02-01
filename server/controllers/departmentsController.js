/**
 * Departments API - list (PERN)
 * Super admin sees all; used for dropdowns and Departments page.
 */

import { query } from '../config/db.js';

function toDepartment(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** GET /api/departments - list all departments (auth required) */
export async function list(req, res, next) {
  try {
    const result = await query(
      'SELECT id, name, slug, created_at, updated_at FROM departments ORDER BY name ASC'
    );
    res.json({ departments: result.rows.map(toDepartment) });
  } catch (err) {
    next(err);
  }
}
