/**
 * Product Analytics Calculator
 * Handles all product-related calculations for dashboard metrics
 */

/**
 * Calculate product metrics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Product analytics
 */
export const calculateProductMetrics = (tasks = []) => {
  if (!tasks.length) {
    return {
      totalProducts: 0,
      productStats: [],
      averageTasksPerProduct: 0,
      averageHoursPerProduct: 0,
      topProduct: null
    };
  }

  // Create product task mapping
  const productTaskMap = new Map();
  
  tasks.forEach(task => {
    const product = task.product || 'Unknown Product';
    
    if (!productTaskMap.has(product)) {
      productTaskMap.set(product, {
        name: product,
        tasks: [],
        totalHours: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalUsers: new Set(),
        totalReporters: new Set()
      });
    }
    
    const productData = productTaskMap.get(product);
    productData.tasks.push(task);
    productData.totalHours += parseFloat(task.hours || 0);
    
    if (task.status === 'completed') {
      productData.completedTasks++;
    } else {
      productData.pendingTasks++;
    }
    
    // Track unique users and reporters
    if (task.userUID || task.userId) {
      productData.totalUsers.add(task.userUID || task.userId);
    }
    if (task.reporterUID || task.reporterId) {
      productData.totalReporters.add(task.reporterUID || task.reporterId);
    }
  });

  // Calculate product statistics
  const productStats = Array.from(productTaskMap.values()).map(productData => ({
    name: productData.name,
    totalTasks: productData.tasks.length,
    totalHours: productData.totalHours,
    completedTasks: productData.completedTasks,
    pendingTasks: productData.pendingTasks,
    uniqueUsers: productData.totalUsers.size,
    uniqueReporters: productData.totalReporters.size,
    averageHours: productData.tasks.length > 0 ? productData.totalHours / productData.tasks.length : 0,
    completionRate: productData.tasks.length > 0 ? (productData.completedTasks / productData.tasks.length) * 100 : 0
  }));

  // Sort by total tasks (descending)
  productStats.sort((a, b) => b.totalTasks - a.totalTasks);

  // Get top product
  const topProduct = productStats.length > 0 ? productStats[0] : null;

  // Calculate averages
  const totalProducts = productStats.length;
  const totalTasks = tasks.length;
  const totalHours = tasks.reduce((sum, task) => sum + parseFloat(task.hours || 0), 0);
  
  const averageTasksPerProduct = totalProducts > 0 ? totalTasks / totalProducts : 0;
  const averageHoursPerProduct = totalProducts > 0 ? totalHours / totalProducts : 0;

  return {
    totalProducts,
    productStats,
    averageTasksPerProduct,
    averageHoursPerProduct,
    topProduct,
    totalTasks,
    totalHours
  };
};
/**
 * Get product metric for dashboard card
 * @param {Object} productAnalytics - Product analytics data
 * @returns {Object} Metric data for card display
 */
export const getProductMetric = (productAnalytics) => {
  return {
    value: productAnalytics.totalProducts,
    additionalData: {
      topProductName: productAnalytics.topProduct?.name || 'No Product',
      topProductTasks: productAnalytics.topProduct?.totalTasks || 0,
      topProductHours: productAnalytics.topProduct?.totalHours || 0,
      averageTasksPerProduct: productAnalytics.averageTasksPerProduct,
      averageHoursPerProduct: productAnalytics.averageHoursPerProduct,
      productStats: productAnalytics.productStats
    }
  };
};

