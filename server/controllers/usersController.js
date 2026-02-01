/**
 * Users API - list, get one, update (PERN)
 * Auth in users; profile in profiles. JOIN for read; update each table as needed.
 */

import { query } from '../config/db.js';

const userColumns = `u.id, u.email, u.role, u.is_active, u.department_id, u.created_at AS u_created_at, u.updated_at AS u_updated_at,
  p.name, p.username, p.office, p.phone, p.avatar_url, p.job_position, p.email_verified_at, p.gender, p.color_set, p.created_by, p.created_at AS p_created_at, p.updated_at AS p_updated_at,
  d.id AS department_id, d.name AS department_name, d.slug AS department_slug`;

const userFrom = `users u
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN departments d ON d.id = u.department_id`;

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
    office: row.office,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    jobPosition: row.job_position,
    departmentId: row.department_id ?? null,
    departmentName: row.department_name ?? null,
    departmentSlug: row.department_slug ?? null,
    emailVerifiedAt: row.email_verified_at,
    gender: row.gender,
    createdAt: row.p_created_at ?? row.u_created_at,
    updatedAt: row.p_updated_at ?? row.u_updated_at,
  };
}

/** GET /api/users - list users (auth required) */
export async function list(req, res, next) {
  try {
    const result = await query(
      `SELECT ${userColumns} FROM ${userFrom} ORDER BY u.created_at DESC`
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
      `SELECT ${userColumns} FROM ${userFrom} WHERE u.id = $1`,
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

    const body = req.body;
    const profileUpdates = [];
    const profileValues = [];
    let profilePos = 1;
    const userUpdates = [];
    const userValues = [];
    let userPos = 1;

    if (body.name !== undefined) {
      profileUpdates.push(`name = $${profilePos++}`);
      profileValues.push(body.name);
    }
    if (body.username !== undefined) {
      profileUpdates.push(`username = $${profilePos++}`);
      profileValues.push(body.username ?? null);
    }
    if (body.office !== undefined) {
      profileUpdates.push(`office = $${profilePos++}`);
      profileValues.push(body.office);
    }
    if (body.phone !== undefined) {
      profileUpdates.push(`phone = $${profilePos++}`);
      profileValues.push(body.phone ?? null);
    }
    if (body.avatarUrl !== undefined) {
      profileUpdates.push(`avatar_url = $${profilePos++}`);
      profileValues.push(body.avatarUrl ?? null);
    }
    if (body.colorSet !== undefined) {
      profileUpdates.push(`color_set = $${profilePos++}`);
      profileValues.push(body.colorSet);
    }
    if (body.jobPosition !== undefined) {
      profileUpdates.push(`job_position = $${profilePos++}`);
      profileValues.push(body.jobPosition ?? null);
    }
    if (isAdmin && body.emailVerifiedAt !== undefined) {
      profileUpdates.push(`email_verified_at = $${profilePos++}`);
      profileValues.push(body.emailVerifiedAt ? new Date(body.emailVerifiedAt) : null);
    }
    if (body.gender !== undefined) {
      if (body.gender !== null && body.gender !== '' && !['male', 'female'].includes(body.gender)) {
        return res.status(400).json({ error: 'Invalid gender. Use male or female.' });
      }
      profileUpdates.push(`gender = $${profilePos++}`);
      profileValues.push(body.gender === '' ? null : body.gender);
    }

    if (isAdmin && body.isActive !== undefined) {
      userUpdates.push(`is_active = $${userPos++}`);
      userValues.push(!!body.isActive);
    }
    if (isAdmin && body.role !== undefined) {
      if (!['admin', 'user'].includes(body.role)) {
        return res.status(400).json({ error: 'Invalid role.' });
      }
      userUpdates.push(`role = $${userPos++}`);
      userValues.push(body.role);
    }
    /* Department is not editable via API; change only via DB (e.g. psql). */
    if (body.departmentId !== undefined) {
      return res.status(400).json({ error: 'Department cannot be updated via API. Change via DB (e.g. psql).', code: 'DEPARTMENT_READONLY' });
    }

    if (profileUpdates.length === 0 && userUpdates.length === 0) {
      const result = await query(
        `SELECT ${userColumns} FROM ${userFrom} WHERE u.id = $1`,
        [id]
      );
      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found.' });
      const payload = toUser(user);
      const io = req.app.get('io');
      if (io) io.emit('user:updated', payload);
      return res.json({ user: payload });
    }

    if (userUpdates.length > 0) {
      userUpdates.push(`updated_at = NOW()`);
      userValues.push(id);
      await query(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${userPos}`,
        userValues
      );
    }

    if (profileUpdates.length > 0) {
      profileUpdates.push(`updated_at = NOW()`);
      profileValues.push(id);
      await query(
        `UPDATE profiles SET ${profileUpdates.join(', ')} WHERE user_id = $${profilePos}`,
        profileValues
      );
    }

    const result = await query(
      `SELECT ${userColumns} FROM ${userFrom} WHERE u.id = $1`,
      [id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const payload = toUser(user);
    const io = req.app.get('io');
    if (io) io.emit('user:updated', payload);
    res.json({ user: payload });
  } catch (err) {
    next(err);
  }
}
