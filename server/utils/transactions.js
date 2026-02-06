/**
 * Database transaction utilities for production
 * Provides safe transaction handling with automatic rollback on errors
 */

import pool from '../config/db.js';
import { query } from '../config/db.js';
import { logger } from './logger.js';

/**
 * Execute a function within a database transaction
 * Automatically commits on success or rolls back on error
 * 
 * @param {Function} callback - Async function that receives a client with transaction context
 * @returns {Promise} - Result of the callback function
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', {
      error: error.message,
      code: error.code,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Query helper that uses transaction client if provided, otherwise uses pool
 */
export async function queryWithClient(client, sql, params) {
  if (client) {
    return client.query(sql, params);
  }
  return query(sql, params);
}
