/**
 * Reporter Analytics Calculator
 * Handles all reporter-related calculations for dashboard metrics
 */

/**
 * Calculate top reporter metrics
 * @param {Array} tasks - Array of tasks
 * @param {Array} reporters - Array of reporters
 * @returns {Object} Top reporter analytics
 */
export const calculateTopReporter = (tasks = [], reporters = []) => {
  if (!tasks.length || !reporters.length) {
    return {
      topReporter: null,
      totalReporters: 0,
      reporterStats: [],
      averageTasksPerReporter: 0,
      averageHoursPerReporter: 0
    };
  }

  // Create reporter task mapping
  const reporterTaskMap = new Map();
  
  tasks.forEach(task => {
    const reporterId = task.reporterUID || task.reporterId;
    if (reporterId) {
      if (!reporterTaskMap.has(reporterId)) {
        reporterTaskMap.set(reporterId, {
          id: reporterId,
          tasks: [],
          totalHours: 0,
          completedTasks: 0,
          pendingTasks: 0
        });
      }
      
      const reporterData = reporterTaskMap.get(reporterId);
      reporterData.tasks.push(task);
      reporterData.totalHours += parseFloat(task.hours || 0);
      
      if (task.status === 'completed') {
        reporterData.completedTasks++;
      } else {
        reporterData.pendingTasks++;
      }
    }
  });

  // Calculate reporter statistics
  const reporterStats = Array.from(reporterTaskMap.values()).map(reporterData => {
    const reporter = reporters.find(r => r.id === reporterData.id || r.uid === reporterData.id);
    return {
      id: reporterData.id,
      name: reporter?.name || reporter?.displayName || 'Unknown Reporter',
      email: reporter?.email || '',
      totalTasks: reporterData.tasks.length,
      totalHours: reporterData.totalHours,
      completedTasks: reporterData.completedTasks,
      pendingTasks: reporterData.pendingTasks,
      averageHours: reporterData.tasks.length > 0 ? reporterData.totalHours / reporterData.tasks.length : 0,
      completionRate: reporterData.tasks.length > 0 ? (reporterData.completedTasks / reporterData.tasks.length) * 100 : 0
    };
  });

  // Sort by total tasks (descending)
  reporterStats.sort((a, b) => b.totalTasks - a.totalTasks);

  // Get top reporter
  const topReporter = reporterStats.length > 0 ? reporterStats[0] : null;

  // Calculate averages
  const totalReporters = reporterStats.length;
  const totalTasks = tasks.length;
  const totalHours = tasks.reduce((sum, task) => sum + parseFloat(task.hours || 0), 0);
  
  const averageTasksPerReporter = totalReporters > 0 ? totalTasks / totalReporters : 0;
  const averageHoursPerReporter = totalReporters > 0 ? totalHours / totalReporters : 0;

  return {
    topReporter,
    totalReporters,
    reporterStats,
    averageTasksPerReporter,
    averageHoursPerReporter,
    totalTasks,
    totalHours
  };
};

/**
 * Calculate user reporter metrics (all reporters)
 * @param {Array} tasks - Array of tasks
 * @param {Array} users - Array of users
 * @param {Array} reporters - Array of reporters
 * @returns {Object} User reporter analytics
 */
export const calculateUserReporter = (tasks = [], users = [], reporters = []) => {
  if (!tasks.length || !reporters.length) {
    return {
      userReporters: [],
      totalUserReporters: 0,
      userReporterStats: [],
      averageTasksPerUserReporter: 0
    };
  }

  // Create reporter task mapping for all reporters
  const reporterTaskMap = new Map();

  // Initialize all reporters
  reporters.forEach(reporter => {
    reporterTaskMap.set(reporter.id || reporter.uid, {
      id: reporter.id || reporter.uid,
      name: reporter.name || reporter.displayName || 'Unknown Reporter',
      email: reporter.email || '',
      tasks: [],
      totalHours: 0,
      completedTasks: 0,
      pendingTasks: 0
    });
  });

  // Map tasks to reporters
  tasks.forEach(task => {
    const reporterId = task.reporterUID || task.reporterId;
    if (reporterId && reporterTaskMap.has(reporterId)) {
      const reporterData = reporterTaskMap.get(reporterId);
      reporterData.tasks.push(task);
      reporterData.totalHours += parseFloat(task.hours || 0);
      
      if (task.status === 'completed') {
        reporterData.completedTasks++;
      } else {
        reporterData.pendingTasks++;
      }
    }
  });

  // Calculate reporter statistics
  const userReporterStats = Array.from(reporterTaskMap.values()).map(reporterData => ({
    id: reporterData.id,
    name: reporterData.name,
    email: reporterData.email,
    totalTasks: reporterData.tasks.length,
    totalHours: reporterData.totalHours,
    completedTasks: reporterData.completedTasks,
    pendingTasks: reporterData.pendingTasks,
    averageHours: reporterData.tasks.length > 0 ? reporterData.totalHours / reporterData.tasks.length : 0,
    completionRate: reporterData.tasks.length > 0 ? (reporterData.completedTasks / reporterData.tasks.length) * 100 : 0
  }));

  // Sort by total tasks (descending)
  userReporterStats.sort((a, b) => b.totalTasks - a.totalTasks);

  const totalUserReporters = userReporterStats.length;
  const totalTasks = userReporterStats.reduce((sum, reporter) => sum + reporter.totalTasks, 0);
  const averageTasksPerUserReporter = totalUserReporters > 0 ? totalTasks / totalUserReporters : 0;

  return {
    userReporters: userReporterStats,
    totalUserReporters,
    userReporterStats,
    averageTasksPerUserReporter,
    totalTasks
  };
};
/**
 * Get reporter metric for dashboard card
 * @param {string} metricType - Type of metric ('top-reporter', 'user-reporter')
 * @param {Object} reporterAnalytics - Reporter analytics data
 * @returns {Object} Metric data for card display
 */
export const getReporterMetric = (metricType, reporterAnalytics) => {
  switch (metricType) {
    case 'top-reporter':
      return {
        value: reporterAnalytics.totalReporters,
        additionalData: {
          topReporterName: reporterAnalytics.topReporter?.name || 'No Reporter',
          topReporterTasks: reporterAnalytics.topReporter?.totalTasks || 0,
          topReporterHours: reporterAnalytics.topReporter?.totalHours || 0,
          averageTasksPerReporter: reporterAnalytics.averageTasksPerReporter,
          averageHoursPerReporter: reporterAnalytics.averageHoursPerReporter
        }
      };
    
    case 'user-reporter':
      return {
        value: reporterAnalytics.totalUserReporters,
        additionalData: {
          userReporters: reporterAnalytics.userReporterStats,
          averageTasksPerUserReporter: reporterAnalytics.averageTasksPerUserReporter,
          totalTasks: reporterAnalytics.totalTasks
        }
      };
    
    default:
      return {
        value: 0,
        additionalData: {}
      };
  }
};

