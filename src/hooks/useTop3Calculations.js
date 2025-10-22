import { Icons } from "@/components/icons";
import { API_CONFIG } from "@/constants";


// Helper function to create "No data" entry
const createNoDataEntry = (icon, label) => ({
  icon,
  label,
  value: "No data",
  subValue: ""
});

// Helper function to calculate top 3 items with counts and add "No data" if empty
const calculateTop3WithNoData = (counts, icon, noDataLabel, limit = 3) => {
  const items = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([item, count]) => ({
      icon,
      label: item,
      value: `${count} task${count !== 1 ? 's' : ''}`,
      subValue: ""
    }));

  // Add "No data" if no items
  if (items.length === 0) {
    items.push(createNoDataEntry(icon, noDataLabel));
  }

  return items;
};

// Helper function to extract field from task (handles both root and data_task levels)
const getTaskField = (task, field) => {
  return task[field] || task.data_task?.[field];
};

// Helper function to extract array field from task
const getTaskArrayField = (task, field) => {
  const value = getTaskField(task, field);
  return Array.isArray(value) ? value : [];
};

// Reusable function to calculate top 3 entities with task counts and markets
const calculateTop3Entities = (tasks = [], entities = [], entityIdField, entityNameField) => {
  const entityTaskCounts = {};

  // Initialize all entities with 0 tasks
  entities.forEach(entity => {
    const entityId = entity.id || entity.uid;
    if (entityId) {
      entityTaskCounts[entityId] = {
        entityId,
        taskCount: 0,
        marketCounts: {}
      };
    }
  });

  // Count tasks per entity
  tasks.forEach(task => {
    let entityId;

    // Handle different field structures
    if (entityIdField === 'reporters') {
      // For reporters, check both root level and data_task level
      entityId = task.reporters || task.data_task?.reporters;
    } else {
      // For users, check both userUID and createbyUID
      entityId = task[entityIdField] || task.createbyUID;
    }

    if (entityId && entityTaskCounts[entityId]) {
      entityTaskCounts[entityId].taskCount++;

      // Count markets for this entity
      const taskMarkets = task.markets || task.data_task?.markets || [];
      if (Array.isArray(taskMarkets)) {
        taskMarkets.forEach(market => {
          if (market) {
            entityTaskCounts[entityId].marketCounts[market] =
              (entityTaskCounts[entityId].marketCounts[market] || 0) + 1;
          }
        });
      }
    }
  });

  // Get top 3 entities by task count
  return Object.values(entityTaskCounts)
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 3)
    .map(entityData => {
      const entity = entities.find(e => e.id === entityData.entityId || e.uid === entityData.entityId);
      const entityName = entity?.[entityNameField] || entity?.name || entity?.email || `Entity ${entityData.entityId}`;

      // Format market counts as badges
      const marketEntries = Object.entries(entityData.marketCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([market, count]) => {
          if (count === 1) {
            return market;
          } else {
            return `${count}x${market}`;
          }
        })
        .join(' ');

      return {
        icon: Icons.generic.user,
        label: entityName,
        value: `${entityData.taskCount} task${entityData.taskCount !== 1 ? 's' : ''}`,
        subValue: marketEntries || 'No markets'
      };
    });
};

// Helper function to create top 3 section with header and entities
const createTop3Section = (tasks, entities, entityIdField, entityNameField, headerLabel) => {
  const header = {
    icon: Icons.generic.user,
    label: headerLabel,
    value: "",
    subValue: "",
    isHeader: true
  };
  const top3Entities = calculateTop3Entities(tasks, entities, entityIdField, entityNameField);
  return [header, ...top3Entities];
};

/**
 * Custom hook for calculating all top 3 metrics across different card types
 * @param {Object} data - The data object containing tasks, users, reporters, etc.
 * @param {Object} options - Additional options for filtering and customization
 * @returns {Object} Object containing all calculated top 3 metrics
 */
