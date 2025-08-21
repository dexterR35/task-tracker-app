/**
 * Redux Cache Utilities
 * Helper functions to access RTK Query cache data from Redux state
 */

/**
 * Get tasks from RTK Query cache for a specific month
 * @param {Object} tasksApiState - The tasksApi state from Redux
 * @param {string} monthId - The month ID to look for
 * @returns {Array|null} Array of tasks or null if not found
 */
export const getTasksFromCache = (tasksApiState, monthId) => {
  try {
    if (!tasksApiState || !tasksApiState.queries) {
      console.log('No tasksApi state found in Redux');
      return null;
    }

    const queries = tasksApiState.queries;
    
    // Try different possible query keys
    const possibleKeys = [
      `getMonthTasks({"monthId":"${monthId}"})`,
      `getMonthTasks({"monthId":"${monthId}","useCache":true})`,
      `subscribeToMonthTasks({"monthId":"${monthId}"})`,
      `subscribeToMonthTasks({"monthId":"${monthId}","useCache":true})`
    ];

    for (const key of possibleKeys) {
      if (queries[key] && queries[key].data && Array.isArray(queries[key].data)) {
        console.log(`Found tasks in cache key: ${key} for month: ${monthId}`);
        return queries[key].data;
      }
    }

    // Fallback: search for any query containing the monthId
    for (const [key, query] of Object.entries(queries)) {
      if (key.includes(monthId) && query.data && Array.isArray(query.data)) {
        console.log(`Found tasks in cache key: ${key} for month: ${monthId}`);
        return query.data;
      }
    }

    console.log(`No tasks found in Redux cache for month: ${monthId}`);
    return null;
  } catch (error) {
    console.error('Error accessing Redux cache:', error);
    return null;
  }
};

/**
 * Get all cached tasks for multiple months
 * @param {Object} tasksApiState - The tasksApi state from Redux
 * @param {Array<string>} monthIds - Array of month IDs
 * @returns {Object} Object with monthId as key and tasks array as value
 */
export const getTasksForMultipleMonths = (tasksApiState, monthIds) => {
  const result = {};
  
  for (const monthId of monthIds) {
    const tasks = getTasksFromCache(tasksApiState, monthId);
    if (tasks) {
      result[monthId] = tasks;
    }
  }
  
  return result;
};

/**
 * Check if tasks are cached for a specific month
 * @param {Object} tasksApiState - The tasksApi state from Redux
 * @param {string} monthId - The month ID to check
 * @returns {boolean} True if tasks are cached
 */
export const hasCachedTasks = (tasksApiState, monthId) => {
  const tasks = getTasksFromCache(tasksApiState, monthId);
  return tasks !== null && tasks.length > 0;
};

/**
 * Get cache status for a specific month
 * @param {Object} tasksApiState - The tasksApi state from Redux
 * @param {string} monthId - The month ID to check
 * @returns {Object} Cache status object
 */
export const getCacheStatus = (tasksApiState, monthId) => {
  try {
    if (!tasksApiState || !tasksApiState.queries) {
      return { cached: false, loading: false, error: null };
    }

    const queries = tasksApiState.queries;
    
    // Check for any query containing the monthId
    for (const [key, query] of Object.entries(queries)) {
      if (key.includes(monthId)) {
        return {
          cached: !!(query.data && Array.isArray(query.data)),
          loading: query.isLoading || false,
          error: query.error || null,
          data: query.data || null,
          lastUpdated: query.lastUpdated || null
        };
      }
    }

    return { cached: false, loading: false, error: null };
  } catch (error) {
    console.error('Error getting cache status:', error);
    return { cached: false, loading: false, error: error.message };
  }
};

/**
 * Debug function to log all cached queries
 * @param {Object} tasksApiState - The tasksApi state from Redux
 */
export const debugCache = (tasksApiState) => {
  if (!tasksApiState || !tasksApiState.queries) {
    console.log('No tasksApi state found');
    return;
  }

  console.log('=== RTK Query Cache Debug ===');
  console.log('Available queries:', Object.keys(tasksApiState.queries));
  
  for (const [key, query] of Object.entries(tasksApiState.queries)) {
    console.log(`Query: ${key}`);
    console.log(`  - Data:`, query.data);
    console.log(`  - Loading:`, query.isLoading);
    console.log(`  - Error:`, query.error);
    console.log(`  - Last Updated:`, query.lastUpdated);
  }
  console.log('=== End Debug ===');
};
