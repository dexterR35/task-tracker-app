import { useEffect, useRef } from 'react';
import { analyticsCalculator } from '../../utils/analyticsCalculator';
import { logger } from '../../utils/logger';

/**
 * Hook to manage analytics cache invalidation
 * Listens for task changes and invalidates cache when needed
 */
export const useAnalyticsCache = (monthId, userId = null) => {
  const lastInvalidationRef = useRef(0);
  const invalidationDebounce = 200; // Debounce invalidations by 200ms

  useEffect(() => {
    if (!monthId) return;

    const handleTaskChanged = (event) => {
      const { detail } = event;
      
      // Only handle events for our month/user combination
      if (detail.monthId !== monthId) return;
      
      // For user-specific views, only invalidate if the task affects that user
      if (userId && detail.taskUserId && detail.taskUserId !== userId) {
        return;
      }

      // Debounce rapid invalidations
      const now = Date.now();
      if (now - lastInvalidationRef.current < invalidationDebounce) {
        logger.debug(`[AnalyticsCache] Debouncing invalidation for ${monthId}`);
        return;
      }
      
      lastInvalidationRef.current = now;

      logger.debug(`[AnalyticsCache] Invalidating cache for ${monthId} (${userId || 'all users'}) due to ${detail.operation}`);
      
      // Clear the cache for this month
      analyticsCalculator.clearCache(monthId);
    };

    // Listen for task change events
    window.addEventListener('task-changed', handleTaskChanged);

    return () => {
      window.removeEventListener('task-changed', handleTaskChanged);
    };
  }, [monthId, userId]);

  // Function to manually invalidate cache
  const invalidateCache = () => {
    if (monthId) {
      logger.debug(`[AnalyticsCache] Manual cache invalidation for ${monthId}`);
      analyticsCalculator.clearCache(monthId);
      lastInvalidationRef.current = Date.now();
    }
  };

  return {
    invalidateCache
  };
};
