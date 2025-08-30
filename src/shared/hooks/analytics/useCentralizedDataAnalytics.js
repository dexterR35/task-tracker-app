import { useSelector } from 'react-redux';
import { useMemo, useRef, useCallback } from 'react';
import { selectCurrentMonthName, selectCurrentMonthId, selectBoardExists } from '../../../features/currentMonth/currentMonthSlice';
import { useAuth } from '../useAuth';
import { useSubscribeToMonthTasksQuery } from '../../../features/tasks/tasksApi';
import { useGetUsersQuery, useGetUserByUIDQuery } from '../../../features/users/usersApi';
import { useGetReportersQuery } from '../../../features/reporters/reportersApi';
import { calculateAnalyticsFromTasks, getMetricForCard, getAllMetrics } from '../../utils/analyticsCalculator';
import { logger } from '../../utils/logger';

/**
 * Complete unified hook that handles all data fetching, filtering, analytics, and helper functions
 * This eliminates the need for multiple hooks and prop passing
 * 
 * @param {string|null} userId - Optional user filter
 * @returns {Object} Complete data and analytics object with all helper functions
 */
export const useCentralizedDataAnalytics = (userId = null) => {
  const prevDataRef = useRef(null);
  const { user, canAccess, isLoading: authLoading, isAuthChecking } = useAuth();
  
  // Get month data from Redux store
  const monthName = useSelector(selectCurrentMonthName);
  const monthId = useSelector(selectCurrentMonthId);
  const boardExists = useSelector(selectBoardExists);
  
  // Normalize userId
  const normalizedUserId = useMemo(() => {
    if (!userId || userId === "" || userId === "null") {
      return null;
    }
    if (canAccess('admin') && !userId) {
      return null;
    }
    return userId;
  }, [userId, canAccess]);

  // Determine if we should skip data fetching
  const shouldSkip = !user || authLoading || isAuthChecking;
  const isValidMonthId = monthId && typeof monthId === 'string' && monthId.match(/^\d{4}-\d{2}$/);
  const shouldSkipMonthData = shouldSkip || !isValidMonthId;

  // Role-based data loading strategy
  const isAdmin = canAccess('admin');
  
  // ADMIN: Get all users data
  const { 
    data: allUsers = [], 
    error: allUsersError, 
    isLoading: allUsersLoading,
    isFetching: allUsersFetching 
  } = useGetUsersQuery(
    {},
    { 
      skip: shouldSkip || !isAdmin, // Only load all users for admin
      keepUnusedDataFor: Infinity, // Never expire - Users never change once created
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  // USER: Get only current user data
  const { 
    data: currentUser = null, 
    error: currentUserError, 
    isLoading: currentUserLoading,
    isFetching: currentUserFetching 
  } = useGetUserByUIDQuery(
    { userUID: user?.uid },
    { 
      skip: shouldSkip || !user?.uid || isAdmin, // Only load current user for non-admin
      keepUnusedDataFor: 86400, // 24 hours (24 * 60 * 60 seconds) - User profile rarely changes
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  // Both roles: Get reporters data
  const { 
    data: reporters = [], 
    error: reportersError, 
    isLoading: reportersLoading,
    isFetching: reportersFetching 
  } = useGetReportersQuery(
    {},
    { 
      skip: shouldSkip,
      keepUnusedDataFor: Infinity, // Never expire - Reporters never change once created
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  // Both roles: Get tasks data (filtered by user for non-admin)
  const { 
    data: tasksData = { tasks: [], boardExists: false, monthId }, 
    error: tasksError, 
    isLoading: tasksLoading,
    isFetching: tasksFetching 
  } = useSubscribeToMonthTasksQuery(
    { monthId: isValidMonthId ? monthId : undefined, userId: normalizedUserId },
    { skip: shouldSkipMonthData }
  );

  const tasks = tasksData.tasks || [];
  const boardData = { exists: tasksData.boardExists, monthId: tasksData.monthId };

  // Role-based user data
  const users = useMemo(() => {
    if (isAdmin) {
      return allUsers; // Admin sees all users
    } else if (currentUser) {
      return [currentUser]; // User sees only themselves
    }
    return [];
  }, [allUsers, currentUser, isAdmin]);

  // Use real-time board data if available, otherwise fall back to Redux store
  const effectiveBoardExists = useMemo(() => 
    boardData?.exists !== undefined ? boardData.exists : boardExists,
    [boardData?.exists, boardExists]
  );

  // Data availability check
  const hasData = useMemo(() => 
    tasks.length > 0 || users.length > 0 || reporters.length > 0,
    [tasks.length, users.length, reporters.length]
  );

  // Calculate analytics from tasks
  const analytics = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return null;
    }
    
    try {
      const result = calculateAnalyticsFromTasks(tasks, monthId, normalizedUserId);
      return result;
    } catch (error) {
      logger.error('[useCentralizedDataAnalytics] Analytics calculation failed:', error);
      return null;
    }
  }, [tasks, monthId, normalizedUserId]);

  // Helper function to get specific metric
  const getMetric = useCallback((type, category = null) => {
    if (!analytics) {
      return null;
    }
    return getMetricForCard(type, analytics, category);
  }, [analytics]);

  // Helper function to get all metrics
  const getAllMetricsData = useCallback(() => {
    if (!analytics) {
      return {};
    }
    return getAllMetrics(analytics);
  }, [analytics]);

  // Helper functions for data filtering
  const getFilteredData = useCallback((filterType) => {
    if (!tasks) return [];
    
    switch (filterType) {
      case 'recentTasks':
        return tasks.slice(0, 10);
      case 'aiTasks':
        return tasks.filter(task => task.aiUsed);
      case 'designTasks':
        return tasks.filter(task => task.category === 'design');
      case 'developmentTasks':
        return tasks.filter(task => task.category === 'development');
      case 'videoTasks':
        return tasks.filter(task => task.category === 'video');
      default:
        return tasks;
    }
  }, [tasks]);

  const getUserById = useCallback((userId) => {
    return users.find(user => (user.userUID || user.id) === userId);
  }, [users]);

  const getReporterById = useCallback((reporterId) => {
    return reporters.find(reporter => (reporter.id || reporter.reporterUID) === reporterId);
  }, [reporters]);

  const getTasksCountByReporter = useCallback(() => {
    const counts = {};
    tasks.forEach(task => {
      const reporterId = task.reporters;
      if (reporterId) {
        counts[reporterId] = (counts[reporterId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const getTasksCountByUser = useCallback((userId) => {
    const counts = {};
    tasks.forEach(task => {
      const userId = task.userUID;
      if (userId) {
        counts[userId] = (counts[userId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const getTasksByUser = useCallback((userId) => {
    return tasks.filter(task => task.userUID === userId);
  }, [tasks]);

  const getTasksByReporter = useCallback((reporterId) => {
    return tasks.filter(task => task.reporters === reporterId);
  }, [tasks]);

  const getTasksByCategory = useCallback((category) => {
    return tasks.filter(task => task.category === category);
  }, [tasks]);

  const getTasksByMarket = useCallback((market) => {
    return tasks.filter(task => 
      Array.isArray(task.markets) 
        ? task.markets.includes(market)
        : task.market === market
    );
  }, [tasks]);

  const getTasksByProduct = useCallback((product) => {
    return tasks.filter(task => task.product === product);
  }, [tasks]);

  // Role-based loading states
  const isLoading = useMemo(() => {
    // If we're skipping data fetching, don't show loading
    if (shouldSkipMonthData) {
      return false;
    }
    
    // Admin: Load all users + reporters + tasks
    if (isAdmin) {
      return tasksLoading || allUsersLoading || reportersLoading;
    }
    
    // User: Load current user + reporters + tasks
    return tasksLoading || currentUserLoading || reportersLoading;
  }, [
    shouldSkipMonthData,
    isAdmin,
    tasksLoading, 
    allUsersLoading, 
    currentUserLoading, 
    reportersLoading
  ]);
  
  // Role-based fetching states
  const isFetching = useMemo(() => {
    if (isAdmin) {
      return tasksFetching || allUsersFetching || reportersFetching;
    }
    return tasksFetching || currentUserFetching || reportersFetching;
  }, [isAdmin, tasksFetching, allUsersFetching, currentUserFetching, reportersFetching]);

  // Role-based error state
  const error = useMemo(() => {
    if (isAdmin) {
      return tasksError || allUsersError || reportersError;
    }
    return tasksError || currentUserError || reportersError;
  }, [isAdmin, tasksError, allUsersError, currentUserError, reportersError]);

  // Memoize the complete result
  const result = useMemo(() => ({
    // Data
    tasks,
    users,
    reporters,
    analytics,
    monthId,
    monthName,
    
    // State
    isLoading,
    isFetching,
    error,
    hasData,
    boardExists: effectiveBoardExists,
    
    // Helper functions
    getMetric,
    getAllMetrics: getAllMetricsData,
    getFilteredData,
    getUserById,
    getReporterById,
    getTasksCountByReporter,
    getTasksCountByUser,
    getTasksByUser,
    getTasksByReporter,
    getTasksByCategory,
    getTasksByMarket,
    getTasksByProduct,
    
    // Legacy support
    summary: analytics?.summary || {},
    categories: analytics?.categories || {},
    performance: analytics?.performance || {},
    markets: analytics?.markets || {},
    products: analytics?.products || {},
    ai: analytics?.ai || {},
    trends: analytics?.trends || {},
    topReporter: analytics?.topReporter || {},
    
    // Debug data
    rawData: {
      tasks,
      users,
      reporters,
      analytics,
      monthId,
      boardExists: effectiveBoardExists,
      errors: {
        tasks: error,
        users: error,
        reporters: error
      }
    }
  }), [
    tasks,
    users,
    reporters,
    analytics,
    monthId,
    monthName,
    isLoading,
    isFetching,
    error,
    hasData,
    effectiveBoardExists,
    getMetric,
    getAllMetricsData,
    getFilteredData,
    getUserById,
    getReporterById,
    getTasksCountByReporter,
    getTasksCountByUser,
    getTasksByUser,
    getTasksByReporter,
    getTasksByCategory,
    getTasksByMarket,
    getTasksByProduct
  ]);
  
  // Only log when data actually changes
  const currentDataKey = `${result.tasks?.length}-${result.users?.length}-${result.reporters?.length}-${!!result.analytics}`;
  if (prevDataRef.current !== currentDataKey) {
    logger.log('[useCentralizedDataAnalytics] Data updated:', {
      tasksCount: result.tasks?.length,
      usersCount: result.users?.length,
      reportersCount: result.reporters?.length,
      hasAnalytics: !!result.analytics,
      userId: normalizedUserId
    });
    prevDataRef.current = currentDataKey;
  }
  
  return result;
};

export default useCentralizedDataAnalytics;


