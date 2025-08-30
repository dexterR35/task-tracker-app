import { BaseCalculator } from './baseCalculator.js';

/**
 * Summary Analytics Calculator
 * Handles basic task statistics and summary calculations
 */
export class SummaryCalculator extends BaseCalculator {
  /**
   * Calculate summary statistics from tasks
   * @param {Array} tasks - Array of task objects
   * @returns {Object} Summary statistics
   */
  calculateSummary(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        totalTasks: 0,
        totalHours: 0,
        totalTimeWithAI: 0,
        averageHoursPerTask: 0,
        tasksWithAI: 0,
        aiUsagePercentage: 0,
        completedTasks: 0,
        completionRate: 0,
      };
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    
    const totalTasks = validTasks.length;
    const totalHours = validTasks.reduce((sum, task) => sum + (Number(task.timeInHours) || 0), 0);
    const totalTimeWithAI = validTasks.reduce((sum, task) => sum + (Number(task.timeSpentOnAI) || 0), 0);
    const tasksWithAI = validTasks.filter(task => (Number(task.timeSpentOnAI) || 0) > 0).length;
    const completedTasks = validTasks.filter(task => task.status === 'completed').length;

    return {
      totalTasks,
      totalHours: Math.round(totalHours * 100) / 100,
      totalTimeWithAI: Math.round(totalTimeWithAI * 100) / 100,
      averageHoursPerTask: totalTasks > 0 ? Math.round((totalHours / totalTasks) * 100) / 100 : 0,
      tasksWithAI,
      aiUsagePercentage: totalTasks > 0 ? Math.round((tasksWithAI / totalTasks) * 100) : 0,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  /**
   * Calculate category-based analytics
   * @param {Array} tasks - Array of task objects
   * @returns {Object} Category analytics
   */
  calculateCategoryAnalytics(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {};
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    const categories = {};

    validTasks.forEach(task => {
      const category = task.category || 'uncategorized';
      
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          totalHours: 0,
          totalTimeWithAI: 0,
          averageHours: 0,
          tasksWithAI: 0,
          aiUsagePercentage: 0,
        };
      }

      const hours = Number(task.timeInHours) || 0;
      const aiTime = Number(task.timeSpentOnAI) || 0;

      categories[category].count++;
      categories[category].totalHours += hours;
      categories[category].totalTimeWithAI += aiTime;
      
      if (aiTime > 0) {
        categories[category].tasksWithAI++;
      }
    });

    // Calculate averages and percentages
    Object.keys(categories).forEach(category => {
      const cat = categories[category];
      cat.averageHours = cat.count > 0 ? Math.round((cat.totalHours / cat.count) * 100) / 100 : 0;
      cat.aiUsagePercentage = cat.count > 0 ? Math.round((cat.tasksWithAI / cat.count) * 100) : 0;
      cat.totalHours = Math.round(cat.totalHours * 100) / 100;
      cat.totalTimeWithAI = Math.round(cat.totalTimeWithAI * 100) / 100;
    });

    return categories;
  }

  /**
   * Calculate performance analytics
   * @param {Array} tasks - Array of task objects
   * @returns {Object} Performance analytics
   */
  calculatePerformanceAnalytics(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        efficiency: 0,
        productivity: 0,
        quality: 0,
        overallScore: 0,
      };
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    
    // Calculate efficiency (completed tasks vs total tasks)
    const completedTasks = validTasks.filter(task => task.status === 'completed').length;
    const efficiency = validTasks.length > 0 ? (completedTasks / validTasks.length) * 100 : 0;

    // Calculate productivity (total hours worked)
    const totalHours = validTasks.reduce((sum, task) => sum + (Number(task.timeInHours) || 0), 0);
    const productivity = totalHours; // Could be normalized based on expected hours

    // Calculate quality (tasks with positive feedback or no issues)
    const qualityTasks = validTasks.filter(task => 
      !task.issues || task.issues.length === 0 || task.quality === 'high'
    ).length;
    const quality = validTasks.length > 0 ? (qualityTasks / validTasks.length) * 100 : 0;

    // Overall score (weighted average)
    const overallScore = Math.round((efficiency * 0.4 + (productivity / 10) * 0.3 + quality * 0.3) * 100) / 100;

    return {
      efficiency: Math.round(efficiency * 100) / 100,
      productivity: Math.round(productivity * 100) / 100,
      quality: Math.round(quality * 100) / 100,
      overallScore: Math.min(100, Math.max(0, overallScore)),
      completedTasks,
      totalTasks: validTasks.length,
      totalHours: Math.round(totalHours * 100) / 100,
    };
  }
}
