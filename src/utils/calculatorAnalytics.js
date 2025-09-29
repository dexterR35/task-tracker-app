/**
 * Calculator Analytics - Reusable calculation functions for task data
 * Provides various calculation utilities for task analytics and data export
 * Includes extracted functions from analyticsUtils.js for enhanced functionality
 */

/**
 * Extract and calculate total tasks by category from monthly task data
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Category totals with detailed breakdown
 */
export const calculateTaskCategoryTotals = (tasks = []) => {

  const discoveredCategories = new Set();
  const discoveredProductTypes = new Set();
  
  // First pass: discover all unique categories and product types
  tasks.forEach(task => {
    const product = task.products;
    if (!product || typeof product !== 'string') {
      return;
    }

    const productLower = product.toLowerCase().trim();
    
    // Discover categories dynamically
    if (productLower.startsWith('prod')) {
      discoveredCategories.add('PROD');
    } else if (productLower.startsWith('acq')) {
      discoveredCategories.add('ACQ');
    } else if (productLower.startsWith('mkt')) {
      discoveredCategories.add('MKT');
    } else {
      discoveredCategories.add('MISC');
    }
    
    // Discover product types dynamically
    if (productLower.includes('casino')) discoveredProductTypes.add('casino');
    if (productLower.includes('sport')) discoveredProductTypes.add('sport');
    if (productLower.includes('poker')) discoveredProductTypes.add('poker');
    if (productLower.includes('lotto')) discoveredProductTypes.add('lotto');
  });

  // Initialize dynamic structures
  const categoryTotals = { total: 0 };
  const categoryBreakdown = {};
  
  // Initialize categories dynamically
  discoveredCategories.forEach(category => {
    categoryTotals[category] = 0;
    if (category !== 'MISC') {
      categoryBreakdown[category] = {};
      // Initialize product types for each category
      discoveredProductTypes.forEach(productType => {
        categoryBreakdown[category][productType] = 0;
      });
    } else {
      categoryBreakdown[category] = { count: 0 };
    }
  });

  const categoryDetails = [];

  // Second pass: process tasks and count
  tasks.forEach((task, index) => {
    try {
      const product = task.products;
      if (!product || typeof product !== 'string') {
        return;
      }

      const productLower = product.toLowerCase().trim();
      let category = 'MISC';
      let productType = '';

      // Determine category and product type dynamically
      if (productLower.startsWith('prod')) {
        category = 'PROD';
      } else if (productLower.startsWith('acq')) {
        category = 'ACQ';
      } else if (productLower.startsWith('mkt')) {
        category = 'MKT';
      } else {
        category = 'MISC';
      }

      // Determine product type dynamically
      if (productLower.includes('casino')) productType = 'casino';
      else if (productLower.includes('sport')) productType = 'sport';
      else if (productLower.includes('poker')) productType = 'poker';
      else if (productLower.includes('lotto')) productType = 'lotto';

      // Increment totals
      categoryTotals[category]++;
      categoryTotals.total++;

      // Increment breakdown dynamically
      if (category !== 'MISC' && productType && categoryBreakdown[category][productType] !== undefined) {
        categoryBreakdown[category][productType]++;
      } else if (category === 'MISC') {
        categoryBreakdown.MISC.count++;
      }

      // Store task details
      categoryDetails.push({
        id: task.id || `task-${index}`,
        taskName: task.taskName || 'Unknown Task',
        category,
        productType: productType || 'N/A',
        products: task.products,
        markets: task.markets || [],
        timeInHours: task.timeInHours || 0,
        reporters: task.reporters || 'Unknown'
      });

    } catch (error) {
      // Error processing task
    }
  });

  // Calculate percentages from 100% base
  const categoryPercentages = {};
  const breakdownPercentages = {};
  
  // Calculate category percentages from 100%
  Object.keys(categoryTotals).forEach(category => {
    if (category !== 'total' && categoryTotals.total > 0) {
      categoryPercentages[category] = (categoryTotals[category] / categoryTotals.total) * 100;
    } else {
      categoryPercentages[category] = 0;
    }
  });

  // Calculate breakdown percentages from 100% for each category
  Object.keys(categoryBreakdown).forEach(category => {
    if (category !== 'MISC') {
      breakdownPercentages[category] = {};
      const categoryTotal = categoryTotals[category] || 0;
      
      Object.keys(categoryBreakdown[category]).forEach(productType => {
        const productCount = categoryBreakdown[category][productType] || 0;
        breakdownPercentages[category][productType] = categoryTotal > 0 ? 
          (productCount / categoryTotal) * 100 : 0;
      });
    } else {
      breakdownPercentages[category] = { count: categoryPercentages[category] };
    }
  });

  return {
    totals: categoryTotals,
    breakdown: categoryBreakdown,
    percentages: {
      categories: categoryPercentages,
      breakdown: breakdownPercentages
    },
    details: categoryDetails,
    summary: {
      totalTasks: categoryTotals.total,
      totalPercentage: 100, // Always 100% as base
      categories: Array.from(discoveredCategories),
      productTypes: Array.from(discoveredProductTypes),
      hasData: categoryTotals.total > 0,
      lastUpdated: new Date().toISOString()
    }
  };
};

