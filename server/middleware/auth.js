/**
 * Auth middleware – JWT + users (auth) JOIN profiles.
 * Protects routes, sets req.user (auth + profile fields). Supports key rotation.
 * Failed auth (401/503) is logged via authLogger for audit.
 */

import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { authLogger } from '../utils/authLogger.js';
import { toAuthUser } from '../utils/userMappers.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_PREVIOUS = process.env.JWT_SECRET_PREVIOUS;

const LOG_JWT_FAILURES = process.env.LOG_JWT_FAILURES === 'true' || process.env.LOG_JWT_FAILURES === '1';

/**
 * Production-ready JWT verification with key rotation support
 * Validates issuer and audience for additional security
 */
export function verifyToken(token, options = {}) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required');
  }

  // Production security: validate issuer and audience
  const verifyOptions = {
    ...options,
    issuer: process.env.JWT_ISSUER || 'task-tracker-api',
    audience: process.env.JWT_AUDIENCE || 'task-tracker-client',
  };

  try {
    return jwt.verify(token, JWT_SECRET, verifyOptions);
  } catch (err) {
    if (LOG_JWT_FAILURES) {
      logger.warn('[auth] JWT verification failed', { 
        reason: err.message, 
        name: err.name,
        code: err.code,
      });
    }
    
    // Key rotation: try previous secret if current fails
    if (JWT_SECRET_PREVIOUS && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
      try {
        return jwt.verify(token, JWT_SECRET_PREVIOUS, verifyOptions);
      } catch (prevErr) {
        if (LOG_JWT_FAILURES) {
          logger.warn('[auth] JWT verification with previous secret also failed', { 
            reason: prevErr.message,
            code: prevErr.code,
          });
        }
        throw err; // Throw original error
      }
    }
    throw err;
  }
}

const USER_QUERY = `SELECT u.id, u.email, u.role, u.is_active, u.department_id,
  p.name, p.office, p.job_position, p.gender,
  d.name AS department_name
  FROM users u
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN departments d ON d.id = u.department_id
  WHERE u.id = $1`;

const USER_MINIMAL_QUERY = `SELECT u.id, u.email, u.role, u.is_active FROM users u WHERE u.id = $1`;

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
  /* Department mandatory for auth (also NOT NULL in users table; enforced on login and refresh). */
  if (row.department_id == null) {
    throw new Error('User must have a department.');
  }
  return toAuthUser(row);
}

