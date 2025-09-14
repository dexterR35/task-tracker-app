import { useMemo } from 'react';

/**
 * Simple data filtering hook for tasks
 * @param {Array} data - Array of data to filter
 * @param {Object} filterOptions - Filter configuration
 * @param {string} filterOptions.userId - Filter by user ID
 * @param {string} filterOptions.monthId - Filter by month ID
 * @returns {Array} Filtered data
 */
export const useDataFilter = (data = [], filterOptions = {}) => {
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let result = [...data];

    // Filter by user ID
    if (filterOptions.userId) {
      result = result.filter(item => 
        item.userUID === filterOptions.userId || 
        item.createbyUID === filterOptions.userId
      );
    }

    // Filter by month ID
    if (filterOptions.monthId) {
      result = result.filter(item => 
        item.monthId === filterOptions.monthId
      );
    }

    return result;
  }, [data, filterOptions]);

  return filteredData;
};

/**
 * Hook for creating filter options from dashboard state
 * @param {Object} dashboardState - Current dashboard state
 * @param {string} dashboardState.selectedUserId - Selected user ID
 * @param {string} dashboardState.selectedMonthId - Selected month ID
 * @returns {Object} Filter options
 */
export const useFilterOptions = (dashboardState = {}) => {
  const filterOptions = useMemo(() => {
    const options = {};

    if (dashboardState.selectedUserId) {
      options.userId = dashboardState.selectedUserId;
    }

    if (dashboardState.selectedMonthId) {
      options.monthId = dashboardState.selectedMonthId;
    }

    return options;
  }, [dashboardState.selectedUserId, dashboardState.selectedMonthId]);

  return filterOptions;
};

/**
 * Simple data processor for sorting and mapping
 * @param {Array} data - Array of data to process
 * @param {Object} options - Processing options
 * @param {Function} options.filterFn - Custom filter function
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - 'asc' or 'desc'
 * @param {Function} options.mapFn - Custom map function
 * @returns {Array} Processed data
 */
export const useDataProcessor = (data = [], options = {}) => {
  const { filterFn = null, sortBy = null, sortOrder = 'desc', mapFn = null } = options;

  const processedData = useMemo(() => {
    let result = [...data];

    // Apply custom filter function
    if (filterFn && typeof filterFn === 'function') {
      result = result.filter(filterFn);
    }

    // Apply sorting
    if (sortBy) {
      result = result.sort((a, b) => {
        const aVal = a[sortBy] || a.data_task?.[sortBy];
        const bVal = b[sortBy] || b.data_task?.[sortBy];
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
    }

    // Apply custom map function
    if (mapFn && typeof mapFn === 'function') {
      result = result.map(mapFn);
    }

    return result;
  }, [data, filterFn, sortBy, sortOrder, mapFn]);

  return processedData;
};

export default useDataFilter;
