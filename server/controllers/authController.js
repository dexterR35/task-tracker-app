/**
 * Auth API controller - register, login, me
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/** Auth user fields: identity, role, office, occupation, manager. password_hash in DB only, never returned. */
const authUserSelect = 'id, email, name, role, is_active, office, occupation, manager_id';

function toAuthUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    office: row.office,
    occupation: row.occupation,
    managerId: row.manager_id,
  };
}

/** POST /api/auth/register */
export async function register(req, res, next) {
  try {
    const { email, password, name, role = 'user' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, name',
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Use admin or user.' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email.toLowerCase().trim(), hashed, name.trim(), role]
    );
    const inserted = result.rows[0];
    await query(
      'UPDATE users SET created_by = $1::text WHERE id = $1',
      [inserted.id]
    );
    const userResult = await query(
      `SELECT ${authUserSelect} FROM users WHERE id = $1`,
      [inserted.id]
    );
    const user = userResult.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: toAuthUser(user),
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    next(err);
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const result = await query(
      `SELECT ${authUserSelect}, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    delete user.password_hash;
    res.json({
      message: 'Login successful',
      token,
      user: toAuthUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me - requires auth middleware */
export async function me(req, res, next) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}