/**
 * Calculate time-based analytics for tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Time analytics data
 */
export const calculateTimeAnalytics = (tasks = []) => {
  const discoveredCategories = new Set();
  // First pass: discover all categories
  tasks.forEach(task => {
    const product = task.products?.toLowerCase() || '';
    if (product.startsWith('prod')) discoveredCategories.add('PROD');
    else if (product.startsWith('acq')) discoveredCategories.add('ACQ');
    else if (product.startsWith('mkt')) discoveredCategories.add('MKT');
    else discoveredCategories.add('MISC');
  });

  // Initialize dynamic structure
  const timeData = {
    totalHours: 0,
    averageHours: 0,
    categoryHours: {},
    timeDistribution: []
  };

  // Initialize category hours dynamically
  discoveredCategories.forEach(category => {
    timeData.categoryHours[category] = 0;
  });

  // Second pass: calculate hours
  tasks.forEach(task => {
    const hours = parseFloat(task.timeInHours) || 0;
    timeData.totalHours += hours;

    const product = task.products?.toLowerCase() || '';
    let category = 'MISC';
    
    if (product.startsWith('prod')) category = 'PROD';
    else if (product.startsWith('acq')) category = 'ACQ';
    else if (product.startsWith('mkt')) category = 'MKT';

    if (timeData.categoryHours[category] !== undefined) {
      timeData.categoryHours[category] += hours;
    }
  });

  timeData.averageHours = tasks.length > 0 ? timeData.totalHours / tasks.length : 0;

  // Create time distribution array dynamically with 100% base calculation
  Object.entries(timeData.categoryHours).forEach(([category, hours]) => {
    if (hours > 0) {
      timeData.timeDistribution.push({
        category,
        hours,
        percentage: timeData.totalHours > 0 ? (hours / timeData.totalHours) * 100 : 0
      });
    }
  });

  // Add percentage calculations from 100% base
  timeData.percentages = {
    totalHours: 100, // Base 100%
    categoryPercentages: {},
    averagePercentage: timeData.totalHours > 0 ? (timeData.averageHours / timeData.totalHours) * 100 : 0
  };

  // Calculate category percentages from 100%
  Object.entries(timeData.categoryHours).forEach(([category, hours]) => {
    timeData.percentages.categoryPercentages[category] = timeData.totalHours > 0 ? 
      (hours / timeData.totalHours) * 100 : 0;
  });

  return timeData;
};

/**
 * Calculate market distribution analytics
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Market analytics data
 */
export const calculateMarketAnalytics = (tasks = []) => {
  // Dynamically discover categories and markets from actual data
  const discoveredCategories = new Set();
  const discoveredMarkets = new Set();
  
  // First pass: discover all categories and markets
  tasks.forEach(task => {
    const product = task.products?.toLowerCase() || '';
    if (product.startsWith('prod')) discoveredCategories.add('PROD');
    else if (product.startsWith('acq')) discoveredCategories.add('ACQ');
    else if (product.startsWith('mkt')) discoveredCategories.add('MKT');
    else discoveredCategories.add('MISC');

    if (Array.isArray(task.markets)) {
      task.markets.forEach(market => {
        if (market && typeof market === 'string') {
          discoveredMarkets.add(market.toLowerCase().trim());
        }
      });
    }
  });

  // Initialize dynamic structure
  const marketData = {
    uniqueMarkets: new Set(),
    marketCounts: {},
    categoryMarkets: {}
  };

  // Initialize category markets dynamically
  discoveredCategories.forEach(category => {
    marketData.categoryMarkets[category] = {};
  });

  // Second pass: process markets
  tasks.forEach(task => {
    const product = task.products?.toLowerCase() || '';
    let category = 'MISC';
    
    if (product.startsWith('prod')) category = 'PROD';
    else if (product.startsWith('acq')) category = 'ACQ';
    else if (product.startsWith('mkt')) category = 'MKT';

    if (Array.isArray(task.markets)) {
      task.markets.forEach(market => {
        if (market && typeof market === 'string') {
          const marketLower = market.toLowerCase().trim();
          marketData.uniqueMarkets.add(marketLower);
          
          // Count by market
          marketData.marketCounts[marketLower] = (marketData.marketCounts[marketLower] || 0) + 1;
          
          // Count by category and market (dynamic)
          if (marketData.categoryMarkets[category] && !marketData.categoryMarkets[category][marketLower]) {
            marketData.categoryMarkets[category][marketLower] = 0;
          }
          if (marketData.categoryMarkets[category]) {
            marketData.categoryMarkets[category][marketLower]++;
          }
        }
      });
    }
  });

  // Calculate market percentages from 100% base
  const marketPercentages = {};
  const categoryMarketPercentages = {};
  
  // Calculate market percentages from 100%
  const totalMarketTasks = Object.values(marketData.marketCounts).reduce((sum, count) => sum + count, 0);
  Object.entries(marketData.marketCounts).forEach(([market, count]) => {
    marketPercentages[market] = totalMarketTasks > 0 ? (count / totalMarketTasks) * 100 : 0;
  });

  // Calculate category-market percentages from 100%
  Object.keys(marketData.categoryMarkets).forEach(category => {
    categoryMarketPercentages[category] = {};
    const categoryTotal = Object.values(marketData.categoryMarkets[category]).reduce((sum, count) => sum + count, 0);
    
    Object.entries(marketData.categoryMarkets[category]).forEach(([market, count]) => {
      categoryMarketPercentages[category][market] = categoryTotal > 0 ? (count / categoryTotal) * 100 : 0;
    });
  });

  return {
    ...marketData,
    uniqueMarkets: Array.from(marketData.uniqueMarkets),
    totalMarkets: marketData.uniqueMarkets.size,
    percentages: {
      totalMarkets: 100, // Base 100%
      marketPercentages,
      categoryMarketPercentages,
      totalMarketTasks
    }
  };
};


