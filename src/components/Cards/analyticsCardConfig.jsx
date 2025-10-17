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
  
  // Calculate total tasks and hours for chart titles
  const totalTasks = tasks?.length || 0;
  const totalHours = tasks?.reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0) || 0;
  
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
    isLoading
  };
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
      tableData: [],
      tableColumns: [],
      casinoMarketingData: [],
      sportMarketingData: []
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
  const casinoMarketingData = sortedMarkets.map(market => ({
    name: market.toUpperCase(),
    value: marketingData.casino[market] || 0
  })).filter(item => item.value > 0);

  // Create chart data for sport marketing
  const sportMarketingData = sortedMarkets.map(market => ({
    name: market.toUpperCase(),
    value: marketingData.sport[market] || 0
  })).filter(item => item.value > 0);

  return {
    tableData,
    tableColumns,
    casinoMarketingData,
    sportMarketingData,
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
    casinoMarketingColors: MARKETING_CHART_COLORS.CASINO,
    sportMarketingData: calculatedData.sportMarketingData,
    sportMarketingTitle: `Sport Marketing by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportMarketingColors: MARKETING_CHART_COLORS.SPORT,
    isLoading
  };
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
      tableData: [],
      tableColumns: [],
      casinoAcquisitionData: [],
      sportAcquisitionData: []
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
  const casinoAcquisitionData = sortedMarkets.map(market => ({
    name: market.toUpperCase(),
    value: acquisitionData.casino[market] || 0
  })).filter(item => item.value > 0);

  // Create chart data for sport acquisition
  const sportAcquisitionData = sortedMarkets.map(market => ({
    name: market.toUpperCase(),
    value: acquisitionData.sport[market] || 0
  })).filter(item => item.value > 0);

  return {
    tableData,
    tableColumns,
    casinoAcquisitionData,
    sportAcquisitionData,
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
    casinoAcquisitionColors: ACQUISITION_CHART_COLORS.CASINO,
    sportAcquisitionData: calculatedData.sportAcquisitionData,
    sportAcquisitionTitle: `Sport Acquisition by Markets (${calculatedData.sportTotalTasks} tasks, ${calculatedData.sportTotalHours}h)`,
    sportAcquisitionColors: ACQUISITION_CHART_COLORS.SPORT,
    isLoading
  };
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
      tableData: [],
      tableColumns: [],
      pieData: [],
      barData: []
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

  // Count tasks by product
  tasks.forEach(task => {
    const products = task.data_task?.products || task.products;
    
    if (!products) {
      productCounts.misc++;
      return;
    }

    const productsLower = products.toLowerCase().trim();
    
    // Check if the product exists in our counts
    if (productCounts.hasOwnProperty(productsLower)) {
      productCounts[productsLower]++;
    } else {
      productCounts.misc++;
    }
  });

  const totalTasks = tasks.length;
  
  // Calculate total hours
  const totalHours = tasks.reduce((sum, task) => {
    return sum + (task.data_task?.timeInHours || task.timeInHours || 0);
  }, 0);

  // Calculate category totals
  const categoryTotals = {
    marketing: productCounts['marketing casino'] + productCounts['marketing sport'] + 
               productCounts['marketing poker'] + productCounts['marketing lotto'],
    acquisition: productCounts['acquisition casino'] + productCounts['acquisition sport'] + 
                 productCounts['acquisition poker'] + productCounts['acquisition lotto'],
    product: productCounts['product casino'] + productCounts['product sport'] + 
             productCounts['product poker'] + productCounts['product lotto'],
    misc: productCounts.misc
  };

  // Create table data
  const tableData = [
    {
      category: 'Marketing',
      total: categoryTotals.marketing,
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().includes('marketing');
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals.marketing / totalTasks) * 100) : 0,
      details: {
        'marketing casino': productCounts['marketing casino'],
        'marketing sport': productCounts['marketing sport'],
        'marketing poker': productCounts['marketing poker'],
        'marketing lotto': productCounts['marketing lotto']
      }
    },
    {
      category: 'Acquisition',
      total: categoryTotals.acquisition,
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().includes('acquisition');
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals.acquisition / totalTasks) * 100) : 0,
      details: {
        'acquisition casino': productCounts['acquisition casino'],
        'acquisition sport': productCounts['acquisition sport'],
        'acquisition poker': productCounts['acquisition poker'],
        'acquisition lotto': productCounts['acquisition lotto']
      }
    },
    {
      category: 'Product',
      total: categoryTotals.product,
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.toLowerCase().includes('product');
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals.product / totalTasks) * 100) : 0,
      details: {
        'product casino': productCounts['product casino'],
        'product sport': productCounts['product sport'],
        'product poker': productCounts['product poker'],
        'product lotto': productCounts['product lotto']
      }
    },
    {
      category: 'Miscellaneous',
      total: categoryTotals.misc,
      totalHours: tasks
        .filter(task => {
          const products = task.data_task?.products || task.products;
          return !products || (!products.toLowerCase().includes('marketing') && 
                               !products.toLowerCase().includes('acquisition') && 
                               !products.toLowerCase().includes('product'));
        })
        .reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0),
      percentage: totalTasks > 0 ? Math.round((categoryTotals.misc / totalTasks) * 100) : 0
    },
    {
      category: 'Total Tasks',
      total: totalTasks,
      totalHours: totalHours,
      percentage: 100
    }
  ];

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

  // Create pie chart data (only categories with tasks)
  const pieData = Object.entries(categoryTotals)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count,
      percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
    }));

  // Create bar chart data with individual products only (no Total Tasks)
  const barData = Object.entries(productCounts)
    .filter(([_, count]) => count > 0)
    .map(([product, count], index) => ({
      name: product.charAt(0).toUpperCase() + product.slice(1),
      tasks: count,
      color: CHART_COLORS.DEFAULT[index % CHART_COLORS.DEFAULT.length]
    }));

  return {
    tableData,
    tableColumns,
    pieData,
    barData
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
  
  // Calculate totals for chart titles
  const totalTasks = tasks?.length || 0;
  const totalHours = tasks?.reduce((sum, task) => sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0) || 0;
  
  return {
    title: "Product Analytics",
    productTableData: productData.tableData,
    productTableColumns: productData.tableColumns,
    productPieData: productData.pieData,
    productPieTitle: `Product Distribution (${totalTasks} tasks, ${totalHours}h)`,
    productPieColors: CHART_COLORS.DEFAULT,
    productBarData: productData.barData,
    productBarTitle: `Product Tasks (${totalTasks} tasks, ${totalHours}h)`,
    productBarColors: CHART_COLORS.DEFAULT,
    className: "",
    isLoading
  };
};
