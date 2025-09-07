/**
 * Analytics utilities for calculating metrics from task, user, and reporter data
 * Used to generate dynamic card data for admin dashboard
 */

/**
 * Calculate total tasks and hours from task data
 */
export const calculateTaskMetrics = (tasks = []) => {
  // Ensure tasks is an array
  const validTasks = Array.isArray(tasks) ? tasks : [];
  
  const totalTasks = validTasks.length;
  const totalHours = validTasks.reduce((sum, task) => {
    const hours = parseFloat(task.timeInHours) || 0;
    return sum + hours;
  }, 0);
  const totalAIHours = validTasks.reduce((sum, task) => {
    const aiHours = parseFloat(task.aiTime) || 0;
    return sum + aiHours;
  }, 0);
  
  return {
    totalTasks,
    totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    totalAIHours: Math.round(totalAIHours * 10) / 10,
    averageHoursPerTask: totalTasks > 0 ? Math.round((totalHours / totalTasks) * 10) / 10 : 0
  };
};

/**
 * Calculate reporter performance metrics
 */
export const calculateReporterMetrics = (tasks = [], reporters = []) => {
  // Ensure inputs are arrays
  const validTasks = Array.isArray(tasks) ? tasks : [];
  const validReporters = Array.isArray(reporters) ? reporters : [];
  
  // Group tasks by reporter
  const reporterTaskCounts = {};
  const reporterHours = {};
  
  validTasks.forEach(task => {
    const reporterId = task.reporters;
    if (reporterId) {
      reporterTaskCounts[reporterId] = (reporterTaskCounts[reporterId] || 0) + 1;
      const hours = parseFloat(task.timeInHours) || 0;
      reporterHours[reporterId] = (reporterHours[reporterId] || 0) + hours;
    }
  });
  
  // Get top 3 reporters by task count
  const topReporters = Object.entries(reporterTaskCounts)
    .map(([reporterId, taskCount]) => {
      const reporter = validReporters.find(r => r.id === reporterId || r.reporterUID === reporterId);
      return {
        id: reporterId,
        name: reporter?.name || 'Unknown Reporter',
        taskCount,
        totalHours: Math.round((reporterHours[reporterId] || 0) * 10) / 10
      };
    })
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 3);
  
  return {
    topReporters,
    totalActiveReporters: Object.keys(reporterTaskCounts).length,
    averageTasksPerReporter: Object.keys(reporterTaskCounts).length > 0 
      ? Math.round((validTasks.length / Object.keys(reporterTaskCounts).length) * 10) / 10 
      : 0
  };
};

/**
 * Calculate user performance metrics
 */
export const calculateUserMetrics = (tasks = [], users = []) => {
  // Group tasks by user
  const userTaskCounts = {};
  const userHours = {};
  
  tasks.forEach(task => {
    const userId = task.userUID;
    if (userId) {
      userTaskCounts[userId] = (userTaskCounts[userId] || 0) + 1;
      userHours[userId] = (userHours[userId] || 0) + (task.timeInHours || 0);
    }
  });
  
  // Get top 3 users by task count
  const topUsers = Object.entries(userTaskCounts)
    .map(([userId, taskCount]) => {
      const user = users.find(u => u.id === userId || u.userUID === userId);
      return {
        id: userId,
        name: user?.name || user?.email || 'Unknown User',
        taskCount,
        totalHours: Math.round((userHours[userId] || 0) * 10) / 10
      };
    })
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 3);
  
  return {
    topUsers,
    totalActiveUsers: Object.keys(userTaskCounts).length,
    averageTasksPerUser: Object.keys(userTaskCounts).length > 0 
      ? Math.round((tasks.length / Object.keys(userTaskCounts).length) * 10) / 10 
      : 0
  };
};

/**
 * Calculate design department metrics
 */
