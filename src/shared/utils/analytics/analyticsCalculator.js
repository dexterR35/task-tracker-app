import { BaseCalculator } from './calculators/baseCalculator.js';
import { SummaryCalculator } from './calculators/summaryCalculator.js';
import { AICalculator } from './calculators/aiCalculator.js';
import { logger } from '../logger';
import { calculateTopReporter, calculateUserReporter, getReporterMetric } from './calculators/reporterCalculator.js';
import { calculateProductMetrics, getProductMetric } from './calculators/productCalculator.js';
import { calculateMarketMetrics, getMarketMetric } from './calculators/marketCalculator.js';

/**
 * Main Analytics Calculator
 * Combines all specialized calculators into a unified interface
 */
export class AnalyticsCalculator extends BaseCalculator {
  constructor() {
    super();
    this.summaryCalculator = new SummaryCalculator();
    this.aiCalculator = new AICalculator();
  }

  /**
   * Calculate all analytics for a month from tasks data
   * @param {Array} tasks - Array of task objects
   * @param {string} monthId - Month identifier
   * @param {string|null} userId - Optional user filter
   * @param {Array} reporters - Array of reporter objects
   * @returns {Object} Complete analytics object
   */
  calculateAllAnalytics(tasks, monthId, userId = null, reporters = []) {
    try {
      // Generate stable cache key
      const cacheKey = this.generateCacheKey(tasks, monthId, userId);
      
      // Filter tasks by user if specified
      const filteredTasks = this.filterTasksByUser(tasks, userId);
      
      if (filteredTasks.length === 0) {
        return this.getEmptyAnalytics(monthId, userId);
      }

      // Calculate all analytics using specialized calculators
      const summary = this.summaryCalculator.calculateSummary(filteredTasks);
      const categories = this.summaryCalculator.calculateCategoryAnalytics(filteredTasks);
      const performance = this.summaryCalculator.calculatePerformanceAnalytics(filteredTasks);
      const aiAnalytics = this.aiCalculator.calculateAIAnalytics(filteredTasks);
      const markets = this.calculateMarketAnalytics(filteredTasks, monthId);
      const products = this.calculateProductAnalytics(filteredTasks, monthId);
      const trends = this.calculateTrends(filteredTasks, monthId);
      const dailyAnalytics = this.calculateDailyAnalytics(filteredTasks);
      const topReporter = this.calculateTopReporterAnalytics(filteredTasks, reporters);

      const analytics = {
        monthId,
        userId,
        tasks: filteredTasks, // Add tasks array for metric calculations
        summary,
        categories,
        performance,
        markets,
        products,
        aiAnalytics,
        trends,
        dailyAnalytics,
        topReporter,
        lastCalculated: Date.now(),
        cacheKey,
      };

      logger.debug(`[AnalyticsCalculator] Calculated analytics for ${monthId}${userId ? ` (user: ${userId})` : ''}:`, {
        totalTasks: summary.totalTasks,
        totalHours: summary.totalHours,
        aiTasks: aiAnalytics.totalAITasks,
      });

      return analytics;
    } catch (error) {
      logger.error(`[AnalyticsCalculator] Error calculating analytics for ${monthId}:`, error);
      return this.getEmptyAnalytics(monthId, userId);
    }
  }

  /**
   * Calculate market analytics
   * @param {Array} tasks - Array of task objects
   * @param {string} monthId - Month identifier
   * @returns {Object} Market analytics
   */
  calculateMarketAnalytics(tasks, monthId) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {};
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    const markets = {};

