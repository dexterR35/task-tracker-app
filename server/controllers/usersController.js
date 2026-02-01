/**
 * Users API - list, get one, update (PERN)
 */

import { query } from '../config/db.js';

const userColumns =
  'id, email, name, username, role, is_active, color_set, created_by, occupation, office, phone, avatar_url, manager_id, email_verified_at, gender, created_at, updated_at';

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
    role: row.role,
    isActive: row.is_active,
    colorSet: row.color_set,
    createdBy: row.created_by,
    occupation: row.occupation,
    office: row.office,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    managerId: row.manager_id,
    emailVerifiedAt: row.email_verified_at,
    gender: row.gender,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** GET /api/users - list users (auth required) */
export async function list(req, res, next) {
  try {
    const result = await query(
      `SELECT ${userColumns} FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows.map(toUser) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/users/:id - get one user by id */
export async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT ${userColumns} FROM users WHERE id = $1`,
      [id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: toUser(user) });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/users/:id - update user (admin or self) */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const isAdmin = currentUser.role === 'admin';
    const isSelf = currentUser.id === id;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const allowed = [
      'name',
      'username',
      'occupation',
      'office',
      'phone',
      'avatar_url',
      'color_set',
      'is_active',
      'role',
      'manager_id',
      'email_verified_at',
      'gender',
    ];
    if (!isAdmin) {
      allowed.splice(allowed.indexOf('is_active'), 1);
      allowed.splice(allowed.indexOf('role'), 1);
      allowed.splice(allowed.indexOf('manager_id'), 1);
      allowed.splice(allowed.indexOf('email_verified_at'), 1);
    }

    const body = req.body;
    const updates = [];
    const values = [];
    let pos = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${pos++}`);
      values.push(body.name);
    }
    if (body.username !== undefined) {
      updates.push(`username = $${pos++}`);
      values.push(body.username ?? null);
    }
    if (body.occupation !== undefined) {
      updates.push(`occupation = $${pos++}`);
      values.push(body.occupation);
    }
    if (body.office !== undefined) {
      updates.push(`office = $${pos++}`);
      values.push(body.office);
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${pos++}`);
      values.push(body.phone ?? null);
    }
    if (body.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${pos++}`);
      values.push(body.avatarUrl ?? null);
    }
    if (body.colorSet !== undefined) {
      updates.push(`color_set = $${pos++}`);
      values.push(body.colorSet);
    }
    if (isAdmin && body.managerId !== undefined) {
      updates.push(`manager_id = $${pos++}`);
      values.push(body.managerId || null);
    }
    if (isAdmin && body.emailVerifiedAt !== undefined) {
      updates.push(`email_verified_at = $${pos++}`);
      values.push(body.emailVerifiedAt ? new Date(body.emailVerifiedAt) : null);
    }
    if (isAdmin && body.isActive !== undefined) {
      updates.push(`is_active = $${pos++}`);
      values.push(!!body.isActive);
    }
    if (isAdmin && body.role !== undefined) {
      if (!['admin', 'user'].includes(body.role)) {
        return res.status(400).json({ error: 'Invalid role.' });
      }
      updates.push(`role = $${pos++}`);
      values.push(body.role);
    }
    if (body.gender !== undefined) {
      if (body.gender !== null && body.gender !== '' && !['male', 'female'].includes(body.gender)) {
        return res.status(400).json({ error: 'Invalid gender. Use male or female.' });
      }
      updates.push(`gender = $${pos++}`);
      values.push(body.gender === '' ? null : body.gender);
    }

    if (updates.length === 0) {
      const result = await query(
        `SELECT ${userColumns} FROM users WHERE id = $1`,
        [id]
      );
      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found.' });
      return res.json({ user: toUser(user) });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${pos} RETURNING ${userColumns}`,
      values
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: toUser(user) });
  } catch (err) {
    next(err);
  }
}
