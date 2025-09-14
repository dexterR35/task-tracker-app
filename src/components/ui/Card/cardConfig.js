import { Icons } from "@/components/icons";

// Helper function to create top 3 header
const createTop3Header = (label) => ({
  icon: Icons.buttons.submit,
  label,
  value: "",
  subValue: "",
  isHeader: true
});

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
  const header = createTop3Header(headerLabel);
  const top3Entities = calculateTop3Entities(tasks, entities, entityIdField, entityNameField);
  return [header, ...top3Entities];
};

// Card configuration system for dynamic card generation
export const CARD_TYPES = {
  TASKS: 'tasks',
  USERS: 'users', 
  REPORTERS: 'reporters',
  REPORTER_METRICS: 'reporter-metrics',
  PERIOD: 'period',
  USER_FILTER: 'user-filter',
  CURRENT_USER: 'current-user',
  SELECTED_USER: 'selected-user',
  ANALYTICS: 'analytics',
  MANAGEMENT: 'management'
};

// Card configuration templates
export const CARD_CONFIGS = {
  [CARD_TYPES.TASKS]: {
    title: "Tasks",
    subtitle: "Current Period",
    description: "Tasks in current period",
    icon: Icons.buttons.submit,
    type: "tasks",
    color: "green",
    getValue: (data) => data.tasks?.length?.toString() || "0",
    getStatus: (data) => data.isCurrentMonth ? "Current" : "Historical",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      // ALWAYS use global tasks data, never filtered data
      const tasks = data.tasks || [];
      const users = data.users || [];
      
      // Top 3 Markets section (always show all markets)
      const top3MarketsHeader = createTop3Header("Top 3 Markets");
      
      // Count tasks per market (using global data only)
      const marketTaskCounts = {};
      tasks.forEach(task => {
        const taskMarkets = task.markets || task.data_task?.markets || [];
        if (Array.isArray(taskMarkets)) {
          taskMarkets.forEach(market => {
            if (market) {
              marketTaskCounts[market] = (marketTaskCounts[market] || 0) + 1;
            }
          });
        }
      });
      
      // Get top 3 markets by task count (global data only)
      const top3Markets = Object.entries(marketTaskCounts)
        .sort(([,a], [,b]) => b - a) // Sort by task count descending
        .slice(0, 3) // Get top 3
        .map(([market, taskCount]) => ({
          icon: Icons.buttons.submit,
          label: market,
          value: `${taskCount} task${taskCount !== 1 ? 's' : ''}`,
          subValue: ""
        }));
      
      // Top 3 Users section (always show all users - global data only)
      const top3UsersSection = createTop3Section(tasks, users, 'userUID', 'name', "Top 3 Users");
      
      return [top3MarketsHeader, ...top3Markets, ...top3UsersSection];
    }
  },

  [CARD_TYPES.REPORTERS]: {
    title: "Reporters",
    subtitle: "Task Assignments",
    description: "Reporter workload breakdown with markets",
    icon: Icons.generic.user,
    type: "reporters",
    color: "purple",
    getValue: (data) => data.reporterMetrics?.totalReporters?.toString() || "0",
    getStatus: (data) => data.reporterMetrics?.isFiltered ? "Filtered" : "All Tasks",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      // ALWAYS use global tasks data, never filtered data
      const tasks = data.tasks || [];
      const reporters = data.reporters || [];
      
      // Top 3 Reporters section (always show all reporters - global data only)
      return createTop3Section(tasks, reporters, 'reporters', 'name', "Top 3 Reporters");
    }
  },

  [CARD_TYPES.USERS]: {
    title: "Users",
    subtitle: "User Accounts",
    description: "Manage user accounts and permissions",
    icon: Icons.admin.users,
    type: "users",
    color: "blue",
    getValue: (data) => data.users?.length?.toString() || "0",
    getStatus: (data) => data.activeTab === 'users' ? "Active" : "Available",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      const top3Header = {
        icon: Icons.admin.users,
        label: "Top 3 Users",
        value: "",
        subValue: "",
        isHeader: true
      };
      
      // Get top 3 users by task count
      const userTaskCounts = {};
      const tasks = data.tasks || [];
      
      // Count tasks per user
      tasks.forEach(task => {
        const userId = task.userUID || task.createbyUID;
        if (userId) {
          if (!userTaskCounts[userId]) {
            userTaskCounts[userId] = {
              userId,
              taskCount: 0,
              marketCounts: {}
            };
          }
          userTaskCounts[userId].taskCount++;
          
          // Count markets for this user
          const taskMarkets = task.markets || task.data_task?.markets || [];
          if (Array.isArray(taskMarkets)) {
            taskMarkets.forEach(market => {
              if (market) {
                userTaskCounts[userId].marketCounts[market] = 
                  (userTaskCounts[userId].marketCounts[market] || 0) + 1;
              }
            });
          }
        }
      });
      
      // Get user names and format top 3
      const top3Users = Object.values(userTaskCounts)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3)
        .map(userData => {
          const user = data.users?.find(u => u.id === userData.userId || u.uid === userData.userId);
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
            subValue: marketEntries || 'No markets'
          };
        });
      
      return [top3Header, ...top3Users];
    }
  },

  [CARD_TYPES.PERIOD]: {
    title: "Period",
    subtitle: "Active Month",
    description: "Current management period",
    icon: Icons.generic.clock,
    type: "period",
    color: "yellow",
    getValue: (data) => data.periodName || "N/A",
    getStatus: (data) => "Current",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      const top3Header = {
        icon: Icons.generic.clock,
        label: "Top 3 Periods",
        value: "",
        subValue: "",
        isHeader: true
      };
      
      const periodDetails = [
        {
          icon: Icons.generic.clock,
          label: "Month",
          value: data.periodName || "N/A"
        },
        {
          icon: Icons.generic.target,
          label: "ID",
          value: data.periodId || "N/A"
        }
      ];
      
      return [top3Header, ...periodDetails];
    }
  },

  [CARD_TYPES.USER_FILTER]: {
    title: "User Filter",
    subtitle: "Selected User",
    description: "Currently viewing",
    icon: Icons.generic.user,
    type: "period",
    getValue: (data) => data.selectedUserName || "All Users",
    getStatus: (data) => "Filtered",
    getDetails: (data) => [
      {
        icon: Icons.generic.user,
        label: "User",
        value: data.selectedUserName || "All Users"
      },
      {
        icon: Icons.buttons.submit,
        label: "Tasks",
        value: data.filteredTasks?.length?.toString() || "0"
      }
    ]
  },

  [CARD_TYPES.CURRENT_USER]: {
    title: "Current User",
    subtitle: "Logged In",
    description: "Your profile information",
    icon: Icons.generic.user,
    type: "users",
    getValue: (data) => data.currentUser?.name || data.currentUser?.email || "Unknown",
    getStatus: (data) => data.currentUser?.role || "User",
    getDetails: (data) => [
      {
        icon: Icons.generic.user,
        label: "Name",
        value: data.currentUser?.name || "N/A"
      },
      {
        icon: Icons.generic.target,
        label: "Role",
        value: data.currentUser?.role || "User"
      }
    ]
  },

  [CARD_TYPES.SELECTED_USER]: {
    title: "Selected User",
    subtitle: "User Details",
    description: "Selected user's task and market breakdown",
    icon: Icons.generic.user,
    type: "users",
    color: "blue",
    getValue: (data) => data.selectedUserName || "No User Selected",
    getStatus: (data) => "Filtered",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      const tasks = data.tasks || [];
      const reporters = data.reporters || [];
      const selectedUserId = data.selectedUserId;
      
      if (!selectedUserId) {
        return [{
          icon: Icons.generic.user,
          label: "No user selected",
          value: "Select a user to see details",
          subValue: ""
        }];
      }
      
      // Filter tasks for selected user
      const userTasks = tasks.filter(task => 
        task.userUID === selectedUserId || task.createbyUID === selectedUserId
      );
      
      // User's Markets section
      const userMarketsHeader = createTop3Header("User's Markets");
      
      // Count markets for this user
      const userMarketCounts = {};
      userTasks.forEach(task => {
        const taskMarkets = task.markets || task.data_task?.markets || [];
        if (Array.isArray(taskMarkets)) {
          taskMarkets.forEach(market => {
            if (market) {
              userMarketCounts[market] = (userMarketCounts[market] || 0) + 1;
            }
          });
        }
      });
      
      // Get user's top 3 markets with task counts
      const userMarkets = Object.entries(userMarketCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3) // Top 3 markets only
        .map(([market, taskCount]) => ({
          icon: Icons.buttons.submit,
          label: market,
          value: `${taskCount} task${taskCount !== 1 ? 's' : ''}`,
          subValue: "" // No badges, just clean display
        }));
      
      // User's Reporters section - only reporters that exist in user's tasks
      const userReportersHeader = createTop3Header("User's Reporters");
      
      // Get only reporters that are assigned to this user's tasks
      const userReporterIds = new Set();
      userTasks.forEach(task => {
        const taskReporterId = task.reporters || task.data_task?.reporters;
        if (taskReporterId) {
          userReporterIds.add(taskReporterId);
        }
      });
      
      // Filter reporters to only those assigned to user's tasks
      const userReporters = reporters.filter(reporter => 
        userReporterIds.has(reporter.id || reporter.uid)
      );
      
      // Calculate top 3 reporters for this user
      const userReportersSection = createTop3Section(userTasks, userReporters, 'reporters', 'name', "User's Reporters");
      
      return [userMarketsHeader, ...userMarkets, ...userReportersSection];
    }
  }
};

