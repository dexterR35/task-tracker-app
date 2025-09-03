import { logger } from '../../../../utils/logger';
import { normalizeTimestamp } from '../../../../utils/dateUtils';

/**
 * Base Analytics Calculator Class
 * Contains common functionality for all analytics calculations
 */
export class BaseCalculator {
  constructor() {
    this.logger = logger;
  }

  /**
   * Safely parse a date from various formats
   * @param {any} dateValue - Date value (Firestore timestamp, Date object, ISO string, etc.)
   * @returns {Date|null} - Parsed date or null if invalid
   */
  parseDate(dateValue) {
    if (!dateValue) return null;
    
    try {
      // Use normalizeTimestamp to handle all date formats
      const normalized = normalizeTimestamp(dateValue);
      if (!normalized) return null;
      
      // Validate the date
      if (isNaN(normalized.getTime())) return null;
      
      return normalized;
    } catch (error) {
      this.logger.error('Error parsing date:', error, 'dateValue:', dateValue);
      return null;
    }
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
   * Generate a stable cache key for analytics calculation
   * @param {Array} tasks 
   * @param {string} monthId 
   * @param {string|null} userId 
   * @returns {string}
   */
  generateCacheKey(tasks, monthId, userId = null) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return `${monthId}_${userId || 'all'}_empty`;
    }

    // Create a more stable cache key based on task IDs and update timestamps
    const taskIds = [...tasks.map(t => t.id)].sort().join(',');
    const lastUpdate = Math.max(...tasks.map(t => t.updatedAt || 0));
    const taskCount = tasks.length;
    
    return `${monthId}_${userId || 'all'}_${taskCount}_${lastUpdate}_${taskIds.slice(0, 100)}`; // Limit task IDs length
  }

  /**
   * Get empty analytics structure
   * @param {string} monthId 
   * @param {string|null} userId 
   * @returns {Object}
   */
  getEmptyAnalytics(monthId, userId = null) {
    return {
      monthId,
      userId,
      summary: {
        totalTasks: 0,
        totalHours: 0,
        totalTimeWithAI: 0,
        averageHoursPerTask: 0,
        tasksWithAI: 0,
        aiUsagePercentage: 0,
      },
      categories: {},
      performance: {},
      markets: {},
      products: {},
      aiAnalytics: {},
      trends: {},
      dailyAnalytics: {},
      topReporter: null,
      lastCalculated: Date.now(),
    };
  }

  /**
   * Validate task data
   * @param {Object} task 
   * @returns {boolean}
   */
  validateTask(task) {
    return task && 
           typeof task === 'object' && 
           task.id && 
           task.monthId;
  }

  /**
   * Filter tasks by user if specified
   * @param {Array} tasks 
   * @param {string|null} userId 
   * @returns {Array}
   */
  filterTasksByUser(tasks, userId = null) {
    if (!userId) return tasks;
    return tasks.filter(task => task.userUID === userId);
  }
}
