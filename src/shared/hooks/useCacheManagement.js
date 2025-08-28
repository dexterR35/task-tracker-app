import { useDispatch } from 'react-redux';
import { usersApi } from '../../features/users/usersApi';
import { reportersApi } from '../../features/reporters/reportersApi';
import { tasksApi } from '../../features/tasks/tasksApi';
import { logger } from '../utils/logger';

export const useCacheManagement = () => {
  const dispatch = useDispatch();

  const clearAllCache = () => {
    dispatch(usersApi.util.resetApiState());
    dispatch(reportersApi.util.resetApiState());
    dispatch(tasksApi.util.resetApiState());
    logger.log("All cache cleared");
  };

  const clearReportersCache = () => {
    dispatch(reportersApi.util.resetApiState());
    logger.log("Reporters cache cleared");
  };

  const clearUsersCache = () => {
    dispatch(usersApi.util.resetApiState());
    logger.log("Users cache cleared");
  };

  const clearTasksCache = () => {
    dispatch(tasksApi.util.resetApiState());
    logger.log("Tasks cache cleared");
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
        clearTasksCache();
        break;
      default:
        clearAllCache();
    }
  };

  // Clear cache when data changes significantly
  const clearCacheOnDataChange = (entityType, operation) => {
    logger.log(`Cache cleared due to ${operation} on ${entityType}`);
    clearEntityCache(entityType);
  };

  return {
    clearAllCache,
    clearReportersCache,
    clearUsersCache,
    clearTasksCache,
    clearEntityCache,
    clearCacheOnDataChange,
  };
};
