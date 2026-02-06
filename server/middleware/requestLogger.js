/**
 * Production-ready request logging middleware
 * Logs all incoming requests with timing and status
 */

import { logger } from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs request method, URL, status code, response time, and user info
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;

  // Log request start
  logger.debug('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket?.remoteAddress,
      userId: req.user?.id || null,
    };

    // Log errors at error level, others at info level
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
}
