import { useMemo } from 'react';
import { useSubscribeToMonthTasksQuery } from '../../features/tasks/tasksApi';
import { analyticsCalculator } from '../utils/analyticsCalculator';
import { logger } from '../utils/logger';

export const useCentralizedAnalytics = (monthId, userId = null) => {
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

  // Calculate analytics using useMemo for performance
  const analyticsData = useMemo(() => {
    try {
      // Filter by user if needed (in case we got all users data)
      const filteredTasks = userId 
        ? tasks.filter(task => task.userUID === userId)
        : tasks;

      logger.log(`[Analytics] Calculating analytics for ${filteredTasks.length} tasks (${userId ? `user ${userId}` : 'all users'})`);

      // Calculate analytics from current data
      const analytics = analyticsCalculator.calculateAllAnalytics(filteredTasks, monthId, userId);

      return {
        tasks: filteredTasks,
        analytics,
        hasData: filteredTasks.length > 0
      };
    } catch (error) {
      logger.error('Failed to calculate analytics:', error);
      return {
        tasks: [],
        analytics: null,
        hasData: false
      };
    }
  }, [tasks, monthId, userId]);

  // Get specific metric for a card
  const getMetric = useMemo(() => (type, category = null) => {
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

  // Get all metrics at once
  const getAllMetrics = useMemo(() => () => {
    if (!analyticsData?.analytics) {
      return {};
    }

    return analyticsCalculator.getAllMetrics(analyticsData.analytics);
  }, [analyticsData?.analytics]);

  return {
    analytics: analyticsData.analytics,
    tasks: analyticsData.tasks,
    hasData: analyticsData.hasData,
    isLoading: tasksLoading,
    error: tasksError,
    getMetric,
    getAllMetrics,
    reload: () => {}, // No-op since RTK Query handles updates
    refreshAnalytics: () => {}, // No-op since RTK Query handles updates
    lastUpdate: Date.now()
  };
};
