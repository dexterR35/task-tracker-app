import { useCallback,useDispatch, useSelector } from './useImports';

import { 
  addNotification, 
  removeNotification, 
  clearAllNotifications,
  updateNotificationConfig,
  markAsRead 
} from '../redux/slices/notificationSlice';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.notifications);

  const addSuccess = useCallback((message, options = {}) => {
    dispatch(addNotification({
      type: 'success',
      message,
      ...options
    }));
  }, [dispatch]);

  const addError = useCallback((message, options = {}) => {
    dispatch(addNotification({
      type: 'error',
      message,
      ...options
    }));
  }, [dispatch]);

  const addWarning = useCallback((message, options = {}) => {
    dispatch(addNotification({
      type: 'warning',
      message,
      ...options
    }));
  }, [dispatch]);

  const addInfo = useCallback((message, options = {}) => {
    dispatch(addNotification({
      type: 'info',
      message,
      ...options
    }));
  }, [dispatch]);

  const remove = useCallback((id) => {
    dispatch(removeNotification(id));
  }, [dispatch]);

  const clearAll = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  const updateConfig = useCallback((config) => {
    dispatch(updateNotificationConfig(config));
  }, [dispatch]);

  const markNotificationAsRead = useCallback((id) => {
    dispatch(markAsRead(id));
  }, [dispatch]);

  return {
    items: notifications.items,
    config: notifications.config,
    addSuccess,
    addError,
    addWarning,
    addInfo,
    remove,
    clearAll,
    updateConfig,
    markAsRead: markNotificationAsRead,
  };
};