    validTasks.forEach(task => {
      const market = task.market || 'unknown';
      
      if (!markets[market]) {
        markets[market] = {
          count: 0,
          totalHours: 0,
          totalTimeWithAI: 0,
          averageHours: 0,
          tasksWithAI: 0,
          aiUsagePercentage: 0,
          categories: {},
          products: {},
        };
      }

      const hours = Number(task.timeInHours) || 0;
      const aiTime = Number(task.timeSpentOnAI) || 0;
      const category = task.category || 'uncategorized';
      const product = task.product || 'unknown';

      markets[market].count++;
      markets[market].totalHours += hours;
      markets[market].totalTimeWithAI += aiTime;
      
      if (aiTime > 0) {
        markets[market].tasksWithAI++;
      }

      // Track categories for this market
      if (!markets[market].categories[category]) {
        markets[market].categories[category] = 0;
      }
      markets[market].categories[category]++;

      // Track products for this market
      if (!markets[market].products[product]) {
        markets[market].products[product] = 0;
      }
      markets[market].products[product]++;
    });

    // Calculate averages and percentages
    Object.keys(markets).forEach(market => {
      const marketData = markets[market];
      marketData.averageHours = marketData.count > 0 ? Math.round((marketData.totalHours / marketData.count) * 100) / 100 : 0;
      marketData.aiUsagePercentage = marketData.count > 0 ? Math.round((marketData.tasksWithAI / marketData.count) * 100) : 0;
      marketData.totalHours = Math.round(marketData.totalHours * 100) / 100;
      marketData.totalTimeWithAI = Math.round(marketData.totalTimeWithAI * 100) / 100;
    });

