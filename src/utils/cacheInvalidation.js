/**
 * Cache Invalidation Utilities
 * Manages cache clearing when data changes
 */

import dataCache from './dataCache';
import { logger } from './logger';

/**
 * Clear cache when static data changes
 */
export const clearStaticDataCache = (dataType) => {
  try {
    const cacheKeys = [
      `users_${getCurrentYear()}`,
      `reporters_${getCurrentYear()}`,
      `deliverables_${getCurrentYear()}`,
      'users',
      'reporters',
      'deliverables'
    ];

    cacheKeys.forEach(key => {
      dataCache.clearStaticData(key);
    });

    logger.log(`[CacheInvalidation] Cleared static data cache for: ${dataType}`);
  } catch (error) {
    logger.error('[CacheInvalidation] Error clearing static data cache:', error);
  }
};

/**
 * Clear cache when tasks change
 */
export const clearTasksDataCache = (monthId = null) => {
  try {
    const currentYear = getCurrentYear();
    const cacheKeys = [
      `tasks_${currentYear}`,
      'tasks'
    ];

    if (monthId) {
      cacheKeys.push(`tasks_${monthId}`);
      cacheKeys.push(`tasks_${monthId}_all`);
    }

    cacheKeys.forEach(key => {
      dataCache.clearTasksData(key);
    });

    logger.log(`[CacheInvalidation] Cleared tasks data cache for: ${monthId || 'all tasks'}`);
  } catch (error) {
    logger.error('[CacheInvalidation] Error clearing tasks data cache:', error);
  }
};

/**
 * Clear cache when month changes
 */
export const clearMonthDataCache = (monthId = null) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const cacheKeys = [
      `months_${currentYear}`,
      `currentMonth_${currentYear}`,
      `availableMonths_${currentYear}`
    ];

    if (monthId) {
      cacheKeys.push(`month_${monthId}`);
    }

    cacheKeys.forEach(key => {
      dataCache.clearMonthData(key);
    });

    logger.log(`[CacheInvalidation] Cleared month data cache for: ${monthId || 'all months'}`);
  } catch (error) {
    logger.error('[CacheInvalidation] Error clearing month data cache:', error);
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  try {
    dataCache.clearAll();
    logger.log('[CacheInvalidation] Cleared all cache');
  } catch (error) {
    logger.error('[CacheInvalidation] Error clearing all cache:', error);
  }
};

/**
 * Get current year for cache keys
 */
const getCurrentYear = () => {
  return new Date().getFullYear().toString();
};

/**
 * Cache invalidation hooks for different data types
 */
export const useCacheInvalidation = () => {
  return {
    clearUsersCache: () => clearStaticDataCache('users'),
    clearReportersCache: () => clearStaticDataCache('reporters'),
    clearDeliverablesCache: () => clearStaticDataCache('deliverables'),
    clearTasksCache: (monthId) => clearTasksDataCache(monthId),
    clearMonthCache: (monthId) => clearMonthDataCache(monthId),
    clearAllCache: () => clearAllCache()
  };
};

export default {
  clearStaticDataCache,
  clearTasksDataCache,
  clearMonthDataCache,
  clearAllCache,
  useCacheInvalidation
};
