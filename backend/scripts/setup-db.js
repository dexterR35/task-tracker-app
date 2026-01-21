/**
 * Database Setup Script
 * Run this script to create the database schema from schema.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { testConnection } from '../src/config/database.js';
import logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    logger.info('Starting database setup...');
    
    // Test database connection
    await testConnection();
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    logger.info('Executing schema...');
    await pool.query(schema);
    
    logger.info('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
