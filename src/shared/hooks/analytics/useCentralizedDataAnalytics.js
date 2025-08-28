import { useMemo, useCallback } from 'react';
import { useAuth } from '../useAuth';
import { useSubscribeToMonthTasksQuery, useSubscribeToMonthBoardQuery } from '../../../features/tasks/tasksApi';
import { useGetUsersQuery } from '../../../features/users/usersApi';
import { useGetReportersQuery } from '../../../features/reporters/reportersApi';
import { analyticsCalculator } from '../../utils/analyticsCalculator';
import { logger } from '../../utils/logger';

/**
 * Centralized data analytics hook that coordinates data from existing APIs
 * This provides a single interface for all data and analytics without duplicating logic
 * 
 * @param {string} monthId - Month identifier
 * @param {string|null} userId - Optional user filter
 * @returns {Object} Complete data and analytics object
 */
export const useCentralizedDataAnalytics = (monthId, userId = null) => {
  // Get auth state to conditionally load data
  const { user, isLoading: authLoading, isAuthChecking } = useAuth();
  
  // Skip API calls if not authenticated or still checking auth
  const shouldSkip = !user || authLoading || isAuthChecking;
  
  // Skip month-specific data if no monthId or monthId is invalid
  const isValidMonthId = monthId && typeof monthId === 'string' && monthId.match(/^\d{4}-\d{2}$/);
  const shouldSkipMonthData = shouldSkip || !isValidMonthId;

  // Normalize userId - convert empty string or "null" string to null
  const normalizedUserId = userId && userId !== "" && userId !== "null" ? userId : null;

  // Single subscription for tasks
  const { 
    data: tasks = [], 
    error: tasksError, 
    isLoading: tasksLoading,
    isFetching: tasksFetching 
  } = useSubscribeToMonthTasksQuery(
    { monthId: isValidMonthId ? monthId : undefined, userId: normalizedUserId },
    { 
      skip: shouldSkipMonthData,
    }
  );

  // Real-time subscription for board status
  const { 
    data: boardData = { exists: false }, 
    error: boardError, 
    isLoading: boardLoading,
    isFetching: boardFetching 
  } = useSubscribeToMonthBoardQuery(
    { monthId: isValidMonthId ? monthId : undefined },
    { 
      skip: shouldSkipMonthData,
    }
  );

  // Debug board subscription
  logger.debug('[useCentralizedDataAnalytics] Board subscription:', {
    monthId,
    isValidMonthId,
    shouldSkipMonthData,
    boardData,
    boardLoading,
    boardError
  });

  // Use API calls with proper caching configuration
  const { 
    data: users = [], 
    error: usersError, 
    isLoading: usersLoading,
    isFetching: usersFetching 
  } = useGetUsersQuery(
    {},
    { 
      skip: shouldSkip,
      keepUnusedDataFor: 300, // Keep data for 5 minutes (300 seconds)
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  const { 
    data: reporters = [], 
    error: reportersError, 
    isLoading: reportersLoading,
    isFetching: reportersFetching 
  } = useGetReportersQuery(
    {},
    { 
      skip: shouldSkip,
      keepUnusedDataFor: 300, // Keep data for 5 minutes (300 seconds)
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  // Debug logging
  logger.debug('[useCentralizedDataAnalytics] API data:', {
    usersCount: users.length,
    reportersCount: reporters.length,
    usersLoading,
    reportersLoading,
    shouldSkip,
    shouldSkipMonthData,
    isValidMonthId,
    monthId,
    normalizedUserId,
    user: user?.email
  });
  
  // Debug reporter data
  if (reporters.length > 0) {
    logger.debug('[useCentralizedDataAnalytics] Sample reporter data:', {
      firstReporter: {
        id: reporters[0].id,
        reporterUID: reporters[0].reporterUID,
        name: reporters[0].name,
        email: reporters[0].email
      },
      totalReporters: reporters.length
    });
  }
  
  // Debug tasks data
  logger.debug('[useCentralizedDataAnalytics] Tasks data:', {
    totalTasks: tasks.length,
    tasksLoading,
    tasksError,
    monthId,
    userId: normalizedUserId
  });
  
  if (tasks.length > 0) {
    logger.debug('[useCentralizedDataAnalytics] Sample task data:', {
      firstTask: {
        id: tasks[0].id,
        reporters: tasks[0].reporters,
        reporterName: tasks[0].reporterName,
        reporterEmail: tasks[0].reporterEmail
      }
    });
  }
  
  // Debug board data
  logger.debug('[useCentralizedDataAnalytics] Board data:', {
    boardExists: boardData?.exists,
    boardData,
    boardError,
    boardLoading,
    monthId,
    shouldSkipMonthData,
    isValidMonthId
  });

  // Combine loading states
  const isLoading = tasksLoading || usersLoading || reportersLoading || boardLoading;
  const isFetching = tasksFetching || usersFetching || reportersFetching || boardFetching;
  const error = tasksError || usersError || reportersError || boardError;

  // Calculate analytics from the data
  const analytics = useMemo(() => {
    if (!monthId || isLoading) {
      return null;
    }

    if (error) {
      logger.error('[useCentralizedDataAnalytics] Data error:', error);
      return null;
    }

    try {
      logger.debug(`[useCentralizedDataAnalytics] Calculating analytics for ${monthId} with ${tasks.length} tasks`);
      return analyticsCalculator.calculateAllAnalytics(tasks, monthId, normalizedUserId, reporters);
    } catch (error) {
      logger.error('[useCentralizedDataAnalytics] Analytics calculation failed:', error);
      return null;
    }
  }, [monthId, normalizedUserId, tasks, reporters, isLoading, error]);

  // Get specific metric for dashboard cards
  const getMetric = useCallback((type, category = null) => {
    if (!analytics) {
      return {
        value: 0,
        additionalData: {},
        isLoading: true
      };
    }

    try {
      const metric = analyticsCalculator.getMetricForCard(type, analytics, category);
      return {
        ...metric,
        isLoading: false
      };
    } catch (error) {
      logger.error('[useCentralizedDataAnalytics] getMetric failed:', error);
      return {
        value: 0,
        additionalData: {},
        isLoading: false,
        error: error.message
      };
    }
  }, [analytics]);

  // Get all metrics for dashboard cards
  const getAllMetrics = useCallback(() => {
    if (!analytics) {
      return {
        summary: { value: 0, additionalData: {} },
        categories: { value: 0, additionalData: {} },
        performance: { value: 0, additionalData: {} },
        markets: { value: 0, additionalData: {} },
        products: { value: 0, additionalData: {} },
        ai: { value: 0, additionalData: {} },
        trends: { value: 0, additionalData: {} },
        topReporter: { value: 0, additionalData: {} },
        isLoading: true
      };
    }

    try {
      return {
        summary: analyticsCalculator.getMetricForCard('summary', analytics),
        categories: analyticsCalculator.getMetricForCard('categories', analytics),
        performance: analyticsCalculator.getMetricForCard('performance', analytics),
        markets: analyticsCalculator.getMetricForCard('markets', analytics),
        products: analyticsCalculator.getMetricForCard('products', analytics),
        ai: analyticsCalculator.getMetricForCard('ai', analytics),
        trends: analyticsCalculator.getMetricForCard('trends', analytics),
        topReporter: analyticsCalculator.getMetricForCard('topReporter', analytics),
        isLoading: false
      };
    } catch (error) {
      logger.error('[useCentralizedDataAnalytics] getAllMetrics failed:', error);
      return {
        summary: { value: 0, additionalData: {} },
        categories: { value: 0, additionalData: {} },
        performance: { value: 0, additionalData: {} },
        markets: { value: 0, additionalData: {} },
        products: { value: 0, additionalData: {} },
        ai: { value: 0, additionalData: {} },
        trends: { value: 0, additionalData: {} },
        topReporter: { value: 0, additionalData: {} },
        isLoading: false,
        error: error.message
      };
    }
  }, [analytics]);

  // Check if data is available
  const hasData = useMemo(() => {
    return analytics !== null && typeof analytics === 'object' && tasks.length > 0;
  }, [analytics, tasks.length]);

  // Check if month board exists - use the real-time board subscription
  const boardExists = useMemo(() => {
    return boardData?.exists || false;
  }, [boardData?.exists]);

  // Get data freshness
  const timestamp = useMemo(() => {
    return Date.now();
  }, [tasks, users, reporters]);

  const dataAge = useMemo(() => {
    return 0; // Since we're using real-time subscriptions, data is always fresh
  }, [timestamp]);

  // Check if data is stale (older than 5 minutes)
  const isDataStale = useMemo(() => {
    return false; // Real-time subscriptions keep data fresh
  }, [dataAge]);

  // Get filtered data for specific use cases
  const getFilteredData = useCallback((filterType, filterValue = null) => {
    switch (filterType) {
      case 'tasksByUser':
        return tasks.filter(task => task.userUID === filterValue);
      case 'tasksByReporter':
        return tasks.filter(task => task.reporters === filterValue);
      case 'tasksByCategory':
        return tasks.filter(task => task.category === filterValue);
      case 'tasksByStatus':
        return tasks.filter(task => task.status === filterValue);
      case 'recentTasks':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return tasks.filter(task => new Date(task.createdAt) > oneWeekAgo);
      case 'highPriorityTasks':
        return tasks.filter(task => task.priority === 'high');
      default:
        return tasks;
    }
  }, [tasks]);

  // Get user by ID
  const getUserById = useCallback((userId) => {
    return users.find(user => user.id === userId || user.userUID === userId);
  }, [users]);

  // Get reporter by ID (supports both document ID and reporterUID)
  const getReporterById = useCallback((reporterId) => {
    return reporters.find(reporter => 
      reporter.id === reporterId || reporter.reporterUID === reporterId
    );
  }, [reporters]);

  // Get task by ID
  const getTaskById = useCallback((taskId) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  // Get tasks count by reporter (computed from tasks data)
  const getTasksCountByReporter = useCallback(() => {
    const counts = {};
    
    // Create a lookup map for reporters by document ID and reporterUID
    const reporterLookup = new Map();
    reporters.forEach(reporter => {
      // Map by document ID
      reporterLookup.set(reporter.id, reporter);
      // Also map by reporterUID if it exists
      if (reporter.reporterUID) {
        reporterLookup.set(reporter.reporterUID, reporter);
      }
    });
    
    tasks.forEach(task => {
      const reporterId = task.reporters;
      if (reporterId && reporterId.trim() !== '') {
        // Try to find the reporter in our lookup
        const reporter = reporterLookup.get(reporterId);
        
        if (!counts[reporterId]) {
          counts[reporterId] = {
            count: 0,
            hours: 0,
            name: reporter?.name || task.reporterName || "Unknown Reporter",
            email: reporter?.email || task.reporterEmail || ""
          };
        }
        counts[reporterId].count += 1;
        counts[reporterId].hours += parseFloat(task.timeInHours) || 0;
      }
    });
    return counts;
  }, [tasks, reporters]);

  // Get tasks count by user
  const getTasksCountByUser = useCallback(() => {
    const counts = {};
    tasks.forEach(task => {
      const userId = task.userUID;
      if (userId && userId.trim() !== '') {
        counts[userId] = (counts[userId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  return {
    // Core data
    tasks,
    users,
    reporters,
    monthBoard: { exists: boardExists }, // Expose board existence
    analytics,
    
    // Loading and error states
    isLoading,
    isFetching,
    error,
    hasData,
    boardExists,
    
    // Data freshness
    timestamp,
    dataAge,
    isDataStale,
    
    // Analytics methods
    getMetric,
    getAllMetrics,
    
    // Data filtering and lookup methods
    getFilteredData,
    getUserById,
    getReporterById,
    getTaskById,
    getTasksCountByReporter,
    getTasksCountByUser,
    
    // Utility methods
    refetch: () => {
      // Individual APIs handle their own refetching
      logger.debug('[useCentralizedDataAnalytics] Refetch requested');
    },
    
    // Raw data for debugging
    rawData: {
      tasks,
      users,
      reporters,
      monthBoard: { exists: boardExists },
      analytics,
      timestamp,
      monthId,
      userId: normalizedUserId
    },
    
    // Convenience properties
    summary: analytics?.summary || null,
    categories: analytics?.categories || null,
    performance: analytics?.performance || null,
    markets: analytics?.markets || null,
    products: analytics?.products || null,
    ai: analytics?.ai || null,
    trends: analytics?.trends || null,
    topReporter: analytics?.topReporter || null,
  };
};

/**
 * Hook for data cache management
 */
export const useDataCache = () => {
  const clearCache = useCallback((monthId = null) => {
    if (monthId) {
      analyticsCalculator.clearCache(monthId);
    } else {
      analyticsCalculator.clearAllCache();
    }
    logger.debug(`[useDataCache] Cache cleared for ${monthId || 'all'}`);
  }, []);

  const getCachedData = useCallback((monthId) => {
    return analyticsCalculator.getCachedAnalytics(monthId);
  }, []);

  const isCacheValid = useCallback((monthId) => {
    return analyticsCalculator.isCacheValid(monthId);
  }, []);

  return {
    clearCache,
    getCachedData,
    isCacheValid
  };
};

/**
 * Hook for data export and reporting
 */
export const useDataExport = () => {
  const exportData = useCallback((monthId, userId = null, format = 'json') => {
    // This would integrate with your export functionality
    logger.debug(`[useDataExport] Exporting data for ${monthId}, user: ${userId}, format: ${format}`);
    return {
      monthId,
      userId,
      format,
      timestamp: Date.now()
    };
  }, []);

  const generateReport = useCallback((monthId, userId = null, reportType = 'summary') => {
    // This would generate different types of reports
    logger.debug(`[useDataExport] Generating ${reportType} report for ${monthId}, user: ${userId}`);
    return {
      monthId,
      userId,
      reportType,
      timestamp: Date.now()
    };
  }, []);

  return {
    exportData,
    generateReport
  };
};
