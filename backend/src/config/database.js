/**
 * Database Configuration
 * Prisma Client initialization and connection management
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

// Prisma Client instance with logging
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Connection test
export const testConnection = async () => {
  try {
    await prisma.$connect();
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
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
};

// Handle connection errors
prisma.$on('error', (e) => {
  logger.error('Prisma Client Error:', e);
});

export default prisma;