// Card factory function to generate cards dynamically
export const createCard = (cardType, data, customConfig = {}) => {
  const config = CARD_CONFIGS[cardType];
  if (!config) {
    console.warn(`Card type ${cardType} not found`);
    return null;
  }

  // Generate dynamic ID based on card type and data
  const generateId = () => {
    switch (cardType) {
      case CARD_TYPES.TASKS:
        return `tasks-${data.tasks?.length || 0}-${data.periodId || 'unknown'}-${data.isCurrentMonth ? 'current' : 'historical'}`;
      case CARD_TYPES.REPORTERS:
        const activeReporters = data.reporters?.filter(r => r.status !== 'inactive')?.length || 0;
        return `reporters-${data.reporters?.length || 0}-${activeReporters}-${data.isUserAdmin ? 'admin' : 'user'}`;
      case CARD_TYPES.USERS:
        const activeUsers = data.users?.filter(u => u.status !== 'inactive')?.length || 0;
        return `users-${data.users?.length || 0}-${activeUsers}-${data.activeTab === 'users' ? 'active' : 'inactive'}`;
      case CARD_TYPES.PERIOD:
        return `period-${data.periodId || 'unknown'}-${data.periodName?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-${new Date().getTime()}`;
      case CARD_TYPES.USER_FILTER:
        return `user-filter-${data.selectedUserId || 'all'}-${data.filteredTasks?.length || 0}-${new Date().getTime()}`;
      case CARD_TYPES.CURRENT_USER:
        return `current-user-${data.currentUser?.id || 'unknown'}-${data.currentUser?.role || 'user'}-${new Date().getTime()}`;
      default:
        return `${cardType}-${new Date().getTime()}`;
    }
  };

  return {
    id: generateId(),
    title: customConfig.title || config.title,
    subtitle: customConfig.subtitle || (config.getSubtitle ? config.getSubtitle(data) : config.subtitle),
    description: customConfig.description || config.description,
    icon: customConfig.icon || config.icon,
    type: customConfig.type || config.type,
    color: customConfig.color || config.color || 'default',
    value: config.getValue(data),
    status: config.getStatus(data),
    details: config.getDetails(data),
    // Only include action if explicitly provided in customConfig
    ...(customConfig.action && { action: customConfig.action }),
    // Only include progress if explicitly provided in customConfig
    ...(customConfig.progress !== undefined && { progress: customConfig.progress }),
    hasChart: customConfig.hasChart || false,
    chartData: customConfig.chartData,
    chartType: customConfig.chartType
  };
};

// Helper function to create multiple cards from configuration
export const createCards = (cardConfigs, data) => {
  return cardConfigs
    .map(config => {
      if (typeof config === 'string') {
        return createCard(config, data);
      } else if (typeof config === 'object' && config.type) {
        return createCard(config.type, data, config);
      }
      return null;
    })
    .filter(card => card !== null);
};

// Predefined card sets for common use cases
export const CARD_SETS = {
  DASHBOARD: [
    CARD_TYPES.TASKS,
    CARD_TYPES.REPORTERS
  ],

  DASHBOARD_WITH_USER: [
    CARD_TYPES.TASKS,
    CARD_TYPES.REPORTERS,
    CARD_TYPES.SELECTED_USER // Show when user is selected
  ],

  MANAGEMENT: [
    CARD_TYPES.USERS,
    CARD_TYPES.REPORTERS,
    CARD_TYPES.PERIOD
  ],

  USER_DASHBOARD: [
    CARD_TYPES.TASKS,
    CARD_TYPES.CURRENT_USER
  ],

  ANALYTICS: [
    CARD_TYPES.TASKS,
    CARD_TYPES.REPORTERS,
    CARD_TYPES.USERS,
    CARD_TYPES.PERIOD
  ]
};
