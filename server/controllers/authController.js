/**
 * Auth API controller - login, me, refresh, logout, logout-all
 * Users are added manually (e.g. seed script or admin code), not via a register form.
 * Refresh tokens stored as SHA-256 hash in DB; session metadata (ip, user_agent) tracked.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { authLogger } from '../utils/authLogger.js';
import { ALLOWED_LOGIN_DOMAINS, isAllowedEmailDomain } from '../config/auth.js';
import { toAuthUser } from '../utils/userMappers.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '10m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
const REFRESH_TOKEN_COOKIE = process.env.REFRESH_TOKEN_COOKIE || 'refresh_token';
const REFRESH_TOKEN_MAX_DEVICES = parseInt(process.env.REFRESH_TOKEN_MAX_DEVICES, 10) || 5;
const isProduction = process.env.NODE_ENV === 'production';

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

function getSessionMeta(req) {
  const userAgent = req.get?.('user-agent') || null;
  const ip = req.ip || req.socket?.remoteAddress || req.get?.('x-forwarded-for')?.split(',')[0]?.trim() || null;
  return { userAgent, ip };
}

/**
 * Production-ready cookie options
 * - httpOnly: Prevents XSS attacks (JavaScript cannot access cookie)
 * - secure: Only sent over HTTPS in production
 * - sameSite: 'none' for cross-origin (required with secure), 'lax' for same-origin
 * - path: Restricts cookie to /api routes
 * - domain: Set in production if needed for subdomain sharing
 */
const cookieOptions = (maxAgeDays = REFRESH_TOKEN_EXPIRES_DAYS) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = process.env.CORS_ORIGIN?.includes('localhost') || !process.env.CORS_ORIGIN;
  
  return {
    httpOnly: true,
    secure: isProduction || !isLocalhost, // Secure in production, allow http on localhost
    sameSite: isProduction && !isLocalhost ? 'none' : 'lax', // 'none' for cross-origin in production
    path: '/api',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
  };
};

const clearCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = process.env.CORS_ORIGIN?.includes('localhost') || !process.env.CORS_ORIGIN;
  
  return {
    httpOnly: true,
    secure: isProduction || !isLocalhost,
    sameSite: isProduction && !isLocalhost ? 'none' : 'lax',
    path: '/api',
    maxAge: 0,
    ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
  };
};

/** Clear refresh cookie at path '/' (legacy default); use so we remove any old cookie and only one remains after login. */
const clearCookieOptionsLegacyPath = () => ({
  ...clearCookieOptions(),
  path: '/',
});

/** Delete expired refresh tokens (run when creating new tokens). */
async function deleteExpiredRefreshTokens() {
  await query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
}

/** Create a refresh token; store hash in DB with session metadata. Max REFRESH_TOKEN_MAX_DEVICES per user (oldest revoked). Returns raw token for cookie. */
async function createRefreshToken(userId, req) {
  await deleteExpiredRefreshTokens();

  const countResult = await query(
    'SELECT COUNT(*) AS c FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW()',
    [userId]
  );
  const count = parseInt(countResult.rows[0]?.c ?? 0, 10);
  if (count >= REFRESH_TOKEN_MAX_DEVICES) {
    const toRemove = count - REFRESH_TOKEN_MAX_DEVICES + 1;
    await query(
      `DELETE FROM refresh_tokens WHERE id IN (
        SELECT id FROM (
          SELECT id FROM refresh_tokens
          WHERE user_id = $1 AND expires_at > NOW()
          ORDER BY COALESCE(last_used_at, created_at) ASC
          LIMIT $2
        ) old
      )`,
      [userId, toRemove]
    );
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashRefreshToken(token);
  const expiresAt = addDays(new Date(), REFRESH_TOKEN_EXPIRES_DAYS);
  const { userAgent, ip } = getSessionMeta(req);
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, userAgent, ip]
  );
  return { token, expiresAt: expiresAt.toISOString() };
}

/** Validate refresh token (by hash); update last_used_at. Return user row or null. Department mandatory (same as login). */
async function validateRefreshToken(token, _req) {
  if (!token || typeof token !== 'string') return null;
  const tokenHash = hashRefreshToken(token);
  const r = await query(
    `SELECT rt.user_id, u.id, u.email, u.role, u.is_active, u.department_id,
      p.name, p.office, p.job_position, p.gender,
      d.name AS department_name
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE rt.token = $1 AND rt.expires_at > NOW() AND u.is_active = true AND u.department_id IS NOT NULL`,
    [tokenHash]
  );
  const row = r.rows[0];
  if (row) {
    await query(
      'UPDATE refresh_tokens SET last_used_at = NOW() WHERE token = $1',
      [tokenHash]
    );
  }
  return row || null;
}

/** Revoke one refresh token by value (hash lookup) */
async function revokeRefreshToken(token) {
  if (!token || typeof token !== 'string') return;
  const tokenHash = hashRefreshToken(token);
  await query('DELETE FROM refresh_tokens WHERE token = $1', [tokenHash]);
}

