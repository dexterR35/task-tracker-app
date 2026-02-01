/* eslint-env node */
/**
 * Seed users using the same DATABASE_URL and bcryptjs as the app (server/.env).
 * Run from server/: npm run db:seed
 * Creates one admin and one user per department (Design, Customer Support, Food).
 * Passwords: admin123 (admins), user123 (users).
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[seed] DATABASE_URL is not set. Create server/.env from env.example and set DATABASE_URL.');
  process.exit(1);
}

const SALT_ROUNDS = 10;

/** Departments to seed; for each we create one admin + one user */
const DEPT_SLUGS = ['design', 'customer-support', 'food'];

/** One admin and one user per department. Email: admin-{slug}@netbet.ro, user-{slug}@netbet.ro */
const USERS = DEPT_SLUGS.flatMap((deptSlug) => [
  { email: `admin-${deptSlug}@netbet.ro`, password: 'admin123', role: 'admin', deptSlug, name: `Admin (${deptSlug})` },
  { email: `user-${deptSlug}@netbet.ro`, password: 'user123', role: 'user', deptSlug, name: `User (${deptSlug})` },
]);

/** Legacy emails to remove so only one admin + one user per department remain */
const LEGACY_EMAILS = [
  'admin@netbet.ro',
  'admin2@netbet.ro',
  'food@netbet.ro',
  'food2@netbet.ro',
];

async function run() {
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  });

  try {
    // Remove legacy users (old seed: admin@, admin2@, food@, food2@netbet.ro)
    await pool.query(
      'DELETE FROM users WHERE email = ANY($1::text[])',
      [LEGACY_EMAILS]
    );

    // Keep only Design, Customer Support, Food in DB (remove others: QA, Development, etc.)
    await pool.query(
      `DELETE FROM users WHERE department_id IN (SELECT id FROM departments WHERE slug NOT IN ('design', 'customer-support', 'food'))`
    );
    await pool.query(
      "DELETE FROM departments WHERE slug NOT IN ('design', 'customer-support', 'food')"
    );

    // Ensure required departments exist (e.g. Food may be missing if DB was created before it was in schema)
    await pool.query(
      `INSERT INTO departments (name, slug) VALUES
       ('Design', 'design'),
       ('Food', 'food'),
       ('Customer Support', 'customer-support')
       ON CONFLICT (slug) DO NOTHING`
    );

    const deptRes = await pool.query(
      "SELECT id, slug FROM departments WHERE slug IN ('design', 'customer-support', 'food')"
    );
    const deptBySlug = Object.fromEntries(deptRes.rows.map((r) => [r.slug, r.id]));

    for (const u of USERS) {
      const departmentId = deptBySlug[u.deptSlug];
      if (!departmentId) {
        console.warn(`[seed] Department "${u.deptSlug}" not found, skipping ${u.email}`);
        continue;
      }
      const password_hash = await bcrypt.hash(u.password, SALT_ROUNDS);
      await pool.query(
        `INSERT INTO users (email, password_hash, role, department_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           department_id = EXCLUDED.department_id`,
        [u.email.toLowerCase(), password_hash, u.role, departmentId]
      );
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [u.email.toLowerCase()]);
      const userId = userRes.rows[0]?.id;
      if (userId) {
        await pool.query(
          `INSERT INTO profiles (user_id, name) VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name`,
          [userId, u.name]
        );
      }
    }

    console.log('[seed] Users seeded: one admin + one user per department (design, customer-support, food). Emails: admin-{dept}@netbet.ro / user-{dept}@netbet.ro');
  } catch (err) {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
