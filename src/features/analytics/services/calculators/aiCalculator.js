import { BaseCalculator } from './baseCalculator.js';

/**
 * AI Analytics Calculator
 * Handles AI-specific calculations and metrics
 */
export class AICalculator extends BaseCalculator {
  /**
   * Calculate AI analytics from tasks
   * @param {Array} tasks - Array of task objects
   * @returns {Object} AI analytics
   */
  calculateAIAnalytics(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        totalAITasks: 0,
        totalAITime: 0,
        aiUsagePercentage: 0,
        averageAITimePerTask: 0,
        aiModels: {},
        aiEfficiency: 0,
        aiCostSavings: 0,
      };
    }

    const validTasks = tasks.filter(task => this.validateTask(task));
    const aiTasks = validTasks.filter(task => (Number(task.timeSpentOnAI) || 0) > 0);
    
    const totalAITasks = aiTasks.length;
    const totalAITime = aiTasks.reduce((sum, task) => sum + (Number(task.timeSpentOnAI) || 0), 0);
    const aiUsagePercentage = validTasks.length > 0 ? (totalAITasks / validTasks.length) * 100 : 0;
    const averageAITimePerTask = totalAITasks > 0 ? totalAITime / totalAITasks : 0;

    // Calculate AI models usage
    const aiModels = this.calculateAIModelsAnalytics(aiTasks);
    
    // Calculate AI efficiency (time saved vs traditional methods)
    const aiEfficiency = this.calculateAIEfficiency(aiTasks);
    
    // Calculate cost savings (estimated)
    const aiCostSavings = this.calculateAICostSavings(aiTasks);

    return {
      totalAITasks,
      totalAITime: Math.round(totalAITime * 100) / 100,
      aiUsagePercentage: Math.round(aiUsagePercentage * 100) / 100,
      averageAITimePerTask: Math.round(averageAITimePerTask * 100) / 100,
      aiModels,
      aiEfficiency: Math.round(aiEfficiency * 100) / 100,
      aiCostSavings: Math.round(aiCostSavings * 100) / 100,
    };
  }

  /**
   * Calculate AI models analytics
   * @param {Array} aiTasks - Array of tasks with AI usage
   * @returns {Object} AI models analytics
   */
  calculateAIModelsAnalytics(aiTasks) {
    const models = {};
    
    aiTasks.forEach(task => {
      const taskModels = Array.isArray(task.aiModels) ? task.aiModels : [];
      
      taskModels.forEach(model => {
        if (!models[model]) {
          models[model] = {
            count: 0,
            totalTime: 0,
            averageTime: 0,
            efficiency: 0,
          };
        }
        
        const aiTime = Number(task.timeSpentOnAI) || 0;
        models[model].count++;
        models[model].totalTime += aiTime;
      });
    });

    // Calculate averages and efficiency
    Object.keys(models).forEach(model => {
      const modelData = models[model];
      modelData.averageTime = modelData.count > 0 ? modelData.totalTime / modelData.count : 0;
      modelData.efficiency = this.calculateModelEfficiency(model, modelData);
      modelData.totalTime = Math.round(modelData.totalTime * 100) / 100;
      modelData.averageTime = Math.round(modelData.averageTime * 100) / 100;
    });

    return models;
  }

  /**
   * Calculate AI efficiency
   * @param {Array} aiTasks - Array of tasks with AI usage
   * @returns {number} Efficiency percentage
   */
  calculateAIEfficiency(aiTasks) {
    if (aiTasks.length === 0) return 0;

    let totalEfficiency = 0;
    
    aiTasks.forEach(task => {
      const aiTime = Number(task.timeSpentOnAI) || 0;
      const totalTime = Number(task.timeInHours) || 0;
      
      if (totalTime > 0) {
        // Efficiency = (time saved / total time) * 100
        // Assuming AI saves 30% of time on average
        const timeSaved = aiTime * 0.3;
        const efficiency = (timeSaved / totalTime) * 100;
        totalEfficiency += efficiency;
      }
    });

    return totalEfficiency / aiTasks.length;
  }

  /**
   * Calculate AI cost savings
   * @param {Array} aiTasks - Array of tasks with AI usage
   * @returns {number} Estimated cost savings
   */
  calculateAICostSavings(aiTasks) {
    if (aiTasks.length === 0) return 0;

    const hourlyRate = 50; // Estimated hourly rate
    let totalSavings = 0;
    
    aiTasks.forEach(task => {
      const aiTime = Number(task.timeSpentOnAI) || 0;
      // Assuming AI saves 30% of time, and time is money
      const timeSaved = aiTime * 0.3;
      const savings = timeSaved * hourlyRate;
      totalSavings += savings;
    });

    return totalSavings;
  }

  /**
   * Calculate model efficiency (placeholder for future implementation)
   * @param {string} model - AI model name
   * @param {Object} modelData - Model usage data
   * @returns {number} Efficiency score
   */
  calculateModelEfficiency(model, modelData) {
    // Placeholder implementation - could be based on model-specific metrics
    const baseEfficiency = 75; // Base efficiency score
    const timeFactor = Math.min(100, (modelData.averageTime / 2) * 100); // Lower time = higher efficiency
    return Math.round((baseEfficiency + timeFactor) / 2);
  }

  /**
   * Calculate AI breakdown by product
   * @param {Array} tasks - Array of task objects
   * @returns {Object} AI breakdown by product
   */
  calculateAIBreakdownByProduct(tasks) {
    const validTasks = tasks.filter(task => this.validateTask(task));
    const aiTasks = validTasks.filter(task => (Number(task.timeSpentOnAI) || 0) > 0);
    
    const breakdown = {};
    
    aiTasks.forEach(task => {
      const product = task.product || 'unknown';
      const aiTime = Number(task.timeSpentOnAI) || 0;
      
      if (!breakdown[product]) {
        breakdown[product] = {
          count: 0,
          totalAITime: 0,
          averageAITime: 0,
          aiModels: {},
        };
      }
      
      breakdown[product].count++;
      breakdown[product].totalAITime += aiTime;
      
      // Track AI models used for this product
      const taskModels = Array.isArray(task.aiModels) ? task.aiModels : [];
      taskModels.forEach(model => {
        if (!breakdown[product].aiModels[model]) {
          breakdown[product].aiModels[model] = 0;
        }
        breakdown[product].aiModels[model]++;
      });
    });

    // Calculate averages
    Object.keys(breakdown).forEach(product => {
      const productData = breakdown[product];
      productData.averageAITime = productData.count > 0 ? productData.totalAITime / productData.count : 0;
      productData.totalAITime = Math.round(productData.totalAITime * 100) / 100;
      productData.averageAITime = Math.round(productData.averageAITime * 100) / 100;
    });

    return breakdown;
  }

  /**
   * Calculate AI breakdown by market
   * @param {Array} tasks - Array of task objects
   * @returns {Object} AI breakdown by market
   */
  calculateAIBreakdownByMarket(tasks) {
    const validTasks = tasks.filter(task => this.validateTask(task));
    const aiTasks = validTasks.filter(task => (Number(task.timeSpentOnAI) || 0) > 0);
    
    const breakdown = {};
    
    aiTasks.forEach(task => {
      const market = task.market || 'unknown';
      const aiTime = Number(task.timeSpentOnAI) || 0;
      
      if (!breakdown[market]) {
        breakdown[market] = {
          count: 0,
          totalAITime: 0,
          averageAITime: 0,
          aiModels: {},
        };
      }
      
      breakdown[market].count++;
      breakdown[market].totalAITime += aiTime;
      
      // Track AI models used for this market
      const taskModels = Array.isArray(task.aiModels) ? task.aiModels : [];
      taskModels.forEach(model => {
        if (!breakdown[market].aiModels[model]) {
          breakdown[market].aiModels[model] = 0;
        }
        breakdown[market].aiModels[model]++;
      });
    });

    // Calculate averages
    Object.keys(breakdown).forEach(market => {
      const marketData = breakdown[market];
      marketData.averageAITime = marketData.count > 0 ? marketData.totalAITime / marketData.count : 0;
      marketData.totalAITime = Math.round(marketData.totalAITime * 100) / 100;
      marketData.averageAITime = Math.round(marketData.averageAITime * 100) / 100;
    });

    return breakdown;
  }
}
