/**
 * Market Analytics Calculator
 * Handles all market-related calculations for dashboard metrics
 */

/**
 * Calculate market metrics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Market analytics
 */
export const calculateMarketMetrics = (tasks = []) => {
  if (!tasks.length) {
    return {
      totalMarkets: 0,
      marketStats: [],
      averageTasksPerMarket: 0,
      averageHoursPerMarket: 0,
      topMarket: null,
      countryBreakdown: {
        at: { count: 0, hours: 0, tasks: [] },
        it: { count: 0, hours: 0, tasks: [] },
        gr: { count: 0, hours: 0, tasks: [] },
        fr: { count: 0, hours: 0, tasks: [] },
        misc: { count: 0, hours: 0, tasks: [] }
      }
    };
  }

  // Create market task mapping
  const marketTaskMap = new Map();
  const countryBreakdown = {
    at: { count: 0, hours: 0, tasks: [] },
    it: { count: 0, hours: 0, tasks: [] },
    gr: { count: 0, hours: 0, tasks: [] },
    fr: { count: 0, hours: 0, tasks: [] },
    misc: { count: 0, hours: 0, tasks: [] }
  };
  
  tasks.forEach(task => {
    const market = task.market || 'Unknown Market';
    const country = task.country || task.market?.toLowerCase() || 'misc';
    
    // Map to country breakdown
    const countryKey = country.toLowerCase();
    if (countryBreakdown[countryKey]) {
      countryBreakdown[countryKey].count++;
      countryBreakdown[countryKey].hours += parseFloat(task.hours || 0);
      countryBreakdown[countryKey].tasks.push(task);
    } else {
      countryBreakdown.misc.count++;
      countryBreakdown.misc.hours += parseFloat(task.hours || 0);
      countryBreakdown.misc.tasks.push(task);
    }
    
    if (!marketTaskMap.has(market)) {
      marketTaskMap.set(market, {
        name: market,
        tasks: [],
        totalHours: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalUsers: new Set(),
        totalReporters: new Set(),
        countries: new Set()
      });
    }
    
    const marketData = marketTaskMap.get(market);
    marketData.tasks.push(task);
    marketData.totalHours += parseFloat(task.hours || 0);
    marketData.countries.add(countryKey);
    
    if (task.status === 'completed') {
      marketData.completedTasks++;
    } else {
      marketData.pendingTasks++;
    }
    
    // Track unique users and reporters
    if (task.userUID || task.userId) {
      marketData.totalUsers.add(task.userUID || task.userId);
    }
    if (task.reporterUID || task.reporterId) {
      marketData.totalReporters.add(task.reporterUID || task.reporterId);
    }
  });

  // Calculate market statistics
  const marketStats = Array.from(marketTaskMap.values()).map(marketData => ({
    name: marketData.name,
    totalTasks: marketData.tasks.length,
    totalHours: marketData.totalHours,
    completedTasks: marketData.completedTasks,
    pendingTasks: marketData.pendingTasks,
    uniqueUsers: marketData.totalUsers.size,
    uniqueReporters: marketData.totalReporters.size,
    countries: Array.from(marketData.countries),
    averageHours: marketData.tasks.length > 0 ? marketData.totalHours / marketData.tasks.length : 0,
    completionRate: marketData.tasks.length > 0 ? (marketData.completedTasks / marketData.tasks.length) * 100 : 0
  }));

  // Sort by total tasks (descending)
  marketStats.sort((a, b) => b.totalTasks - a.totalTasks);

  // Get top market
  const topMarket = marketStats.length > 0 ? marketStats[0] : null;

  // Calculate averages
  const totalMarkets = marketStats.length;
  const totalTasks = tasks.length;
  const totalHours = tasks.reduce((sum, task) => sum + parseFloat(task.hours || 0), 0);
  
  const averageTasksPerMarket = totalMarkets > 0 ? totalTasks / totalMarkets : 0;
  const averageHoursPerMarket = totalMarkets > 0 ? totalHours / totalMarkets : 0;

  // Calculate country totals
  const countryTotals = Object.entries(countryBreakdown).map(([country, data]) => ({
    country: country.toUpperCase(),
    count: data.count,
    hours: data.hours,
    averageHours: data.count > 0 ? data.hours / data.count : 0
  }));

  return {
    totalMarkets,
    marketStats,
    averageTasksPerMarket,
    averageHoursPerMarket,
    topMarket,
    totalTasks,
    totalHours,
    countryBreakdown,
    countryTotals
  };
};
/**
 * Get market metric for dashboard card
 * @param {Object} marketAnalytics - Market analytics data
 * @returns {Object} Metric data for card display
 */
export const getMarketMetric = (marketAnalytics) => {
  return {
    value: marketAnalytics.totalMarkets,
    additionalData: {
      topMarketName: marketAnalytics.topMarket?.name || 'No Market',
      topMarketTasks: marketAnalytics.topMarket?.totalTasks || 0,
      topMarketHours: marketAnalytics.topMarket?.totalHours || 0,
      averageTasksPerMarket: marketAnalytics.averageTasksPerMarket,
      averageHoursPerMarket: marketAnalytics.averageHoursPerMarket,
      marketStats: marketAnalytics.marketStats,
      countryBreakdown: marketAnalytics.countryBreakdown,
      countryTotals: marketAnalytics.countryTotals
    }
  };
};