export const exportAnalyticsData = (tasks = []) => {
  const categoryData = calculateTaskCategoryTotals(tasks);
  const timeData = calculateTimeAnalytics(tasks);
  const marketData = calculateMarketAnalytics(tasks);

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalTasks: tasks.length,
      dataSource: 'useAppData',
      version: '1.0.0'
    },
    categories: categoryData,
    time: timeData,
    markets: marketData,
    summary: {
      totalTasks: categoryData.totals.total,
      totalHours: timeData.totalHours,
      uniqueMarkets: marketData.totalMarkets,
      categories: Object.keys(categoryData.totals).filter(key => key !== 'total'),
      hasData: categoryData.totals.total > 0
    }
  };
};

/**
 * Get specific category totals (convenience function)
 * @param {Array} tasks - Array of task objects
 * @param {string} category - Category to filter (PROD, ACQ, MKT, MISC, or 'ALL')
 * @returns {Object} Category-specific data
 */
export const getCategoryData = (tasks = [], category = 'ALL') => {
  const allData = calculateTaskCategoryTotals(tasks);
  
  if (category === 'ALL') {
    return allData;
  }

  // Check if category exists in the discovered categories
  const categoryExists = allData.summary.categories.includes(category);
  
  return {
    category,
    total: categoryExists ? (allData.totals[category] || 0) : 0,
    breakdown: categoryExists ? (allData.breakdown[category] || {}) : {},
    details: allData.details.filter(task => task.category === category),
    percentage: allData.totals.total > 0 && categoryExists ? 
      ((allData.totals[category] || 0) / allData.totals.total) * 100 : 0,
    exists: categoryExists
  };
};


export const formatForExport = (analyticsData, format = 'json') => {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(analyticsData, null, 2);
    
    case 'csv':
      const csvRows = [];
      csvRows.push('Category,Total,Percentage');
      Object.entries(analyticsData.categories.totals).forEach(([key, value]) => {
        if (key !== 'total') {
          const percentage = analyticsData.categories.totals.total > 0 ? 
            (value / analyticsData.categories.totals.total) * 100 : 0;
          csvRows.push(`${key},${value},${percentage.toFixed(2)}%`);
        }
      });
      return csvRows.join('\n');
    
    case 'summary':
      return `
Analytics Summary
================
Generated: ${analyticsData.metadata.generatedAt}
Total Tasks: ${analyticsData.summary.totalTasks}
Total Hours: ${analyticsData.summary.totalHours.toFixed(2)}
Unique Markets: ${analyticsData.summary.uniqueMarkets}

Category Breakdown:
${Object.entries(analyticsData.categories.totals)
  .filter(([key]) => key !== 'total')
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}
      `.trim();
    
    default:
      return JSON.stringify(analyticsData, null, 2);
  }
};

// ===== EXTRACTED FUNCTIONS FROM ANALYTICSUTILS.JS =====

/**
 * Calculate basic task metrics (extracted from analyticsUtils.js)
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Basic task metrics
 */
