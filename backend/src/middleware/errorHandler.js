/**
 * Error Handling Middleware
 * Centralized error handling for consistent error responses
 */

import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error Handler
 */
export const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

/**
 * Global Error Handler
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });
  
  // PostgreSQL errors
  if (error.code && error.code.startsWith('23')) {
    error = handlePostgresError(error);
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    error = new ApiError(400, 'Validation Error', error.details);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }
  
  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
    ...(config.isDevelopment && { stack: error.stack }),
  });
};

/**
 * Handle PostgreSQL-specific errors
 */
const handlePostgresError = (error) => {
  switch (error.code) {
    case '23505':
      // Unique constraint violation
      const field = error.constraint || 'field';
      return new ApiError(409, `${field} already exists`);
      
    case '23503':
      // Foreign key constraint violation
      return new ApiError(400, 'Invalid reference to related record');
      
    case '23502':
      // Not null constraint violation
      return new ApiError(400, 'Required field is missing');
      
    case '23514':
      // Check constraint violation
      return new ApiError(400, 'Invalid data provided');
      
    default:
      return new ApiError(500, 'Database operation failed');
  }
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
