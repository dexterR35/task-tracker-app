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

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '10m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
const REFRESH_TOKEN_COOKIE = process.env.REFRESH_TOKEN_COOKIE || 'refresh_token';
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

const cookieOptions = (maxAgeDays = REFRESH_TOKEN_EXPIRES_DAYS) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api',
  maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
});

const clearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api',
  maxAge: 0,
});

/** Create a refresh token; store hash in DB with session metadata. Returns raw token for cookie. */
async function createRefreshToken(userId, req) {
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

/** Validate refresh token (by hash); update last_used_at. Return user row or null. */
async function validateRefreshToken(token, _req) {
  if (!token || typeof token !== 'string') return null;
  const tokenHash = hashRefreshToken(token);
  const r = await query(
    `SELECT rt.user_id, u.id, u.email, u.role, u.is_active, p.name, p.office, p.job_position, p.gender
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE rt.token = $1 AND rt.expires_at > NOW() AND u.is_active = true`,
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

/** Allowed email domains for login/auth (REI office only). */
const ALLOWED_LOGIN_DOMAINS = ['rei-d-services.com', 'netbet.com', 'netbet.ro', 'gimo.co.uk'];

function isAllowedEmailDomain(email) {
  if (!email || typeof email !== 'string') return false;
  const domain = email.toLowerCase().trim().split('@')[1];
  return domain && ALLOWED_LOGIN_DOMAINS.includes(domain);
}

/** Auth + profile: users (auth) JOIN profiles. password_hash never returned. */
const authUserSelect = 'u.id, u.email, u.role, u.is_active, p.name, p.office, p.job_position, p.gender';

function toAuthUser(row) {
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

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    if (!isAllowedEmailDomain(email)) {
      return res.status(403).json({
        error: 'Only office emails are allowed: @rei-d-services.com, @netbet.com, @netbet.ro or @gimo.co.uk',
      });
    }

    const result = await query(
      `SELECT ${authUserSelect}, u.password_hash
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      authLogger.loginFail(req, 'user_not_found_or_inactive', 'USER_NOT_FOUND_OR_INACTIVE');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      authLogger.loginFail(req, 'invalid_password', 'INVALID_PASSWORD');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const { token: refreshToken } = await createRefreshToken(user.id, req);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions());

    authLogger.loginSuccess(req, user.id, user.email);
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

/** POST /api/auth/refresh - HTTP-only cookie sent; validates against sessions (refresh_tokens) table; returns new access token */
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const userRow = await validateRefreshToken(token, req);
    if (!userRow) {
      authLogger.refreshFail(req, 'invalid_or_expired', 'REFRESH_INVALID');
      return res.status(401).json({ error: 'Invalid or expired refresh token.', code: 'REFRESH_INVALID' });
    }
    await revokeRefreshToken(token);
    const accessToken = jwt.sign(
      { userId: userRow.id, email: userRow.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const { token: newRefreshToken } = await createRefreshToken(userRow.id, req);
    res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, cookieOptions());
    authLogger.refreshSuccess(req, userRow.id, userRow.email);
    const user = toAuthUser(userRow);
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
    if (req.user?.id) {
      await revokeRefreshTokensForUser(req.user.id);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions());
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
