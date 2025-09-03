// Centralized logger utility
const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  debug: (...args) => {
    if (isDevelopment && import.meta.env.VITE_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};
