/**
 * Shared cache configuration for RTK Query APIs
 * Provides consistent cache policies across the application
 */

// Cache duration constants (in seconds) - moved from constants.js
export const CACHE_DURATIONS = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 1800,     // 30 minutes
  VERY_LONG: 3600, // 1 hour
  INFINITE: Infinity
};

// Data volatility categories
export const DATA_VOLATILITY = {
  HIGH: 'HIGH',     // Changes frequently (tasks, real-time data)
  MEDIUM: 'MEDIUM', // Changes moderately (user data, reports)
  LOW: 'LOW',       // Changes rarely (static config, reporters)
  STATIC: 'STATIC'  // Never changes (constants, enums)
};

/**
 * Get cache configuration based on data volatility
 * @param {string} volatility - Data volatility level
 * @returns {Object} - Cache configuration object
 */
export const getCacheConfig = (volatility = DATA_VOLATILITY.MEDIUM) => {
  const configs = {
    [DATA_VOLATILITY.HIGH]: {
      keepUnusedDataFor: CACHE_DURATIONS.SHORT,
      refetchOnMountOrArgChange: CACHE_DURATIONS.SHORT,
      refetchOnFocus: true,
      refetchOnReconnect: true
    },
    [DATA_VOLATILITY.MEDIUM]: {
      keepUnusedDataFor: CACHE_DURATIONS.MEDIUM,
      refetchOnMountOrArgChange: CACHE_DURATIONS.MEDIUM,
      refetchOnFocus: false,
      refetchOnReconnect: true
    },
    [DATA_VOLATILITY.LOW]: {
      keepUnusedDataFor: CACHE_DURATIONS.LONG,
      refetchOnMountOrArgChange: CACHE_DURATIONS.LONG,
      refetchOnFocus: false,
      refetchOnReconnect: false
    },
    [DATA_VOLATILITY.STATIC]: {
      keepUnusedDataFor: CACHE_DURATIONS.INFINITE,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false
    }
  };

  return configs[volatility] || configs[DATA_VOLATILITY.MEDIUM];
};

/**
 * Predefined cache configurations for common data types
 */
export const CACHE_CONFIGS = {
  // Real-time data that changes frequently
  TASKS: getCacheConfig(DATA_VOLATILITY.HIGH),
  
  // User data that changes moderately
  USERS: getCacheConfig(DATA_VOLATILITY.MEDIUM),
  
  // Static data that rarely changes
  REPORTERS: getCacheConfig(DATA_VOLATILITY.STATIC),
  
  // Charts/analytics that change moderately
  CHARTS: getCacheConfig(DATA_VOLATILITY.MEDIUM),
  
  // Month data that changes rarely
  MONTHS: getCacheConfig(DATA_VOLATILITY.LOW)
};

/**
 * Get cache configuration by data type
 * @param {string} dataType - Type of data (TASKS, USERS, REPORTERS, etc.)
 * @returns {Object} - Cache configuration object
 */
export const getCacheConfigByType = (dataType) => {
  return CACHE_CONFIGS[dataType] || CACHE_CONFIGS.USERS;
};
