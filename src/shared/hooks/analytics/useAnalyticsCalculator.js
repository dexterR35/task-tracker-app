import { useMemo, useCallback } from 'react';
import { calculateAnalyticsFromTasks, getMetricForCard, getAllMetrics } from '../../utils/analyticsCalculator';
import { logger } from '../../utils/logger';

/**
 * Hook responsible only for calculating analytics from filtered data
 * Separates analytics calculation concerns from fetching and filtering
 */
export const useAnalyticsCalculator = (filteredData, normalizedUserId) => {
  const { tasks, monthId } = filteredData;
  
  logger.log('[useAnalyticsCalculator] Calculating analytics for', { 
    tasksCount: tasks?.length, 
    monthId, 
    userId: normalizedUserId 
  });

  // Calculate analytics from tasks - memoized to prevent recalculation
  const analytics = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      logger.log('[useAnalyticsCalculator] No tasks to calculate analytics for');
      return null;
    }
    
    try {
      const result = calculateAnalyticsFromTasks(tasks, monthId, normalizedUserId);
      logger.log('[useAnalyticsCalculator] Analytics calculated successfully', {
        summary: result?.summary,
        categoriesCount: Object.keys(result?.categories || {}).length
      });
      return result;
    } catch (error) {
      logger.error('[useAnalyticsCalculator] Analytics calculation failed:', error);
      return null;
    }
  }, [tasks, monthId, normalizedUserId]);

  // Helper function to get specific metric - memoized
  const getMetric = useCallback((type, category = null) => {
    if (!analytics) {
      logger.log('[useAnalyticsCalculator] No analytics available for getMetric');
      return null;
    }
    return getMetricForCard(type, analytics, category);
  }, [analytics]);

  // Helper function to get all metrics - memoized
  const getAllMetricsData = useCallback(() => {
    if (!analytics) {
      logger.log('[useAnalyticsCalculator] No analytics available for getAllMetrics');
      return {};
    }
    return getAllMetrics(analytics);
  }, [analytics]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Calculated analytics
    analytics,
    
    // Helper functions
    getMetric,
    getAllMetrics: getAllMetricsData,
    
    // Legacy support (for backward compatibility)
    summary: analytics?.summary || {},
    categories: analytics?.categories || {},
    performance: analytics?.performance || {},
    markets: analytics?.markets || {},
    products: analytics?.products || {},
    ai: analytics?.ai || {},
    trends: analytics?.trends || {},
    topReporter: analytics?.topReporter || {}
  }), [
    analytics,
    getMetric,
    getAllMetricsData
  ]);
};
