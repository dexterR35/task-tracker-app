
import { CACHE_CONFIG } from '@/constants';

// Re-export constants from centralized location for backward compatibility
export const CACHE_DURATIONS = CACHE_CONFIG.DURATIONS;
export const DATA_VOLATILITY = CACHE_CONFIG.DATA_VOLATILITY;

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
  // Tasks with real-time Firebase listeners - long cache to prevent memory leaks
  TASKS: {
    keepUnusedDataFor: CACHE_DURATIONS.LONG, // Changed from INFINITE to prevent memory leaks
    refetchOnMountOrArgChange: false, // Don't refetch - real-time listeners handle updates
    refetchOnFocus: false, // Don't refetch on focus - real-time listeners handle updates
    refetchOnReconnect: false // Don't refetch on reconnect - prevent infinite loops
  },
  
  // User data - long cache since users don't change frequently
  USERS: {
    keepUnusedDataFor: CACHE_DURATIONS.LONG, // Changed from INFINITE to prevent memory leaks
    refetchOnMountOrArgChange: false, // Don't refetch - users are stable
    refetchOnFocus: false, // Don't refetch - users are stable
    refetchOnReconnect: false // Don't refetch - users are stable
  },
  
  // Reporters - allow refetching since they can be added/updated
  REPORTERS: {
    keepUnusedDataFor: CACHE_DURATIONS.LONG,
    refetchOnMountOrArgChange: CACHE_DURATIONS.MEDIUM,
    refetchOnFocus: false,
    refetchOnReconnect: true
  },
  
  // Charts/analytics that change moderately
  CHARTS: getCacheConfig(DATA_VOLATILITY.MEDIUM),
  
  // Month data that changes rarely
  MONTHS: getCacheConfig(DATA_VOLATILITY.LOW),
  
  // Settings data - allow refetching since they can be updated
  SETTINGS: {
    keepUnusedDataFor: CACHE_DURATIONS.SHORT, // Short cache for settings
    refetchOnMountOrArgChange: CACHE_DURATIONS.SHORT,
    refetchOnFocus: true, // Refetch on focus for settings
    refetchOnReconnect: true
  }
};

/**
 * Get cache configuration by data type
 * @param {string} dataType - Type of data (TASKS, USERS, REPORTERS, etc.)
 * @returns {Object} - Cache configuration object
 */
export const getCacheConfigByType = (dataType) => {
  return CACHE_CONFIGS[dataType] || CACHE_CONFIGS.USERS;
};
