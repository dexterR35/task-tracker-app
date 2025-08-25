import { useMemo, useCallback, useRef } from 'react';
import { useSubscribeToMonthTasksQuery } from '../../features/tasks/tasksApi';
import { analyticsCalculator } from '../utils/analyticsCalculator';
import { logger } from '../utils/logger';
import { useAnalyticsCache } from './useAnalyticsCache';

export const useCentralizedAnalytics = (monthId, userId = null) => {
  // Use ref to track previous tasks to prevent unnecessary recalculations
  const prevTasksRef = useRef(null);
  const prevAnalyticsRef = useRef(null);
  const lastCalculationRef = useRef(0);
  
  // Use the analytics cache management hook
  const { invalidateCache } = useAnalyticsCache(monthId, userId);
  
  // Use RTK Query hook directly to get tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError
  } = useSubscribeToMonthTasksQuery(
    { monthId, userId },
    {
      skip: !monthId
    }
  );

  // Memoize the filtered tasks to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    
    // Filter by user if needed (in case we got all users data)
    const filtered = userId 
      ? tasks.filter(task => task.userUID === userId)
      : tasks;
    
    return filtered;
  }, [tasks, userId]);

  // Calculate analytics using useMemo with better dependency tracking
  const analyticsData = useMemo(() => {
    try {
      // Check if we have the same tasks as before
      const prevTasks = prevTasksRef.current;
      const prevAnalytics = prevAnalyticsRef.current;
      
      // If tasks haven't changed and we have cached analytics, return them
      if (prevTasks && prevAnalytics && 
          prevTasks.length === filteredTasks.length &&
          JSON.stringify(prevTasks.map(t => ({ id: t.id, updatedAt: t.updatedAt }))) === 
          JSON.stringify(filteredTasks.map(t => ({ id: t.id, updatedAt: t.updatedAt })))) {
        logger.debug(`[Analytics] Using cached analytics for ${filteredTasks.length} tasks (${userId ? `user ${userId}` : 'all users'})`);
        return prevAnalytics;
      }

      // Debounce rapid calculations
      const now = Date.now();
      if (now - lastCalculationRef.current < 100) { // 100ms debounce
        logger.debug(`[Analytics] Debouncing calculation for ${monthId}`);
        return prevAnalytics || {
          tasks: filteredTasks,
          analytics: null,
          hasData: false
        };
      }
      
      lastCalculationRef.current = now;

      logger.debug(`[Analytics] Calculating analytics for ${filteredTasks.length} tasks (${userId ? `user ${userId}` : 'all users'})`);

      // Calculate analytics from current data
      const analytics = analyticsCalculator.calculateAllAnalytics(filteredTasks, monthId, userId);

      const result = {
        tasks: filteredTasks,
        analytics,
        hasData: filteredTasks.length > 0
      };

      // Cache the result
      prevTasksRef.current = filteredTasks;
      prevAnalyticsRef.current = result;

      return result;
    } catch (error) {
      logger.error('Failed to calculate analytics:', error);
      return {
        tasks: [],
        analytics: null,
        hasData: false
      };
    }
  }, [filteredTasks, monthId, userId]);

  // Memoize the getMetric function to prevent unnecessary re-renders
  const getMetric = useCallback((type, category = null) => {
    if (!analyticsData?.analytics) {
      return {
        value: 0,
        additionalData: {},
        isLoading: tasksLoading,
        error: tasksError
      };
    }

    const metric = analyticsCalculator.getMetricForCard(type, analyticsData.analytics, category);
    return {
      ...metric,
      isLoading: tasksLoading,
      error: tasksError
    };
  }, [analyticsData?.analytics, tasksLoading, tasksError]);

  // Memoize the getAllMetrics function
  const getAllMetrics = useCallback(() => {
    if (!analyticsData?.analytics) {
      return {};
    }

    return analyticsCalculator.getAllMetrics(analyticsData.analytics);
  }, [analyticsData?.analytics]);

  // Memoize the reload function
  const reload = useCallback(() => {
    // Clear the cache to force recalculation
    prevTasksRef.current = null;
    prevAnalyticsRef.current = null;
    lastCalculationRef.current = 0;
    invalidateCache();
  }, [invalidateCache]);

  // Memoize the refreshAnalytics function
  const refreshAnalytics = useCallback(() => {
    // Clear the cache to force recalculation
    prevTasksRef.current = null;
    prevAnalyticsRef.current = null;
    lastCalculationRef.current = 0;
    invalidateCache();
  }, [invalidateCache]);

  return {
    analytics: analyticsData.analytics,
    tasks: analyticsData.tasks,
    hasData: analyticsData.hasData,
    isLoading: tasksLoading,
    error: tasksError,
    getMetric,
    getAllMetrics,
    reload,
    refreshAnalytics,
    lastUpdate: Date.now()
  };
};
