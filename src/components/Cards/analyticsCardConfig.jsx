/**
 * Markets by Users Card Configuration
 * Essential configuration for markets by users table and charts
 * Includes calculation utilities and caching
 */

import { CARD_SYSTEM } from '@/constants';
import Badge from '@/components/ui/Badge/Badge';
import { addConsistentColors, getMarketColor, getProductColor, getAIModelColor, getUserColor } from '@/utils/chartColorMapping';
// Removed unused analytics cache import

// Markets by Users Card Types
export const MARKETS_BY_USERS_CARD_TYPES = CARD_SYSTEM.ANALYTICS_CARD_TYPES;

// Color configurations - using CARD_SYSTEM.COLOR_HEX_MAP
export const CHART_COLORS = {
  DEFAULT: Object.values(CARD_SYSTEM.COLOR_HEX_MAP),
  USER_BY_TASK: Object.values(CARD_SYSTEM.COLOR_HEX_MAP).slice(0, 10)
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
      tableData: [{
        user: "No data available",
        totalTasks: 0,
        totalHours: "0h",
        noData: true
      }], 
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
        { key: "totalHours", header: "Total Hours", align: "center", highlight: true }
      ], 
      chartData: [{ name: "No data available", value: 0 }], 
      colors: ["#6b7280"],
      userByTaskData: [{ name: "No data available", value: 0 }]
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
    chartData = addConsistentColors(
      Array.from(allMarkets).sort().map(market => ({
        name: market.toUpperCase(),
        value: marketTotals[market] || 0
      })),
      'market'
    );
  }

  if (options.includeUsersChart && tableData.length > 0) {
    userByTaskData = addConsistentColors(
      tableData
        .filter(row => !row.bold) // Exclude grand total row
        .map(row => ({
          name: row.user,
          value: row.totalTasks || 0
        }))
        .sort((a, b) => b.value - a.value) // Sort by task count descending
        .slice(0, 10), // Show top 10 users
      'user'
    );
  }

  return {
    tableData,
    tableColumns,
    chartData,
    colors: chartData.map(item => item.color),
    userByTaskData
  };
};

// Helper function to calculate biaxial bar data
const calculateBiaxialBarData = (tasks) => {
  if (!tasks || tasks.length === 0) return [];
  
  // Get all unique markets from actual tasks
  const marketStats = {};
  
  tasks.forEach(task => {
    const taskMarkets = task.data_task?.markets || task.markets || [];
    const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
    
    taskMarkets.forEach(market => {
      if (market) {
        if (!marketStats[market]) {
          marketStats[market] = {
            tasks: 0,
            hours: 0
          };
        }
        marketStats[market].tasks += 1;
        marketStats[market].hours += taskHours;
      }
    });
  });
  
  // Convert to array format for the chart with consistent colors
  return addConsistentColors(
    Object.entries(marketStats)
      .map(([market, stats]) => ({
        name: market.toUpperCase(),
        tasks: stats.tasks,
        hours: Math.round(stats.hours * 100) / 100, // Round to 2 decimal places
      }))
      .sort((a, b) => b.tasks - a.tasks), // Sort by task count descending
    'market'
  );
};

const calculateUsersBiaxialData = (tasks, users) => {
  if (!tasks || tasks.length === 0 || !users || users.length === 0) return [];
  
  // Get all unique users from actual tasks
  const userStats = {};
  
  tasks.forEach(task => {
    const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
    
    // Try multiple possible user fields
    const createdBy = task.data_task?.createdBy || task.createdBy || task.data_task?.createdByName || task.createdByName;
    const assignedTo = task.data_task?.assignedTo || task.assignedTo || task.data_task?.assignedToName || task.assignedToName;
    const reporter = task.data_task?.reporter || task.reporter || task.data_task?.reporterName || task.reporterName;
    
    // Use the first available user field
    const userId = createdBy || assignedTo || reporter;
    
    if (userId) {
      if (!userStats[userId]) {
        userStats[userId] = {
          tasks: 0,
          hours: 0
        };
      }
      userStats[userId].tasks += 1;
      userStats[userId].hours += taskHours;
    }
  });
  
  // Convert to array format for the chart with user names and consistent colors
  const result = addConsistentColors(
    Object.entries(userStats)
      .map(([userId, stats]) => {
        // Find user name from users array - try multiple ID fields
        const user = users.find(u => 
          u.uid === userId || 
          u.id === userId || 
          u.email === userId ||
          u.displayName === userId ||
          u.name === userId
        );
        
        const userName = user ? (user.displayName || user.name || user.email || `User ${userId}`) : `User ${userId}`;
        
        return {
          name: userName,
          tasks: stats.tasks,
          hours: Math.round(stats.hours * 100) / 100, // Round to 2 decimal places
        };
      })
      .sort((a, b) => b.tasks - a.tasks), // Sort by task count descending
    'user'
  );
    
  return result;
};

// Get markets by users card props for direct use with MarketsByUsersCard
export const getMarketsByUsersCardProps = (tasks, users, isLoading = false, options = CALCULATION_OPTIONS.FULL_MARKETS_BY_USERS) => {
  // Early return for empty data to prevent heavy calculations
  if (!tasks || tasks.length === 0 || !users || users.length === 0) {
    return {
      title: "Markets by Users",
      analyticsByUserMarketsTableData: [],
      analyticsByUserMarketsTableColumns: [],
      marketsData: [],
      marketsTitle: "Markets Distribution (0 tasks, 0h)",
      marketsColors: [],
      userByTaskData: [],
      userByTaskTitle: "Users by Task Count (0 tasks, 0h)",
      userByTaskColors: CHART_COLORS.USER_BY_TASK,
      biaxialBarData: [],
      biaxialBarTitle: "Markets: Tasks & Hours (0 tasks, 0h)",
      biaxialTasksColor: CHART_COLORS.DEFAULT[0],
      biaxialHoursColor: CHART_COLORS.DEFAULT[1],
      usersBiaxialData: [],
      usersBiaxialTitle: "Users: Tasks & Hours (0 tasks, 0h)",
      usersBiaxialTasksColor: CHART_COLORS.DEFAULT[2],
      usersBiaxialHoursColor: CHART_COLORS.DEFAULT[3],
      isLoading
    };
  }

  const calculatedData = calculateMarketsByUsersData(tasks, users, options);
  
  // Calculate total tasks and hours for chart titles
  const totalTasks = tasks?.length || 0;
  const totalHours = tasks?.reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0) || 0;
  
  // Prepare biaxial bar chart data (tasks and hours per market)
  const biaxialBarData = calculateBiaxialBarData(tasks);
  
  // Prepare users biaxial bar chart data (tasks and hours per user)
  const usersBiaxialData = calculateUsersBiaxialData(tasks, users);

  return {
    title: "Markets by Users",
    analyticsByUserMarketsTableData: calculatedData.tableData,
    analyticsByUserMarketsTableColumns: calculatedData.tableColumns,
    marketsData: calculatedData.chartData,
    marketsTitle: `Markets Distribution (${totalTasks} tasks, ${totalHours}h)`,
    marketsColors: calculatedData.colors,
    userByTaskData: calculatedData.userByTaskData,
    userByTaskTitle: `Users by Task Count (${totalTasks} tasks, ${totalHours}h)`,
    userByTaskColors: CHART_COLORS.USER_BY_TASK,
    biaxialBarData: biaxialBarData,
    biaxialBarTitle: `Markets: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    biaxialTasksColor: CHART_COLORS.DEFAULT[0], // "#3b82f6" - first color from palette
    biaxialHoursColor: CHART_COLORS.DEFAULT[1], // "#10b981" - second color from palette
    usersBiaxialData: usersBiaxialData,
    usersBiaxialTitle: `Users: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    usersBiaxialTasksColor: CHART_COLORS.DEFAULT[2], // "#f59e0b" - third color from palette
    usersBiaxialHoursColor: CHART_COLORS.DEFAULT[3], // "#ef4444" - fourth color from palette
    isLoading
  };
};

