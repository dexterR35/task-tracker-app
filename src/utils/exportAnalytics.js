/**
 * Export Analytics Utility
 * Simple export functions for calculator analytics data
 * Use these functions to export data for charts and other implementations
 */

import { 
  calculateTaskCategoryTotals, 
  calculateTimeAnalytics, 
  calculateMarketAnalytics,
  exportAnalyticsData,
  formatForExport,
  calculateBasicTaskMetrics,
  calculateAIMetrics,
  generateTimeChartData,
  calculateTrend,
  exportEnhancedAnalytics
} from './calculatorAnalytics';

/**
 * Export task category totals for charts
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Category totals data ready for charts
 */
export const exportCategoryTotals = (tasks = []) => {
  const data = calculateTaskCategoryTotals(tasks);
  
  return {
    totals: data.totals,
    breakdown: data.breakdown,
    percentages: data.percentages,
    summary: data.summary,
    // Chart-ready format with 100% base calculations
    chartData: {
      categories: Object.keys(data.totals).filter(key => key !== 'total'),
      values: Object.keys(data.totals)
        .filter(key => key !== 'total')
        .map(key => data.totals[key]),
      percentages: Object.keys(data.totals)
        .filter(key => key !== 'total')
        .map(key => data.percentages.categories[key] || 0),
      // Breakdown percentages from 100%
      breakdownPercentages: data.percentages.breakdown
    }
  };
};

/**
 * Export time analytics for charts
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Time analytics data ready for charts
 */
export const exportTimeAnalytics = (tasks = []) => {
  const data = calculateTimeAnalytics(tasks);
  
  return {
    ...data,
    // Chart-ready format with 100% base calculations
    chartData: {
      categories: data.timeDistribution.map(item => item.category),
      hours: data.timeDistribution.map(item => item.hours),
      percentages: data.timeDistribution.map(item => item.percentage),
      // Additional percentage data from 100% base
      categoryPercentages: data.percentages.categoryPercentages,
      totalPercentage: data.percentages.totalHours
    }
  };
};

/**
 * Export market analytics for charts
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Market analytics data ready for charts
 */
export const exportMarketAnalytics = (tasks = []) => {
  const data = calculateMarketAnalytics(tasks);
  
  return {
    ...data,
    // Chart-ready format with 100% base calculations
    chartData: {
      markets: Object.keys(data.marketCounts),
      counts: Object.values(data.marketCounts),
      percentages: Object.keys(data.marketCounts).map(market => 
        data.percentages.marketPercentages[market] || 0
      ),
      // Additional percentage data from 100% base
      marketPercentages: data.percentages.marketPercentages,
      categoryMarketPercentages: data.percentages.categoryMarketPercentages,
      totalPercentage: data.percentages.totalMarkets
    }
  };
};

/**
 * Export complete analytics package
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Complete analytics data with chart-ready formats
 */
export const exportCompleteAnalytics = (tasks = []) => {
  const categories = exportCategoryTotals(tasks);
  const time = exportTimeAnalytics(tasks);
  const markets = exportMarketAnalytics(tasks);
  
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalTasks: tasks.length,
      dataSource: 'useAppData',
      version: '1.0.0'
    },
    categories,
    time,
    markets,
    summary: {
      totalTasks: categories.totals.total,
      totalHours: time.totalHours,
      uniqueMarkets: markets.totalMarkets,
      hasData: categories.totals.total > 0
    }
  };
};

/**
 * Export data in specific format
 * @param {Array} tasks - Array of task objects from useAppData
 * @param {string} format - Export format ('json', 'csv', 'summary')
 * @returns {string} Formatted data string
 */
export const exportData = (tasks = [], format = 'json') => {
  const analyticsData = exportCompleteAnalytics(tasks);
  return formatForExport(analyticsData, format);
};

/**
 * Download analytics data as file
 * @param {Array} tasks - Array of task objects from useAppData
 * @param {string} format - Export format ('json', 'csv', 'summary')
 * @param {string} filename - Custom filename (optional)
 */
export const downloadAnalytics = (tasks = [], format = 'json', filename = null) => {
  const data = exportData(tasks, format);
  const defaultFilename = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
  const finalFilename = filename || defaultFilename;
  
  // Create and download file
  const blob = new Blob([data], { 
    type: format === 'json' ? 'application/json' : 'text/csv' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get chart data for specific chart type
 * @param {Array} tasks - Array of task objects from useAppData
 * @param {string} chartType - Chart type ('categories', 'time', 'markets', 'all')
 * @returns {Object} Chart-ready data
 */
export const getChartData = (tasks = [], chartType = 'all') => {
  switch (chartType.toLowerCase()) {
    case 'categories':
      return exportCategoryTotals(tasks);
    case 'time':
      return exportTimeAnalytics(tasks);
    case 'markets':
      return exportMarketAnalytics(tasks);
    case 'all':
    default:
      return exportCompleteAnalytics(tasks);
  }
};

/**
 * Export basic task metrics (extracted from analyticsUtils.js)
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Basic task metrics
 */
export const exportBasicMetrics = (tasks = []) => {
  return calculateBasicTaskMetrics(tasks);
};

/**
 * Export AI metrics (extracted from analyticsUtils.js)
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} AI usage metrics
 */
export const exportAIMetrics = (tasks = []) => {
  return calculateAIMetrics(tasks);
};

/**
 * Export time chart data (extracted from analyticsUtils.js)
 * @param {Array} tasks - Array of task objects from useAppData
 * @param {number} days - Number of days to generate data for
 * @returns {Array} Time-based chart data
 */
export const exportTimeChartData = (tasks = [], days = 7) => {
  return generateTimeChartData(tasks, days);
};

/**
 * Export enhanced analytics with all extracted functions
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Complete enhanced analytics
 */
export const exportEnhancedData = (tasks = []) => {
  return exportEnhancedAnalytics(tasks);
};

/**
 * Calculate trend between two values
 * @param {number} currentValue - Current value
 * @param {number} previousValue - Previous value
 * @returns {Object} Trend data
 */
export const exportTrend = (currentValue, previousValue) => {
  return calculateTrend(currentValue, previousValue);
};

/**
 * Console log analytics data for debugging
 * @param {Array} tasks - Array of task objects from useAppData
 * @param {string} type - Data type to log ('categories', 'time', 'markets', 'basic', 'ai', 'enhanced', 'all')
 */
export const logAnalytics = (tasks = [], type = 'all') => {
  // Debug logging removed for production
  // Use logger.debug() if debug logging is needed
};
