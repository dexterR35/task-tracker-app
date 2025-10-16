/**
 * Markets by Users Card Configuration
 * Essential configuration for markets by users table and charts
 * Includes calculation utilities
 */

import { CARD_SYSTEM } from '@/constants';

// Markets by Users Card Types
export const MARKETS_BY_USERS_CARD_TYPES = CARD_SYSTEM.ANALYTICS_CARD_TYPES;

// Color configurations
export const CHART_COLORS = {
  DEFAULT: [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
    "#84cc16", "#f97316", "#ec4899", "#6b7280", "#14b8a6", "#a855f7"
  ],
  USER_BY_TASK: [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
    "#84cc16", "#f97316", "#ec4899", "#6b7280"
  ]
};

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate total from an object of values
 * @param {Object} dataObject - Object with numeric values
 * @param {string} defaultValue - Default value if object is empty
 * @returns {number} - Sum of all values
 */
export const calculateTotal = (dataObject, defaultValue = 0) => {
  if (!dataObject || typeof dataObject !== 'object') {
    return defaultValue;
  }
  
  return Object.values(dataObject).reduce((sum, value) => {
    const numValue = typeof value === 'number' ? value : 0;
    return sum + numValue;
  }, 0);
};


/**
 * Calculate totals for user data (hours, tasks)
 * @param {Object} userData - Object containing user data objects
 * @returns {Object} - Object with calculated totals
 */
export const calculateUserDataTotals = (userData) => {
  const {
    userHours = {},
    userTotals = {}
  } = userData;

  return {
    totalHours: calculateTotal(userHours),
    totalTasks: calculateTotal(userTotals)
  };
};

/**
 * Calculate percentage of a value relative to total
 * @param {number} value - The value to calculate percentage for
 * @param {number} total - The total value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted percentage string
 */
export const calculatePercentage = (value, total, decimals = 1) => {
  if (total === 0) return '0.0';
  
  const percentage = (value / total) * 100;
  return percentage.toFixed(decimals);
};

/**
 * Calculate percentage with count display
 * @param {number} count - The count value
 * @param {number} total - The total value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted string like "5 (25.0%)"
 */
export const calculateCountWithPercentage = (count, total, decimals = 1) => {
  if (total === 0) return `${count} (0%)`;
  
  const percentage = Math.round((count / total) * 100);
  return `${count} (${percentage}%)`;
};




// ============================================================================
// MARKETS BY USERS CONFIGURATION
// ============================================================================

// Helper function to get user name
const getUserName = (userId, users) => {
  const user = users.find(u => (u.id || u.uid || u.userUID) === userId);
  return user?.name || user?.email || `User ${userId.slice(0, 8)}`;
};

// Calculation options for different card types
export const CALCULATION_OPTIONS = {
  FULL_MARKETS_BY_USERS: {
    includeTable: true,
    includeMarketsChart: true,
    includeUsersChart: true,
    includeHours: true,
    includeGrandTotal: true
  },
  SIMPLE_TABLE: {
    includeTable: true,
    includeMarketsChart: false,
    includeUsersChart: false,
    includeHours: false,
    includeGrandTotal: true
  },
  MARKETS_ONLY: {
    includeTable: false,
    includeMarketsChart: true,
    includeUsersChart: false,
    includeHours: false,
    includeGrandTotal: false
  },
  USERS_ONLY: {
    includeTable: false,
    includeMarketsChart: false,
    includeUsersChart: true,
    includeHours: false,
    includeGrandTotal: false
  }
};

