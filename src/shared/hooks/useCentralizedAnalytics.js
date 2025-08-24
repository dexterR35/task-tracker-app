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
    
    // Debug: log available queries
    if (!data && Object.keys(queries).length > 0) {
      console.log('Available queries:', Object.keys(queries));
      console.log('Looking for monthId:', monthId, 'userId:', userId);
    }
    
    return data || [];
  }, [tasksApiState, userId]);

  // Calculate all analytics from Redux data
  const analytics = useMemo(() => {
    if (!monthId) {
      return null;
    }

    const tasks = getTasksFromRedux(monthId);
    console.log(`Analytics calculation - monthId: ${monthId}, userId: ${userId}, tasks count: ${tasks?.length || 0}`);
    
    if (!tasks || tasks.length === 0) {
      console.log(`No tasks found in Redux for month: ${monthId}`);
      return null;
    }

    const result = calculateAnalyticsFromTasks(tasks, monthId, userId);
    console.log('Analytics calculated:', result);
    return result;
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
