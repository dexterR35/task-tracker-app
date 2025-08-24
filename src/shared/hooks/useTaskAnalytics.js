import { useMemo } from "react";
import { useSubscribeToMonthTasksQuery } from "../../features/tasks/tasksApi";

// Analytics calculation types
export const ANALYTICS_TYPES = {
  TOTAL_TASKS: "total-tasks",
  TOTAL_HOURS: "total-hours",
  TOTAL_TIME_WITH_AI: "total-time-with-ai",
  AI_TASKS: "ai-tasks",
  DEVELOPMENT: "development",
  DESIGN: "design",
  VIDEO: "video",
  USER_PERFORMANCE: "user-performance",
  MARKETS: "markets",
  PRODUCTS: "products",
};

// Task categories for filtering
export const TASK_CATEGORIES = {
  DEV: "dev",
  DESIGN: "design",
  VIDEO: "video",
};

/**
 * Custom hook for calculating task analytics
 * @param {string} monthId - The month ID
 * @param {string|null} userId - Optional user ID for filtering
 * @param {string} type - The type of analytics to calculate
 * @param {string} category - Optional category for filtering (e.g., 'dev', 'design', 'video')
 * @returns {Object} Analytics data with value, additionalData, isLoading, and error
 */
export const useTaskAnalytics = (monthId, userId = null, type, category = null) => {
  // Use the proper RTK Query hook for real-time data
  const { data: tasks = [], isLoading, error } = useSubscribeToMonthTasksQuery(
    { monthId, userId, useCache: true },
    { skip: !monthId }
  );

  const analyticsData = useMemo(() => {
    if (!monthId) {
      return { value: 0, additionalData: {}, isLoading: false, error: null };
    }

    // Filter tasks by user if userId is provided
    const filteredTasks = userId
      ? tasks.filter((task) => task.userUID === userId)
      : tasks;

    // Filter by category if specified
    const categoryFilteredTasks = category
      ? filteredTasks.filter((task) => {
          const taskName = (task.taskName || "").toLowerCase();
          return taskName === category;
        })
      : filteredTasks;

    // Calculate analytics based on type
    let value = 0;
    let additionalData = {};

    switch (type) {
      case ANALYTICS_TYPES.TOTAL_TASKS:
        value = filteredTasks.length;
        break;

      case ANALYTICS_TYPES.TOTAL_HOURS:
        value = filteredTasks.reduce(
          (sum, task) => sum + (parseFloat(task.timeInHours) || 0),
          0
        );
        break;

      case ANALYTICS_TYPES.TOTAL_TIME_WITH_AI:
        value = filteredTasks
          .filter((task) => task.aiUsed)
          .reduce((sum, task) => sum + (parseFloat(task.timeSpentOnAI) || 0), 0);
        break;

      case ANALYTICS_TYPES.AI_TASKS:
        value = filteredTasks.filter((task) => task.aiUsed).length;
        break;

      case ANALYTICS_TYPES.DEVELOPMENT:
      case ANALYTICS_TYPES.DESIGN:
      case ANALYTICS_TYPES.VIDEO:
        value = categoryFilteredTasks.length;
        const categoryHours = categoryFilteredTasks.reduce(
          (sum, task) => sum + (parseFloat(task.timeInHours) || 0),
          0
        );
        const categoryAITasks = categoryFilteredTasks.filter((task) => task.aiUsed).length;
        const categoryAIHours = categoryFilteredTasks.reduce(
          (sum, task) => sum + (task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0),
          0
        );

        additionalData = {
          totalHours: categoryHours,
          aiTasks: categoryAITasks,
          aiHours: categoryAIHours,
          avgHoursPerTask: categoryFilteredTasks.length > 0 ? categoryHours / categoryFilteredTasks.length : 0,
          aiPercentage: categoryFilteredTasks.length > 0 ? (categoryAITasks / categoryFilteredTasks.length) * 100 : 0,
          tasks: categoryFilteredTasks,
        };
        break;

      case ANALYTICS_TYPES.USER_PERFORMANCE:
        // Group tasks by user and calculate performance
        const userStats = {};
        filteredTasks.forEach((task) => {
          if (!userStats[task.userUID]) {
            userStats[task.userUID] = {
              name: task.createdByName || task.userUID,
              tasks: 0,
              hours: 0,
            };
          }
          userStats[task.userUID].tasks += 1;
          userStats[task.userUID].hours += parseFloat(task.timeInHours) || 0;
        });

        // Calculate average performance
        const users = Object.values(userStats);
        if (users.length > 0) {
          const totalTasks = users.reduce((sum, user) => sum + user.tasks, 0);
          const totalHours = users.reduce((sum, user) => sum + user.hours, 0);
          value = users.length; // Show number of users
          additionalData = {
            totalHours,
            avgHoursPerTask: totalTasks > 0 ? totalHours / totalTasks : 0,
            userStats: users,
            totalTasks,
          };
        }
        break;

      case ANALYTICS_TYPES.MARKETS:
        const marketStats = {};
        filteredTasks.forEach((task) => {
          if (Array.isArray(task.markets)) {
            task.markets.forEach((market) => {
              if (!marketStats[market]) {
                marketStats[market] = { count: 0, hours: 0 };
              }
              marketStats[market].count += 1;
              marketStats[market].hours += parseFloat(task.timeInHours) || 0;
            });
          }
        });

        const markets = Object.entries(marketStats).map(([market, stats]) => ({
          name: market,
          count: stats.count,
          hours: stats.hours,
        }));

        value = markets.length; // number of unique markets
        additionalData = { markets };
        break;

      case ANALYTICS_TYPES.PRODUCTS:
        const productStats = {};
        filteredTasks.forEach((task) => {
          if (task.product) {
            if (!productStats[task.product]) {
              productStats[task.product] = { count: 0, hours: 0 };
            }
            productStats[task.product].count += 1;
            productStats[task.product].hours += parseFloat(task.timeInHours) || 0;
          }
        });

        const products = Object.entries(productStats).map(([product, stats]) => ({
          name: product,
          count: stats.count,
          hours: stats.hours,
        }));

        value = products.length; // number of unique products
        additionalData = { products };
        break;

      default:
        value = 0;
        additionalData = {};
    }

    return {
      value,
      additionalData,
      isLoading,
      error,
      tasks: filteredTasks,
    };
  }, [tasks, monthId, userId, type, category, isLoading, error]);

  return analyticsData;
};