export const calculateBasicTaskMetrics = (tasks = []) => {
  const validTasks = Array.isArray(tasks) ? tasks : [];
  
  const totalTasks = validTasks.length;
  const totalHours = validTasks.reduce((sum, task) => {
    const hours = parseFloat(task.timeInHours) || 0;
    return sum + hours;
  }, 0);
  const totalAIHours = validTasks.reduce((sum, task) => {
    const aiHours = parseFloat(task.aiTime) || 0;
    return sum + aiHours;
  }, 0);
  
  return {
    totalTasks,
    totalHours: Math.round(totalHours * 10) / 10,
    totalAIHours: Math.round(totalAIHours * 10) / 10,
    averageHoursPerTask: totalTasks > 0 ? Math.round((totalHours / totalTasks) * 10) / 10 : 0
  };
};

/**
 * Calculate AI metrics (extracted from analyticsUtils.js)
 * @param {Array} tasks - Array of task objects
 * @returns {Object} AI usage metrics
 */
export const calculateAIMetrics = (tasks = []) => {
  const validTasks = Array.isArray(tasks) ? tasks : [];
  
  const aiTasks = validTasks.filter(task => task.aiUsed === true);
  const totalAIHours = aiTasks.reduce((sum, task) => {
    const aiHours = parseFloat(task.aiTime) || 0;
    return sum + aiHours;
  }, 0);
  
  return {
    totalAITasks: aiTasks.length,
    totalAIHours: Math.round(totalAIHours * 10) / 10,
    aiTaskPercentage: validTasks.length > 0 ? 
      Math.round((aiTasks.length / validTasks.length) * 100) : 0,
    averageAIHoursPerTask: aiTasks.length > 0 ? 
      Math.round((totalAIHours / aiTasks.length) * 10) / 10 : 0
  };
};

/**
 * Generate time-based chart data (extracted from analyticsUtils.js)
 * @param {Array} tasks - Array of task objects
 * @param {number} days - Number of days to generate data for
 * @returns {Array} Chart data for time trends
 */
export const generateTimeChartData = (tasks = [], days = 7) => {
  const chartData = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const tasksOnDate = tasks.filter(task => {
      if (!task.createdAt) return false;
      
      try {
        let taskDate;
        if (task.createdAt instanceof Date) {
          taskDate = task.createdAt;
        } else if (task.createdAt.seconds) {
          taskDate = new Date(task.createdAt.seconds * 1000);
        } else {
          taskDate = new Date(task.createdAt);
        }
        
        if (isNaN(taskDate.getTime())) return false;
        return taskDate.toISOString().split('T')[0] === dateStr;
      } catch (error) {
        return false;
      }
    });
    
    chartData.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: tasksOnDate.length,
      date: dateStr,
      percentage: tasks.length > 0 ? (tasksOnDate.length / tasks.length) * 100 : 0
    });
  }
  
  return chartData;
};

/**
 * Calculate trend between two values (extracted from analyticsUtils.js)
 * @param {number} currentValue - Current value
 * @param {number} previousValue - Previous value
 * @returns {Object} Trend data
 */
export const calculateTrend = (currentValue, previousValue) => {
  if (previousValue === 0) {
    return {
      direction: currentValue > 0 ? 'up' : 'neutral',
      percentage: currentValue > 0 ? 100 : 0,
      value: currentValue
    };
  }
  
  const percentage = ((currentValue - previousValue) / previousValue) * 100;
  const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
  
  return {
    direction,
    percentage: Math.round(Math.abs(percentage) * 10) / 10,
    value: currentValue - previousValue
  };
};

/**
 * Enhanced export with all extracted functions
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Complete analytics with extracted functions
 */
export const exportEnhancedAnalytics = (tasks = []) => {
  const basicMetrics = calculateBasicTaskMetrics(tasks);
  const aiMetrics = calculateAIMetrics(tasks);
  const timeChartData = generateTimeChartData(tasks, 7);
  const categoryData = calculateTaskCategoryTotals(tasks);
  const timeData = calculateTimeAnalytics(tasks);
  const marketData = calculateMarketAnalytics(tasks);
  
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalTasks: tasks.length,
      dataSource: 'useAppData',
      version: '2.0.0',
      includesExtractedFunctions: true
    },
    basic: basicMetrics,
    ai: aiMetrics,
    timeChart: timeChartData,
    categories: categoryData,
    time: timeData,
    markets: marketData,
    summary: {
      totalTasks: basicMetrics.totalTasks,
      totalHours: basicMetrics.totalHours,
      totalAIHours: aiMetrics.totalAIHours,
      uniqueMarkets: marketData.totalMarkets,
      hasData: basicMetrics.totalTasks > 0
    }
  };
};
