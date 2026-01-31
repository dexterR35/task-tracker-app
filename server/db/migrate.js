/**
 * Run schema migration (creates users + refresh_tokens tables)
 * Usage: npm run db:migrate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('[migrate] Schema applied successfully.');
  } catch (err) {
    const msg = err.message || err.code || String(err);
    console.error('[migrate] Error:', msg);
    if (err.code) console.error('[migrate] Code:', err.code);
    if (!process.env.DATABASE_URL) console.error('[migrate] DATABASE_URL is not set in .env');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
