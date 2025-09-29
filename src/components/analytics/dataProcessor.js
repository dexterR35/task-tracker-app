/**
 * Data processor utility for analytics components
 * Transforms raw task data into formats suitable for tables and charts
 */

/**
 * Process tasks data into table format
 * @param {Array} tasks - Array of task objects
 * @param {Object} config - Configuration object
 * @returns {Object} Processed data for table display
 */
export const processTasksForTable = (tasks = [], config = {}) => {
  const {
    categoryField = 'products',
    marketField = 'markets',
    categories = ['MKT', 'ACQ', 'PROD', 'MISC'],
    markets = ['Casino', 'Sport', 'Poker', 'Lotto']
  } = config;

  // Initialize data structure
  const tableData = {};
  categories.forEach(category => {
    tableData[category] = {};
    markets.forEach(market => {
      tableData[category][market] = 0;
    });
    tableData[category].total = 0;
  });

  // Process each task with error handling
  tasks.forEach((task, index) => {
    try {
      // Processing task

      const category = extractCategory(task, categoryField);
      const market = extractMarket(task, marketField);
      
      if (tableData[category] && tableData[category][market] !== undefined) {
        tableData[category][market]++;
        tableData[category].total++;
      }
    } catch (error) {
      // Error processing task
      // Continue processing other tasks
    }
  });

  return tableData;
};

/**
 * Process tasks data into chart format
 * @param {Array} tasks - Array of task objects
 * @param {Object} config - Configuration object
 * @returns {Array} Data array for chart display
 */
export const processTasksForChart = (tasks = [], config = {}) => {
  const {
    categoryField = 'products',
    categories = ['MKT', 'ACQ', 'PROD', 'MISC']
  } = config;

  // Initialize chart data
  const chartData = [["Category", "Tasks"]];
  
  // Count tasks by category
  const categoryCounts = {};
  categories.forEach(category => {
    categoryCounts[category] = 0;
  });

  // Process each task with error handling
  tasks.forEach((task, index) => {
    try {
      const category = extractCategory(task, categoryField);
      if (categoryCounts[category] !== undefined) {
        categoryCounts[category]++;
      }
    } catch (error) {
      // Error processing task for chart
      // Continue processing other tasks
    }
  });

  // Add data to chart format
  categories.forEach(category => {
    chartData.push([category, categoryCounts[category]]);
  });

  return chartData;
};

/**
 * Extract category from task data
 * @param {Object} task - Task object
 * @param {string} field - Field to extract category from
 * @returns {string} Category name
 */
const extractCategory = (task, field) => {
  const value = task[field];
  
  // Ensure value is a string
  if (!value || typeof value !== 'string') {
    // Try to extract from departments field
    const department = task.departments;
    if (department && typeof department === 'string') {
      const departmentLower = department.toLowerCase();
      if (departmentLower.includes('marketing') || departmentLower.includes('mkt')) {
        return 'MKT';
      } else if (departmentLower.includes('acquisition') || departmentLower.includes('acq')) {
        return 'ACQ';
      } else if (departmentLower.includes('product') || departmentLower.includes('prod')) {
        return 'PROD';
      }
    }
    return 'MISC';
  }
  
  const valueLower = value.toLowerCase().trim();
  
  if (valueLower.startsWith('mkt')) {
    return 'MKT';
  } else if (valueLower.startsWith('acq')) {
    return 'ACQ';
  } else if (valueLower.startsWith('prod')) {
    return 'PROD';
  } else if (valueLower === 'misc') {
    return 'MISC';
  } else {
    // Try to extract from departments field
    const department = task.departments;
    if (department && typeof department === 'string') {
      const departmentLower = department.toLowerCase();
      if (departmentLower.includes('marketing') || departmentLower.includes('mkt')) {
        return 'MKT';
      } else if (departmentLower.includes('acquisition') || departmentLower.includes('acq')) {
        return 'ACQ';
      } else if (departmentLower.includes('product') || departmentLower.includes('prod')) {
        return 'PROD';
      }
    }
  }
  
  return 'MISC';
};

/**
 * Extract market from task data
 * @param {Object} task - Task object
 * @param {string} field - Field to extract market from
 * @returns {string} Market name
 */
const extractMarket = (task, field) => {
  const value = task[field];
  
  // Ensure value is a string
  if (!value || typeof value !== 'string') {
    // Try to extract from markets array
    if (Array.isArray(task.markets) && task.markets.length > 0) {
      const firstMarket = task.markets[0];
      if (firstMarket && typeof firstMarket === 'string') {
        const firstMarketLower = firstMarket.toLowerCase();
        if (firstMarketLower.includes('sport')) {
          return 'Sport';
        } else if (firstMarketLower.includes('poker')) {
          return 'Poker';
        } else if (firstMarketLower.includes('lotto')) {
          return 'Lotto';
        }
      }
    }
    return 'Casino';
  }
  
  const valueLower = value.toLowerCase().trim();
  
  if (valueLower.includes('sport')) {
    return 'Sport';
  } else if (valueLower.includes('poker')) {
    return 'Poker';
  } else if (valueLower.includes('lotto')) {
    return 'Lotto';
  } else if (valueLower.includes('casino')) {
    return 'Casino';
  } else {
    // Try to extract from markets array
    if (Array.isArray(task.markets) && task.markets.length > 0) {
      const firstMarket = task.markets[0];
      if (firstMarket && typeof firstMarket === 'string') {
        const firstMarketLower = firstMarket.toLowerCase();
        if (firstMarketLower.includes('sport')) {
          return 'Sport';
        } else if (firstMarketLower.includes('poker')) {
          return 'Poker';
        } else if (firstMarketLower.includes('lotto')) {
          return 'Lotto';
        }
      }
    }
  }
  
  return 'Casino';
};

/**
 * Generate summary data from processed table data
 * @param {Object} tableData - Processed table data
 * @returns {Object} Summary statistics
 */
export const generateSummaryData = (tableData) => {
  const totalTasks = Object.values(tableData).reduce((sum, category) => {
    return sum + (category.total || 0);
  }, 0);

  return {
    totalTasks,
    categories: Object.keys(tableData).length
  };
};

