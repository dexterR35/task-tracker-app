/**
 * PostgreSQL connection pool
 * PERN backend - database config
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('[db] New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
