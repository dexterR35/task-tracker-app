/**
 * Seed a default admin user (optional)
 * Usage: npm run db:seed
 * Set SEED_ADMIN_PASSWORD in .env or it will use a default for dev only.
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

async function seed() {
  try {
    const hash = await bcrypt.hash(defaultPassword, 12);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@netbet.ro', hash, 'Admin (Netbet)', 'admin']
    );
    console.log('[seed] Default admin created (or already exists).');
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.log('[seed] Dev password: admin123 — set SEED_ADMIN_PASSWORD in production.');
    }
  } catch (err) {
    console.error('[seed] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