/** Revoke all refresh tokens for a user */
async function revokeRefreshTokensForUser(userId) {
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

/** Auth uses only users: email, password_hash, department_id, is_active (role for authorization). Name is profile-only, not used in login. */
const authUserSelect = `u.id, u.email, u.role, u.is_active, u.department_id,
  p.name, p.office, p.job_position, p.gender,
  d.name AS department_name`;

const authUserFrom = `users u
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN departments d ON d.id = u.department_id`;

/** POST /api/auth/login - Production-ready with rate limiting, validation, and security */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: 'Email is required.',
        code: 'VALIDATION_ERROR',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({
        error: 'Password is required.',
        code: 'VALIDATION_ERROR',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Invalid email format.',
        code: 'VALIDATION_ERROR',
      });
    }

    // Password length check (prevent DoS with extremely long passwords)
    if (password.length > 1000) {
      return res.status(400).json({
        error: 'Password is too long.',
        code: 'VALIDATION_ERROR',
      });
    }

    // Domain whitelist check
    if (!isAllowedEmailDomain(normalizedEmail)) {
      const domains = ALLOWED_LOGIN_DOMAINS.map((d) => `@${d}`).join(', ');
      authLogger.loginFail(req, 'domain_not_allowed', 'DOMAIN_NOT_ALLOWED');
      return res.status(403).json({
        error: `Only office emails are allowed: ${domains}`,
        code: 'DOMAIN_NOT_ALLOWED',
      });
    }

    const result = await query(
      `SELECT ${authUserSelect}, u.password_hash FROM ${authUserFrom} WHERE u.email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      authLogger.loginFail(req, 'user_not_found_or_inactive', 'USER_NOT_FOUND_OR_INACTIVE');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    /* Department mandatory for login (also NOT NULL in users table and enforced on refresh). */
    if (!user.department_id) {
      authLogger.loginFail(req, 'no_department', 'NO_DEPARTMENT');
      return res.status(403).json({
        error: 'Account must be assigned to a department. Contact admin.',
        code: 'NO_DEPARTMENT',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      authLogger.loginFail(req, 'invalid_password', 'INVALID_PASSWORD');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate access token with minimal payload
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        departmentId: user.department_id,
      },
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: process.env.JWT_ISSUER || 'task-tracker-api',
        audience: process.env.JWT_AUDIENCE || 'task-tracker-client',
      }
    );

    // Create refresh token and set secure cookie
    const { token: refreshToken } = await createRefreshToken(user.id, req);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions());

    authLogger.loginSuccess(req, user.id, user.email);
    delete user.password_hash;
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
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

/** POST /api/auth/refresh - HTTP-only cookie sent; validates against sessions (refresh_tokens) table; returns new access token.
 *  Production-ready with token rotation and security checks.
 *  When no valid cookie/session: 200 with token/user null (avoids 401 noise on initial session check when not logged in). */
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    
    // Validate refresh token
    const userRow = await validateRefreshToken(token, req);
    if (!userRow) {
      authLogger.refreshFail(req, 'invalid_or_expired', 'REFRESH_INVALID');
      // Clear invalid cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions());
      res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptionsLegacyPath());
      return res.status(200).json({ token: null, user: null });
    }

    // Token rotation: revoke old refresh token before issuing new one
    await revokeRefreshToken(token);
    
    // Generate new access token
    const accessToken = jwt.sign(
      { 
        userId: userRow.id, 
        email: userRow.email,
        role: userRow.role,
        departmentId: userRow.department_id,
      },
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: process.env.JWT_ISSUER || 'task-tracker-api',
        audience: process.env.JWT_AUDIENCE || 'task-tracker-client',
      }
    );
    
    // Issue new refresh token (rotation)
    const { token: newRefreshToken } = await createRefreshToken(userRow.id, req);
    res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, cookieOptions());
    
    authLogger.refreshSuccess(req, userRow.id, userRow.email);
    const user = toAuthUser(userRow);
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    res.json({
      message: 'Token refreshed',
      token: accessToken,
      user,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout - cookie sent; deletes session from DB, clears cookie, emits forceLogout via Socket.IO */
export async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    let userId = req.user?.id;
    let email = req.user?.email ?? null;
    if (token) {
      const userRow = await validateRefreshToken(token, req);
      if (userRow) {
        userId = userRow.id;
        email = userRow.email;
      }
      await revokeRefreshToken(token);
    }
    /* Only revoke current session (cookie). Use POST /auth/logout-all to revoke all devices. */
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptionsLegacyPath());
    const io = req.app.get?.('io');
    if (io && userId) {
      io.to(`user:${userId}`).emit('forceLogout');
      if (typeof io.forceDisconnectUser === 'function') {
        await io.forceDisconnectUser(userId);
      }
    }
    if (userId) authLogger.logout(req, userId, email ?? undefined);
    res.json({ message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout-all - Bearer required; revokes all sessions for user, emits forceLogout to all devices */
export async function logoutAll(req, res, next) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email ?? null;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    await revokeRefreshTokensForUser(userId);
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptionsLegacyPath());
    const io = req.app.get?.('io');
    if (io) {
      io.to(`user:${userId}`).emit('forceLogout');
      if (typeof io.forceDisconnectUser === 'function') {
        await io.forceDisconnectUser(userId);
      }
    }
    authLogger.logoutAll(req, userId, email ?? undefined);
    res.json({ message: 'Logged out from all devices.' });
  } catch (err) {
    next(err);
  }
}
