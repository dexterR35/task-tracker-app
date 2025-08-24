import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useComputeMonthAnalyticsMutation } from '../../features/tasks/tasksApi';
import { useNotifications } from './useNotifications';


/**
 * Hook for generating analytics from Redux state (Strategy 3)
 * Avoids Firebase reads by using already-fetched task data
 */
export const useAnalyticsFromRedux = () => {
  const { addSuccess, addError } = useNotifications();
  const [computeAnalytics, { isLoading: isComputing }] = useComputeMonthAnalyticsMutation();

  // Access the RTK Query cache from Redux state
  const tasksApiState = useSelector((state) => state.tasksApi);

  // Get tasks from Redux state for the current month
  const getTasksFromRedux = useCallback((monthId) => {
    // Access tasks directly from RTK Query cache
    const queries = tasksApiState?.queries || {};
    const queryKey = `subscribeToMonthTasks({"monthId":"${monthId}"})`;
    return queries[queryKey]?.data || null;
  }, [tasksApiState]);

  // Check if tasks are cached for a month
  const hasTasksInRedux = useCallback((monthId) => {
    const tasks = getTasksFromRedux(monthId);
    return tasks !== null && tasks.length > 0;
  }, [getTasksFromRedux]);

  // Get cache status for debugging
  const getReduxCacheStatus = useCallback((monthId) => {
    const queries = tasksApiState?.queries || {};
    const queryKey = `subscribeToMonthTasks({"monthId":"${monthId}"})`;
    const query = queries[queryKey];
    
    return {
      cached: !!(query?.data && Array.isArray(query.data)),
      loading: query?.isLoading || false,
      error: query?.error || null,
      data: query?.data || null,
      lastUpdated: query?.lastUpdated || null
    };
  }, [tasksApiState]);

  // Debug function to log cache state
  const debugReduxCache = useCallback(() => {
    console.log('=== RTK Query Cache Debug ===');
    console.log('Available queries:', Object.keys(tasksApiState?.queries || {}));
    
    for (const [key, query] of Object.entries(tasksApiState?.queries || {})) {
      console.log(`Query: ${key}`);
      console.log(`  - Data:`, query.data);
      console.log(`  - Loading:`, query.isLoading);
      console.log(`  - Error:`, query.error);
      console.log(`  - Last Updated:`, query.lastUpdated);
    }
    console.log('=== End Debug ===');
  }, [tasksApiState]);

  /**
   * Generate analytics from Redux state (no Firebase reads)
   * @param {string} monthId - The month to generate analytics for
   * @param {Array} tasks - Optional tasks array (if not provided, will try to get from Redux)
   * @returns {Promise<Object>} Analytics data
   */
  const generateAnalyticsFromRedux = useCallback(async (monthId, tasks = null) => {
    try {
      console.log('Generating analytics from Redux state for month:', monthId);
      
      // If tasks not provided, try to get from Redux state
      let tasksToUse = tasks;
      if (!tasksToUse) {
        tasksToUse = getTasksFromRedux(monthId);
      }

      if (!tasksToUse || tasksToUse.length === 0) {
        // Debug cache state if no tasks found
        console.log('No tasks found in Redux, debugging cache state...');
        debugReduxCache();
        
        throw new Error(`No tasks found in Redux state for ${monthId}. Please ensure tasks are loaded first.`);
      }

      console.log(`Computing analytics from ${tasksToUse.length} tasks in Redux state for month:`, monthId);
      
      // Use the enhanced computeMonthAnalytics with tasks from Redux
      const result = await computeAnalytics({ 
        monthId, 
        useCache: true, 
        tasks: tasksToUse 
      }).unwrap();

      addSuccess(`Analytics generated from Redux state for ${monthId}!`);
      return result;
    } catch (error) {
      console.error('Error generating analytics from Redux:', error);
      addError(error.message || 'Failed to generate analytics from Redux state');
      throw error;
    }
  }, [computeAnalytics, getTasksFromRedux, debugReduxCache, addSuccess, addError]);

  /**
   * Generate analytics for multiple months from Redux state
   * @param {Array<string>} monthIds - Array of month IDs
   * @returns {Promise<Object>} Analytics data for all months
   */
  const generateMultiMonthAnalyticsFromRedux = useCallback(async (monthIds) => {
    try {
      console.log('Generating multi-month analytics from Redux state for months:', monthIds);
      
      const results = {};
      
      for (const monthId of monthIds) {
        try {
          const tasks = getTasksFromRedux(monthId);
          if (tasks && tasks.length > 0) {
            const analytics = await generateAnalyticsFromRedux(monthId, tasks);
            results[monthId] = analytics;
          } else {
            console.warn(`No tasks found in Redux state for month: ${monthId}`);
          }
        } catch (error) {
          console.error(`Error generating analytics for month ${monthId}:`, error);
          results[monthId] = { error: error.message };
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error generating multi-month analytics from Redux:', error);
      addError('Failed to generate multi-month analytics from Redux state');
      throw error;
    }
  }, [generateAnalyticsFromRedux, getTasksFromRedux, addError]);

  return {
    generateAnalyticsFromRedux,
    generateMultiMonthAnalyticsFromRedux,
    isComputing,
    getTasksFromRedux,
    hasTasksInRedux,
    getReduxCacheStatus,
    debugReduxCache
  };
};

export default useAnalyticsFromRedux;