export const useTop3Calculations = (data, options = {}) => {
  const {
    selectedUserId = null,
    selectedReporterId = null,
    selectedMonthId = null,
    department = null,
    limit = 3,
    includeAllData = false // For selected user card that needs all products/markets
  } = options;

  // Early return if no data
  const tasks = data.tasks || [];
  const users = data.users || [];
  const reporters = data.reporters || [];

  if (!tasks.length) {
    return {
      totalHours: 0,
      totalAIHours: 0,
      top3Markets: [],
      top3AIModels: [],
      top3Products: [],
      top3Users: [],
      top3Reporters: [],
      departmentMetrics: {},
      productMarketCombinations: {},
      sections: {
        totalHours: [],
        top3Markets: [],
        top3AIModels: [],
        top3Products: [],
        top3Users: [],
        top3Reporters: [],
        allUsers: []
      }
    };
  }

  // Filter tasks based on options - optimized single pass filtering with limit
  const filteredTasks = tasks.filter(task => {
    // Filter by month ID
    if (selectedMonthId && task.monthId !== selectedMonthId) {
      return false;
    }

    // Filter by user ID
    if (selectedUserId && task.userUID !== selectedUserId && task.createbyUID !== selectedUserId) {
      return false;
    }

    // Filter by reporter ID (exact case)
    if (selectedReporterId &&
        task.reporters !== selectedReporterId &&
        task.data_task?.reporters !== selectedReporterId) {
      return false;
    }

    // Filter by department
    if (department) {
      const taskDepartment = task.data_task?.departments || task.departments;

      // Handle both array and string formats
      if (Array.isArray(taskDepartment)) {
        if (!taskDepartment.some(dept => dept === department)) {
          return false;
        }
      } else if (taskDepartment !== department) {
        return false;
      }
    }

    return true;
  }).slice(0, API_CONFIG.REQUEST_LIMITS.TOP_3_LIMIT);

  // Calculate total hours
  const totalHours = filteredTasks.reduce((sum, task) =>
    sum + (task.timeInHours || task.data_task?.timeInHours || 0), 0
  );
  const totalAIHours = filteredTasks.reduce((sum, task) =>
    sum + (task.aiTime || task.data_task?.aiTime || 0), 0
  );

  // Calculate top 3 markets
  const marketTaskCounts = {};
  filteredTasks.forEach(task => {
    const taskMarkets = getTaskArrayField(task, 'markets');
    taskMarkets.forEach(market => {
      if (market) {
        marketTaskCounts[market] = (marketTaskCounts[market] || 0) + 1;
      }
    });
  });

  const top3Markets = Object.entries(marketTaskCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3) // Limit to top 3 markets
    .map(([market, taskCount]) => ({
      icon: Icons.generic.trendingUp,
      label: market,
      value: `${taskCount} task${taskCount !== 1 ? 's' : ''}`,
      subValue: ""
    }));

  // Calculate top 3 AI models
  const aiModelCounts = {};
  filteredTasks.forEach(task => {
    const aiModels = getTaskArrayField(task, 'aiModels');
    aiModels.forEach(model => {
      if (model) {
        aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
      }
    });
  });

  const top3AIModels = calculateTop3WithNoData(
    aiModelCounts,
    Icons.generic.cpu,
    "No AI models used",
    3 // Limit to top 3 AI models
  );

  // Calculate top 3 products
  const productCounts = {};
  filteredTasks.forEach(task => {
    const product = getTaskField(task, 'products');
    if (product) {
      productCounts[product] = (productCounts[product] || 0) + 1;
    }
  });

  const top3Products = calculateTop3WithNoData(
    productCounts,
    Icons.generic.package,
    "No products worked on",
    3 // Limit to top 3 products
  );

  // Calculate top 3 users
  const userTaskCounts = {};
  filteredTasks.forEach(task => {
    const userId = task.userUID || task.createbyUID;
    if (userId) {
      if (!userTaskCounts[userId]) {
        userTaskCounts[userId] = {
          userId,
          taskCount: 0,
          totalHours: 0,
          marketCounts: {}
        };
      }
      userTaskCounts[userId].taskCount++;

      // Add hours for this task
      const taskHours = task.timeInHours || task.data_task?.timeInHours || 0;
      userTaskCounts[userId].totalHours += taskHours;

      // Count markets for this user
      const taskMarkets = getTaskArrayField(task, 'markets');
      taskMarkets.forEach(market => {
        if (market) {
          userTaskCounts[userId].marketCounts[market] =
            (userTaskCounts[userId].marketCounts[market] || 0) + 1;
        }
      });
    }
  });

  // Get unique user IDs from tasks
  const taskUserIds = [...new Set(filteredTasks.map(task => task.userUID || task.createbyUID).filter(Boolean))];
  const usersWithTasks = users.filter(user => taskUserIds.includes(user.id || user.uid));

  const top3Users = Object.values(userTaskCounts)
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 3) // Limit to top 3 users
    .map(userData => {
      const user = usersWithTasks.find(u => u.id === userData.userId || u.uid === userData.userId);
      const userName = user?.name || user?.email || `User ${userData.userId}`;

      // Format market counts
      const marketEntries = Object.entries(userData.marketCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([market, count]) => {
          if (count === 1) {
            return market;
          } else {
            return `${count}x${market}`;
          }
        })
        .join(' ');

      return {
        icon: Icons.generic.user,
        label: userName,
        value: `${userData.taskCount} task${userData.taskCount !== 1 ? 's' : ''}`,
        subValue: marketEntries || 'No markets',
        hoursValue: `${userData.totalHours}h`
      };
    });

  // Calculate top 3 reporters
  const reporterTaskCounts = {};
  filteredTasks.forEach(task => {
    const reporterId = getTaskField(task, 'reporters');
    if (reporterId) {
      if (!reporterTaskCounts[reporterId]) {
        reporterTaskCounts[reporterId] = {
          reporterId,
          taskCount: 0,
          marketCounts: {}
        };
      }
      reporterTaskCounts[reporterId].taskCount++;

      // Count markets for this reporter
      const taskMarkets = getTaskArrayField(task, 'markets');
      taskMarkets.forEach(market => {
        if (market) {
          reporterTaskCounts[reporterId].marketCounts[market] =
            (reporterTaskCounts[reporterId].marketCounts[market] || 0) + 1;
        }
      });
    }
  });

  // Get unique reporter IDs from tasks
  const taskReporterIds = [...new Set(filteredTasks.map(task => getTaskField(task, 'reporters')).filter(Boolean))];
  const reportersWithTasks = reporters.filter(reporter => taskReporterIds.includes(reporter.id || reporter.uid));

  const top3Reporters = Object.values(reporterTaskCounts)
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 3) // Limit to top 3 reporters
    .map(reporterData => {
      const reporter = reportersWithTasks.find(r => r.id === reporterData.reporterId || r.uid === reporterData.reporterId);
      const reporterName = reporter?.name || reporter?.reporterName || `Reporter ${reporterData.reporterId}`;

      // Format market counts
      const marketEntries = Object.entries(reporterData.marketCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([market, count]) => {
          if (count === 1) {
            return market;
          } else {
            return `${count}x${market}`;
          }
        })
        .join(' ');

      return {
        icon: Icons.admin.reporters,
        label: reporterName,
        value: `${reporterData.taskCount} task${reporterData.taskCount !== 1 ? 's' : ''}`,
        subValue: marketEntries || 'No markets'
      };
    });

  // Calculate product-market combinations (for selected user card)
  const productMarketCombinations = {};
  filteredTasks.forEach(task => {
    const product = getTaskField(task, 'products');
    const taskMarkets = getTaskArrayField(task, 'markets');

    if (product && taskMarkets.length > 0) {
      if (!productMarketCombinations[product]) {
        productMarketCombinations[product] = {
          markets: {},
          totalTasks: 0
        };
      }

      productMarketCombinations[product].totalTasks++;
      taskMarkets.forEach(market => {
        if (market) {
          productMarketCombinations[product].markets[market] = (productMarketCombinations[product].markets[market] || 0) + 1;
        }
      });
    }
  });

  // Calculate department-specific metrics
  const departmentMetrics = {};
  if (department) {
    departmentMetrics.totalTasks = filteredTasks.length;
    departmentMetrics.totalHours = totalHours;
    departmentMetrics.totalAIHours = totalAIHours;
  }

  // Create formatted sections for easy use in cards
  const sections = {
    totalHours: [
      {
        icon: Icons.generic.clock,
        label: "Total Hours",
        value: "",
        subValue: "",
        isHeader: true
      },
      {
        icon: Icons.generic.clock,
        label: "Total Hours",
        value: `${totalHours}h`,
        subValue: ""
      },
      {
        icon: Icons.generic.ai,
        label: "Total AI Hours",
        value: `${totalAIHours}h`,
        subValue: ""
      }
    ],
    top3Markets: [
      {
        icon: Icons.generic.trendingUp,
        label: "Top 3 Markets",
        value: "",
        subValue: "",
        isHeader: true
      },
      ...top3Markets
    ],
    top3AIModels: [
      {
        icon: Icons.generic.ai,
        label: "Top AI Models",
        value: "",
        subValue: "",
        isHeader: true
      },
      ...top3AIModels
    ],
    top3Products: [
      {
        icon: Icons.generic.package,
        label: "Top 3 Products",
        value: "",
        subValue: "",
        isHeader: true
      },
      ...top3Products
    ],
    top3Users: [
      {
        icon: Icons.generic.user,
        label: "Top 3 Users",
        value: "",
        subValue: "",
        isHeader: true
      },
      ...top3Users
    ],
    top3Reporters: [
      {
        icon: Icons.admin.reporters,
        label: "Top 3 Reporters",
        value: "",
        subValue: "",
        isHeader: true
      },
      ...top3Reporters
    ],
    allUsers: [
      {
        icon: Icons.generic.user,
        label: "All Users",
        value: "",
        subValue: "",
        isHeader: true
      },
      ...top3Users
    ]
  };

  // Add department-specific sections if applicable
  if (department) {
    sections.departmentStats = [
      {
        icon: Icons.generic.clock,
        label: "Total Hours",
        value: "",
        subValue: "",
        isHeader: true
      },
      {
        icon: Icons.generic[department] || Icons.generic.task,
        label: "Total Tasks",
        value: departmentMetrics.totalTasks.toString(),
        subValue: ""
      },
      {
        icon: Icons.generic.ai,
        label: "Total AI Hours",
        value: `${departmentMetrics.totalAIHours}h`,
        subValue: ""
      },
      {
        icon: Icons.generic.clock,
        label: "Total Hours",
        value: `${departmentMetrics.totalHours}h`,
        subValue: ""
      }
    ];
  }

  return {
    // Raw data
    totalHours,
    totalAIHours,
    top3Markets,
    top3AIModels,
    top3Products,
    top3Users,
    top3Reporters,
    departmentMetrics,
    productMarketCombinations, // For selected user card

    // Formatted sections ready for cards
    sections,

    // Helper functions for custom combinations
    createNoDataEntry,
    calculateTop3WithNoData,
    createTop3Section
  };
};

export default useTop3Calculations;
