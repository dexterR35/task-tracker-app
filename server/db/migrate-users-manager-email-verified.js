/**
 * Add manager_id and email_verified_at to users (for existing DBs).
 * Run once: node db/migrate-users-manager-email-verified.js
 * New DBs: use schema.sql / npm run db:migrate (already includes these columns).
 */

import pool from '../config/db.js';

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
    `);
    console.log('[migrate] manager_id and email_verified_at added to users.');
  } catch (err) {
    console.error('[migrate] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