// Removed caching system for simplicity

// Simplified version without caching
export const getCachedMarketsByUsersCardProps = (tasks, users, month, isLoading = false, options = CALCULATION_OPTIONS.FULL_MARKETS_BY_USERS) => {
  return getMarketsByUsersCardProps(tasks, users, isLoading, options);
};

// ============================================================================
// MARKETING ANALYTICS CONFIGURATION
// ============================================================================

// Marketing-specific colors - using same colors as Markets by Users
export const MARKETING_CHART_COLORS = {
  CASINO: CHART_COLORS.DEFAULT,
  SPORT: CHART_COLORS.DEFAULT
};

/**
 * Calculate marketing analytics data for table and charts
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Marketing analytics data object
 */
export const calculateMarketingAnalyticsData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [{
        category: "No data available",
        total: 0,
        noData: true
      }],
      tableColumns: [
        { key: "category", header: "Marketing Category", align: "left" },
        { key: "total", header: "Total Tasks", align: "center", highlight: true }
      ],
      casinoMarketingData: [{ name: "No data available", value: 0 }],
      sportMarketingData: [{ name: "No data available", value: 0 }],
      casinoBiaxialData: [{ name: "No data available", tasks: 0, hours: 0, color: "#6b7280" }],
      sportBiaxialData: [{ name: "No data available", tasks: 0, hours: 0, color: "#6b7280" }],
      casinoTotalTasks: 0,
      casinoTotalHours: 0,
      sportTotalTasks: 0,
      sportTotalHours: 0
    };
  }

  // Initialize data structures
  const marketingData = {
    casino: {},
    sport: {},
    poker: {},
    lotto: {}
  };
  
  const marketTotals = {};
  const allMarkets = new Set();

  // Process tasks to extract marketing data
  tasks.forEach(task => {
    const products = task.data_task?.products || task.products;
    const markets = task.data_task?.markets || task.markets || [];
    
    if (!products || !Array.isArray(markets) || markets.length === 0) return;

    // Check if it's a marketing task (products is a string)
    if (typeof products === 'string' && products.includes('marketing')) {
      // Determine marketing category
      let category = null;
      if (products.includes('casino')) category = 'casino';
      else if (products.includes('sport')) category = 'sport';
      else if (products.includes('poker')) category = 'poker';
      else if (products.includes('lotto')) category = 'lotto';
      
      if (category) {
        // Process each market for this task
        markets.forEach(market => {
          if (market) {
            allMarkets.add(market);
            
            // Initialize data structures
            if (!marketingData[category][market]) {
              marketingData[category][market] = 0;
            }
            if (!marketTotals[market]) {
              marketTotals[market] = 0;
            }
            
            // Count tasks
            marketingData[category][market]++;
            marketTotals[market]++;
          }
        });
      }
    }
  });

  // Create table data
  const tableData = [];
  const sortedMarkets = Array.from(allMarkets).sort();
  
  // Add rows for each marketing category
  Object.keys(marketingData).forEach(category => {
    const categoryData = marketingData[category];
    const categoryTotal = Object.values(categoryData).reduce((sum, count) => sum + count, 0);
    
    if (categoryTotal > 0) {
      const row = {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        total: categoryTotal
      };
      
      // Add market columns with percentages
      sortedMarkets.forEach(market => {
        const marketCount = categoryData[market] || 0;
        const percentage = categoryTotal > 0 ? Math.round((marketCount / categoryTotal) * 100) : 0;
        row[market] = `${marketCount} (${percentage}%)`;
      });
      
      tableData.push(row);
    }
  });

  // Add grand total row
  const grandTotal = Object.values(marketTotals).reduce((sum, count) => sum + count, 0);
  if (grandTotal > 0) {
    const grandTotalRow = {
      category: "Grand Total",
      total: grandTotal,
      bold: true,
      highlight: true
    };
    
    sortedMarkets.forEach(market => {
      const marketTotal = marketTotals[market] || 0;
      const percentage = grandTotal > 0 ? Math.round((marketTotal / grandTotal) * 100) : 0;
      grandTotalRow[market] = `${marketTotal} (${percentage}%)`;
    });
    
    tableData.push(grandTotalRow);
  }

  // Create table columns
  const tableColumns = [
    { key: "category", header: "Marketing Category", align: "left" },
    { key: "total", header: "Total Tasks", align: "center", highlight: true }
  ];
  
  // Add market columns
  sortedMarkets.forEach(market => {
    tableColumns.push({
      key: market,
      header: market.toUpperCase(),
      align: "center"
    });
  });

  // Calculate totals for casino marketing
  const casinoTotalTasks = Object.values(marketingData.casino).reduce((sum, count) => sum + count, 0);
  const casinoTotalHours = tasks
    .filter(task => {
      const products = task.data_task?.products || task.products;
      return typeof products === 'string' && products.includes('marketing') && products.includes('casino');
    })
    .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);

  // Calculate totals for sport marketing
  const sportTotalTasks = Object.values(marketingData.sport).reduce((sum, count) => sum + count, 0);
  const sportTotalHours = tasks
    .filter(task => {
      const products = task.data_task?.products || task.products;
      return typeof products === 'string' && products.includes('marketing') && products.includes('sport');
    })
    .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);

  // Create chart data for casino marketing
  const casinoMarketingData = addConsistentColors(
    sortedMarkets.map(market => ({
      name: market.toUpperCase(),
      value: marketingData.casino[market] || 0
    })).filter(item => item.value > 0),
    'market'
  );

  // Create chart data for sport marketing
  const sportMarketingData = addConsistentColors(
    sortedMarkets.map(market => ({
      name: market.toUpperCase(),
      value: marketingData.sport[market] || 0
    })).filter(item => item.value > 0),
    'market'
  );

  // Create biaxial chart data for casino marketing
  const casinoBiaxialData = addConsistentColors(
    sortedMarkets.map(market => {
      const marketTasks = marketingData.casino[market] || 0;
      const marketHours = tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          const taskMarkets = task.data_task?.markets || task.markets || [];
          return typeof products === 'string' && 
                 products.includes('marketing') && 
                 products.includes('casino') &&
                 taskMarkets.includes(market);
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
      
      return {
        name: market.toUpperCase(),
        tasks: marketTasks,
        hours: Math.round(marketHours * 100) / 100,
      };
    }).filter(item => item.tasks > 0),
    'market'
  );

  // Create biaxial chart data for sport marketing
  const sportBiaxialData = addConsistentColors(
    sortedMarkets.map(market => {
      const marketTasks = marketingData.sport[market] || 0;
      const marketHours = tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          const taskMarkets = task.data_task?.markets || task.markets || [];
          return typeof products === 'string' && 
                 products.includes('marketing') && 
                 products.includes('sport') &&
                 taskMarkets.includes(market);
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
      
      return {
        name: market.toUpperCase(),
        tasks: marketTasks,
        hours: Math.round(marketHours * 100) / 100,
      };
    }).filter(item => item.tasks > 0),
    'market'
  );

  return {
    tableData,
    tableColumns,
    casinoMarketingData,
    sportMarketingData,
    casinoBiaxialData,
    sportBiaxialData,
    casinoTotalTasks,
    casinoTotalHours,
    sportTotalTasks,
    sportTotalHours
  };
};

