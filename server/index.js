/**
 * PERN backend - Express + PostgreSQL + Auth API + Socket.io
 * Security: Helmet for headers; HTTPS in production (reverse proxy or REDIRECT_HTTP_TO_HTTPS).
 */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './config/db.js';
import { getUserFromToken } from './middleware/auth.js';
import { authLogger } from './utils/authLogger.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('[server] JWT_SECRET must be set and at least 32 characters in production.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('[server] DATABASE_URL must be set in production.');
    process.exit(1);
  }
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin || !corsOrigin.trim()) {
    console.error('[server] CORS_ORIGIN must be set in production (explicit origin(s), no *).');
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

const app = express();

/** CORS: production = explicit origins (comma-separated); dev = allow all */
const corsOrigin = process.env.CORS_ORIGIN;
const origin = isProduction && corsOrigin
  ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
  : (corsOrigin || true);
app.use(cors({ origin, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cookieParser());

/** Optional: redirect HTTP to HTTPS in production (or use reverse proxy) */
if (isProduction && process.env.REDIRECT_HTTP_TO_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.secure) return next();
    res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  });
}

/** Rate limiter for auth (login): per-email when body has email, else per-IP (limits brute force and targeted attacks) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  message: { error: 'Too many attempts. Try again in 15 minutes.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email;
    if (email && typeof email === 'string') {
      return `email:${email.toLowerCase().trim()}`;
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  },
});

/** Health: extensible for DB, Redis (when adapter used), etc. */
app.get('/health', (_, res) => res.json({ status: 'ok', db: 'pending' }));

app.get('/health/db', async (_, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);

app.use('/api', (_, res) => res.status(404).json({ error: 'Not found.', code: 'NOT_FOUND' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const payload = { error: err.message || 'Internal server error' };
  if (err.code) payload.code = err.code;
  res.status(status).json(payload);
});

const server = http.createServer(app);

/** Socket.IO CORS: same as Express. For multi-server, use Redis adapter (io.adapter(redisAdapter)). */
const io = new Server(server, {
  cors: {
    origin: Array.isArray(origin) ? origin : (origin === true ? '*' : origin),
    credentials: true,
  },
});

/** Socket.IO auth: same logic as HTTP middleware. On expired token we accept briefly, emit auth:expired (userId/email), then disconnect so client can refresh and reconnect. */
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(Object.assign(new Error('Unauthorized'), { code: 'NO_TOKEN' }));
  }
  try {
    const user = await getUserFromToken(token, { minimal: true });
    socket.userId = user.id;
    socket.userEmail = user.email;
    socket.role = user.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const decoded = jwt.decode(token);
      socket.tokenExpired = true;
      socket.userId = decoded?.userId ?? null;
      socket.userEmail = decoded?.email ?? null;
      next();
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      return next(Object.assign(new Error('Invalid token'), { code: 'TOKEN_INVALID' }));
    }
    return next(Object.assign(new Error(err.message || 'Unauthorized'), { code: 'AUTH_FAILED' }));
  }
});

/** Allowed Socket.IO events and required roles (identity from JWT, not socket.id) */
const SOCKET_EVENT_ROLES = {
  'task:subscribe': ['user', 'admin'],
  'task:unsubscribe': ['user', 'admin'],
  'admin:broadcast': ['admin'],
};

function requireSocketEventRole(socket, eventName) {
  const allowed = SOCKET_EVENT_ROLES[eventName];
  if (!allowed || !allowed.includes(socket.role)) {
    throw new Error('Forbidden');
  }
}

io.on('connection', (socket) => {
  if (socket.tokenExpired) {
    socket.emit('auth:expired', { userId: socket.userId, email: socket.userEmail, code: 'TOKEN_EXPIRED' });
    socket.disconnect(true);
    return;
  }

  socket.join(`user:${socket.userId}`);
  authLogger.socketConnect(socket);

  Object.keys(SOCKET_EVENT_ROLES).forEach((eventName) => {
    socket.on(eventName, (...args) => {
      try {
        requireSocketEventRole(socket, eventName);
        const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
        if (cb) cb({ ok: true });
      } catch (err) {
        const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
        if (cb) cb({ error: err.message || 'Forbidden', code: 'FORBIDDEN' });
        else socket.emit('auth:error', { event: eventName, error: err.message, code: 'FORBIDDEN' });
      }
    });
  });

  socket.on('disconnect', (reason) => {
    authLogger.socketDisconnect(socket, reason);
  });
});

/** Disconnect all sockets for a user (e.g. on logout / logout-all). Call after emitting forceLogout. */
io.forceDisconnectUser = async (userId) => {
  const sockets = await io.to(`user:${userId}`).fetchSockets();
  for (const s of sockets) {
    s.disconnect(true);
  }
};

app.set('io', io);

export { io };

server.listen(PORT, () => {
  console.log(`[server] Running at http://localhost:${PORT}`);
  console.log(`[server] Auth API: POST /api/auth/login, GET /api/auth/me, POST /api/auth/refresh, POST /api/auth/logout, POST /api/auth/logout-all`);
  console.log(`[server] Socket.io: authenticated with same JWT (auth.token or query.token)`);
});
