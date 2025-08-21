import { useEffect, useRef } from 'react';
import { useNotifications } from './useNotifications';

export const useNotificationCleanup = (dependencies = []) => {
  const { clearAll } = useNotifications();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Clear notifications on mount and when dependencies change
    if (!isInitialMount.current) {
      clearAll();
    } else {
      isInitialMount.current = false;
    }
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);
};
