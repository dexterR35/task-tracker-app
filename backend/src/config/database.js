/**
 * Database Configuration
 * PostgreSQL connection with native pg driver (Raw SQL)
 */

import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection events
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    logger.info('New client connected to PostgreSQL');
  }
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Connection test
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('✅ Database connected successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await pool.end();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
};

// Query helper with error handling
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Executed query in ${duration}ms`, { text, params });
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