// Calculate markets by users data for table and charts
export const calculateMarketsByUsersData = (tasks, users, options = CALCULATION_OPTIONS.FULL_MARKETS_BY_USERS) => {
  if (!tasks || tasks.length === 0) {
    return { 
      tableData: [], 
      tableColumns: [], 
      chartData: [], 
      colors: [],
      userByTaskData: []
    };
  }

  const userMarketData = {};
  const marketTotals = {};
  const userTotals = {};
  const userHours = {};
  const allMarkets = new Set();
  const allUsers = new Set();

  // Single pass: collect markets, users, count tasks, and calculate hours
  tasks.forEach(task => {
    const markets = task.data_task?.markets || task.markets || [];
    const userId = task.userUID || task.createbyUID;
    
    if (userId && markets.length > 0) {
      // Add user to set
      allUsers.add(userId);
      
      // Initialize user data if not exists
      if (!userMarketData[userId]) {
        userMarketData[userId] = {};
        userTotals[userId] = 0;
        userHours[userId] = 0;
      }
      
      // Calculate hours if needed
      if (options.includeHours) {
        const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
        userHours[userId] += taskHours;
      }
      
      // Process each market
      markets.forEach(market => {
        if (market) {
          // Add market to set
          allMarkets.add(market);
          
          // Initialize market data if not exists
          if (!userMarketData[userId][market]) {
            userMarketData[userId][market] = 0;
          }
          if (!marketTotals[market]) {
            marketTotals[market] = 0;
          }
          
          // Count tasks
          userMarketData[userId][market]++;
          marketTotals[market]++;
        }
      });
      
      // Count total tasks for user
      userTotals[userId]++;
    }
  });

  // Create table data (only if requested)
  let tableData = [];
  if (options.includeTable) {
    tableData = Array.from(allUsers).map(userId => {
      const userName = getUserName(userId, users);
      const userTotal = userTotals[userId];
      const userTotalHours = userHours[userId] || 0;
      
      const row = { 
        user: userName, 
        totalTasks: userTotal
      };
      
      // Add optional columns based on options
      if (options.includeHours) {
        row.totalHours = `${userTotalHours}h`;
      }
      
      // Add market columns
      allMarkets.forEach(market => {
        const marketCount = userMarketData[userId][market] || 0;
        row[market] = calculateCountWithPercentage(marketCount, userTotal);
      });
      
      return row;
    });

    tableData.sort((a, b) => b.totalTasks - a.totalTasks);
  }

  // Add grand total row (only if table is included and grand total is requested)
  if (options.includeTable && options.includeGrandTotal) {
    const totals = calculateUserDataTotals({
      userHours,
      userTotals
    });
    
    const grandTotalRow = { 
      user: "Grand Total", 
      totalTasks: totals.totalTasks,
      bold: true, 
      highlight: true 
    };
    
    // Add optional columns based on options
    if (options.includeHours) {
      grandTotalRow.totalHours = `${totals.totalHours}h`;
    }
    
    allMarkets.forEach(market => {
      const marketTotal = marketTotals[market];
      grandTotalRow[market] = calculateCountWithPercentage(marketTotal, totals.totalTasks);
    });
    tableData.push(grandTotalRow);
  }

  // Create table columns (only if table is included)
  let tableColumns = [];
  if (options.includeTable) {
    tableColumns = [
      { key: "user", header: "User", align: "left" },
      { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true }
    ];
    
    // Add optional columns based on options
    if (options.includeHours) {
      tableColumns.push({ key: "totalHours", header: "Total Hours", align: "center", highlight: true });
    }
    
    // Add market columns
    tableColumns.push(...Array.from(allMarkets).sort().map(market => ({
      key: market,
      header: market.toUpperCase(),
      align: "center"
    })));
  }

  // Create chart data (only if requested)
  let chartData = [];
  let userByTaskData = [];
  
  if (options.includeMarketsChart) {
    chartData = Array.from(allMarkets).sort().map(market => ({
      name: market.toUpperCase(),
      value: marketTotals[market] || 0
    }));
  }

  if (options.includeUsersChart && tableData.length > 0) {
    userByTaskData = tableData
      .filter(row => !row.bold) // Exclude grand total row
      .map(row => ({
        name: row.user,
        value: row.totalTasks || 0
      }))
      .sort((a, b) => b.value - a.value) // Sort by task count descending
      .slice(0, 10); // Show top 10 users
  }

  return {
    tableData,
    tableColumns,
    chartData,
    colors: chartData.map((_, index) => CHART_COLORS.DEFAULT[index % CHART_COLORS.DEFAULT.length]),
    userByTaskData
  };
};

// Get markets by users card props for direct use with MarketsByUsersCard
export const getMarketsByUsersCardProps = (tasks, users, isLoading = false, options = CALCULATION_OPTIONS.FULL_MARKETS_BY_USERS) => {
  const calculatedData = calculateMarketsByUsersData(tasks, users, options);
  
  return {
    title: "Markets by Users",
    analyticsByUserMarketsTableData: calculatedData.tableData,
    analyticsByUserMarketsTableColumns: calculatedData.tableColumns,
    marketsData: calculatedData.chartData,
    marketsTitle: "Markets Distribution",
    marketsColors: calculatedData.colors,
    userByTaskData: calculatedData.userByTaskData,
    userByTaskTitle: "Users by Task Count",
    userByTaskColors: CHART_COLORS.USER_BY_TASK,
    isLoading
  };
};