// Get marketing analytics card props for direct use with MarketingAnalyticsCard
export const getMarketingAnalyticsCardProps = (tasks, isLoading = false) => {
  const calculatedData = calculateMarketingAnalyticsData(tasks);
  
  return {
    title: "Marketing Analytics",
    marketingTableData: calculatedData.tableData,
    marketingTableColumns: calculatedData.tableColumns,
    casinoMarketingData: calculatedData.casinoMarketingData,
    casinoMarketingTitle: `Casino Marketing by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoMarketingColors: calculatedData.casinoMarketingData.map(item => item.color),
    sportMarketingData: calculatedData.sportMarketingData,
    sportMarketingTitle: `Sport Marketing by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportMarketingColors: calculatedData.sportMarketingData.map(item => item.color),
    casinoBiaxialData: calculatedData.casinoBiaxialData,
    casinoBiaxialTitle: `Casino Marketing Tasks & Hours by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    casinoBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    sportBiaxialData: calculatedData.sportBiaxialData,
    sportBiaxialTitle: `Sport Marketing Tasks & Hours by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    sportBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    isLoading
  };
};

// Simplified version without caching
export const getCachedMarketingAnalyticsCardProps = (tasks, month, isLoading = false) => {
  return getMarketingAnalyticsCardProps(tasks, isLoading);
};

// ============================================================================
// ACQUISITION ANALYTICS CONFIGURATION
// ============================================================================

// Acquisition-specific colors - using same colors as Marketing
export const ACQUISITION_CHART_COLORS = {
  CASINO: CHART_COLORS.DEFAULT,
  SPORT: CHART_COLORS.DEFAULT
};

/**
 * Calculate acquisition analytics data for table and charts
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Acquisition analytics data object
 */
export const calculateAcquisitionAnalyticsData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [{
        category: "No data available",
        total: 0,
        noData: true
      }],
      tableColumns: [
        { key: "category", header: "Acquisition Category", align: "left" },
        { key: "total", header: "Total Tasks", align: "center", highlight: true }
      ],
      casinoAcquisitionData: [{ name: "No data available", value: 0 }],
      sportAcquisitionData: [{ name: "No data available", value: 0 }],
      casinoBiaxialData: [{ name: "No data available", tasks: 0, hours: 0, color: "#6b7280" }],
      sportBiaxialData: [{ name: "No data available", tasks: 0, hours: 0, color: "#6b7280" }],
      casinoTotalTasks: 0,
      casinoTotalHours: 0,
      sportTotalTasks: 0,
      sportTotalHours: 0
    };
  }

  // Initialize data structures
  const acquisitionData = {
    casino: {},
    sport: {},
    poker: {},
    lotto: {}
  };
  
  const marketTotals = {};
  const allMarkets = new Set();

  // Process tasks to extract acquisition data
  tasks.forEach(task => {
    const products = task.data_task?.products || task.products;
    const markets = task.data_task?.markets || task.markets || [];
    
    if (!products || !Array.isArray(markets) || markets.length === 0) return;

    // Check if it's an acquisition task (products is a string)
    if (typeof products === 'string' && products.includes('acquisition')) {
      // Determine acquisition category
      let category = null;
      if (products.includes('casino')) category = 'casino';
      else if (products.includes('sport')) category = 'sport';
      else if (products.includes('poker')) category = 'poker';
      else if (products.includes('lotto')) category = 'lotto';
      
      if (category) {
        // Process each market for this task
        markets.forEach(market => {
          if (market) {
            allMarkets.add(market);
            
            // Initialize data structures
            if (!acquisitionData[category][market]) {
              acquisitionData[category][market] = 0;
            }
            if (!marketTotals[market]) {
              marketTotals[market] = 0;
            }
            
            // Count tasks
            acquisitionData[category][market]++;
            marketTotals[market]++;
          }
        });
      }
    }
  });

  // Create table data
  const tableData = [];
  const sortedMarkets = Array.from(allMarkets).sort();
  
  // Add rows for each acquisition category
  Object.keys(acquisitionData).forEach(category => {
    const categoryData = acquisitionData[category];
    const categoryTotal = Object.values(categoryData).reduce((sum, count) => sum + count, 0);
    
    if (categoryTotal > 0) {
      const row = {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        total: categoryTotal
      };
      
      // Add market columns with percentages
      sortedMarkets.forEach(market => {
        const marketCount = categoryData[market] || 0;
        const percentage = categoryTotal > 0 ? Math.round((marketCount / categoryTotal) * 100) : 0;
        row[market] = `${marketCount} (${percentage}%)`;
      });
      
      tableData.push(row);
    }
  });

  // Add grand total row
  const grandTotal = Object.values(marketTotals).reduce((sum, count) => sum + count, 0);
  if (grandTotal > 0) {
    const grandTotalRow = {
      category: "Grand Total",
      total: grandTotal,
      bold: true,
      highlight: true
    };
    
    sortedMarkets.forEach(market => {
      const marketTotal = marketTotals[market] || 0;
      const percentage = grandTotal > 0 ? Math.round((marketTotal / grandTotal) * 100) : 0;
      grandTotalRow[market] = `${marketTotal} (${percentage}%)`;
    });
    
    tableData.push(grandTotalRow);
  }

  // Create table columns
  const tableColumns = [
    { key: "category", header: "Acquisition Category", align: "left" },
    { key: "total", header: "Total Tasks", align: "center", highlight: true }
  ];
  
  // Add market columns
  sortedMarkets.forEach(market => {
    tableColumns.push({
      key: market,
      header: market.toUpperCase(),
      align: "center"
    });
  });

  // Calculate totals for casino acquisition
  const casinoTotalTasks = Object.values(acquisitionData.casino).reduce((sum, count) => sum + count, 0);
  const casinoTotalHours = tasks
    .filter(task => {
      const products = task.data_task?.products || task.products;
      return typeof products === 'string' && products.includes('acquisition') && products.includes('casino');
    })
    .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);

  // Calculate totals for sport acquisition
  const sportTotalTasks = Object.values(acquisitionData.sport).reduce((sum, count) => sum + count, 0);
  const sportTotalHours = tasks
    .filter(task => {
      const products = task.data_task?.products || task.products;
      return typeof products === 'string' && products.includes('acquisition') && products.includes('sport');
    })
    .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);

  // Create chart data for casino acquisition
  const casinoAcquisitionData = addConsistentColors(
    sortedMarkets.map(market => ({
      name: market.toUpperCase(),
      value: acquisitionData.casino[market] || 0
    })).filter(item => item.value > 0),
    'market'
  );

  // Create chart data for sport acquisition
  const sportAcquisitionData = addConsistentColors(
    sortedMarkets.map(market => ({
      name: market.toUpperCase(),
      value: acquisitionData.sport[market] || 0
    })).filter(item => item.value > 0),
    'market'
  );

  // Create biaxial chart data for casino acquisition
  const casinoBiaxialData = addConsistentColors(
    sortedMarkets.map(market => {
      const marketTasks = acquisitionData.casino[market] || 0;
      const marketHours = tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          const taskMarkets = task.data_task?.markets || task.markets || [];
          return typeof products === 'string' && 
                 products.includes('acquisition') && 
                 products.includes('casino') &&
                 taskMarkets.includes(market);
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
      
      return {
        name: market.toUpperCase(),
        tasks: marketTasks,
        hours: Math.round(marketHours * 100) / 100,
      };
    }).filter(item => item.tasks > 0),
    'market'
  );

  // Create biaxial chart data for sport acquisition
  const sportBiaxialData = addConsistentColors(
    sortedMarkets.map(market => {
      const marketTasks = acquisitionData.sport[market] || 0;
      const marketHours = tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          const taskMarkets = task.data_task?.markets || task.markets || [];
          return typeof products === 'string' && 
                 products.includes('acquisition') && 
                 products.includes('sport') &&
                 taskMarkets.includes(market);
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
      
      return {
        name: market.toUpperCase(),
        tasks: marketTasks,
        hours: Math.round(marketHours * 100) / 100,
      };
    }).filter(item => item.tasks > 0),
    'market'
  );

  return {
    tableData,
    tableColumns,
    casinoAcquisitionData,
    sportAcquisitionData,
    casinoBiaxialData,
    sportBiaxialData,
    casinoTotalTasks,
    casinoTotalHours,
    sportTotalTasks,
    sportTotalHours
  };
};

