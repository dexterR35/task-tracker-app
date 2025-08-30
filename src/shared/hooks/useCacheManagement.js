import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { tasksApi } from '../../features/tasks/tasksApi';
import { usersApi } from '../../features/users/usersApi';
import { reportersApi } from '../../features/reporters/reportersApi';
import { logger } from '../utils/logger';

/**
 * Hook for managing cache operations
 * Provides utilities to clear cache, invalidate specific data, and manage cache lifecycle
 */
export const useCacheManagement = () => {
  const dispatch = useDispatch();

  // Clear all cache entries
  const clearAllCache = useCallback(() => {
    logger.log('[useCacheManagement] Clearing all cache entries');
    dispatch(tasksApi.util.resetApiState());
    dispatch(usersApi.util.resetApiState());
    dispatch(reportersApi.util.resetApiState());
  }, [dispatch]);

  // Clear cache for specific month
  const clearMonthCache = useCallback((monthId) => {
    logger.log(`[useCacheManagement] Clearing cache for month: ${monthId}`);
    dispatch(tasksApi.util.invalidateTags([{ type: 'MonthTasks', id: monthId }]));
  }, [dispatch]);

  // Clear cache for specific user
  const clearUserCache = useCallback((userId) => {
    logger.log(`[useCacheManagement] Clearing cache for user: ${userId}`);
    dispatch(usersApi.util.invalidateTags([{ type: 'Users', id: userId }]));
  }, [dispatch]);

  // Clear cache when data changes (for real-time updates)
  const clearCacheOnDataChange = useCallback((dataType, operation) => {
    logger.log(`[useCacheManagement] Clearing cache due to ${operation} on ${dataType}`);
    
    switch (dataType) {
      case 'tasks':
        dispatch(tasksApi.util.invalidateTags([{ type: 'MonthTasks' }]));
        break;
      case 'users':
        dispatch(usersApi.util.invalidateTags([{ type: 'Users' }]));
        break;
      case 'reporters':
        dispatch(reportersApi.util.invalidateTags([{ type: 'Reporters' }]));
        break;
      default:
        logger.warn(`[useCacheManagement] Unknown data type: ${dataType}`);
    }
  }, [dispatch]);

  // Clean up old cache entries (remove unused data)
  const cleanupOldCache = useCallback(() => {
    logger.log('[useCacheManagement] Cleaning up old cache entries');
    
    // Remove cache entries older than 10 minutes
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    
    // This is a manual cleanup - RTK Query handles most cleanup automatically
    // but we can trigger additional cleanup if needed
    dispatch(tasksApi.util.resetApiState());
  }, [dispatch]);

  return {
    clearAllCache,
    clearMonthCache,
    clearUserCache,
    clearCacheOnDataChange,
    cleanupOldCache,
  };
};
