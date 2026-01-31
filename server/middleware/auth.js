/**
 * JWT auth middleware - protect routes
 */

import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await query(
      'SELECT id, email, name, role, is_active, office, occupation, manager_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active,
      office: user.office,
      occupation: user.occupation,
      managerId: user.manager_id,
    };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    next(err);
  }
};

/** Optional: require specific role */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden.' });
  }
  next();
};