// Get acquisition analytics card props for direct use with AcquisitionAnalyticsCard
export const getAcquisitionAnalyticsCardProps = (tasks, isLoading = false) => {
  const calculatedData = calculateAcquisitionAnalyticsData(tasks);
  
  return {
    title: "Acquisition Analytics",
    acquisitionTableData: calculatedData.tableData,
    acquisitionTableColumns: calculatedData.tableColumns,
    casinoAcquisitionData: calculatedData.casinoAcquisitionData,
    casinoAcquisitionTitle: `Casino Acquisition by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoAcquisitionColors: calculatedData.casinoAcquisitionData.map(item => item.color),
    sportAcquisitionData: calculatedData.sportAcquisitionData,
    sportAcquisitionTitle: `Sport Acquisition by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportAcquisitionColors: calculatedData.sportAcquisitionData.map(item => item.color),
    casinoBiaxialData: calculatedData.casinoBiaxialData,
    casinoBiaxialTitle: `Casino Acquisition Tasks & Hours by Markets (${calculatedData.casinoTotalTasks} tasks, ${calculatedData.casinoTotalHours}h)`,
    casinoBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    casinoBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    sportBiaxialData: calculatedData.sportBiaxialData,
    sportBiaxialTitle: `Sport Acquisition Tasks & Hours by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    sportBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    isLoading
  };
};

// Simplified version without caching
export const getCachedAcquisitionAnalyticsCardProps = (tasks, month, isLoading = false) => {
  return getAcquisitionAnalyticsCardProps(tasks, isLoading);
};

// ============================================================================
// PRODUCT ANALYTICS CONFIGURATION
// ============================================================================

// Product-specific colors - using same colors as Markets by Users
export const PRODUCT_CHART_COLORS = {
  MARKETING: CHART_COLORS.DEFAULT,
  ACQUISITION: CHART_COLORS.DEFAULT,
  PRODUCT: CHART_COLORS.DEFAULT,
  MISC: CHART_COLORS.DEFAULT
};

/**
 * Calculate product analytics data for table and charts
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Product analytics data object
 */
export const calculateProductAnalyticsData = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [{
        category: "No data available",
        total: 0,
        totalHours: 0,
        percentage: 0,
        noData: true
      }],
      tableColumns: [
        { key: "category", header: "Product Category", align: "left" },
        { key: "total", header: "Task Count", align: "center", highlight: true },
        { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
        { key: "percentage", header: "Percentage", align: "center", highlight: true }
      ],
      categoryPieData: [{ name: "No data available", value: 0, percentage: 0 }],
      productPieData: [{ name: "No data available", value: 0, color: "#6b7280" }],
      biaxialData: [{ name: "No data available", tasks: 0, hours: 0, color: "#6b7280" }],
      categoryTotals: {
        marketing: 0,
        acquisition: 0,
        product: 0,
        misc: 0
      }
    };
  }

  // Initialize product counts
  const productCounts = {
    'marketing casino': 0,
    'marketing sport': 0,
    'marketing poker': 0,
    'marketing lotto': 0,
    'acquisition casino': 0,
    'acquisition sport': 0,
    'acquisition poker': 0,
    'acquisition lotto': 0,
    'product casino': 0,
    'product sport': 0,
    'product poker': 0,
    'product lotto': 0,
    'misc': 0
  };

  // Count tasks by product - only include "product" category tasks
  tasks.forEach(task => {
    const products = task.data_task?.products || task.products;
    
    if (!products) {
      return; // Skip tasks without products
    }

    const productsLower = products.toLowerCase().trim();
    
    // Only count tasks that start with "product" (product casino, product sport, etc.)
    if (productsLower.startsWith('product ')) {
      if (productCounts.hasOwnProperty(productsLower)) {
        productCounts[productsLower]++;
      }
    }
    // Skip marketing, acquisition, and other categories
  });

  // Calculate totals for only "product" category tasks
  const filteredTasks = tasks.filter(task => {
    const products = task.data_task?.products || task.products;
    if (!products) return false;
    const productsLower = products.toLowerCase().trim();
    return productsLower.startsWith('product ');
  });
  
  const totalTasks = filteredTasks.length;
  
  // Calculate total hours only for filtered tasks
  const totalHours = filteredTasks.reduce((sum, task) => {
    return sum + (task.data_task?.timeInHours || task.timeInHours || 0);
  }, 0);

  // Calculate category totals (only product categories)
  const categoryTotals = {
    'product casino': productCounts['product casino'],
    'product sport': productCounts['product sport'],
    'product poker': productCounts['product poker'],
    'product lotto': productCounts['product lotto']
  };

  // Create table data for product categories only (only show categories with data)
  const tableData = [];
  
  // Only add categories that have actual data
  if (categoryTotals['product casino'] > 0) {
    tableData.push({
      category: 'Product Casino',
      total: categoryTotals['product casino'],
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === 'product casino';
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals['product casino'] / totalTasks) * 100) : 0,
      details: {
        'product casino': productCounts['product casino']
      }
    });
  }
  
  if (categoryTotals['product sport'] > 0) {
    tableData.push({
      category: 'Product Sport',
      total: categoryTotals['product sport'],
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === 'product sport';
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals['product sport'] / totalTasks) * 100) : 0,
      details: {
        'product sport': productCounts['product sport']
      }
    });
  }
  
  if (categoryTotals['product poker'] > 0) {
    tableData.push({
      category: 'Product Poker',
      total: categoryTotals['product poker'],
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === 'product poker';
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals['product poker'] / totalTasks) * 100) : 0,
      details: {
        'product poker': productCounts['product poker']
      }
    });
  }
  
  if (categoryTotals['product lotto'] > 0) {
    tableData.push({
      category: 'Product Lotto',
      total: categoryTotals['product lotto'],
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().trim() === 'product lotto';
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals['product lotto'] / totalTasks) * 100) : 0,
      details: {
        'product lotto': productCounts['product lotto']
      }
    });
  }
  
  // Add Total Tasks row only if there are any product tasks
  if (totalTasks > 0) {
    tableData.push({
      category: 'Total Tasks',
      total: totalTasks,
      totalHours: totalHours,
      percentage: 100
    });
  }

  // Create table columns
  const tableColumns = [
    {
      key: 'category',
      header: 'Product Category',
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {value}
        </span>
      )
    },
    {
      key: 'total',
      header: 'Task Count',
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">
          {value}
        </span>
      )
    },
    {
      key: 'totalHours',
      header: 'Total Hours',
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">
          {value}h
        </span>
      )
    },
    {
      key: 'percentage',
      header: 'Percentage',
      render: (value) => (
        <span className="text-gray-700 dark:text-gray-300">
          {value}%
        </span>
      )
    }
  ];

  // Create first pie chart data (categories with tasks - including misc)
  const categoryPieData = addConsistentColors(
    Object.entries(categoryTotals)
      .filter(([category, count]) => count > 0)
      .map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
      })),
    'product'
  );

  // Create second pie chart data (individual products with tasks - including misc)
  const productPieData = addConsistentColors(
    Object.entries(productCounts)
      .filter(([product, count]) => count > 0)
      .map(([product, count]) => ({
        name: product.charAt(0).toUpperCase() + product.slice(1),
        value: count,
      })),
    'product'
  );

  // Create biaxial chart data for product analytics (including misc)
  const biaxialData = addConsistentColors(
    Object.entries(productCounts)
      .filter(([product, count]) => count > 0)
      .map(([product, count]) => {
        const productHours = tasks
          .filter(task => {
            const products = task.data_task?.products || task.products;
            return products && products.toLowerCase().trim() === product;
          })
          .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
        
        return {
          name: product.charAt(0).toUpperCase() + product.slice(1),
          tasks: count,
          hours: Math.round(productHours * 100) / 100,
        };
      }),
    'product'
  );

  return {
    tableData,
    tableColumns,
    categoryPieData,
    productPieData,
    biaxialData,
    categoryTotals
  };
};

/**
 * Get product analytics card props
 * @param {Array} tasks - Array of task objects
 * @param {boolean} isLoading - Loading state
 * @returns {Object} Product analytics card props
 */
export const getProductAnalyticsCardProps = (tasks, isLoading = false) => {
  const productData = calculateProductAnalyticsData(tasks);
  
  // Use filtered totals from productData instead of all tasks
  const totalTasks = productData.tableData.find(row => row.category === 'Total Tasks')?.total || 0;
  const totalHours = productData.tableData.find(row => row.category === 'Total Tasks')?.totalHours || 0;
  
  // Split biaxial data into two charts (categories and products)
  const categoryBiaxialData = Object.entries(productData.categoryTotals || {})
    .filter(([category, count]) => count > 0)
    .map(([category, count], index) => {
      const categoryHours = tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().includes(category);
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
      
      return {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        tasks: count,
        hours: Math.round(categoryHours * 100) / 100,
        color: CHART_COLORS.DEFAULT[index % CHART_COLORS.DEFAULT.length]
      };
    });

  return {
    title: "Product Analytics",
    productTableData: productData.tableData,
    productTableColumns: productData.tableColumns,
    categoryPieData: productData.categoryPieData,
    categoryPieTitle: `Product Categories (${totalTasks} tasks, ${totalHours}h)`,
    categoryPieColors: productData.categoryPieData.map(item => item.color),
    productPieData: productData.productPieData,
    productPieTitle: `Individual Products (${totalTasks} tasks, ${totalHours}h)`,
    productPieColors: productData.productPieData.map(item => item.color),
    categoryBiaxialData: categoryBiaxialData,
    categoryBiaxialTitle: `Product Categories Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    categoryBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    categoryBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    productBiaxialData: productData.biaxialData,
    productBiaxialTitle: `Individual Products Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    productBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    className: "",
    isLoading
  };
};

// Simplified version without caching
export const getCachedProductAnalyticsCardProps = (tasks, month, isLoading = false) => {
  return getProductAnalyticsCardProps(tasks, isLoading);
};

// Cache management utilities removed for simplicity

// ============================================================================
// AI ANALYTICS CONFIGURATION
// ============================================================================

// AI-specific colors
export const AI_CHART_COLORS = {
  MODELS: CHART_COLORS.DEFAULT,
  USERS: CHART_COLORS.USER_BY_TASK
};

/**
 * Calculate AI analytics data for table and charts
 * @param {Array} tasks - Array of task objects
 * @param {Array} users - Array of user objects
 * @returns {Object} AI analytics data object
 */
export const calculateAIAnalyticsData = (tasks, users) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [{
        user: "No data available",
        totalTasks: 0,
        aiUsedTasks: 0,
        aiTime: 0,
        aiModels: "No data available",
        markets: "No data available",
        products: "No data available",
        aiUsagePercentage: 0,
        noData: true
      }],
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
        { key: "aiUsedTasks", header: "AI Used Tasks", align: "center", highlight: true },
        { key: "aiTime", header: "AI Time (hrs)", align: "center", highlight: true },
        { key: "aiUsagePercentage", header: "AI Usage %", align: "center", highlight: true },
        { 
          key: "aiModels", 
          header: "AI Models Used", 
          align: "left",
          render: (value, row) => {
            if (!value || value === "No data available") return value;
            const aiModels = value.split(', ').filter(m => m.trim());
            return (
              <div className="flex flex-wrap gap-1">
                {aiModels.map((model, index) => (
                  <Badge key={index} color="purple" size="sm">
                    {model}
                  </Badge>
                ))}
              </div>
            );
          }
        },
        { 
          key: "markets", 
          header: "Markets", 
          align: "left",
          render: (value, row) => {
            if (!value || value === "No data available") return value;
            const markets = value.split(', ').filter(m => m.trim());
            return (
              <div className="flex flex-wrap gap-1">
                {markets.map((market, index) => (
                  <Badge key={index} color="amber" size="sm">
                    {market}
                  </Badge>
                ))}
              </div>
            );
          }
        },
        { 
          key: "products", 
          header: "Products", 
          align: "left",
          render: (value, row) => {
            if (!value || value === "No data available") return value;
            const products = value.split(', ').filter(p => p.trim());
            return (
              <div className="flex flex-wrap gap-1">
                {products.map((product, index) => (
                  <Badge key={index} color="blue" size="sm">
                    {product}
                  </Badge>
                ))}
              </div>
            );
          }
        }
      ],
      aiModelsData: [{ name: "No data available", value: 0 }],
      usersAIData: [{ name: "No data available", value: 0 }],
      usersBiaxialData: [{ name: "No data available", aiTime: 0, aiTasks: 0, color: "#6b7280" }],
      marketsAIData: [{ name: "No data available", value: 0 }],
      productsAIData: [{ name: "No data available", value: 0 }],
      marketsBiaxialData: [{ name: "No data available", aiTime: 0, aiTasks: 0, color: "#6b7280" }],
      productsBiaxialData: [{ name: "No data available", aiTime: 0, aiTasks: 0, color: "#6b7280" }]
    };
  }

  // Initialize data structures
  const userAIData = {};
  const aiModelCounts = {};
  const marketAICounts = {};
  const productAICounts = {};
  const allUsers = new Set();
  const allAIModels = new Set();
  const allMarkets = new Set();
  const allProducts = new Set();

  // Check if there are any tasks with AI usage
  const hasAIUsage = tasks.some(task => {
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    return aiUsed && aiUsed.length > 0;
  });

  if (!hasAIUsage) {
    return {
      tableData: [{
        user: "No AI usage data available",
        totalTasks: tasks.length,
        aiUsedTasks: 0,
        aiTime: 0,
        aiModels: "No AI usage found",
        markets: "No AI usage found",
        products: "No AI usage found",
        aiUsagePercentage: 0,
        noData: true
      }],
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
        { key: "aiUsedTasks", header: "AI Used Tasks", align: "center", highlight: true },
        { key: "aiTime", header: "AI Time (hrs)", align: "center", highlight: true },
        { key: "aiUsagePercentage", header: "AI Usage %", align: "center", highlight: true },
        { key: "aiModels", header: "AI Models Used", align: "left" },
        { key: "markets", header: "Markets", align: "left" },
        { key: "products", header: "Products", align: "left" }
      ],
      aiModelsData: [{ name: "No AI usage found", value: 0 }],
      usersAIData: [{ name: "No AI usage found", value: 0 }],
      usersBiaxialData: [{ name: "No AI usage found", aiTime: 0, aiTasks: 0, color: "#6b7280" }],
      marketsAIData: [{ name: "No AI usage found", value: 0 }],
      productsAIData: [{ name: "No AI usage found", value: 0 }],
      marketsBiaxialData: [{ name: "No AI usage found", aiTime: 0, aiTasks: 0, color: "#6b7280" }],
      productsBiaxialData: [{ name: "No AI usage found", aiTime: 0, aiTasks: 0, color: "#6b7280" }]
    };
  }

  // Process tasks to extract AI usage data
  tasks.forEach(task => {
    const userId = task.userUID || task.createbyUID;
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    const markets = task.data_task?.markets || task.markets || [];
    const products = task.data_task?.products || task.products || '';
    
    if (!userId || !aiUsed || aiUsed.length === 0) return;

    allUsers.add(userId);
    
    // Initialize user data if not exists
    if (!userAIData[userId]) {
      userAIData[userId] = {
        totalTasks: 0,
        totalAITime: 0,
        aiModels: new Set(),
        aiUsedCount: 0,
        markets: new Set(),
        products: new Set()
      };
    }

    // Count tasks with AI usage
    userAIData[userId].totalTasks += 1;
    userAIData[userId].aiUsedCount += aiUsed.length;

    // Add markets and products to user's sets and global sets
    if (Array.isArray(markets)) {
      markets.forEach(market => {
        if (market) {
          allMarkets.add(market);
          userAIData[userId].markets.add(market);
        }
      });
    }

    if (products && typeof products === 'string') {
      allProducts.add(products);
      userAIData[userId].products.add(products);
    }

    // Process each AI usage entry
    aiUsed.forEach(ai => {
      const aiTime = ai.aiTime || 0;
      const aiModels = ai.aiModels || [];
      
      userAIData[userId].totalAITime += aiTime;
      
      // Add AI models to user's set
      aiModels.forEach(model => {
        allAIModels.add(model);
        userAIData[userId].aiModels.add(model);
        aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
      });
    });
  });

  // Create table data
  const tableData = Array.from(allUsers).map(userId => {
    const user = users.find(u => (u.id || u.uid || u.userUID) === userId);
    const userName = user?.name || user?.email || `User ${userId.slice(0, 8)}`;
    const userData = userAIData[userId];
    
    return {
      user: userName,
      totalTasks: userData.totalTasks,
      aiUsedTasks: userData.aiUsedCount,
      aiTime: Math.round(userData.totalAITime * 100) / 100,
      aiModels: Array.from(userData.aiModels).join(', '),
      markets: Array.from(userData.markets).join(', '),
      products: Array.from(userData.products).join(', '),
      aiUsagePercentage: userData.totalTasks > 0 ? 
        Math.round((userData.aiUsedCount / userData.totalTasks) * 100) : 0
    };
  });

  // Sort by AI time descending
  tableData.sort((a, b) => b.aiTime - a.aiTime);

  // Add grand total row
  const grandTotal = {
    user: "Grand Total",
    totalTasks: tableData.reduce((sum, row) => sum + row.totalTasks, 0),
    aiUsedTasks: tableData.reduce((sum, row) => sum + row.aiUsedTasks, 0),
    aiTime: Math.round(tableData.reduce((sum, row) => sum + row.aiTime, 0) * 100) / 100,
    aiModels: Array.from(allAIModels).join(', '),
    markets: Array.from(allMarkets).join(', '),
    products: Array.from(allProducts).join(', '),
    aiUsagePercentage: 0,
    bold: true,
    highlight: true
  };

  // Calculate grand total percentage
  if (grandTotal.totalTasks > 0) {
    grandTotal.aiUsagePercentage = Math.round((grandTotal.aiUsedTasks / grandTotal.totalTasks) * 100);
  }

  tableData.push(grandTotal);

  // Create table columns
  const tableColumns = [
    { key: "user", header: "User", align: "left" },
    { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
    { key: "aiUsedTasks", header: "AI Used Tasks", align: "center", highlight: true },
    { key: "aiTime", header: "AI Time (hrs)", align: "center", highlight: true },
    { key: "aiUsagePercentage", header: "AI Usage %", align: "center", highlight: true },
    { 
      key: "aiModels", 
      header: "AI Models Used", 
      align: "left",
      render: (value, row) => {
        if (!value || value === "No data available") return value;
        const aiModels = value.split(', ').filter(m => m.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {aiModels.map((model, index) => (
              <Badge key={index} colorHex={CARD_SYSTEM.COLOR_HEX_MAP.purple} size="xs">
                {model}
              </Badge>
            ))}
          </div>
        );
      }
    },
    { 
      key: "markets", 
      header: "Markets", 
      align: "left",
      render: (value, row) => {
        if (!value || value === "No data available") return value;
        const markets = value.split(', ').filter(m => m.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {markets.map((market, index) => (
              <Badge key={index} colorHex={CARD_SYSTEM.COLOR_HEX_MAP.amber} size="xs">
                {market}
              </Badge>
            ))}
          </div>
        );
      }
    },
    { 
      key: "products", 
      header: "Products", 
      align: "left",
      render: (value, row) => {
        if (!value || value === "No data available") return value;
        const products = value.split(', ').filter(p => p.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {products.map((product, index) => (
              <Badge key={index} colorHex={CARD_SYSTEM.COLOR_HEX_MAP.blue} size="xs">
                {product}
              </Badge>
            ))}
          </div>
        );
      }
    }
  ];

  // Create AI models pie chart data
  const aiModelsData = addConsistentColors(
    Array.from(allAIModels).map(model => ({
      name: model,
      value: aiModelCounts[model] || 0
    })).sort((a, b) => b.value - a.value),
    'aiModel'
  );

  // Create users AI usage pie chart data
  const usersAIData = addConsistentColors(
    tableData
      .filter(row => !row.bold) // Exclude grand total row
      .map(row => ({
        name: row.user,
        value: row.aiTime
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10), // Show top 10 users
    'user'
  );

  // Create users biaxial chart data (AI time vs AI tasks)
  const usersBiaxialData = addConsistentColors(
    tableData
      .filter(row => !row.bold) // Exclude grand total row
      .map(row => ({
        name: row.user,
        tasks: row.aiUsedTasks,
        hours: row.aiTime,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10), // Show top 10 users
    'user'
  );

  // Create markets AI usage pie chart data
  const marketsAIData = addConsistentColors(
    Array.from(allMarkets).map(market => {
      // Count tasks that have AI usage and include this market
      const marketAICount = tasks.filter(task => {
        const taskMarkets = task.data_task?.markets || task.markets || [];
        const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
        return taskMarkets.includes(market) && aiUsed.length > 0;
      }).length;
      
      return {
        name: market,
        value: marketAICount
      };
    }).filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value),
    'market'
  );

  // Create products AI usage pie chart data
  const productsAIData = addConsistentColors(
    Array.from(allProducts).map(product => {
      // Count tasks that have AI usage and match this product
      const productAICount = tasks.filter(task => {
        const taskProducts = task.data_task?.products || task.products || '';
        const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
        return taskProducts === product && aiUsed.length > 0;
      }).length;
      
      return {
        name: product,
        value: productAICount
      };
    }).filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value),
    'product'
  );

  // Create markets biaxial chart data (AI usage by market)
  const marketsBiaxialData = addConsistentColors(
    Array.from(allMarkets).map(market => {
      // Count tasks that have AI usage and include this market
      const marketAICount = tasks.filter(task => {
        const taskMarkets = task.data_task?.markets || task.markets || [];
        const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
        return taskMarkets.includes(market) && aiUsed.length > 0;
      }).length;
      
      // Calculate total AI time for this market
      const marketAITime = tasks
        .filter(task => {
          const taskMarkets = task.data_task?.markets || task.markets || [];
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return taskMarkets.includes(market) && aiUsed.length > 0;
        })
        .reduce((sum, task) => {
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiTime || 0), 0);
        }, 0);

      return {
        name: market,
        tasks: marketAICount,
        hours: Math.round(marketAITime * 100) / 100,
      };
    }).filter(item => item.tasks > 0)
      .sort((a, b) => b.tasks - a.tasks),
    'market'
  );

  // Create products biaxial chart data (AI usage by product)
  const productsBiaxialData = addConsistentColors(
    Array.from(allProducts).map(product => {
      // Count tasks that have AI usage and match this product
      const productAICount = tasks.filter(task => {
        const taskProducts = task.data_task?.products || task.products || '';
        const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
        return taskProducts === product && aiUsed.length > 0;
      }).length;
      
      // Calculate total AI time for this product
      const productAITime = tasks
        .filter(task => {
          const taskProducts = task.data_task?.products || task.products || '';
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return taskProducts === product && aiUsed.length > 0;
        })
        .reduce((sum, task) => {
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiTime || 0), 0);
        }, 0);

      return {
        name: product,
        tasks: productAICount,
        hours: Math.round(productAITime * 100) / 100,
      };
    }).filter(item => item.tasks > 0)
      .sort((a, b) => b.tasks - a.tasks),
    'product'
  );

  return {
    tableData,
    tableColumns,
    aiModelsData,
    usersAIData,
    usersBiaxialData,
    marketsAIData,
    productsAIData,
    marketsBiaxialData,
    productsBiaxialData
  };
};

/**
 * Get AI analytics card props for direct use with AIAnalyticsCard
 * @param {Array} tasks - Array of task objects
 * @param {Array} users - Array of user objects
 * @param {boolean} isLoading - Loading state
 * @returns {Object} AI analytics card props
 */
export const getAIAnalyticsCardProps = (tasks, users, isLoading = false) => {
  const calculatedData = calculateAIAnalyticsData(tasks, users);
  
  // Calculate totals for chart titles
  const totalTasks = tasks?.length || 0;
  const totalAITime = tasks?.reduce((sum, task) => {
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    return sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiTime || 0), 0);
  }, 0) || 0;
  
  return {
    title: "AI Usage Analytics",
    aiTableData: calculatedData.tableData,
    aiTableColumns: calculatedData.tableColumns,
    aiModelsData: calculatedData.aiModelsData,
    aiModelsTitle: `AI Models Usage (${totalTasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    aiModelsColors: calculatedData.aiModelsData.map(item => item.color),
    usersAIData: calculatedData.usersAIData,
    usersAITitle: `Users by AI Time (${totalTasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    usersAIColors: calculatedData.usersAIData.map(item => item.color),
    usersBiaxialData: calculatedData.usersBiaxialData,
    usersBiaxialTitle: `Users: AI Time & AI Tasks (${totalTasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    usersBiaxialTimeColor: CHART_COLORS.DEFAULT[0],
    usersBiaxialTasksColor: CHART_COLORS.DEFAULT[1],
    marketsAIData: calculatedData.marketsAIData,
    marketsAITitle: `Markets AI Usage (${totalTasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    marketsAIColors: calculatedData.marketsAIData.map(item => item.color),
    productsAIData: calculatedData.productsAIData,
    productsAITitle: `Products AI Usage (${totalTasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    productsAIColors: calculatedData.productsAIData.map(item => item.color),
    marketsBiaxialData: calculatedData.marketsBiaxialData,
    marketsBiaxialTitle: `Markets: AI Tasks & AI Time (${totalTasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    marketsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    marketsBiaxialTimeColor: CHART_COLORS.DEFAULT[1],
    productsBiaxialData: calculatedData.productsBiaxialData,
    productsBiaxialTitle: `Products: AI Tasks & AI Time (${totalTasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    productsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productsBiaxialTimeColor: CHART_COLORS.DEFAULT[1],
    isLoading
  };
};

// Simplified version without caching
export const getCachedAIAnalyticsCardProps = (tasks, users, month, isLoading = false) => {
  return getAIAnalyticsCardProps(tasks, users, isLoading);
};

// ============================================================================
// REPORTER ANALYTICS CONFIGURATION
// ============================================================================

/**
 * Calculate reporter analytics data for table and charts
 * @param {Array} tasks - Array of task objects
 * @param {Array} reporters - Array of reporter objects
 * @returns {Object} Reporter analytics data object
 */
export const calculateReporterAnalyticsData = (tasks, reporters) => {
  if (!tasks || tasks.length === 0) {
    return {
      reporterTableData: [{
        reporter: "No data available",
        totalTasks: 0,
        totalHours: 0,
        markets: "No data available",
        products: "No data available",
        noData: true
      }],
      reporterTableColumns: [
        { key: "reporter", header: "Reporter", align: "left" },
        { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
        { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
        { key: "markets", header: "Markets", align: "left" },
        { key: "products", header: "Products", align: "left" }
      ],
      reporterPieData: [{ name: "No data available", value: 0 }],
      reporterBiaxialData: [{ name: "No data available", tasks: 0, hours: 0, color: "#6b7280" }]
    };
  }

  // Initialize data structures
  const reporterData = {};
  const allReporters = new Set();

  // Process tasks to extract reporter data
  tasks.forEach(task => {
    // Check for reporter name and reporterUID in task data
    const reporterName = task.reporterName || task.data_task?.reporterName;
    const reporterUID = task.reporterUID || task.data_task?.reporterUID;
    const markets = task.data_task?.markets || task.markets || [];
    const products = task.data_task?.products || task.products || '';
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;

    // Use reporterUID as primary key, fallback to reporterName
    const reporterKey = reporterUID || reporterName;
    if (!reporterKey) return;

    allReporters.add(reporterKey);

    // Initialize reporter data
    if (!reporterData[reporterKey]) {
      reporterData[reporterKey] = {
        reporterName: reporterName || `Reporter ${reporterKey.slice(0, 8)}`,
        totalTasks: 0,
        totalHours: 0,
        markets: new Set(),
        products: new Set()
      };
    }

    reporterData[reporterKey].totalTasks += 1;
    reporterData[reporterKey].totalHours += timeInHours;

    // Process markets
    if (Array.isArray(markets)) {
      markets.forEach(market => {
        if (market) {
          reporterData[reporterKey].markets.add(market);
        }
      });
    }

    // Process products
    if (products && typeof products === 'string') {
      reporterData[reporterKey].products.add(products);
    }
  });

  // Create reporter table data
  const reporterTableData = Array.from(allReporters).map(reporterKey => {
    const data = reporterData[reporterKey];

    return {
      reporter: data.reporterName,
      totalTasks: data.totalTasks,
      totalHours: Math.round(data.totalHours * 100) / 100,
      markets: Array.from(data.markets).join(', '),
      products: Array.from(data.products).join(', ')
    };
  });

  // Sort by total tasks descending
  reporterTableData.sort((a, b) => b.totalTasks - a.totalTasks);

  // Add grand total row
  const grandTotal = {
    reporter: "Grand Total",
    totalTasks: reporterTableData.reduce((sum, row) => sum + row.totalTasks, 0),
    totalHours: Math.round(reporterTableData.reduce((sum, row) => sum + row.totalHours, 0) * 100) / 100,
    markets: "All Markets",
    products: "All Products",
    bold: true,
    highlight: true
  };
  reporterTableData.push(grandTotal);

  // Create table columns
  const reporterTableColumns = [
    { key: "reporter", header: "Reporter", align: "left" },
    { key: "totalTasks", header: "Total Tasks", align: "center", highlight: true },
    { key: "totalHours", header: "Total Hours", align: "center", highlight: true },
    { 
      key: "markets", 
      header: "Markets", 
      align: "left",
      render: (value, row) => {
        if (!value || value === "No data available" || value === "All Markets") return value;
        const markets = value.split(', ').filter(m => m.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {markets.map((market, index) => (
              <Badge key={index} color="amber" size="xs">
                {market}
              </Badge>
            ))}
          </div>
        );
      }
    },
    { 
      key: "products", 
      header: "Products", 
      align: "left",
      render: (value, row) => {
        if (!value || value === "No data available" || value === "All Products") return value;
        const products = value.split(', ').filter(p => p.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {products.map((product, index) => (
              <Badge key={index} color="orange" size="xs">
                {product}
              </Badge>
            ))}
          </div>
        );
      }
    }
  ];

  // Create chart data
  const reporterPieData = addConsistentColors(
    reporterTableData
      .filter(row => !row.bold) // Exclude grand total row
      .map(row => ({
        name: row.reporter,
        value: row.totalTasks
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10), // Show top 10 reporters
    'reporter'
  );

  const reporterBiaxialData = addConsistentColors(
    reporterTableData
      .filter(row => !row.bold) // Exclude grand total row
      .map(row => ({
        name: row.reporter,
        tasks: row.totalTasks,
        hours: row.totalHours
      }))
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 10), // Show top 10 reporters
    'reporter'
  );

  return {
    reporterTableData,
    reporterTableColumns,
    reporterPieData,
    reporterBiaxialData
  };
};

/**
 * Get reporter analytics card props for direct use with ReporterAnalyticsCard
 * @param {Array} tasks - Array of task objects
 * @param {Array} reporters - Array of reporter objects
 * @param {boolean} isLoading - Loading state
 * @returns {Object} Reporter analytics card props
 */
export const getReporterAnalyticsCardProps = (tasks, reporters, isLoading = false) => {
  const calculatedData = calculateReporterAnalyticsData(tasks, reporters);
  
  // Calculate totals for chart titles
  const totalTasks = tasks?.length || 0;
  const totalHours = tasks?.reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0) || 0;
  
  return {
    title: "Reporter Analytics",
    reporterTableData: calculatedData.reporterTableData,
    reporterTableColumns: calculatedData.reporterTableColumns,
    reporterPieData: calculatedData.reporterPieData,
    reporterPieTitle: `Reporter Metrics (${totalTasks} tasks, ${totalHours}h)`,
    reporterPieColors: calculatedData.reporterPieData.map(item => item.color),
    reporterBiaxialData: calculatedData.reporterBiaxialData,
    reporterBiaxialTitle: `Reporter Metrics: Tasks & Hours (${totalTasks} tasks, ${totalHours}h)`,
    reporterBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    reporterBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    isLoading
  };
};

// Simplified version without caching
export const getCachedReporterAnalyticsCardProps = (tasks, reporters, month, isLoading = false) => {
  return getReporterAnalyticsCardProps(tasks, reporters, isLoading);
};