export const calculateDesignMetrics = (tasks = [], reporters = []) => {
  const designTasks = tasks.filter(task => task.departments === 'design');
  const totalDesignHours = designTasks.reduce((sum, task) => sum + (task.timeInHours || 0), 0);
  const designTasksWithDeliverables = designTasks.filter(task => 
    task.deliverables && task.deliverables.length > 0
  );
  
  // Get top 3 design deliverables
  const deliverableCounts = {};
  designTasksWithDeliverables.forEach(task => {
    task.deliverables.forEach(deliverable => {
      deliverableCounts[deliverable] = (deliverableCounts[deliverable] || 0) + 1;
    });
  });
  
  const topDeliverables = Object.entries(deliverableCounts)
    .map(([deliverable, count]) => ({ deliverable, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get AI usage for design tasks
  const designAITasks = designTasks.filter(task => task.usedAI || (task.aiModels && task.aiModels.length > 0));
  const designAIHours = designAITasks.reduce((sum, task) => sum + (task.aiTime || 0), 0);
  
  // Get top AI models used in design
  const aiModelCounts = {};
  designAITasks.forEach(task => {
    if (task.aiModels && task.aiModels.length > 0) {
      task.aiModels.forEach(model => {
        aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
      });
    }
  });
  
  const topAIModels = Object.entries(aiModelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get markets for design tasks
  const marketCounts = {};
  designTasks.forEach(task => {
    if (task.markets && task.markets.length > 0) {
      task.markets.forEach(market => {
        marketCounts[market] = (marketCounts[market] || 0) + 1;
      });
    }
  });
  
  const topMarkets = Object.entries(marketCounts)
    .map(([market, count]) => ({ market, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get top reporters for design tasks
  const reporterCounts = {};
  designTasks.forEach(task => {
    if (task.reporters) {
      reporterCounts[task.reporters] = (reporterCounts[task.reporters] || 0) + 1;
    }
  });
  
  const topReporters = Object.entries(reporterCounts)
    .map(([reporterId, count]) => {
      const reporter = reporters.find(r => r.id === reporterId || r.reporterUID === reporterId);
      return {
        id: reporterId,
        name: reporter?.name || 'Unknown Reporter',
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    totalDesignTasks: designTasks.length,
    totalDesignHours: Math.round(totalDesignHours * 10) / 10,
    tasksWithDeliverables: designTasksWithDeliverables.length,
    topDeliverables,
    averageHoursPerDesignTask: designTasks.length > 0 
      ? Math.round((totalDesignHours / designTasks.length) * 10) / 10 
      : 0,
    // New AI data
    aiTasks: designAITasks.length,
    aiHours: Math.round(designAIHours * 10) / 10,
    topAIModels,
    // New market data
    topMarkets,
    // New reporter data
    topReporters
  };
};

/**
 * Calculate AI usage metrics
 */
export const calculateAIMetrics = (tasks = []) => {
  const aiTasks = tasks.filter(task => task.usedAI || (task.aiModels && task.aiModels.length > 0));
  const totalAIHours = aiTasks.reduce((sum, task) => sum + (task.aiTime || 0), 0);
  
  // Get top 3 AI models
  const aiModelCounts = {};
  aiTasks.forEach(task => {
    if (task.aiModels && task.aiModels.length > 0) {
      task.aiModels.forEach(model => {
        aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
      });
    }
  });
  
  const topAIModels = Object.entries(aiModelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    totalAITasks: aiTasks.length,
    totalAIHours: Math.round(totalAIHours * 10) / 10,
    topAIModels,
    aiUsagePercentage: tasks.length > 0 
      ? Math.round((aiTasks.length / tasks.length) * 100) 
      : 0,
    averageAIHoursPerTask: aiTasks.length > 0 
      ? Math.round((totalAIHours / aiTasks.length) * 10) / 10 
      : 0
  };
};

/**
 * Calculate market metrics
 */
export const calculateMarketMetrics = (tasks = []) => {
  // Get all markets from tasks
  const marketCounts = {};
  tasks.forEach(task => {
    if (task.markets && task.markets.length > 0) {
      task.markets.forEach(market => {
        marketCounts[market] = (marketCounts[market] || 0) + 1;
      });
    }
  });
  
  const topMarkets = Object.entries(marketCounts)
    .map(([market, count]) => ({ market, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    topMarkets,
    totalActiveMarkets: Object.keys(marketCounts).length,
    totalMarketEntries: Object.values(marketCounts).reduce((sum, count) => sum + count, 0)
  };
};

/**
 * Calculate product metrics
 */
export const calculateProductMetrics = (tasks = []) => {
  // Get all products from tasks
  const productCounts = {};
  tasks.forEach(task => {
    if (task.products) {
      productCounts[task.products] = (productCounts[task.products] || 0) + 1;
    }
  });
  
  const topProducts = Object.entries(productCounts)
    .map(([product, count]) => ({ product, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    topProducts,
    totalActiveProducts: Object.keys(productCounts).length,
    totalProductEntries: Object.values(productCounts).reduce((sum, count) => sum + count, 0)
  };
};

/**
 * Calculate video department metrics
 */
export const calculateVideoMetrics = (tasks = [], reporters = []) => {
  const videoTasks = tasks.filter(task => task.departments === 'video');
  const totalVideoHours = videoTasks.reduce((sum, task) => sum + (task.timeInHours || 0), 0);
  
  // Get AI usage for video tasks
  const videoAITasks = videoTasks.filter(task => task.usedAI || (task.aiModels && task.aiModels.length > 0));
  const videoAIHours = videoAITasks.reduce((sum, task) => sum + (task.aiTime || 0), 0);
  
  // Get top AI models used in video
  const aiModelCounts = {};
  videoAITasks.forEach(task => {
    if (task.aiModels && task.aiModels.length > 0) {
      task.aiModels.forEach(model => {
        aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
      });
    }
  });
  
  const topAIModels = Object.entries(aiModelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get markets for video tasks
  const marketCounts = {};
  videoTasks.forEach(task => {
    if (task.markets && task.markets.length > 0) {
      task.markets.forEach(market => {
        marketCounts[market] = (marketCounts[market] || 0) + 1;
      });
    }
  });
  
  const topMarkets = Object.entries(marketCounts)
    .map(([market, count]) => ({ market, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get top reporters for video tasks
  const reporterCounts = {};
  videoTasks.forEach(task => {
    if (task.reporters) {
      reporterCounts[task.reporters] = (reporterCounts[task.reporters] || 0) + 1;
    }
  });
  
  const topReporters = Object.entries(reporterCounts)
    .map(([reporterId, count]) => {
      const reporter = reporters.find(r => r.id === reporterId || r.reporterUID === reporterId);
      return {
        id: reporterId,
        name: reporter?.name || 'Unknown Reporter',
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    totalVideoTasks: videoTasks.length,
    totalVideoHours: Math.round(totalVideoHours * 10) / 10,
    averageHoursPerVideoTask: videoTasks.length > 0 
      ? Math.round((totalVideoHours / videoTasks.length) * 10) / 10 
      : 0,
    // New AI data
    aiTasks: videoAITasks.length,
    aiHours: Math.round(videoAIHours * 10) / 10,
    topAIModels,
    // New market data
    topMarkets,
    // New reporter data
    topReporters
  };
};

/**
 * Calculate developer department metrics
 */
export const calculateDeveloperMetrics = (tasks = [], reporters = []) => {
  const devTasks = tasks.filter(task => task.departments === 'developer');
  const totalDevHours = devTasks.reduce((sum, task) => sum + (task.timeInHours || 0), 0);
  
  // Get AI usage for dev tasks
  const devAITasks = devTasks.filter(task => task.usedAI || (task.aiModels && task.aiModels.length > 0));
  const devAIHours = devAITasks.reduce((sum, task) => sum + (task.aiTime || 0), 0);
  
  // Get top AI models used in development
  const aiModelCounts = {};
  devAITasks.forEach(task => {
    if (task.aiModels && task.aiModels.length > 0) {
      task.aiModels.forEach(model => {
        aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
      });
    }
  });
  
  const topAIModels = Object.entries(aiModelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get markets for dev tasks
  const marketCounts = {};
  devTasks.forEach(task => {
    if (task.markets && task.markets.length > 0) {
      task.markets.forEach(market => {
        marketCounts[market] = (marketCounts[market] || 0) + 1;
      });
    }
  });
  
  const topMarkets = Object.entries(marketCounts)
    .map(([market, count]) => ({ market, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get top reporters for dev tasks
  const reporterCounts = {};
  devTasks.forEach(task => {
    if (task.reporters) {
      reporterCounts[task.reporters] = (reporterCounts[task.reporters] || 0) + 1;
    }
  });
  
  const topReporters = Object.entries(reporterCounts)
    .map(([reporterId, count]) => {
      const reporter = reporters.find(r => r.id === reporterId || r.reporterUID === reporterId);
      return {
        id: reporterId,
        name: reporter?.name || 'Unknown Reporter',
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return {
    totalDevTasks: devTasks.length,
    totalDevHours: Math.round(totalDevHours * 10) / 10,
    averageHoursPerDevTask: devTasks.length > 0 
      ? Math.round((totalDevHours / devTasks.length) * 10) / 10 
      : 0,
    // New AI data
    aiTasks: devAITasks.length,
    aiHours: Math.round(devAIHours * 10) / 10,
    topAIModels,
    // New market data
    topMarkets,
    // New reporter data
    topReporters
  };
};

/**
 * Generate chart data for time-based trends
 */
export const generateChartData = (tasks = [], days = 7) => {
  const chartData = [];
  const now = new Date();
  
  // Generate data for the last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Count tasks created on this date
    const tasksOnDate = tasks.filter(task => {
      if (!task.createdAt) return false;
      
      // Handle different date formats
      let taskDate;
      try {
        // If it's already a Date object
        if (task.createdAt instanceof Date) {
          taskDate = task.createdAt;
        }
        // If it's a timestamp object (Firebase)
        else if (task.createdAt.seconds) {
          taskDate = new Date(task.createdAt.seconds * 1000);
        }
        // If it's a string or number
        else {
          taskDate = new Date(task.createdAt);
        }
        
        // Check if the date is valid
        if (isNaN(taskDate.getTime())) {
          return false;
        }
        
        return taskDate.toISOString().split('T')[0] === dateStr;
      } catch (error) {
        // If any error occurs, skip this task
        return false;
      }
    });
    
    chartData.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: tasksOnDate.length,
      date: dateStr
    });
  }
  
  return chartData;
};

/**
 * Calculate trend data (comparing current vs previous period)
 */
export const calculateTrend = (currentValue, previousValue) => {
  if (previousValue === 0) {
    return currentValue > 0 ? { direction: 'up', percentage: 100 } : { direction: 'neutral', percentage: 0 };
  }
  
  const percentage = Math.round(((currentValue - previousValue) / previousValue) * 100);
  const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
  
  return { direction, percentage: Math.abs(percentage) };
};

/**
 * Get color for metric type (same as homepage)
 */
export const getMetricColor = (type) => {
  switch (type) {
    case "total-tasks":
      return "#67C090";
    case "total-hours":
      return "#33A1E0";
    case "ai-tasks":
      return "#e31769";
    case "design":
      return "#eb2743";
    case "video":
      return "#8B5CF6";
    case "developer":
      return "#F59E0B";
    case "reporters":
      return "#10B981";
    case "users":
      return "#3B82F6";
    case "markets":
      return "#EF4444";
    case "products":
      return "#8B5CF6";
    default:
      return "#3d48c9";
  }
};
