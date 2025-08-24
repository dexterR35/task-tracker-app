import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { analyticsCalculator, calculateAnalyticsFromTasks, getMetricForCard, getAllMetrics } from '../utils/analyticsCalculator';
import { ANALYTICS_TYPES } from '../constants/analyticsTypes';

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
    
    // Debug: log all available queries first
    console.log('All available queries:', Object.keys(queries));
    console.log('Looking for monthId:', monthId, 'userId:', userId);
    
    // Log the structure of the first few queries to understand the format
    const queryKeys = Object.keys(queries);
    if (queryKeys.length > 0) {
      console.log('First query key:', queryKeys[0]);
      console.log('First query data:', queries[queryKeys[0]]);
      
      // Log all query keys that contain the monthId
      const monthQueries = queryKeys.filter(key => key.includes(monthId));
      console.log('Queries containing monthId:', monthQueries);
      
      // Log all query keys that contain userId if provided
      if (userId) {
        const userQueries = queryKeys.filter(key => key.includes(userId));
        console.log('Queries containing userId:', userQueries);
      }
    }
    
    // Try different query key formats based on the actual API structure
    let queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null,"useCache":true})`;
    let data = queries[queryKey]?.data;
    
    if (!data) {
      // Try without useCache
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":null})`;
      data = queries[queryKey]?.data;
    }
    
    if (!data) {
      // Try with userId if provided
      if (userId) {
        queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}","useCache":true})`;
        data = queries[queryKey]?.data;
      }
    }
    
    if (!data && userId) {
      // Try without useCache for userId
      queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}"})`;
      data = queries[queryKey]?.data;
    }
    
    // Also try the RTK Query cache key format
    if (!data && userId) {
      const cacheKey = `${monthId}_user_${userId}`;
      const cacheQueryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${userId}","useCache":true})`;
      data = queries[cacheQueryKey]?.data;
      if (data) {
        console.log('Found data using cache key format:', cacheKey);
      }
    }
    
    // If still no data, try to find any query that matches the monthId
    if (!data) {
      const matchingQueries = Object.keys(queries).filter(key => 
        key.includes(`"monthId":"${monthId}"`)
      );
      console.log('Matching queries for monthId:', matchingQueries);
      
      if (matchingQueries.length > 0) {
        // Prioritize user-specific queries if userId is provided
        if (userId) {
          const userSpecificQuery = matchingQueries.find(key => 
            key.includes(`"userId":"${userId}"`)
          );
          if (userSpecificQuery) {
            data = queries[userSpecificQuery]?.data;
            console.log('Using user-specific query:', userSpecificQuery);
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
    
    console.log('Found data:', data?.length || 0, 'tasks');
    console.log('Data type:', typeof data);
    console.log('Data value:', data);
    
    // Ensure we always return an array
    if (!data) {
      console.log('No data found, returning empty array');
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.error('Data is not an array:', data);
      return [];
    }
    
    // If userId is provided, validate that the data is actually filtered for that user
    if (userId && data.length > 0) {
      const userTasks = data.filter(task => task.userUID === userId);
      console.log(`Validation: Found ${userTasks.length} tasks for user ${userId} out of ${data.length} total tasks`);
      
      if (userTasks.length !== data.length) {
        console.warn(`Data mismatch: Expected ${data.length} tasks for user ${userId}, but only ${userTasks.length} belong to this user`);
        console.warn('This suggests the query returned all tasks instead of user-specific tasks');
        // Return only the user's tasks
        return userTasks;
      }
    }
    
    return data;
  }, [tasksApiState, userId]);

  // Calculate all analytics from Redux data
  const analytics = useMemo(() => {
    if (!monthId) {
      return null;
    }

    const tasks = getTasksFromRedux(monthId);
    console.log(`Analytics calculation - monthId: ${monthId}, userId: ${userId}, tasks count: ${tasks?.length || 0}`);
    console.log('Tasks type:', typeof tasks);
    console.log('Tasks value:', tasks);
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      console.log(`No valid tasks found in Redux for month: ${monthId}`);
      return null;
    }

    try {
      const result = calculateAnalyticsFromTasks(tasks, monthId, userId);
      console.log('Analytics calculated:', result);
      return result;
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return null;
    }
  }, [monthId, userId, getTasksFromRedux]);

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