    return markets;
  }

  /**
   * Calculate product analytics
   * @param {Array} tasks - Array of task objects
   * @param {string} monthId - Month identifier
   * @returns {Object} Product analytics
   */
  calculateProductAnalytics(tasks, monthId) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {};
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    const products = {};

    validTasks.forEach(task => {
      const product = task.product || 'unknown';
      
      if (!products[product]) {
        products[product] = {
          count: 0,
          totalHours: 0,
          totalTimeWithAI: 0,
          averageHours: 0,
          tasksWithAI: 0,
          aiUsagePercentage: 0,
          categories: {},
          markets: {},
        };
      }

      const hours = Number(task.timeInHours) || 0;
      const aiTime = Number(task.timeSpentOnAI) || 0;
      const category = task.category || 'uncategorized';
      const market = task.market || 'unknown';

      products[product].count++;
      products[product].totalHours += hours;
      products[product].totalTimeWithAI += aiTime;
      
      if (aiTime > 0) {
        products[product].tasksWithAI++;
      }

      // Track categories for this product
      if (!products[product].categories[category]) {
        products[product].categories[category] = 0;
      }
      products[product].categories[category]++;

      // Track markets for this product
      if (!products[product].markets[market]) {
        products[product].markets[market] = 0;
      }
      products[product].markets[market]++;
    });

    // Calculate averages and percentages
    Object.keys(products).forEach(product => {
      const productData = products[product];
      productData.averageHours = productData.count > 0 ? Math.round((productData.totalHours / productData.count) * 100) / 100 : 0;
      productData.aiUsagePercentage = productData.count > 0 ? Math.round((productData.tasksWithAI / productData.count) * 100) : 0;
      productData.totalHours = Math.round(productData.totalHours * 100) / 100;
      productData.totalTimeWithAI = Math.round(productData.totalTimeWithAI * 100) / 100;
    });

    return products;
  }

  /**
   * Calculate trends analytics
   * @param {Array} tasks - Array of task objects
   * @param {string} monthId - Month identifier
   * @returns {Object} Trends analytics
   */
  calculateTrends(tasks, monthId) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        weekly: {},
        daily: {},
        categoryTrends: {},
        aiTrends: {},
      };
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    const weekly = {};
    const daily = {};
    const categoryTrends = {};
    const aiTrends = {};

    validTasks.forEach(task => {
      const taskDate = this.parseDate(task.createdAt);
      if (!taskDate) return;

      // Weekly trends
      const weekKey = this.getWeekKey(taskDate);
      if (!weekly[weekKey]) {
        weekly[weekKey] = {
          count: 0,
          totalHours: 0,
          totalAITime: 0,
        };
      }
      weekly[weekKey].count++;
      weekly[weekKey].totalHours += Number(task.timeInHours) || 0;
      weekly[weekKey].totalAITime += Number(task.timeSpentOnAI) || 0;

      // Daily trends
      const dayKey = taskDate.toISOString().split('T')[0];
      if (!daily[dayKey]) {
        daily[dayKey] = {
          count: 0,
          totalHours: 0,
          totalAITime: 0,
        };
      }
      daily[dayKey].count++;
      daily[dayKey].totalHours += Number(task.timeInHours) || 0;
      daily[dayKey].totalAITime += Number(task.timeSpentOnAI) || 0;

      // Category trends
      const category = task.category || 'uncategorized';
      if (!categoryTrends[category]) {
        categoryTrends[category] = {
          count: 0,
          totalHours: 0,
          weekly: {},
        };
      }
      categoryTrends[category].count++;
      categoryTrends[category].totalHours += Number(task.timeInHours) || 0;

      if (!categoryTrends[category].weekly[weekKey]) {
        categoryTrends[category].weekly[weekKey] = 0;
      }
      categoryTrends[category].weekly[weekKey]++;

      // AI trends
      const aiTime = Number(task.timeSpentOnAI) || 0;
      if (aiTime > 0) {
        if (!aiTrends[weekKey]) {
          aiTrends[weekKey] = {
            count: 0,
            totalTime: 0,
          };
        }
        aiTrends[weekKey].count++;
        aiTrends[weekKey].totalTime += aiTime;
      }
    });

    return {
      weekly,
      daily,
      categoryTrends,
      aiTrends,
    };
  }

  /**
   * Calculate daily analytics
   * @param {Array} tasks - Array of task objects
   * @returns {Object} Daily analytics
   */
  calculateDailyAnalytics(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {};
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    const daily = {};

    validTasks.forEach(task => {
      const taskDate = this.parseDate(task.createdAt);
      if (!taskDate) return;

      const dayKey = taskDate.toISOString().split('T')[0];
      
      if (!daily[dayKey]) {
        daily[dayKey] = {
          count: 0,
          totalHours: 0,
          totalAITime: 0,
          categories: {},
          aiTasks: 0,
        };
      }

      const hours = Number(task.timeInHours) || 0;
      const aiTime = Number(task.timeSpentOnAI) || 0;
      const category = task.category || 'uncategorized';

      daily[dayKey].count++;
      daily[dayKey].totalHours += hours;
      daily[dayKey].totalAITime += aiTime;
      
      if (aiTime > 0) {
        daily[dayKey].aiTasks++;
      }

      if (!daily[dayKey].categories[category]) {
        daily[dayKey].categories[category] = 0;
      }
      daily[dayKey].categories[category]++;
    });

    return daily;
  }

  /**
   * Calculate top reporter analytics
   * @param {Array} tasks - Array of task objects
   * @param {Array} reporters - Array of reporter objects
   * @returns {Object|null} Top reporter analytics
   */
  calculateTopReporterAnalytics(tasks, reporters = []) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return null;
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    const reporterStats = {};

    validTasks.forEach(task => {
      const reporterId = task.reporterUID || task.reporterId;
      if (!reporterId) return;

      if (!reporterStats[reporterId]) {
        reporterStats[reporterId] = {
          id: reporterId,
          count: 0,
          totalHours: 0,
          totalAITime: 0,
          averageHours: 0,
          aiUsagePercentage: 0,
          categories: {},
        };
      }

      const hours = Number(task.timeInHours) || 0;
      const aiTime = Number(task.timeSpentOnAI) || 0;
      const category = task.category || 'uncategorized';

      reporterStats[reporterId].count++;
      reporterStats[reporterId].totalHours += hours;
      reporterStats[reporterId].totalAITime += aiTime;

      if (!reporterStats[reporterId].categories[category]) {
        reporterStats[reporterId].categories[category] = 0;
      }
      reporterStats[reporterId].categories[category]++;
    });

    // Calculate averages and find top reporter
    let topReporter = null;
    let maxTasks = 0;

    Object.keys(reporterStats).forEach(reporterId => {
      const stats = reporterStats[reporterId];
      stats.averageHours = stats.count > 0 ? Math.round((stats.totalHours / stats.count) * 100) / 100 : 0;
      stats.aiUsagePercentage = stats.count > 0 ? Math.round((stats.totalAITime / stats.totalHours) * 100) : 0;
      stats.totalHours = Math.round(stats.totalHours * 100) / 100;
      stats.totalAITime = Math.round(stats.totalAITime * 100) / 100;

      if (stats.count > maxTasks) {
        maxTasks = stats.count;
        topReporter = stats;
      }
    });

    // Add reporter name if available
    if (topReporter && Array.isArray(reporters)) {
      const reporter = reporters.find(r => r.id === topReporter.id || r.reporterUID === topReporter.id);
      if (reporter) {
        topReporter.name = reporter.name;
        topReporter.email = reporter.email;
      }
    }

    return topReporter;
  }

  /**
   * Get metric for specific card type
   * @param {string} type - Metric type
   * @param {Object} analytics - Analytics object
   * @param {string|null} category - Optional category filter
   * @returns {Object} Metric data
   */
  getMetricForCard(type, analytics, category = null) {
    if (!analytics) {
      return {
        value: 0,
        additionalData: {},
        isLoading: false,
        error: null,
      };
    }

    try {
      switch (type) {
        case 'total-tasks':
          return {
            value: analytics.summary?.totalTasks || 0,
            additionalData: {
              completionRate: analytics.summary?.completionRate || 0,
              averageHours: analytics.summary?.averageHoursPerTask || 0,
            },
            isLoading: false,
            error: null,
          };

        case 'total-hours':
          return {
            value: analytics.summary?.totalHours || 0,
            additionalData: {
              averageHours: analytics.summary?.averageHoursPerTask || 0,
              totalTasks: analytics.summary?.totalTasks || 0,
            },
            isLoading: false,
            error: null,
          };

        case 'ai-combined':
          return {
            value: analytics.aiAnalytics?.totalAITasks || 0,
            additionalData: {
              totalAITime: analytics.aiAnalytics?.totalAITime || 0,
              aiUsagePercentage: analytics.aiAnalytics?.aiUsagePercentage || 0,
              aiEfficiency: analytics.aiAnalytics?.aiEfficiency || 0,
              aiModels: analytics.aiAnalytics?.aiModels || {},
            },
            isLoading: false,
            error: null,
          };

        case 'development':
        case 'design':
        case 'video':
          const categoryData = analytics.categories?.[category] || {};
          return {
            value: categoryData.count || 0,
            additionalData: {
              totalHours: categoryData.totalHours || 0,
              averageHours: categoryData.averageHours || 0,
              aiUsagePercentage: categoryData.aiUsagePercentage || 0,
            },
            isLoading: false,
            error: null,
          };

        case 'user-performance':
          // Count unique users instead of performance score
          const uniqueUsers = new Set();
          if (analytics.tasks) {
            analytics.tasks.forEach(task => {
              const userId = task.userUID || task.userId;
              if (userId) {
                uniqueUsers.add(userId);
              }
            });
          }
          
          return {
            value: uniqueUsers.size, // Number of unique users
            additionalData: {
              efficiency: analytics.performance?.efficiency || 0,
              productivity: analytics.performance?.productivity || 0,
              quality: analytics.performance?.quality || 0,
              completedTasks: analytics.performance?.completedTasks || 0,
              overallScore: analytics.performance?.overallScore || 0,
            },
            isLoading: false,
            error: null,
          };

        case 'top-reporter':
          // Count unique reporters instead of tasks for top reporter
          const uniqueReporters = new Set();
          if (analytics.tasks) {
            analytics.tasks.forEach(task => {
              const reporterId = task.reporterUID || task.reporterId;
              if (reporterId) {
                uniqueReporters.add(reporterId);
              }
            });
          }
          
          return {
            value: uniqueReporters.size, // Number of unique reporters
            additionalData: {
              reporterName: analytics.topReporter?.name || 'Unknown',
              totalHours: analytics.topReporter?.totalHours || 0,
              averageHours: analytics.topReporter?.averageHours || 0,
              aiUsagePercentage: analytics.topReporter?.aiUsagePercentage || 0,
              topReporterTasks: analytics.topReporter?.count || 0, // Tasks for top reporter
            },
            isLoading: false,
            error: null,
          };

        case 'markets':
          const marketCount = Object.keys(analytics.markets || {}).length;
          return {
            value: marketCount,
            additionalData: {
              marketData: analytics.markets || {},
              totalTasks: analytics.summary?.totalTasks || 0,
            },
            isLoading: false,
            error: null,
          };

        case 'products':
          const productCount = Object.keys(analytics.products || {}).length;
          return {
            value: productCount,
            additionalData: {
              productData: analytics.products || {},
              totalTasks: analytics.summary?.totalTasks || 0,
            },
            isLoading: false,
            error: null,
          };

        default:
          return {
            value: 0,
            additionalData: {},
            isLoading: false,
            error: `Unknown metric type: ${type}`,
          };
      }
    } catch (error) {
      logger.error(`[AnalyticsCalculator] Error getting metric for ${type}:`, error);
      return {
        value: 0,
        additionalData: {},
        isLoading: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all metrics for dashboard cards
   * @param {Object} analytics - Analytics object
   * @returns {Object} All metrics
   */
  getAllMetrics(analytics) {
    if (!analytics) {
      return {};
    }

    return {
      'total-tasks': this.getMetricForCard('total-tasks', analytics),
      'total-hours': this.getMetricForCard('total-hours', analytics),
      'ai-combined': this.getMetricForCard('ai-combined', analytics),
      'development': this.getMetricForCard('development', analytics, 'development'),
      'design': this.getMetricForCard('design', analytics, 'design'),
      'video': this.getMetricForCard('video', analytics, 'video'),
      'user-performance': this.getMetricForCard('user-performance', analytics),
      'top-reporter': this.getMetricForCard('top-reporter', analytics),
      'markets': this.getMetricForCard('markets', analytics),
      'products': this.getMetricForCard('products', analytics),
    };
  }
}

// Export singleton instance
export const analyticsCalculator = new AnalyticsCalculator();

// Export convenience functions
export const calculateAnalytics = (tasks = [], users = [], reporters = [], monthId, userId = null) => {
  // Generate stable cache key
  const cacheKey = analyticsCalculator.generateCacheKey(tasks, monthId, userId);
  
  // Filter tasks by user if specified
  const filteredTasks = analyticsCalculator.filterTasksByUser(tasks, userId);
  
  if (filteredTasks.length === 0) {
    return analyticsCalculator.getEmptyAnalytics(monthId, userId);
  }

  // Calculate all analytics using specialized calculators
  const summary = analyticsCalculator.summaryCalculator.calculateSummary(filteredTasks);
  const categories = analyticsCalculator.summaryCalculator.calculateCategoryAnalytics(filteredTasks);
  const performance = analyticsCalculator.summaryCalculator.calculatePerformanceAnalytics(filteredTasks);
  const aiAnalytics = analyticsCalculator.aiCalculator.calculateAIAnalytics(filteredTasks);
  const markets = analyticsCalculator.calculateMarketAnalytics(filteredTasks, monthId);
  const products = analyticsCalculator.calculateProductAnalytics(filteredTasks, monthId);
  const trends = analyticsCalculator.calculateTrends(filteredTasks, monthId);
  const dailyAnalytics = analyticsCalculator.calculateDailyAnalytics(filteredTasks);
  const topReporter = analyticsCalculator.calculateTopReporterAnalytics(filteredTasks, reporters);

  // Calculate dedicated metrics using new calculators
  const reporterAnalytics = calculateTopReporter(filteredTasks, reporters);
  const userReporterAnalytics = calculateUserReporter(filteredTasks, users, reporters);
  const productAnalytics = calculateProductMetrics(filteredTasks);
  const marketAnalytics = calculateMarketMetrics(filteredTasks);

  const analytics = {
    monthId,
    userId,
    tasks: filteredTasks,
    summary,
    categories,
    performance,
    markets: marketAnalytics,
    products: productAnalytics,
    aiAnalytics,
    trends,
    dailyAnalytics,
    topReporter: reporterAnalytics,
    userReporter: userReporterAnalytics,
    lastCalculated: Date.now(),
    cacheKey,
  };

  logger.debug(`[AnalyticsCalculator] Calculated analytics for ${monthId}${userId ? ` (user: ${userId})` : ''}:`, {
    totalTasks: summary.totalTasks,
    totalHours: summary.totalHours,
    aiTasks: aiAnalytics.totalAITasks,
  });

  return analytics;
};

export const getMetricForCard = (cardId, analytics) => {
  if (!analytics || !cardId) {
    return { value: 0, additionalData: {} };
  }

  try {
    switch (cardId) {
      case 'total-tasks':
        return {
          value: analytics.summary?.totalTasks || 0,
          additionalData: {
            completedTasks: analytics.summary?.completedTasks || 0,
            pendingTasks: analytics.summary?.pendingTasks || 0,
            completionRate: analytics.summary?.completionRate || 0
          }
        };

      case 'total-hours':
        return {
          value: analytics.summary?.totalHours || 0,
          additionalData: {
            averageHours: analytics.summary?.averageHours || 0,
            totalTasks: analytics.summary?.totalTasks || 0
          }
        };

      case 'ai-combined':
        return {
          value: analytics.aiAnalytics?.totalAITasks || 0,
          additionalData: {
            aiPercentage: analytics.aiAnalytics?.aiPercentage || 0,
            aiHours: analytics.aiAnalytics?.aiHours || 0,
            nonAiTasks: analytics.aiAnalytics?.nonAiTasks || 0
          }
        };

      case 'development':
        return {
          value: analytics.categories?.development?.count || 0,
          additionalData: {
            hours: analytics.categories?.development?.hours || 0,
            completionRate: analytics.categories?.development?.completionRate || 0
          }
        };

      case 'design':
        return {
          value: analytics.categories?.design?.count || 0,
          additionalData: {
            hours: analytics.categories?.design?.hours || 0,
            completionRate: analytics.categories?.design?.completionRate || 0
          }
        };

      case 'video':
        return {
          value: analytics.categories?.video?.count || 0,
          additionalData: {
            hours: analytics.categories?.video?.hours || 0,
            completionRate: analytics.categories?.video?.completionRate || 0
          }
        };

      case 'deliverables':
        return {
          value: analytics.categories?.deliverables?.count || 0,
          additionalData: {
            hours: analytics.categories?.deliverables?.hours || 0,
            completionRate: analytics.categories?.deliverables?.completionRate || 0
          }
        };

      case 'ai-models':
        return {
          value: analytics.aiAnalytics?.aiModels?.length || 0,
          additionalData: {
            modelStats: analytics.aiAnalytics?.aiModels || [],
            totalAiTasks: analytics.aiAnalytics?.totalAITasks || 0
          }
        };

      case 'user-performance':
        // Use new reporter calculator for user performance
        return getReporterMetric('user-reporter', analytics.userReporter);

      case 'top-reporter':
        // Use new reporter calculator for top reporter
        return getReporterMetric('top-reporter', analytics.topReporter);

      case 'user-reporter':
        // Use new reporter calculator for user reporter
        return getReporterMetric('user-reporter', analytics.userReporter);

      case 'markets':
        // Use new market calculator
        return getMarketMetric(analytics.markets);

      case 'products':
        // Use new product calculator
        return getProductMetric(analytics.products);

      default:
        logger.warn(`[AnalyticsCalculator] Unknown card ID: ${cardId}`);
        return { value: 0, additionalData: {} };
    }
  } catch (error) {
    logger.error(`[AnalyticsCalculator] Error calculating metric for card ${cardId}:`, error);
    return { value: 0, additionalData: {} };
  }
};

export const getAllMetrics = (analytics) => {
  return analyticsCalculator.getAllMetrics(analytics);
};
