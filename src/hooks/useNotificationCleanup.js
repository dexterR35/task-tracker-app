import { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export const useNotificationCleanup = (dependencies = []) => {
  const { clearAll } = useNotifications();
  const isInitialMount = useRef(true);

  const cleanup = useCallback(() => {
    clearAll();
  }, [clearAll]);

  useEffect(() => {
    if (!isInitialMount.current) {
      cleanup();
    } else {
      isInitialMount.current = false;
    }
  }, dependencies);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);
};
