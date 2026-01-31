/**
 * PERN backend - Express + PostgreSQL + Auth API
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pool from './config/db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());

/** Rate limiter for auth (login/register) – limits brute force per IP */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`[server] Running at http://localhost:${PORT}`);
  console.log(`[server] Auth API: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me`);
});
