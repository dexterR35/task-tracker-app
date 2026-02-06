/**
 * Production-ready error handling middleware
 * Standardizes error responses and logs errors appropriately
 */

import { logger } from '../utils/logger.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error handler - maps PostgreSQL errors to user-friendly messages
 */
export function handleDatabaseError(err) {
  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  const pgErrorCodes = {
    '23505': { // unique_violation
      status: 409,
      code: 'DUPLICATE_ENTRY',
      message: 'A record with this value already exists.',
    },
    '23503': { // foreign_key_violation
      status: 400,
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'Referenced record does not exist.',
    },
    '23502': { // not_null_violation
      status: 400,
      code: 'NOT_NULL_VIOLATION',
      message: 'Required field is missing.',
    },
    '23514': { // check_violation
      status: 400,
      code: 'CHECK_VIOLATION',
      message: 'Data validation failed.',
    },
    '42P01': { // undefined_table
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Database configuration error.',
    },
    '42703': { // undefined_column
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Database configuration error.',
    },
  };

  const errorCode = err.code;
  if (pgErrorCodes[errorCode]) {
    return new ApiError(
      pgErrorCodes[errorCode].message,
      pgErrorCodes[errorCode].status,
      pgErrorCodes[errorCode].code,
      process.env.NODE_ENV === 'development' ? { originalError: err.message } : null
    );
  }

  // Generic database error
  return new ApiError(
    'Database operation failed.',
    500,
    'DATABASE_ERROR',
    process.env.NODE_ENV === 'development' ? { originalError: err.message } : null
  );
}

/**
 * Main error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Log error
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket?.remoteAddress,
    userId: req.user?.id || null,
    error: err.message,
    code: err.code || 'UNKNOWN_ERROR',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };

  if (err instanceof ApiError) {
    logger.error('[API Error]', logData);
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('23') || err.code && err.code.startsWith('42')) {
    const dbError = handleDatabaseError(err);
    logger.error('[Database Error]', { ...logData, dbCode: err.code });
    return res.status(dbError.statusCode).json({
      error: dbError.message,
      code: dbError.code,
      ...(dbError.details && { details: dbError.details }),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn('[JWT Error]', logData);
    return res.status(401).json({
      error: err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.',
      code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    logger.warn('[Validation Error]', logData);
    return res.status(400).json({
      error: 'Validation failed.',
      code: 'VALIDATION_ERROR',
      details: err.details || [{ field: 'unknown', error: err.message }],
    });
  }

  // Unknown error - don't expose details in production
  logger.error('[Unknown Error]', logData);
  const isProduction = process.env.NODE_ENV === 'production';
  
  return res.status(err.statusCode || 500).json({
    error: isProduction ? 'Internal server error.' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(!isProduction && { stack: err.stack }),
  });
}

/**
 * Async handler wrapper - catches async errors and passes to error handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Resource not found.',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
}
