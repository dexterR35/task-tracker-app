import { ANALYTICS_TYPES, TASK_CATEGORIES } from './analyticsTypes';
import { logger } from './logger';

/**
 * Centralized Analytics Calculator
 * Computes all metrics from cached Redux data without individual API calls
 */
export class AnalyticsCalculator {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this._analyticsCache = new Map(); // In-memory cache for memoization
    this._lastCalculation = new Map(); // Track last calculation time per key
    this._calculationDebounce = 100; // Debounce calculations by 100ms
  }

  /**
   * Clear cache for a specific month
   * @param {string} monthId 
   */
  clearCache(monthId) {
    this.cache.delete(monthId);
    // Clear related memoization cache entries
    const keysToDelete = [];
    for (const [key] of this._analyticsCache) {
      if (key.includes(monthId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this._analyticsCache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
    this._analyticsCache.clear();
    this._lastCalculation.clear();
  }

  /**
   * Check if cache is valid for a month
   * @param {string} monthId 
   * @returns {boolean}
   */
  isCacheValid(monthId) {
    const cached = this.cache.get(monthId);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Get cached analytics for a month
   * @param {string} monthId 
   * @returns {Object|null}
   */
  getCachedAnalytics(monthId) {
    if (this.isCacheValid(monthId)) {
      return this.cache.get(monthId).data;
    }
    return null;
  }

  /**
   * Cache analytics data for a month
   * @param {string} monthId 
   * @param {Object} data 
   */
  cacheAnalytics(monthId, data) {
    this.cache.set(monthId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Generate a stable cache key for analytics calculation
   * @param {Array} tasks 
   * @param {string} monthId 
   * @param {string|null} userId 
   * @returns {string}
   */
  _generateCacheKey(tasks, monthId, userId = null) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return `${monthId}_${userId || 'all'}_empty`;
    }

    // Create a more stable cache key based on task IDs and update timestamps
    const taskIds = tasks.map(t => t.id).sort().join(',');
    const lastUpdate = Math.max(...tasks.map(t => t.updatedAt || 0));
    const taskCount = tasks.length;
    
    return `${monthId}_${userId || 'all'}_${taskCount}_${lastUpdate}_${taskIds.slice(0, 100)}`; // Limit task IDs length
  }

  /**
   * Check if we should skip calculation due to debouncing
   * @param {string} cacheKey 
   * @returns {boolean}
   */
  _shouldSkipCalculation(cacheKey) {
    const lastCalc = this._lastCalculation.get(cacheKey);
    if (!lastCalc) return false;
    
    const now = Date.now();
    return (now - lastCalc) < this._calculationDebounce;
  }

  /**
   * Calculate all analytics for a month from tasks data
   * @param {Array} tasks - Array of task objects
   * @param {string} monthId - Month identifier
   * @param {string|null} userId - Optional user filter
   * @returns {Object} Complete analytics object
   */
  calculateAllAnalytics(tasks, monthId, userId = null, reporters = [], reporterTaskCounts = {}) {
    // Generate stable cache key
    const cacheKey = this._generateCacheKey(tasks, monthId, userId);
    
    // Check debouncing
    if (this._shouldSkipCalculation(cacheKey)) {
      const cached = this._analyticsCache.get(cacheKey);
      if (cached) {
        logger.debug(`[AnalyticsCalculator] Skipping calculation due to debouncing for ${cacheKey}`);
        return cached;
      }
    }
    
    // Check if we have cached analytics for this exact data
    if (this._analyticsCache.has(cacheKey)) {
      logger.debug(`[AnalyticsCalculator] Using cached analytics for ${cacheKey}`);
      return this._analyticsCache.get(cacheKey);
    }
    
    // Validate input
    if (!Array.isArray(tasks)) {
      logger.error('AnalyticsCalculator: tasks is not an array:', tasks);
      logger.error('Type of tasks:', typeof tasks);
      logger.error('Tasks value:', tasks);
      return this._getEmptyAnalytics(monthId, userId);
    }

    // Update last calculation time
    this._lastCalculation.set(cacheKey, Date.now());

    // Filter tasks by user if specified
    const filteredTasks = userId 
      ? tasks.filter(task => task.userUID === userId)
      : tasks;

    logger.debug(`[AnalyticsCalculator] Calculating fresh analytics for ${monthId} from ${filteredTasks.length} tasks (cacheKey: ${cacheKey})`);

    const analytics = {
      monthId,
      userId,
      timestamp: Date.now(),
      summary: this.calculateSummary(filteredTasks),
      categories: this.calculateCategoryAnalytics(filteredTasks),
      performance: this.calculatePerformanceAnalytics(filteredTasks),
      markets: this.calculateMarketAnalytics(filteredTasks),
      products: this.calculateProductAnalytics(filteredTasks),
      ai: this.calculateAIAnalytics(filteredTasks),
      trends: this.calculateTrends(filteredTasks),
      aiBreakdownByProduct: this.calculateAIBreakdownByProduct(filteredTasks),
      aiBreakdownByMarket: this.calculateAIBreakdownByMarket(filteredTasks),
      daily: this.calculateDailyAnalytics(filteredTasks),
      aiModels: this.calculateAIModelsAnalytics(filteredTasks),
      deliverables: this.calculateDeliverablesAnalytics(filteredTasks),
      bestAI: this.calculateBestAIAnalytics(filteredTasks),
      bestCategory: this.calculateBestCategoryAnalytics(filteredTasks),
      topReporter: this.calculateTopReporterAnalytics(filteredTasks, reporters, reporterTaskCounts),
      designDeliverables: this.calculateDesignDeliverablesAnalytics(filteredTasks),
      raw: {
        totalTasks: filteredTasks.length,
        tasks: filteredTasks
      }
    };

    // Cache the results
    this.cacheAnalytics(monthId, analytics);
    this._analyticsCache.set(cacheKey, analytics);
    
    // Limit cache size to prevent memory leaks
    if (this._analyticsCache.size > 50) {
      const firstKey = this._analyticsCache.keys().next().value;
      this._analyticsCache.delete(firstKey);
    }
    
    return analytics;
  }

  /**
   * Get empty analytics object for error cases
   * @param {string} monthId 
   * @param {string|null} userId 
   * @returns {Object}
   */
  _getEmptyAnalytics(monthId, userId = null) {
    return {
      monthId,
      userId,
      timestamp: Date.now(),
      summary: { totalTasks: 0, totalHours: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, completionRate: 0, avgHoursPerTask: 0 },
      categories: {},
      performance: { totalUsers: 0, totalHours: 0, avgHoursPerTask: 0, users: [] },
      markets: { totalMarkets: 0, markets: [], totalTasks: 0, totalHours: 0 },
      products: { totalProducts: 0, products: [], totalTasks: 0, totalHours: 0 },
      ai: { totalAITasks: 0, totalAIHours: 0, aiPercentage: 0 },
      trends: {},
      aiBreakdownByProduct: {},
      aiBreakdownByMarket: {},
      daily: {},
      aiModels: {},
      deliverables: {},
      bestAI: { aiUsage: {}, bestAI: "No AI Used", totalAITasks: 0, maxUsage: 0 },
      bestCategory: { categories: {}, bestCategory: "N/A", totalTasks: 0, maxCount: 0 },
      topReporter: { reporterStats: {}, topReporter: null, maxTasks: 0 },
      designDeliverables: { totalDeliverables: 0, designTasksCount: 0 },
      raw: { totalTasks: 0, tasks: [] }
    };
  }

  /**
   * Calculate summary metrics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateSummary(tasks) {
    const totalTasks = tasks.length;
    const totalHours = tasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0);
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;

    return {
      totalTasks,
      totalHours: parseFloat(totalHours.toFixed(2)),
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(1)) : 0,
      avgHoursPerTask: totalTasks > 0 ? parseFloat((totalHours / totalTasks).toFixed(2)) : 0
    };
  }

  /**
   * Calculate category-specific analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateCategoryAnalytics(tasks) {
    const categories = {
      [TASK_CATEGORIES.DEV]: { tasks: [], hours: 0, aiTasks: 0, aiHours: 0 },
      [TASK_CATEGORIES.DESIGN]: { tasks: [], hours: 0, aiTasks: 0, aiHours: 0 },
      [TASK_CATEGORIES.VIDEO]: { tasks: [], hours: 0, aiTasks: 0, aiHours: 0 }
    };

    tasks.forEach(task => {
      const taskName = (task.taskName || '').toLowerCase();
      let category = null;

      // Determine category based on task name
      if (taskName === TASK_CATEGORIES.DEV) category = TASK_CATEGORIES.DEV;
      else if (taskName === TASK_CATEGORIES.DESIGN) category = TASK_CATEGORIES.DESIGN;
      else if (taskName === TASK_CATEGORIES.VIDEO) category = TASK_CATEGORIES.VIDEO;

      if (category && categories[category]) {
        const hours = parseFloat(task.timeInHours) || 0;
        const aiHours = task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0;

        categories[category].tasks.push(task);
        categories[category].hours += hours;
        if (task.aiUsed) {
          categories[category].aiTasks += 1;
          categories[category].aiHours += aiHours;
        }
      }
    });

    // Calculate additional metrics for each category
    Object.keys(categories).forEach(category => {
      const cat = categories[category];
      cat.totalTasks = cat.tasks.length;
      cat.hours = parseFloat(cat.hours.toFixed(2));
      cat.aiHours = parseFloat(cat.aiHours.toFixed(2));
      cat.aiPercentage = cat.totalTasks > 0 ? parseFloat(((cat.aiTasks / cat.totalTasks) * 100).toFixed(1)) : 0;
      cat.avgHoursPerTask = cat.totalTasks > 0 ? parseFloat((cat.hours / cat.totalTasks).toFixed(2)) : 0;
    });

    return categories;
  }

  /**
   * Calculate performance analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculatePerformanceAnalytics(tasks) {
    const userStats = {};

    tasks.forEach(task => {
      const userId = task.userUID;
      if (!userStats[userId]) {
        userStats[userId] = {
          name: task.createdByName || userId,
          tasks: 0,
          hours: 0,
          completedTasks: 0,
          aiTasks: 0,
          aiHours: 0
        };
      }

      const hours = parseFloat(task.timeInHours) || 0;
      const aiHours = task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0;

      userStats[userId].tasks += 1;
      userStats[userId].hours += hours;
      if (task.status === 'completed') {
        userStats[userId].completedTasks += 1;
      }
      if (task.aiUsed) {
        userStats[userId].aiTasks += 1;
        userStats[userId].aiHours += aiHours;
      }
    });

    // Calculate performance metrics for each user
    const users = Object.values(userStats);
    users.forEach(user => {
      user.hours = parseFloat(user.hours.toFixed(2));
      user.aiHours = parseFloat(user.aiHours.toFixed(2));
      user.completionRate = user.tasks > 0 ? parseFloat(((user.completedTasks / user.tasks) * 100).toFixed(1)) : 0;
      user.aiPercentage = user.tasks > 0 ? parseFloat(((user.aiTasks / user.tasks) * 100).toFixed(1)) : 0;
      user.avgHoursPerTask = user.tasks > 0 ? parseFloat((user.hours / user.tasks).toFixed(2)) : 0;
    });

    return {
      totalUsers: users.length,
      users,
      totalTasks: users.reduce((sum, user) => sum + user.tasks, 0),
      totalHours: users.reduce((sum, user) => sum + user.hours, 0),
      avgHoursPerTask: users.length > 0 ? 
        parseFloat((users.reduce((sum, user) => sum + user.hours, 0) / users.reduce((sum, user) => sum + user.tasks, 0)).toFixed(2)) : 0
    };
  }

  /**
   * Calculate market analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateMarketAnalytics(tasks) {
    const marketStats = {};
    const marketByTime = {};
    const marketByCategory = {};

    tasks.forEach(task => {
      if (Array.isArray(task.markets)) {
        task.markets.forEach(market => {
          if (!marketStats[market]) {
            marketStats[market] = { 
              count: 0, 
              hours: 0, 
              tasks: [],
              aiTasks: 0,
              aiHours: 0,
              completedTasks: 0,
              pendingTasks: 0,
              inProgressTasks: 0
            };
          }

          const hours = parseFloat(task.timeInHours) || 0;
          const aiHours = task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0;

          marketStats[market].count += 1;
          marketStats[market].hours += hours;
          marketStats[market].tasks.push(task);
          
          // Status tracking
          if (task.status === 'completed') marketStats[market].completedTasks += 1;
          else if (task.status === 'pending') marketStats[market].pendingTasks += 1;
          else if (task.status === 'in-progress') marketStats[market].inProgressTasks += 1;
          
          if (task.aiUsed) {
            marketStats[market].aiTasks += 1;
            marketStats[market].aiHours += aiHours;
          }

          // Time-based market analysis
          const date = task.createdAt?.toDate?.() || new Date(task.createdAt);
          const monthKey = date.toISOString().substring(0, 7);
          
          if (!marketByTime[market]) marketByTime[market] = {};
          if (!marketByTime[market][monthKey]) {
            marketByTime[market][monthKey] = { count: 0, hours: 0, aiTasks: 0 };
          }
          marketByTime[market][monthKey].count += 1;
          marketByTime[market][monthKey].hours += hours;
          if (task.aiUsed) marketByTime[market][monthKey].aiTasks += 1;

          // Category-based market analysis
          const taskName = (task.taskName || '').toLowerCase();
          if (!marketByCategory[market]) marketByCategory[market] = {};
          if (!marketByCategory[market][taskName]) {
            marketByCategory[market][taskName] = { count: 0, hours: 0, aiTasks: 0 };
          }
          marketByCategory[market][taskName].count += 1;
          marketByCategory[market][taskName].hours += hours;
          if (task.aiUsed) marketByCategory[market][taskName].aiTasks += 1;
        });
      }
    });

    const markets = Object.entries(marketStats).map(([market, stats]) => ({
      name: market,
      count: stats.count,
      hours: parseFloat(stats.hours.toFixed(2)),
      aiTasks: stats.aiTasks,
      aiHours: parseFloat(stats.aiHours.toFixed(2)),
      aiPercentage: stats.count > 0 ? ((stats.aiTasks / stats.count) * 100).toFixed(1) : 0,
      avgHoursPerTask: stats.count > 0 ? (stats.hours / stats.count).toFixed(2) : 0,
      completedTasks: stats.completedTasks,
      pendingTasks: stats.pendingTasks,
      inProgressTasks: stats.inProgressTasks,
      completionRate: stats.count > 0 ? ((stats.completedTasks / stats.count) * 100).toFixed(1) : 0
    }));

    // Sort markets by hours (most active first)
    markets.sort((a, b) => b.hours - a.hours);

    // Create the structure that PreviewPage expects - simplified for charts
    const marketsForCharts = {};
    markets.forEach(market => {
      marketsForCharts[market.name] = market.count; // Just the count for charts
    });

    // logger.log('Markets calculated:', markets);
    // logger.log('Markets for charts:', marketsForCharts);

    return {
      totalMarkets: markets.length,
      markets: marketsForCharts, // Use the chart-compatible structure
      marketsList: markets, // Keep the original array for other uses
      totalTasks: markets.reduce((sum, market) => sum + market.count, 0),
      totalHours: markets.reduce((sum, market) => sum + market.hours, 0),
      marketByTime,
      marketByCategory,
      topMarkets: markets.slice(0, 5), // Top 5 markets by hours
      avgHoursPerMarket: markets.length > 0 ? parseFloat((markets.reduce((sum, market) => sum + market.hours, 0) / markets.length).toFixed(2)) : 0
    };
  }

  /**
   * Calculate product analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateProductAnalytics(tasks) {
    const productStats = {};
    const productByTime = {};
    const productByMarket = {};

    tasks.forEach(task => {
      if (task.product) {
        if (!productStats[task.product]) {
          productStats[task.product] = { 
            count: 0, 
            hours: 0, 
            tasks: [],
            aiTasks: 0,
            aiHours: 0,
            completedTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0
          };
        }

        const hours = parseFloat(task.timeInHours) || 0;
        const aiHours = task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0;

        productStats[task.product].count += 1;
        productStats[task.product].hours += hours;
        productStats[task.product].tasks.push(task);
        
        // Status tracking
        if (task.status === 'completed') productStats[task.product].completedTasks += 1;
        else if (task.status === 'pending') productStats[task.product].pendingTasks += 1;
        else if (task.status === 'in-progress') productStats[task.product].inProgressTasks += 1;
        
        if (task.aiUsed) {
          productStats[task.product].aiTasks += 1;
          productStats[task.product].aiHours += aiHours;
        }

        // Time-based product analysis
        const date = task.createdAt?.toDate?.() || new Date(task.createdAt);
        const monthKey = date.toISOString().substring(0, 7);
        
        if (!productByTime[task.product]) productByTime[task.product] = {};
        if (!productByTime[task.product][monthKey]) {
          productByTime[task.product][monthKey] = { count: 0, hours: 0, aiTasks: 0 };
        }
        productByTime[task.product][monthKey].count += 1;
        productByTime[task.product][monthKey].hours += hours;
        if (task.aiUsed) productByTime[task.product][monthKey].aiTasks += 1;

        // Market-based product analysis
        if (Array.isArray(task.markets)) {
          task.markets.forEach(market => {
            if (!productByMarket[task.product]) productByMarket[task.product] = {};
            if (!productByMarket[task.product][market]) {
              productByMarket[task.product][market] = { count: 0, hours: 0, aiTasks: 0 };
            }
            productByMarket[task.product][market].count += 1;
            productByMarket[task.product][market].hours += hours;
            if (task.aiUsed) productByMarket[task.product][market].aiTasks += 1;
          });
        }
      }
    });

    const products = Object.entries(productStats).map(([product, stats]) => ({
      name: product,
      count: stats.count,
      hours: parseFloat(stats.hours.toFixed(2)),
      aiTasks: stats.aiTasks,
      aiHours: parseFloat(stats.aiHours.toFixed(2)),
      aiPercentage: stats.count > 0 ? ((stats.aiTasks / stats.count) * 100).toFixed(1) : 0,
      avgHoursPerTask: stats.count > 0 ? (stats.hours / stats.count).toFixed(2) : 0,
      completedTasks: stats.completedTasks,
      pendingTasks: stats.pendingTasks,
      inProgressTasks: stats.inProgressTasks,
      completionRate: stats.count > 0 ? ((stats.completedTasks / stats.count) * 100).toFixed(1) : 0
    }));

    // Sort products by hours (most active first)
    products.sort((a, b) => b.hours - a.hours);

    // Create the structure that PreviewPage expects - simplified for charts
    const productsForCharts = {};
    products.forEach(product => {
      productsForCharts[product.name] = product.count; // Just the count for charts
    });

    // logger.log('Products calculated:', products);
    // logger.log('Products for charts:', productsForCharts);

    return {
      totalProducts: products.length,
      products: productsForCharts, // Use the chart-compatible structure
      productsList: products, // Keep the original array for other uses
      totalTasks: products.reduce((sum, product) => sum + product.count, 0),
      totalHours: products.reduce((sum, product) => sum + product.hours, 0),
      productByTime,
      productByMarket,
      topProducts: products.slice(0, 5), // Top 5 products by hours
      avgHoursPerProduct: products.length > 0 ? parseFloat((products.reduce((sum, product) => sum + product.hours, 0) / products.length).toFixed(2)) : 0
    };
  }

  /**
   * Calculate AI-specific analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateAIAnalytics(tasks) {
    const aiTasks = tasks.filter(task => task.aiUsed);
    const totalAITasks = aiTasks.length;
    const totalAIHours = aiTasks.reduce((sum, task) => sum + (parseFloat(task.timeSpentOnAI) || 0), 0);
    const totalHours = tasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0);

    return {
      totalAITasks,
      totalAIHours: parseFloat(totalAIHours.toFixed(2)),
      aiPercentage: tasks.length > 0 ? parseFloat(((totalAITasks / tasks.length) * 100).toFixed(1)) : 0,
      aiHoursPercentage: totalHours > 0 ? parseFloat(((totalAIHours / totalHours) * 100).toFixed(1)) : 0,
      avgAIHoursPerTask: totalAITasks > 0 ? parseFloat((totalAIHours / totalAITasks).toFixed(2)) : 0,
      aiTasks
    };
  }

  /**
   * Calculate trend analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateTrends(tasks) {
    // Group tasks by date
    const tasksByDate = {};
    const tasksByWeek = {};
    const tasksByMonth = {};
    
    tasks.forEach(task => {
      const date = task.createdAt?.toDate?.() || new Date(task.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      const weekKey = this.getWeekKey(date);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      
      // Daily grouping
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = { tasks: 0, hours: 0, aiTasks: 0, aiHours: 0 };
      }
      tasksByDate[dateKey].tasks += 1;
      tasksByDate[dateKey].hours += parseFloat(task.timeInHours) || 0;
      if (task.aiUsed) {
        tasksByDate[dateKey].aiTasks += 1;
        tasksByDate[dateKey].aiHours += parseFloat(task.timeSpentOnAI) || 0;
      }
      
      // Weekly grouping
      if (!tasksByWeek[weekKey]) {
        tasksByWeek[weekKey] = { tasks: 0, hours: 0, aiTasks: 0, aiHours: 0 };
      }
      tasksByWeek[weekKey].tasks += 1;
      tasksByWeek[weekKey].hours += parseFloat(task.timeInHours) || 0;
      if (task.aiUsed) {
        tasksByWeek[weekKey].aiTasks += 1;
        tasksByWeek[weekKey].aiHours += parseFloat(task.timeSpentOnAI) || 0;
      }
      
      // Monthly grouping
      if (!tasksByMonth[monthKey]) {
        tasksByMonth[monthKey] = { tasks: 0, hours: 0, aiTasks: 0, aiHours: 0 };
      }
      tasksByMonth[monthKey].tasks += 1;
      tasksByMonth[monthKey].hours += parseFloat(task.timeInHours) || 0;
      if (task.aiUsed) {
        tasksByMonth[monthKey].aiTasks += 1;
        tasksByMonth[monthKey].aiHours += parseFloat(task.timeSpentOnAI) || 0;
      }
    });

    const dates = Object.keys(tasksByDate).sort();
    const weeks = Object.keys(tasksByWeek).sort();
    const months = Object.keys(tasksByMonth).sort();
    
    const dailyTrends = dates.map(date => ({
      date,
      tasks: tasksByDate[date].tasks,
      hours: parseFloat(tasksByDate[date].hours.toFixed(2)),
      aiTasks: tasksByDate[date].aiTasks,
      aiHours: parseFloat(tasksByDate[date].aiHours.toFixed(2)),
      aiPercentage: tasksByDate[date].tasks > 0 ? ((tasksByDate[date].aiTasks / tasksByDate[date].tasks) * 100).toFixed(1) : 0
    }));
    
    const weeklyTrends = weeks.map(week => ({
      week,
      tasks: tasksByWeek[week].tasks,
      hours: parseFloat(tasksByWeek[week].hours.toFixed(2)),
      aiTasks: tasksByWeek[week].aiTasks,
      aiHours: parseFloat(tasksByWeek[week].aiHours.toFixed(2)),
      aiPercentage: tasksByWeek[week].tasks > 0 ? ((tasksByWeek[week].aiTasks / tasksByWeek[week].tasks) * 100).toFixed(1) : 0
    }));
    
    const monthlyTrends = months.map(month => ({
      month,
      tasks: tasksByMonth[month].tasks,
      hours: parseFloat(tasksByMonth[month].hours.toFixed(2)),
      aiTasks: tasksByMonth[month].aiTasks,
      aiHours: parseFloat(tasksByMonth[month].aiHours.toFixed(2)),
      aiPercentage: tasksByMonth[month].tasks > 0 ? ((tasksByMonth[month].aiTasks / tasksByMonth[month].tasks) * 100).toFixed(1) : 0
    }));

    return {
      dailyTrends,
      weeklyTrends,
      monthlyTrends,
      totalDays: dates.length,
      totalWeeks: weeks.length,
      totalMonths: months.length,
      avgTasksPerDay: dates.length > 0 ? (tasks.length / dates.length).toFixed(1) : 0,
      avgHoursPerDay: dates.length > 0 ? (tasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0) / dates.length).toFixed(2) : 0,
      avgTasksPerWeek: weeks.length > 0 ? (tasks.length / weeks.length).toFixed(1) : 0,
      avgHoursPerWeek: weeks.length > 0 ? (tasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0) / weeks.length).toFixed(2) : 0
    };
  }

  /**
   * Get week key for grouping (YYYY-WW format)
   * @param {Date} date 
   * @returns {string}
   */
  getWeekKey(date) {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Get week number of the year
   * @param {Date} date 
   * @returns {number}
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Get specific metric value for a card
   * @param {string} type - Analytics type
   * @param {Object} analytics - Complete analytics object
   * @param {string} category - Optional category filter
   * @returns {Object} Metric data for the card
   */
  getMetricForCard(type, analytics, category = null) {
    const { summary, categories, performance, markets, products, ai } = analytics;

    switch (type) {
      case ANALYTICS_TYPES.TOTAL_TASKS:
        return {
          value: summary.totalTasks,
          additionalData: {
            completed: summary.completedTasks,
            pending: summary.pendingTasks,
            inProgress: summary.inProgressTasks,
            completionRate: summary.completionRate,
            bestCategory: analytics.bestCategory.bestCategory
          }
        };

      case ANALYTICS_TYPES.TOTAL_HOURS:
        return {
          value: summary.totalHours,
          additionalData: {
            avgHoursPerTask: summary.avgHoursPerTask,
            totalTasks: summary.totalTasks,
            bestCategory: analytics.bestCategory.bestCategory
          }
        };

      case ANALYTICS_TYPES.TOTAL_TIME_WITH_AI:
        return {
          value: ai.totalAIHours,
          additionalData: {
            aiPercentage: ai.aiHoursPercentage,
            totalAITasks: ai.totalAITasks,
            avgAIHoursPerTask: ai.avgAIHoursPerTask,
            bestCategory: analytics.bestCategory.bestCategory
          }
        };

      case ANALYTICS_TYPES.AI_TASKS:
        return {
          value: ai.totalAITasks,
          additionalData: {
            aiPercentage: ai.aiPercentage,
            totalAIHours: ai.totalAIHours,
            avgAIHoursPerTask: ai.avgAIHoursPerTask,
            aiUsage: analytics.bestAI.aiUsage,
            bestCategory: analytics.bestCategory.bestCategory
          }
        };

      case ANALYTICS_TYPES.AI_COMBINED:
        return {
          value: ai.totalAITasks,
          additionalData: {
            aiPercentage: ai.aiPercentage,
            totalAIHours: ai.totalAIHours,
            avgAIHoursPerTask: ai.avgAIHoursPerTask,
            aiUsage: analytics.bestAI.aiUsage,
            bestCategory: analytics.bestCategory.bestCategory,
            aiHoursPercentage: ai.aiHoursPercentage
          }
        };

      case ANALYTICS_TYPES.DEVELOPMENT:
        return {
          value: categories[TASK_CATEGORIES.DEV]?.totalTasks || 0,
          additionalData: {
            totalHours: categories[TASK_CATEGORIES.DEV]?.hours || 0,
            aiTasks: categories[TASK_CATEGORIES.DEV]?.aiTasks || 0,
            aiHours: categories[TASK_CATEGORIES.DEV]?.aiHours || 0,
            avgHoursPerTask: categories[TASK_CATEGORIES.DEV]?.avgHoursPerTask || 0,
            aiPercentage: categories[TASK_CATEGORIES.DEV]?.aiPercentage || 0,
            bestCategory: analytics.bestCategory.bestCategory
          }
        };

      case ANALYTICS_TYPES.DESIGN:
        return {
          value: categories[TASK_CATEGORIES.DESIGN]?.totalTasks || 0,
          additionalData: {
            totalHours: categories[TASK_CATEGORIES.DESIGN]?.hours || 0,
            aiTasks: categories[TASK_CATEGORIES.DESIGN]?.aiTasks || 0,
            aiHours: categories[TASK_CATEGORIES.DESIGN]?.aiHours || 0,
            avgHoursPerTask: categories[TASK_CATEGORIES.DESIGN]?.avgHoursPerTask || 0,
            aiPercentage: categories[TASK_CATEGORIES.DESIGN]?.aiPercentage || 0,
            bestCategory: analytics.bestCategory.bestCategory,
            deliverables: analytics.designDeliverables.totalDeliverables
          }
        };

      case ANALYTICS_TYPES.VIDEO:
        return {
          value: categories[TASK_CATEGORIES.VIDEO]?.totalTasks || 0,
          additionalData: {
            totalHours: categories[TASK_CATEGORIES.VIDEO]?.hours || 0,
            aiTasks: categories[TASK_CATEGORIES.VIDEO]?.aiTasks || 0,
            aiHours: categories[TASK_CATEGORIES.VIDEO]?.aiHours || 0,
            avgHoursPerTask: categories[TASK_CATEGORIES.VIDEO]?.avgHoursPerTask || 0,
            aiPercentage: categories[TASK_CATEGORIES.VIDEO]?.aiPercentage || 0,
            bestCategory: analytics.bestCategory.bestCategory
          }
        };

      case ANALYTICS_TYPES.USER_PERFORMANCE:
        return {
          value: performance.totalUsers,
          additionalData: {
            totalHours: performance.totalHours,
            avgHoursPerTask: performance.avgHoursPerTask,
            userStats: performance.users,
            totalTasks: performance.totalTasks,
            bestCategory: analytics.bestCategory.bestCategory
          }
        };

      case ANALYTICS_TYPES.MARKETS:
        return {
          value: markets.totalMarkets,
          additionalData: {
            markets: markets.marketsList, // Use the detailed list for metrics
            totalTasks: markets.totalTasks,
            totalHours: markets.totalHours
          }
        };

      case ANALYTICS_TYPES.PRODUCTS:
        return {
          value: products.totalProducts,
          additionalData: {
            products: products.productsList, // Use the detailed list for metrics
            totalTasks: products.totalTasks,
            totalHours: products.totalHours
          }
        };

      case ANALYTICS_TYPES.BEST_AI:
        return {
          value: analytics.bestAI.maxUsage,
          additionalData: {
            aiUsage: analytics.bestAI.aiUsage,
            bestAI: analytics.bestAI.bestAI,
            totalAITasks: analytics.bestAI.totalAITasks
          }
        };

      case ANALYTICS_TYPES.BEST_CATEGORY:
        return {
          value: analytics.bestCategory.maxCount,
          additionalData: {
            categories: analytics.bestCategory.categories,
            bestCategory: analytics.bestCategory.bestCategory,
            totalTasks: analytics.bestCategory.totalTasks
          }
        };

      case ANALYTICS_TYPES.DELIVERABLES:
        return {
          value: analytics.deliverables.totalDeliverables,
          additionalData: {
            totalDeliverables: analytics.deliverables.totalDeliverables,
            designTasksCount: analytics.designDeliverables.designTasksCount
          }
        };

      case ANALYTICS_TYPES.TOP_REPORTER:
        return {
          value: Object.keys(analytics.topReporter.reporterStats).length,
          additionalData: {
            reporterStats: analytics.topReporter.reporterStats,
            topReporter: analytics.topReporter.topReporter,
            maxTasks: analytics.topReporter.maxTasks,
            totalReporters: Object.keys(analytics.topReporter.reporterStats).length
          }
        };

      default:
        return {
          value: 0,
          additionalData: {}
        };
    }
  }

  /**
   * Get all metrics for all cards
   * @param {Object} analytics - Complete analytics object
   * @returns {Object} All metrics organized by type
   */
  getAllMetrics(analytics) {
    const metrics = {};
    
    Object.values(ANALYTICS_TYPES).forEach(type => {
      metrics[type] = this.getMetricForCard(type, analytics);
    });

    return metrics;
  }

  /**
   * Calculate AI breakdown by product
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateAIBreakdownByProduct(tasks) {
    const breakdown = {};

    tasks.forEach(task => {
      if (task.product) {
        if (!breakdown[task.product]) {
          breakdown[task.product] = {
            aiTasks: 0,
            nonAiTasks: 0,
            totalTasks: 0,
            aiHours: 0,
            totalHours: 0
          };
        }

        const hours = parseFloat(task.timeInHours) || 0;
        const aiHours = task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0;

        breakdown[task.product].totalTasks += 1;
        breakdown[task.product].totalHours += hours;

        if (task.aiUsed) {
          breakdown[task.product].aiTasks += 1;
          breakdown[task.product].aiHours += aiHours;
        } else {
          breakdown[task.product].nonAiTasks += 1;
        }
      }
    });

    return breakdown;
  }

  /**
   * Calculate AI breakdown by market
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateAIBreakdownByMarket(tasks) {
    const breakdown = {};

    tasks.forEach(task => {
      if (Array.isArray(task.markets)) {
        task.markets.forEach(market => {
          if (!breakdown[market]) {
            breakdown[market] = {
              aiTasks: 0,
              nonAiTasks: 0,
              totalTasks: 0,
              aiHours: 0,
              totalHours: 0
            };
          }

          const hours = parseFloat(task.timeInHours) || 0;
          const aiHours = task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0;

          breakdown[market].totalTasks += 1;
          breakdown[market].totalHours += hours;

          if (task.aiUsed) {
            breakdown[market].aiTasks += 1;
            breakdown[market].aiHours += aiHours;
          } else {
            breakdown[market].nonAiTasks += 1;
          }
        });
      }
    });

    return breakdown;
  }

  /**
   * Calculate daily analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateDailyAnalytics(tasks) {
    const daily = {};

    tasks.forEach(task => {
      const date = task.createdAt?.toDate?.() || new Date(task.createdAt);
      const dateKey = date.toISOString().split('T')[0];

      if (!daily[dateKey]) {
        daily[dateKey] = { count: 0, hours: 0, aiTasks: 0, aiHours: 0 };
      }

      daily[dateKey].count += 1;
      daily[dateKey].hours += parseFloat(task.timeInHours) || 0;

      if (task.aiUsed) {
        daily[dateKey].aiTasks += 1;
        daily[dateKey].aiHours += parseFloat(task.timeSpentOnAI) || 0;
      }
    });

    return daily;
  }

  /**
   * Calculate AI models analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateAIModelsAnalytics(tasks) {
    const aiModels = {};

    tasks.forEach(task => {
      if (task.aiUsed && Array.isArray(task.aiModels)) {
        task.aiModels.forEach(model => {
          if (!aiModels[model]) {
            aiModels[model] = 0;
          }
          aiModels[model] += 1;
        });
      }
    });

    return aiModels;
  }

  /**
   * Calculate deliverables analytics
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateDeliverablesAnalytics(tasks) {
    const deliverables = {};

    tasks.forEach(task => {
      if (Array.isArray(task.deliverables)) {
        task.deliverables.forEach(deliverable => {
          if (!deliverables[deliverable]) {
            deliverables[deliverable] = 0;
          }
          deliverables[deliverable] += 1;
        });
      }
    });

    return deliverables;
  }

  /**
   * Calculate best AI from task data
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateBestAIAnalytics(tasks) {
    const aiUsage = {};
    let totalAITasks = 0;

    tasks.forEach(task => {
      if (task.aiUsed && Array.isArray(task.aiModels)) {
        task.aiModels.forEach(model => {
          if (!aiUsage[model]) {
            aiUsage[model] = 0;
          }
          aiUsage[model] += 1;
          totalAITasks += 1;
        });
      }
    });

    // Find the AI with highest usage
    let bestAI = "No AI Used";
    let maxUsage = 0;

    Object.entries(aiUsage).forEach(([ai, count]) => {
      if (count > maxUsage) {
        maxUsage = count;
        bestAI = ai;
      }
    });

    return {
      aiUsage,
      bestAI,
      totalAITasks,
      maxUsage
    };
  }

  /**
   * Calculate best category from task data
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateBestCategoryAnalytics(tasks) {
    const categories = {};
    let totalTasks = 0;

    tasks.forEach(task => {
      if (Array.isArray(task.markets)) {
        task.markets.forEach(market => {
          if (!categories[market]) {
            categories[market] = 0;
          }
          categories[market] += 1;
          totalTasks += 1;
        });
      }
    });

    // Find the category with highest count
    let bestCategory = "N/A";
    let maxCount = 0;

    Object.entries(categories).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestCategory = category;
      }
    });

    return {
      categories,
      bestCategory,
      totalTasks,
      maxCount
    };
  }

  /**
   * Calculate top reporter from task data
   * @param {Array} tasks 
   * @param {Array} reporters - Array of reporter objects from API
   * @returns {Object}
   */
  calculateTopReporterAnalytics(tasks, reporters = [], reporterTaskCounts = {}) {
    const reporterStats = {};



    // First, add all reporters from the database with accurate task counts
    reporters.forEach(reporter => {
      const taskCount = reporterTaskCounts[reporter.id] || 0;
      reporterStats[reporter.id] = {
        id: reporter.id,
        name: reporter.name || "Unknown Reporter",
        occupation: reporter.occupation || "Reporter",
        department: reporter.departament || "Unknown",
        tasks: taskCount, // Use accurate count from RTK Query
        hours: 0
      };
    });

    // Calculate hours for reporters who have tasks
    tasks.forEach(task => {
      // Get reporter ID from the correct field - tasks store it as 'reporters' (string or array)
      let reporterId = task.reporters;
      
      // Handle case where reporters is an array (take first unique reporter)
      if (Array.isArray(reporterId)) {
        // Get unique reporter IDs from the array
        const uniqueReporterIds = [...new Set(reporterId)];
        reporterId = uniqueReporterIds[0]; // Take the first unique reporter
      }
      
      if (reporterId && reporterId.trim() !== '' && reporterStats[reporterId]) {
        // Add hours to existing reporter stats
        reporterStats[reporterId].hours += parseFloat(task.timeInHours) || 0;
      }
    });

    // Find the reporter with most tasks
    let topReporter = null;
    let maxTasks = 0;

    Object.values(reporterStats).forEach(reporter => {
      if (reporter.tasks > maxTasks) {
        maxTasks = reporter.tasks;
        topReporter = reporter.id;
      }
    });



    return {
      reporterStats,
      topReporter,
      maxTasks
    };
  }

  /**
   * Calculate deliverables count for design tasks
   * @param {Array} tasks 
   * @returns {Object}
   */
  calculateDesignDeliverablesAnalytics(tasks) {
    let totalDeliverables = 0;
    const designTasks = tasks.filter(task => {
      const taskName = (task.taskName || '').toLowerCase();
      return taskName === TASK_CATEGORIES.DESIGN;
    });

    designTasks.forEach(task => {
      if (Array.isArray(task.deliverables)) {
        totalDeliverables += task.deliverables.length;
      }
    });

    return {
      totalDeliverables,
      designTasksCount: designTasks.length
    };
  }
}

// Export singleton instance
export const analyticsCalculator = new AnalyticsCalculator();

// Export helper functions
export const calculateAnalyticsFromTasks = (tasks, monthId, userId = null) => {
  return analyticsCalculator.calculateAllAnalytics(tasks, monthId, userId);
};

export const getMetricForCard = (type, analytics, category = null) => {
  return analyticsCalculator.getMetricForCard(type, analytics, category);
};

export const getAllMetrics = (analytics) => {
  return analyticsCalculator.getAllMetrics(analytics);
};

// Test function to verify analytics calculations
export const testAnalyticsCalculation = (tasks, monthId, userId = null) => {
  try {
    console.log(`[testAnalyticsCalculation] Testing with ${tasks.length} tasks for monthId: ${monthId}, userId: ${userId || 'all'}`);
    
    // Log first few tasks for debugging
    if (tasks.length > 0) {
      console.log('[testAnalyticsCalculation] Sample task:', tasks[0]);
    }
    
    const analytics = calculateAnalyticsFromTasks(tasks, monthId, userId);
    
    console.log('[testAnalyticsCalculation] Calculated analytics:', {
      totalTasks: analytics.summary?.totalTasks || 0,
      totalHours: analytics.summary?.totalHours || 0,
      totalAITasks: analytics.ai?.totalAITasks || 0,
      totalAIHours: analytics.ai?.totalAIHours || 0,
      totalUsers: analytics.performance?.totalUsers || 0,
      totalMarkets: analytics.markets?.totalMarkets || 0,
      totalProducts: analytics.products?.totalProducts || 0
    });
    
    return {
      success: true,
      analytics,
      taskCount: tasks.length
    };
  } catch (error) {
    console.error('[testAnalyticsCalculation] Error:', error);
    return {
      success: false,
      error: error.message,
      taskCount: tasks.length
    };
  }
};

// Test function to verify cache optimization
export const testCacheOptimization = (tasks, monthId, userId = null) => {
  try {
    console.log(`[testCacheOptimization] Testing cache optimization for ${monthId}`);
    
    // First calculation
    const start1 = performance.now();
    const analytics1 = calculateAnalyticsFromTasks(tasks, monthId, userId);
    const time1 = performance.now() - start1;
    
    // Second calculation (should use cache)
    const start2 = performance.now();
    const analytics2 = calculateAnalyticsFromTasks(tasks, monthId, userId);
    const time2 = performance.now() - start2;
    
    console.log(`[testCacheOptimization] First calculation: ${time1.toFixed(2)}ms`);
    console.log(`[testCacheOptimization] Second calculation: ${time2.toFixed(2)}ms`);
    console.log(`[testCacheOptimization] Cache hit: ${time2 < time1 * 0.1 ? 'YES' : 'NO'}`);
    
    return {
      success: true,
      firstCalculationTime: time1,
      secondCalculationTime: time2,
      cacheHit: time2 < time1 * 0.1
    };
  } catch (error) {
    console.error('[testCacheOptimization] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default analyticsCalculator;
