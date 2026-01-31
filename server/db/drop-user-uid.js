/**
 * Drop user_uid column from users table (use id only)
 * Run once: node db/drop-user-uid.js
 */

import pool from '../config/db.js';

async function run() {
  try {
    await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS user_uid');
    console.log('[drop-user-uid] Column user_uid dropped (or was already missing).');
  } catch (err) {
    console.error('[drop-user-uid] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
