/**
 * Analytics Cache Utility
 * Provides intelligent caching for expensive analytics calculations
 * Invalidates cache when data changes (new tasks, updates, etc.)
 */

// Cache storage - in a real app, you might use localStorage or a more sophisticated cache
const analyticsCache = new Map();

// Cache configuration
export const CACHE_CONFIG = {
  // Cache duration in milliseconds (2 minutes - shorter for better responsiveness)
  TTL: 2 * 60 * 1000,
  // Maximum cache size
  MAX_SIZE: 30,
  // Cache keys
  KEYS: {
    MARKETS_BY_USERS: 'markets_by_users',
    MARKETING_ANALYTICS: 'marketing_analytics', 
    ACQUISITION_ANALYTICS: 'acquisition_analytics',
    PRODUCT_ANALYTICS: 'product_analytics'
  }
};

/**
 * Generate a cache key based on data and parameters
 * @param {string} type - Analytics type
 * @param {Array} tasks - Tasks data
 * @param {Object} month - Month data
 * @param {Array} users - Users data
 * @returns {string} Cache key
 */
const generateCacheKey = (type, tasks, month, users) => {
  // Create a hash of the relevant data
  const tasksHash = tasks?.length || 0;
  const monthHash = month?.monthId || 'current';
  const usersHash = users?.length || 0;
  
  // Include task IDs and timestamps for change detection
  const taskIds = tasks?.map(t => t.id || t.taskId).sort().join(',') || '';
  const lastModified = tasks?.reduce((max, task) => {
    const modified = task.updatedAt || task.createdAt || 0;
    return Math.max(max, new Date(modified).getTime());
  }, 0) || 0;
  
  return `${type}_${tasksHash}_${monthHash}_${usersHash}_${taskIds}_${lastModified}`;
};

/**
 * Check if cache entry is valid (not expired)
 * @param {Object} cacheEntry - Cache entry
 * @returns {boolean} Is valid
 */
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  
  const now = Date.now();
  return (now - cacheEntry.timestamp) < CACHE_CONFIG.TTL;
};

/**
 * Get cached analytics data
 * @param {string} type - Analytics type
 * @param {Array} tasks - Tasks data
 * @param {Object} month - Month data
 * @param {Array} users - Users data
 * @returns {Object|null} Cached data or null
 */
export const getCachedAnalytics = (type, tasks, month, users) => {
  const cacheKey = generateCacheKey(type, tasks, month, users);
  const cacheEntry = analyticsCache.get(cacheKey);
  
  if (isCacheValid(cacheEntry)) {
    console.log(`📊 Analytics cache HIT for ${type}`);
    return cacheEntry.data;
  }
  
  // Remove expired entry
  if (cacheEntry) {
    analyticsCache.delete(cacheKey);
  }
  
  console.log(`📊 Analytics cache MISS for ${type}`);
  return null;
};

/**
 * Set analytics data in cache
 * @param {string} type - Analytics type
 * @param {Array} tasks - Tasks data
 * @param {Object} month - Month data
 * @param {Array} users - Users data
 * @param {Object} data - Analytics data to cache
 */
export const setCachedAnalytics = (type, tasks, month, users, data) => {
  const cacheKey = generateCacheKey(type, tasks, month, users);
  
  // Clean up cache if it's getting too large
  if (analyticsCache.size >= CACHE_CONFIG.MAX_SIZE) {
    const oldestKey = analyticsCache.keys().next().value;
    analyticsCache.delete(oldestKey);
  }
  
  analyticsCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    type,
    key: cacheKey
  });
  
  console.log(`📊 Analytics cache SET for ${type}`);
};

/**
 * Clear all analytics cache
 */
export const clearAnalyticsCache = () => {
  analyticsCache.clear();
  console.log('📊 Analytics cache CLEARED');
};

/**
 * Clear cache for specific type
 * @param {string} type - Analytics type to clear
 */
export const clearAnalyticsCacheByType = (type) => {
  for (const [key, entry] of analyticsCache.entries()) {
    if (entry.type === type) {
      analyticsCache.delete(key);
    }
  }
  console.log(`📊 Analytics cache CLEARED for ${type}`);
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const entry of analyticsCache.values()) {
    if (isCacheValid(entry)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: analyticsCache.size,
    validEntries,
    expiredEntries,
    maxSize: CACHE_CONFIG.MAX_SIZE,
    ttl: CACHE_CONFIG.TTL
  };
};

/**
 * Hook for analytics caching
 * @param {string} type - Analytics type
 * @param {Function} calculateFn - Function to calculate analytics
 * @param {Array} tasks - Tasks data
 * @param {Object} month - Month data
 * @param {Array} users - Users data
 * @returns {Object} Cached analytics data
 */
export const useAnalyticsCache = (type, calculateFn, tasks, month, users) => {
  // Try to get from cache first
  const cachedData = getCachedAnalytics(type, tasks, month, users);
  
  if (cachedData) {
    return cachedData;
  }
  
  // Calculate and cache if not in cache
  const calculatedData = calculateFn(tasks, month, users);
  setCachedAnalytics(type, tasks, month, users, calculatedData);
  
  return calculatedData;
};
