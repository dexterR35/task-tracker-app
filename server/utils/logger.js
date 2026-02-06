/**
 * Production-ready structured logging utility
 * Provides consistent logging format for production monitoring
 */

const isProduction = process.env.NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.info;

/**
 * Format log entry for production
 */
function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...data,
  };

  if (isProduction) {
    // In production, output JSON for log aggregation tools
    return JSON.stringify(logEntry);
  }

  // In development, output formatted string
  const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data, null, 2)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

export const logger = {
  error(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.error) {
      console.error(formatLog('error', message, data));
    }
  },

  warn(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.warn) {
      console.warn(formatLog('warn', message, data));
    }
  },

  info(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.info) {
      console.log(formatLog('info', message, data));
    }
  },

  debug(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.debug) {
      console.log(formatLog('debug', message, data));
    }
  },
};
