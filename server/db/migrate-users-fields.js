/**
 * Add user profile fields to users table (color_set, created_by, occupation, office, user_uid)
 * Run once: node db/migrate-users-fields.js
 */

import pool from '../config/db.js';

const columns = [
  ['color_set', 'VARCHAR(20)'],
  ['created_by', 'VARCHAR(100)'],
  ['occupation', 'VARCHAR(100)'],
  ['office', 'VARCHAR(100)'],
];

async function migrate() {
  try {
    for (const [name, type] of columns) {
      await pool.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${name} ${type}`
      );
    }
    console.log('[migrate-users-fields] Columns added successfully.');
  } catch (err) {
    console.error('[migrate-users-fields] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
