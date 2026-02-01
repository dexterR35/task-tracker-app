/**
 * Auth middleware – JWT + users (auth) JOIN profiles.
 * Protects routes, sets req.user (auth + profile fields). Supports key rotation.
 * Failed auth (401/503) is logged via authLogger for audit.
 */

import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { authLogger } from '../utils/authLogger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_PREVIOUS = process.env.JWT_SECRET_PREVIOUS;

const LOG_JWT_FAILURES = process.env.LOG_JWT_FAILURES === 'true' || process.env.LOG_JWT_FAILURES === '1';

/** Shared JWT verification (key rotation supported). Used by HTTP middleware and Socket.IO. */
export function verifyToken(token, options = {}) {
  try {
    return jwt.verify(token, JWT_SECRET, options);
  } catch (err) {
    if (LOG_JWT_FAILURES) {
      console.warn('[auth] JWT verification failed', { reason: err.message, name: err.name });
    }
    if (JWT_SECRET_PREVIOUS && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
      try {
        return jwt.verify(token, JWT_SECRET_PREVIOUS, options);
      } catch (prevErr) {
        if (LOG_JWT_FAILURES) {
          console.warn('[auth] JWT verification with previous secret also failed', { reason: prevErr.message });
        }
        throw err;
      }
    }
    throw err;
  }
}

const USER_QUERY = `SELECT u.id, u.email, u.role, u.is_active, p.name, p.office, p.job_position, p.gender
  FROM users u
  LEFT JOIN profiles p ON p.user_id = u.id
  WHERE u.id = $1`;

const USER_MINIMAL_QUERY = `SELECT u.id, u.email, u.role, u.is_active FROM users u WHERE u.id = $1`;

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    office: row.office,
    jobPosition: row.job_position,
    gender: row.gender,
  };
}

/**
 * Resolve user from JWT. Used by HTTP middleware and Socket.IO. Throws on invalid token or inactive user.
 * @param {object} [opts] - { minimal: true } for Socket (id, email, role, isActive only) to reduce payload.
 */
export async function getUserFromToken(token, opts = {}) {
  if (!JWT_SECRET) {
    throw new Error('Authentication not configured.');
  }
  const decoded = verifyToken(token);
  const minimal = opts.minimal === true;
  const sql = minimal ? USER_MINIMAL_QUERY : USER_QUERY;
  const result = await query(sql, [decoded.userId]);
  const row = result.rows[0];
  if (!row || !row.is_active) {
    throw new Error('User not found or inactive.');
  }
  if (minimal) {
    return { id: row.id, email: row.email, role: row.role, isActive: row.is_active };
  }
  return toUser(row);
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      authLogger.authenticateFail(req, 'NO_TOKEN', 'Access denied. No token provided.');
      return res.status(401).json({ error: 'Access denied. No token provided.', code: 'NO_TOKEN' });
    }
    req.user = await getUserFromToken(token);
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      authLogger.authenticateFail(req, 'TOKEN_INVALID', err.message);
      return res.status(401).json({ error: 'Invalid token.', code: 'TOKEN_INVALID' });
    }
    if (err.name === 'TokenExpiredError') {
      authLogger.authenticateFail(req, 'TOKEN_EXPIRED', err.message);
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    if (err.message === 'Authentication not configured.') {
      authLogger.authenticateFail(req, 'AUTH_NOT_CONFIGURED', err.message);
      return res.status(503).json({ error: 'Authentication not configured.', code: 'AUTH_NOT_CONFIGURED' });
    }
    if (err.message === 'User not found or inactive.') {
      authLogger.authenticateFail(req, 'USER_INACTIVE', err.message);
      return res.status(401).json({ error: 'User not found or inactive.', code: 'USER_INACTIVE' });
    }
    next(err);
  }
};

/** Optional auth: set req.user if valid Bearer; no 401. Full profile (same shape as getUserFromToken). Logs if token is expired, including role. */
export const optionalAuthenticate = async (req, res, next) => {
  if (!JWT_SECRET) return next();
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return next();
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        try {
          decoded = verifyToken(token, { ignoreExpiration: true });
        } catch {
          return next();
        }
      } else {
        return next();
      }
    }
    const result = await query(USER_QUERY, [decoded.userId]);
    const row = result.rows[0];
    if (!row || !row.is_active) return next();
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.warn('[optionalAuth] Expired token used', {
        userId: row.id,
        role: row.role,
        exp: new Date(decoded.exp * 1000).toISOString(),
      });
    }
    req.user = toUser(row);
    next();
  } catch {
    next();
  }
};

/** Optional: require specific role. Logs failed checks for audit. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    authLogger.authorizeFail(req, 'UNAUTHORIZED', null, null);
    return res.status(401).json({ error: 'Unauthorized.', code: 'UNAUTHORIZED' });
  }
  if (!roles.includes(req.user.role)) {
    authLogger.authorizeFail(req, 'FORBIDDEN', req.user.id, req.user.role);
    return res.status(403).json({ error: 'Forbidden.', code: 'FORBIDDEN' });
  }
  next();
};
