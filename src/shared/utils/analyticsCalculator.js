import { ANALYTICS_TYPES, TASK_CATEGORIES } from '../constants/analyticsTypes';

/**
 * Centralized Analytics Calculator
 * Computes all metrics from cached Redux data without individual API calls
 */
export class AnalyticsCalculator {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Clear cache for a specific month
   * @param {string} monthId 
   */
  clearCache(monthId) {
    this.cache.delete(monthId);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
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
   * Calculate all analytics for a month from tasks data
   * @param {Array} tasks - Array of task objects
   * @param {string} monthId - Month identifier
   * @param {string|null} userId - Optional user filter
   * @returns {Object} Complete analytics object
   */
  calculateAllAnalytics(tasks, monthId, userId = null) {
    // For real-time updates, always calculate fresh analytics
    // This ensures CRUD operations are immediately reflected
    console.log(`Calculating fresh analytics for ${monthId} from ${tasks.length} tasks`);

    // Filter tasks by user if specified
    const filteredTasks = userId 
      ? tasks.filter(task => task.userUID === userId)
      : tasks;

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
      raw: {
        totalTasks: filteredTasks.length,
        tasks: filteredTasks
      }
    };

    // Cache the results for future use
    this.cacheAnalytics(monthId, analytics);
    
    return analytics;
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

    return {
      totalMarkets: markets.length,
      markets,
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

    return {
      totalProducts: products.length,
      products,
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
            completionRate: summary.completionRate
          }
        };

      case ANALYTICS_TYPES.TOTAL_HOURS:
        return {
          value: summary.totalHours,
          additionalData: {
            avgHoursPerTask: summary.avgHoursPerTask,
            totalTasks: summary.totalTasks
          }
        };

      case ANALYTICS_TYPES.TOTAL_TIME_WITH_AI:
        return {
          value: ai.totalAIHours,
          additionalData: {
            aiPercentage: ai.aiHoursPercentage,
            totalAITasks: ai.totalAITasks,
            avgAIHoursPerTask: ai.avgAIHoursPerTask
          }
        };

      case ANALYTICS_TYPES.AI_TASKS:
        return {
          value: ai.totalAITasks,
          additionalData: {
            aiPercentage: ai.aiPercentage,
            totalAIHours: ai.totalAIHours,
            avgAIHoursPerTask: ai.avgAIHoursPerTask
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
            aiPercentage: categories[TASK_CATEGORIES.DEV]?.aiPercentage || 0
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
            aiPercentage: categories[TASK_CATEGORIES.DESIGN]?.aiPercentage || 0
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
            aiPercentage: categories[TASK_CATEGORIES.VIDEO]?.aiPercentage || 0
          }
        };

      case ANALYTICS_TYPES.USER_PERFORMANCE:
        return {
          value: performance.totalUsers,
          additionalData: {
            totalHours: performance.totalHours,
            avgHoursPerTask: performance.avgHoursPerTask,
            userStats: performance.users,
            totalTasks: performance.totalTasks
          }
        };

      case ANALYTICS_TYPES.MARKETS:
        return {
          value: markets.totalMarkets,
          additionalData: {
            markets: markets.markets,
            totalTasks: markets.totalTasks,
            totalHours: markets.totalHours
          }
        };

      case ANALYTICS_TYPES.PRODUCTS:
        return {
          value: products.totalProducts,
          additionalData: {
            products: products.products,
            totalTasks: products.totalTasks,
            totalHours: products.totalHours
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

export default analyticsCalculator;
