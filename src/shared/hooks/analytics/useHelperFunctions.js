import { useCallback, useMemo } from 'react';
import { logger } from '../../utils/logger';

/**
 * Hook responsible only for helper functions and data manipulation
 * Separates utility functions from data fetching, filtering, and calculation
 */
export const useHelperFunctions = (filteredData) => {
  const { tasks, users, reporters } = filteredData;
  
  logger.log('[useHelperFunctions] Setting up helper functions for', { 
    tasksCount: tasks?.length, 
    usersCount: users?.length,
    reportersCount: reporters?.length 
  });

  // Get filtered data by type - memoized
  const getFilteredData = useCallback((filterType) => {
    if (!tasks) return [];
    
    switch (filterType) {
      case 'recentTasks':
        return tasks.slice(0, 10); // Last 10 tasks
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

  // Find user by ID - memoized
  const getUserById = useCallback((userId) => {
    return users.find(user => (user.userUID || user.id) === userId);
  }, [users]);

  // Find reporter by ID - memoized
  const getReporterById = useCallback((reporterId) => {
    return reporters.find(reporter => (reporter.id || reporter.reporterUID) === reporterId);
  }, [reporters]);

  // Get task counts by reporter - memoized
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

  // Get task counts by user - memoized
  const getTasksCountByUser = useCallback(() => {
    const counts = {};
    tasks.forEach(task => {
      const userId = task.userUID;
      if (userId) {
        counts[userId] = (counts[userId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  // Get tasks by user - memoized
  const getTasksByUser = useCallback((userId) => {
    return tasks.filter(task => task.userUID === userId);
  }, [tasks]);

  // Get tasks by reporter - memoized
  const getTasksByReporter = useCallback((reporterId) => {
    return tasks.filter(task => task.reporters === reporterId);
  }, [tasks]);

  // Get tasks by category - memoized
  const getTasksByCategory = useCallback((category) => {
    return tasks.filter(task => task.category === category);
  }, [tasks]);

  // Get tasks by market - memoized
  const getTasksByMarket = useCallback((market) => {
    return tasks.filter(task => 
      Array.isArray(task.markets) 
        ? task.markets.includes(market)
        : task.market === market
    );
  }, [tasks]);

  // Get tasks by product - memoized
  const getTasksByProduct = useCallback((product) => {
    return tasks.filter(task => task.product === product);
  }, [tasks]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Data filtering helpers
    getFilteredData,
    getTasksByUser,
    getTasksByReporter,
    getTasksByCategory,
    getTasksByMarket,
    getTasksByProduct,
    
    // Lookup helpers
    getUserById,
    getReporterById,
    
    // Count helpers
    getTasksCountByReporter,
    getTasksCountByUser
  }), [
    getFilteredData,
    getTasksByUser,
    getTasksByReporter,
    getTasksByCategory,
    getTasksByMarket,
    getTasksByProduct,
    getUserById,
    getReporterById,
    getTasksCountByReporter,
    getTasksCountByUser
  ]);
};