/**
 * Production-ready authentication middleware
 * Validates JWT token, sets req.user, enforces department requirement
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      authLogger.authenticateFail(req, 'NO_TOKEN', 'Access denied. No token provided.');
      return res.status(401).json({ 
        error: 'Access denied. No token provided.', 
        code: 'NO_TOKEN' 
      });
    }

    // Validate Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      authLogger.authenticateFail(req, 'INVALID_FORMAT', 'Invalid authorization header format.');
      return res.status(401).json({ 
        error: 'Invalid authorization header format. Use: Bearer <token>', 
        code: 'INVALID_FORMAT' 
      });
    }

    const token = authHeader.slice(7).trim();
    
    // Basic token validation
    if (!token || token.length < 10) {
      authLogger.authenticateFail(req, 'TOKEN_INVALID', 'Token is too short or invalid.');
      return res.status(401).json({ 
        error: 'Invalid token.', 
        code: 'TOKEN_INVALID' 
      });
    }

    // Get user from token (validates JWT and fetches user from DB)
    req.user = await getUserFromToken(token);
    
    // Security: Ensure user has department (mandatory)
    if (!req.user.departmentId) {
      authLogger.authenticateFail(req, 'NO_DEPARTMENT', 'User must have a department.');
      return res.status(403).json({ 
        error: 'Account must be assigned to a department. Contact admin.', 
        code: 'NO_DEPARTMENT' 
      });
    }

    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      authLogger.authenticateFail(req, 'TOKEN_INVALID', err.message);
      return res.status(401).json({ 
        error: 'Invalid token.', 
        code: 'TOKEN_INVALID' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      authLogger.authenticateFail(req, 'TOKEN_EXPIRED', err.message);
      return res.status(401).json({ 
        error: 'Token expired.', 
        code: 'TOKEN_EXPIRED' 
      });
    }

    if (err.name === 'NotBeforeError') {
      authLogger.authenticateFail(req, 'TOKEN_NOT_ACTIVE', err.message);
      return res.status(401).json({ 
        error: 'Token not yet active.', 
        code: 'TOKEN_NOT_ACTIVE' 
      });
    }

    // Handle custom errors
    if (err.message === 'Authentication not configured.') {
      authLogger.authenticateFail(req, 'AUTH_NOT_CONFIGURED', err.message);
      return res.status(503).json({ 
        error: 'Authentication not configured.', 
        code: 'AUTH_NOT_CONFIGURED' 
      });
    }

    if (err.message === 'User not found or inactive.') {
      authLogger.authenticateFail(req, 'USER_INACTIVE', err.message);
      return res.status(401).json({ 
        error: 'User not found or inactive.', 
        code: 'USER_INACTIVE' 
      });
    }

    if (err.message === 'User must have a department.') {
      authLogger.authenticateFail(req, 'NO_DEPARTMENT', err.message);
      return res.status(403).json({ 
        error: 'Account must be assigned to a department. Contact admin.', 
        code: 'NO_DEPARTMENT' 
      });
    }

    // Pass unknown errors to error handler
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
      logger.warn('[optionalAuth] Expired token used', {
        userId: row.id,
        role: row.role,
        exp: new Date(decoded.exp * 1000).toISOString(),
      });
    }
    req.user = toAuthUser(row);
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

/**
 * Department slug guards for 2-apps-in-1: Design (tasks) vs Food (orders).
 * Use after authenticate. req.user.departmentSlug must be set.
 */

/**
 * Production-ready department slug guard
 * Allow only users whose department slug matches
 * E.g. requireDepartmentSlug('food') for orders API
 */
export const requireDepartmentSlug = (slug) => (req, res, next) => {
  if (!req.user) {
    authLogger.authorizeFail(req, 'UNAUTHORIZED', null, null);
    return res.status(401).json({ 
      error: 'Unauthorized.', 
      code: 'UNAUTHORIZED' 
    });
  }

  // Validate slug parameter
  if (!slug || typeof slug !== 'string') {
    logger.error('[requireDepartmentSlug] Invalid slug parameter', { slug });
    return res.status(500).json({ 
      error: 'Server configuration error.', 
      code: 'SERVER_ERROR' 
    });
  }

  const userSlug = req.user.departmentSlug ?? '';
  if (userSlug !== slug.toLowerCase().trim()) {
    authLogger.authorizeFail(req, 'WRONG_DEPARTMENT', req.user.id, req.user.role);
    return res.status(403).json({
      error: 'Access allowed only for this department.',
      code: 'WRONG_DEPARTMENT',
      requiredDepartment: slug,
      userDepartment: userSlug || 'none',
    });
  }
  next();
};

/**
 * Production-ready department slug rejection guard
 * Reject users whose department slug matches
 * E.g. rejectDepartmentSlug('food') for task-boards/tasks API
 */
export const rejectDepartmentSlug = (slug) => (req, res, next) => {
  if (!req.user) {
    authLogger.authorizeFail(req, 'UNAUTHORIZED', null, null);
    return res.status(401).json({ 
      error: 'Unauthorized.', 
      code: 'UNAUTHORIZED' 
    });
  }

  // Validate slug parameter
  if (!slug || typeof slug !== 'string') {
    logger.error('[rejectDepartmentSlug] Invalid slug parameter', { slug });
    return res.status(500).json({ 
      error: 'Server configuration error.', 
      code: 'SERVER_ERROR' 
    });
  }

  const userSlug = req.user.departmentSlug ?? '';
  if (userSlug === slug.toLowerCase().trim()) {
    authLogger.authorizeFail(req, 'WRONG_DEPARTMENT', req.user.id, req.user.role);
    return res.status(403).json({
      error: 'This department uses a different app. Please use the correct department interface.',
      code: 'WRONG_DEPARTMENT',
      userDepartment: userSlug,
    });
  }
  next();
};

