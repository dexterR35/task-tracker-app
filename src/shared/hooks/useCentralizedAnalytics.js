import { useMemo, useCallback, useEffect, useState } from 'react';
import { analyticsCalculator, calculateAnalyticsFromTasks, getMetricForCard, getAllMetrics } from '../utils/analyticsCalculator';
import { analyticsStorage, taskStorage } from '../utils/indexedDBStorage';
import { logger } from '../utils/logger';
import { ANALYTICS_TYPES } from '../utils/analyticsTypes';

/**
 * Centralized Analytics Hook
 * Provides all analytics data from IndexedDB cache without individual API calls
 */
export const useCentralizedAnalytics = (monthId, userId = null) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from IndexedDB (your data store)
  const loadData = useCallback(async () => {
    if (!monthId) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Get tasks from IndexedDB (your stored data)
      const tasks = await taskStorage.getTasks(monthId);
      
      if (!tasks || tasks.length === 0) {
        setAnalyticsData({
          tasks: [],
          analytics: null,
          hasData: false
        });
        return;
      }

      // 2. Filter by user if needed
      const filteredTasks = userId 
        ? tasks.filter(task => task.userUID === userId)
        : tasks;

      // 3. ALWAYS calculate analytics from current IndexedDB data (for CRUD sync)
      // This ensures analytics stay in sync with your table operations
      const analytics = analyticsCalculator.calculateAllAnalytics(filteredTasks, monthId, userId);
      
      // 4. Store updated analytics back to IndexedDB
      await analyticsStorage.storeAnalytics(monthId, analytics);

      setAnalyticsData({
        tasks: filteredTasks,
        analytics,
        hasData: filteredTasks.length > 0
      });
      
    } catch (err) {
      setError(err.message);
      logger.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [monthId, userId]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for task changes and recalculate analytics
  useEffect(() => {
    if (!monthId) return;

    // Create a custom event listener for task changes
    const handleTaskChange = (event) => {
      const { monthId: eventMonthId, operation, taskId, source } = event.detail || {};
      
      // Only recalculate if it's for our month
      if (eventMonthId === monthId) {
        logger.log(`[useCentralizedAnalytics] Task change detected: ${operation || source} for month ${monthId}, recalculating analytics`);
        loadData();
      }
    };

    // Listen for custom events when tasks are modified
    window.addEventListener('task-changed', handleTaskChange);
    
    // Also listen for storage events (when IndexedDB is updated from other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === `tasks_${monthId}`) {
        logger.log('[useCentralizedAnalytics] IndexedDB change detected, recalculating analytics');
        loadData();
      }
    });

    return () => {
      window.removeEventListener('task-changed', handleTaskChange);
      window.removeEventListener('storage', handleTaskChange);
    };
  }, [monthId, loadData]);

  // Get specific metric for a card
  const getMetric = useCallback((type, category = null) => {
    if (!analyticsData?.analytics) {
      return {
        value: 0,
        additionalData: {},
        isLoading: false,
        error: null
      };
    }

    const metric = getMetricForCard(type, analyticsData.analytics, category);
    return {
      ...metric,
      isLoading: false,
      error: null
    };
  }, [analyticsData?.analytics]);

  // Get all metrics at once
  const getAllMetricsData = useCallback(() => {
    if (!analyticsData?.analytics) {
      return {};
    }

    return getAllMetrics(analyticsData.analytics);
  }, [analyticsData?.analytics]);

  // Get tasks data
  const getTasks = useCallback(() => {
    return analyticsData?.tasks || [];
  }, [analyticsData?.tasks]);

  // Clear cache for this month
  const clearCache = useCallback(async () => {
    try {
      analyticsCalculator.clearCache(monthId);
      await analyticsStorage.clearAnalytics(monthId);
      await taskStorage.clearTasks(monthId);
      await loadData(); // Reload data after clearing cache
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }, [monthId, loadData]);

  // Force refresh analytics from current IndexedDB data
  const refreshAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const tasks = await taskStorage.getTasks(monthId);
      const filteredTasks = userId 
        ? tasks.filter(task => task.userUID === userId)
        : tasks;
      
      const analytics = analyticsCalculator.calculateAllAnalytics(filteredTasks, monthId, userId);
      await analyticsStorage.storeAnalytics(monthId, analytics);
      
      setAnalyticsData({
        tasks: filteredTasks,
        analytics,
        hasData: filteredTasks.length > 0
      });
    } catch (error) {
      logger.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monthId, userId]);

  // Get cache status
  const getCacheStatus = useCallback(() => {
    return {
      hasData: analyticsData?.hasData || false,
      isLoading,
      error,
      cached: analyticsData?.analytics !== null,
      tasksCount: getTasks().length
    };
  }, [analyticsData, isLoading, error, getTasks]);

  return {
    // Main analytics object
    analytics: analyticsData?.analytics || null,
    
    // Individual metric getters
    getMetric,
    getAllMetrics: getAllMetricsData,
    
    // Data access
    getTasks,
    hasData: analyticsData?.hasData || false,
    isLoading,
    error,
    
    // Cache management
    clearCache,
    getCacheStatus,
    reload: loadData,
    refreshAnalytics,
    
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
