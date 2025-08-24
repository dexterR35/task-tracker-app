import { useMemo, useCallback,useEffect } from 'react';
import { useSelector } from 'react-redux';
import { analyticsCalculator, calculateAnalyticsFromTasks, getMetricForCard, getAllMetrics } from '../utils/analyticsCalculator';
import { logger } from '../utils/logger';
import { ANALYTICS_TYPES } from '../utils/analyticsTypes';

/**
 * Centralized Analytics Hook
 * Provides all analytics data from cached Redux state without individual API calls
 */
export const useCentralizedAnalytics = (monthId, userId = null) => {
  // Get tasks from Redux state
  const tasksApiState = useSelector((state) => state.tasksApi);
  
  // Get tasks for the specified month from Redux cache
  const getTasksFromRedux = useCallback((monthId) => {
    const queries = tasksApiState?.queries || {};
    
    // Try different query key formats based on the actual API structure
    let queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null,"useCache":true})`;
    let data = queries[queryKey]?.data;
    
    if (!data) {
      // Try without useCache
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null})`;
      data = queries[queryKey]?.data;
    }
    
    // If userId is provided, prioritize user-specific queries
    if (userId) {
      const userQueryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}","useCache":true})`;
      const userData = queries[userQueryKey]?.data;
      
      if (userData) {
        data = userData;
        queryKey = userQueryKey;
        // Using user-specific query with cache
      } else {
        // Try without useCache for userId
        const userQueryKeyNoCache = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}"})`;
        const userDataNoCache = queries[userQueryKeyNoCache]?.data;
        
        if (userDataNoCache) {
          data = userDataNoCache;
          queryKey = userQueryKeyNoCache;
          // Using user-specific query without cache
        } else {
          // No user-specific query found for userId
          // If no user-specific query exists, don't use any data
          // This will force the system to wait for the correct user-specific data
          return [];
        }
      }
    }
    
    // Also try the RTK Query cache key format
    if (!data && userId) {
      const cacheKey = `${monthId}_user_${userId}`;
      const cacheQueryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}","useCache":true})`;
      data = queries[cacheQueryKey]?.data;
      // Found data using cache key format
    }
    
    // If still no data, try to find any query that matches the monthId
    if (!data) {
      const matchingQueries = Object.keys(queries).filter(key => 
        key.includes(`"monthId":"${monthId}"`) && key.includes('subscribeToMonthTasks')
      );
      // Matching subscribeToMonthTasks queries for monthId
      
      if (matchingQueries.length > 0) {
        // Prioritize user-specific queries if userId is provided
        if (userId) {
          const userSpecificQuery = matchingQueries.find(key => 
            key.includes(`"userId":"${userId}"`)
          );
          if (userSpecificQuery) {
            data = queries[userSpecificQuery]?.data;
            // Using user-specific query
          } else {
            // If no user-specific query found, don't use any query
            console.log('No user-specific query found, not using any query');
            return [];
          }
        } else {
          // For admin view (no userId), use the first matching query
          data = queries[matchingQueries[0]]?.data;
          console.log('Using first matching query:', matchingQueries[0]);
        }
      }
    }
    
    // Additional fallback: try to find any query that contains both monthId and userId
    if (!data && userId) {
      const exactMatchQuery = Object.keys(queries).find(key => 
        key.includes(monthId) && key.includes(userId)
      );
      if (exactMatchQuery) {
        data = queries[exactMatchQuery]?.data;
        console.log('Found exact match query:', exactMatchQuery);
      }
    }
    
    logger.debug('Found data:', data?.length || 0, 'tasks');
    logger.debug('Data type:', typeof data);
    logger.debug('Data value:', data);
    
    // Ensure we always return an array
    if (!data) {
      logger.debug('No data found, returning empty array');
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.error('Data is not an array:', data);
      return [];
    }
    
    // If userId is provided, validate that the data is actually filtered for that user
    if (userId && data.length > 0) {
      const userTasks = data.filter(task => task.userUID === userId);
      
      // Only log validation once per data change
      const validationKey = `${userId}_${data.length}_${userTasks.length}`;
      if (validationKey !== window._lastValidationKey) {
        window._lastValidationKey = validationKey;
        
        if (userTasks.length === 0) {
          console.log(`No tasks found for user ${userId} (${data.length} total tasks exist)`);
        } else if (import.meta.env.VITE_DEBUG === 'true') {
          console.log(`Found ${userTasks.length} tasks for user ${userId}`);
        }
      }
      
      // Always return only the user's tasks when userId is provided
      return userTasks;
    }
    
    return data;
  }, [tasksApiState, userId]);

  // Calculate all analytics from Redux data
  const analytics = useMemo(() => {
    if (!monthId) {
      return null;
    }

    const tasks = getTasksFromRedux(monthId);
    
    if (!tasks || !Array.isArray(tasks)) {
      logger.debug(`No valid tasks found in Redux for month: ${monthId}`);
      return null;
    }
    
    // If tasks array is empty, still calculate analytics (will show 0 values)

    try {
      const result = calculateAnalyticsFromTasks(tasks, monthId, userId);
      return result;
    } catch (error) {
      logger.error('Error calculating analytics:', error);
      return null;
    }
  }, [monthId, userId, getTasksFromRedux]);

  // Clean up validation cache when userId or monthId changes
  useEffect(() => {
    return () => {
      delete window._lastValidationKey;
    };
  }, [userId, monthId]);

  // Get specific metric for a card
  const getMetric = useCallback((type, category = null) => {
    if (!analytics) {
      return {
        value: 0,
        additionalData: {},
        isLoading: false,
        error: null
      };
    }

    const metric = getMetricForCard(type, analytics, category);
    return {
      ...metric,
      isLoading: false,
      error: null
    };
  }, [analytics]);

  // Get all metrics at once
  const getAllMetricsData = useCallback(() => {
    if (!analytics) {
      return {};
    }

    return getAllMetrics(analytics);
  }, [analytics]);

  // Get tasks data
  const getTasks = useCallback(() => {
    return getTasksFromRedux(monthId) || [];
  }, [monthId, getTasksFromRedux]);

  // Check if data is available
  const hasData = useMemo(() => {
    // If analytics is null, no data
    if (analytics === null) {
      return false;
    }
    
    // If analytics exists but has no tasks, still consider it as "has data" (just empty)
    if (analytics && analytics.summary && analytics.summary.totalTasks === 0) {
      return true; // User has no tasks, but we have analytics data
    }
    
    // If analytics exists and has tasks, we have data
    return analytics !== null;
  }, [analytics]);

  // Get loading state
  const isLoading = useMemo(() => {
    if (!monthId) return false;
    
    const queries = tasksApiState?.queries || {};
    
    // Try different query key formats based on the actual API structure
    let queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null,"useCache":true})`;
    let query = queries[queryKey];
    
    if (!query) {
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null})`;
      query = queries[queryKey];
    }
    
    if (!query && userId) {
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}","useCache":true})`;
      query = queries[queryKey];
    }
    
    if (!query && userId) {
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}"})`;
      query = queries[queryKey];
    }
    
    return query?.isLoading || false;
  }, [monthId, tasksApiState, userId]);

  // Get error state
  const error = useMemo(() => {
    if (!monthId) return null;
    
    const queries = tasksApiState?.queries || {};
    
    // Try different query key formats based on the actual API structure
    let queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null,"useCache":true})`;
    let query = queries[queryKey];
    
    if (!query) {
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null})`;
      query = queries[queryKey];
    }
    
    if (!query && userId) {
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}","useCache":true})`;
      query = queries[queryKey];
    }
    
    if (!query && userId) {
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}"})`;
      query = queries[queryKey];
    }
    
    return query?.error || null;
  }, [monthId, tasksApiState, userId]);

  // Clear cache for this month
  const clearCache = useCallback(() => {
    analyticsCalculator.clearCache(monthId);
  }, [monthId]);

  // Get cache status
  const getCacheStatus = useCallback(() => {
    return {
      hasData,
      isLoading,
      error,
      cached: analyticsCalculator.isCacheValid(monthId),
      tasksCount: getTasks().length
    };
  }, [hasData, isLoading, error, monthId, getTasks]);

  return {
    // Main analytics object
    analytics,
    
    // Individual metric getters
    getMetric,
    getAllMetrics: getAllMetricsData,
    
    // Data access
    getTasks,
    hasData,
    isLoading,
    error,
    
    // Cache management
    clearCache,
    getCacheStatus,
    
    // Convenience getters for common metrics
    totalTasks: getMetric(ANALYTICS_TYPES.TOTAL_TASKS),
    totalHours: getMetric(ANALYTICS_TYPES.TOTAL_HOURS),
    totalTimeWithAI: getMetric(ANALYTICS_TYPES.TOTAL_TIME_WITH_AI),
    aiTasks: getMetric(ANALYTICS_TYPES.AI_TASKS),
    development: getMetric(ANALYTICS_TYPES.DEVELOPMENT),
    design: getMetric(ANALYTICS_TYPES.DESIGN),
    video: getMetric(ANALYTICS_TYPES.VIDEO),
    userPerformance: getMetric(ANALYTICS_TYPES.USER_PERFORMANCE),
    markets: getMetric(ANALYTICS_TYPES.MARKETS),
    products: getMetric(ANALYTICS_TYPES.PRODUCTS)
  };
};

export default useCentralizedAnalytics;
