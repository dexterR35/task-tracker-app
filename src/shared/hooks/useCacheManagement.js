import { useDispatch } from 'react-redux';
import { usersApi } from '../../features/users/usersApi';
import { reportersApi } from '../../features/reporters/reportersApi';
import { useDataCache } from './analytics/useCentralizedDataAnalytics';
import { logger } from '../utils/logger';

export const useCacheManagement = () => {
  const dispatch = useDispatch();
  const { clearCache } = useDataCache();

  const clearAllCache = () => {
    dispatch(usersApi.util.resetApiState());
    dispatch(reportersApi.util.resetApiState());
    logger.log("All cache cleared (excluding tasks - handled by real-time)");
  };

  const clearReportersCache = () => {
    dispatch(reportersApi.util.resetApiState());
    logger.log("Reporters cache cleared");
  };

  const clearUsersCache = () => {
    dispatch(usersApi.util.resetApiState());
    logger.log("Users cache cleared");
  };

  // Clear cache for specific entity
  const clearEntityCache = (entityType) => {
    switch (entityType) {
      case 'reporters':
        clearReportersCache();
        break;
      case 'users':
        clearUsersCache();
        break;
      case 'tasks':
        clearCache();
        logger.log('Analytics cache cleared due to task operation');
        break;
      default:
        clearAllCache();
    }
  };

  // Clear cache when data changes significantly
  const clearCacheOnDataChange = (entityType, operation) => {
    logger.log(`Cache cleared due to ${operation} on ${entityType}`);
    clearEntityCache(entityType);
    
    // For tasks, analytics cache is already cleared in clearEntityCache
    // No additional logic needed
  };

  return {
    clearAllCache,
    clearReportersCache,
    clearUsersCache,
    clearEntityCache,
    clearCacheOnDataChange,
  };
};
