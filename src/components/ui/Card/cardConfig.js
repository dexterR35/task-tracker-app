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
  MANAGEMENT: 'management',
  DEPARTMENT_VIDEO: 'department-video',
  DEPARTMENT_DESIGN: 'department-design',
  DEPARTMENT_DEV: 'department-dev'
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
      
      // Calculate total hours from all tasks
      const totalHours = tasks.reduce((sum, task) => sum + (task.timeInHours || task.data_task?.timeInHours || 0), 0);
      const totalAIHours = tasks.reduce((sum, task) => sum + (task.aiTime || task.data_task?.aiTime || 0), 0);
      
      // Calculate AI models usage
      const aiModelCounts = {};
      tasks.forEach(task => {
        const aiModels = task.aiModels || task.data_task?.aiModels || [];
        if (Array.isArray(aiModels)) {
          aiModels.forEach(model => {
            if (model) {
              aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
            }
          });
        }
      });
      
      // Get top 3 AI models by usage
      const top3AIModels = Object.entries(aiModelCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([model, count]) => ({
          icon: Icons.generic.ai,
          label: model,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));
      
      // Calculate products usage
      const productCounts = {};
      tasks.forEach(task => {
        const product = task.products || task.data_task?.products;
        if (product) {
          productCounts[product] = (productCounts[product] || 0) + 1;
        }
      });
      
      // Get top 3 products by usage
      const top3Products = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([product, count]) => ({
          icon: Icons.buttons.submit,
          label: product,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));
      
      // Top 3 Users section - only users who have tasks
      const top3UsersHeader = createTop3Header("Top 3 Users");
      
      // Get unique user IDs from tasks
      const taskUserIds = [...new Set(tasks.map(task => task.userUID || task.createbyUID).filter(Boolean))];
      
      // Filter users to only those who have tasks
      const usersWithTasks = users.filter(user => taskUserIds.includes(user.id || user.uid));
      
      // Calculate top 3 users with task counts
      const userTaskCounts = {};
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
      
      // Get top 3 users by task count
      const top3Users = Object.values(userTaskCounts)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3)
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
            subValue: marketEntries || 'No markets'
          };
        });
      
      return [
        // Total Hours Section
        createTop3Header("Total Hours"),
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
        },
        
        // Top AI Models Section
        createTop3Header("Top AI Models"),
        ...top3AIModels,
        
        // Top 3 Products Section
        createTop3Header("Top 3 Products"),
        ...top3Products,
        
        // Top 3 Markets Section
        top3MarketsHeader, 
        ...top3Markets
      ];
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
      
      // Top 3 Reporters section - only reporters who have tasks
      const top3ReportersHeader = createTop3Header("Top 3 Reporters");
      
      // Get unique reporter IDs from tasks
      const taskReporterIds = [...new Set(tasks.map(task => task.reporters || task.data_task?.reporters).filter(Boolean))];
      
      // Filter reporters to only those who have tasks
      const reportersWithTasks = reporters.filter(reporter => taskReporterIds.includes(reporter.id || reporter.uid));
      
      // Calculate top 3 reporters with task counts
      const reporterTaskCounts = {};
      tasks.forEach(task => {
        const reporterId = task.reporters || task.data_task?.reporters;
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
          const taskMarkets = task.markets || task.data_task?.markets || [];
          if (Array.isArray(taskMarkets)) {
            taskMarkets.forEach(market => {
              if (market) {
                reporterTaskCounts[reporterId].marketCounts[market] = 
                  (reporterTaskCounts[reporterId].marketCounts[market] || 0) + 1;
              }
            });
          }
        }
      });
      
      // Get top 3 reporters by task count
      const top3Reporters = Object.values(reporterTaskCounts)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3)
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
            icon: Icons.generic.user,
            label: reporterName,
            value: `${reporterData.taskCount} task${reporterData.taskCount !== 1 ? 's' : ''}`,
            subValue: marketEntries || 'No markets'
          };
        });
      
      return [top3ReportersHeader, ...top3Reporters];
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
      
      // Calculate total hours for selected user
      const totalHours = userTasks.reduce((sum, task) => sum + (task.timeInHours || task.data_task?.timeInHours || 0), 0);
      const totalAIHours = userTasks.reduce((sum, task) => sum + (task.aiTime || task.data_task?.aiTime || 0), 0);
      
      // Calculate AI models usage for selected user
      const aiModelCounts = {};
      userTasks.forEach(task => {
        const aiModels = task.aiModels || task.data_task?.aiModels || [];
        if (Array.isArray(aiModels)) {
          aiModels.forEach(model => {
            if (model) {
              aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
            }
          });
        }
      });
      
      // Get top 3 AI models by usage for selected user
      const top3AIModels = Object.entries(aiModelCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([model, count]) => ({
          icon: Icons.generic.ai,
          label: model,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));
      
      // Calculate products usage for selected user
      const productCounts = {};
      userTasks.forEach(task => {
        const product = task.products || task.data_task?.products;
        if (product) {
          productCounts[product] = (productCounts[product] || 0) + 1;
        }
      });
      
      // Get top 3 products by usage for selected user
      const top3Products = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([product, count]) => ({
          icon: Icons.buttons.submit,
          label: product,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));
      
      // Top 3 Markets section
      const userMarketsHeader = createTop3Header("Top 3 Markets");
      
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
      
      // Top 3 Reporters section - only reporters that exist in user's tasks
      const userReportersHeader = createTop3Header("Top 3 Reporters");
      
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
      
      // Calculate top 3 reporters for this user - only reporters who have tasks assigned to this user
      
      // Calculate reporter task counts for this specific user
      const userReporterTaskCounts = {};
      userTasks.forEach(task => {
        const reporterId = task.reporters || task.data_task?.reporters;
        if (reporterId) {
          if (!userReporterTaskCounts[reporterId]) {
            userReporterTaskCounts[reporterId] = {
              reporterId,
              taskCount: 0,
              marketCounts: {}
            };
          }
          userReporterTaskCounts[reporterId].taskCount++;
          
          // Count markets for this reporter
          const taskMarkets = task.markets || task.data_task?.markets || [];
          if (Array.isArray(taskMarkets)) {
            taskMarkets.forEach(market => {
              if (market) {
                userReporterTaskCounts[reporterId].marketCounts[market] = 
                  (userReporterTaskCounts[reporterId].marketCounts[market] || 0) + 1;
              }
            });
          }
        }
      });
      
      // Get top 3 reporters by task count for this user
      const top3UserReporters = Object.values(userReporterTaskCounts)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3)
        .map(reporterData => {
          const reporter = userReporters.find(r => r.id === reporterData.reporterId || r.uid === reporterData.reporterId);
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
            icon: Icons.generic.user,
            label: reporterName,
            value: `${reporterData.taskCount} task${reporterData.taskCount !== 1 ? 's' : ''}`,
            subValue: marketEntries || 'No markets'
          };
        });
      
      return [
        // Total Hours Section
        createTop3Header("Total Hours"),
        {
          icon: Icons.generic.user,
          label: "Total Tasks",
          value: userTasks.length.toString(),
          subValue: ""
        },
        {
          icon: Icons.generic.ai,
          label: "Total AI Hours",
          value: `${totalAIHours}h`,
          subValue: ""
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${totalHours}h`,
          subValue: ""
        },
        
        // Top AI Models Section
        createTop3Header("Top AI Models"),
        ...top3AIModels,
        
        // Top 3 Products Section
        createTop3Header("Top 3 Products"),
        ...top3Products,
        
        // Top 3 Markets Section
        userMarketsHeader, 
        ...userMarkets, 
        
        // Top 3 Reporters Section
        userReportersHeader,
        ...top3UserReporters
      ];
    }
  },

  [CARD_TYPES.DEPARTMENT_VIDEO]: {
    title: "Video Department",
    subtitle: "Video Team Metrics",
    description: "Video department task breakdown and analytics",
    icon: Icons.generic.video,
    type: "department",
    color: "red",
    getValue: (data) => {
      const tasks = data.tasks || [];
      const videoTasks = tasks.filter(task => 
        task.departments === 'video' || task.data_task?.departments === 'video'
      );
      return videoTasks.length.toString();
    },
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      const tasks = data.tasks || [];
      const users = data.users || [];
      const videoTasks = tasks.filter(task => 
        task.departments === 'video' || task.data_task?.departments === 'video'
      );
      
      
      if (videoTasks.length === 0) {
        return [{
          icon: Icons.generic.video,
          label: "No video tasks",
          value: "No tasks found for Video department",
          subValue: ""
        }];
      }

      // Department stats
      const totalTasks = videoTasks.length;
      const totalAIHours = videoTasks.reduce((sum, task) => sum + (task.aiTime || task.data_task?.aiTime || 0), 0);
      const totalHours = videoTasks.reduce((sum, task) => sum + (task.timeInHours || task.data_task?.timeInHours || 0), 0);

      // Top 3 users in video department - only users who have video tasks
      const videoUsersHeader = createTop3Header("Top 3 Video Users");
      
      // Get unique user IDs from video tasks
      const videoUserIds = [...new Set(videoTasks.map(task => task.userUID || task.createbyUID).filter(Boolean))];
      
      // Filter users to only those who have video tasks
      const videoUsers = users.filter(user => videoUserIds.includes(user.id || user.uid));
      
      // Calculate top 3 video users with task counts
      const videoUserTaskCounts = {};
      videoTasks.forEach(task => {
        const userId = task.userUID || task.createbyUID;
        if (userId) {
          if (!videoUserTaskCounts[userId]) {
            videoUserTaskCounts[userId] = {
              userId,
              taskCount: 0,
              marketCounts: {}
            };
          }
          videoUserTaskCounts[userId].taskCount++;
          
          // Count markets for this user
          const taskMarkets = task.markets || task.data_task?.markets || [];
          if (Array.isArray(taskMarkets)) {
            taskMarkets.forEach(market => {
              if (market) {
                videoUserTaskCounts[userId].marketCounts[market] = 
                  (videoUserTaskCounts[userId].marketCounts[market] || 0) + 1;
              }
            });
          }
        }
      });
      
      // Get top 3 video users by task count
      const top3VideoUsers = Object.values(videoUserTaskCounts)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3)
        .map(userData => {
          const user = videoUsers.find(u => u.id === userData.userId || u.uid === userData.userId);
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

      // Top 3 AI models used in video
      const aiModelsHeader = createTop3Header("Top 3 AI Models");
      const aiModelCounts = {};
      videoTasks.forEach(task => {
        const aiModels = task.aiModels || task.data_task?.aiModels || [];
        if (Array.isArray(aiModels)) {
          aiModels.forEach(model => {
            if (model) {
              aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
            }
          });
        }
      });
      
      const top3AIModels = Object.entries(aiModelCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([model, count]) => ({
          icon: Icons.generic.ai,
          label: model,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      // Calculate products usage in video department
      const productCounts = {};
      videoTasks.forEach(task => {
        const product = task.products || task.data_task?.products;
        if (product) {
          productCounts[product] = (productCounts[product] || 0) + 1;
        }
      });
      
      // Get top 3 products by usage in video department
      const top3Products = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([product, count]) => ({
          icon: Icons.buttons.submit,
          label: product,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      // Top 3 markets in video department
      const marketsHeader = createTop3Header("Top 3 Video Markets");
      const marketCounts = {};
      videoTasks.forEach(task => {
        const taskMarkets = task.markets || task.data_task?.markets || [];
        if (Array.isArray(taskMarkets)) {
          taskMarkets.forEach(market => {
            if (market) {
              marketCounts[market] = (marketCounts[market] || 0) + 1;
            }
          });
        }
      });
      
      const top3Markets = Object.entries(marketCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([market, count]) => ({
          icon: Icons.buttons.submit,
          label: market,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      const details = [
        // Total Hours Section
        createTop3Header("Total Hours"),
        {
          icon: Icons.generic.video,
          label: "Total Tasks",
          value: totalTasks.toString(),
          subValue: ""
        },
        {
          icon: Icons.generic.ai,
          label: "Total AI Hours",
          value: `${totalAIHours}h`,
          subValue: ""
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${totalHours}h`,
          subValue: ""
        },
        
        // Top 3 Users Section
        videoUsersHeader,
        ...top3VideoUsers,
        
        // Top AI Models Section
        aiModelsHeader,
        ...top3AIModels,
        
        // Top 3 Products Section
        createTop3Header("Top 3 Products"),
        ...top3Products,
        
        // Top 3 Markets Section
        marketsHeader,
        ...top3Markets
      ];

      return details;
    }
  },

  [CARD_TYPES.DEPARTMENT_DESIGN]: {
    title: "Design Department",
    subtitle: "Design Team Metrics",
    description: "Design department task breakdown and analytics",
    icon: Icons.generic.design,
    type: "department",
    color: "purple",
    getValue: (data) => {
      const tasks = data.tasks || [];
      const designTasks = tasks.filter(task => 
        task.departments === 'design' || task.data_task?.departments === 'design'
      );
      return designTasks.length.toString();
    },
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      const tasks = data.tasks || [];
      const users = data.users || [];
      const designTasks = tasks.filter(task => 
        task.departments === 'design' || task.data_task?.departments === 'design'
      );
      
      if (designTasks.length === 0) {
        return [{
          icon: Icons.generic.design,
          label: "No design tasks",
          value: "No tasks found for Design department",
          subValue: ""
        }];
      }

      // Department stats
      const totalTasks = designTasks.length;
      const totalAIHours = designTasks.reduce((sum, task) => sum + (task.aiTime || task.data_task?.aiTime || 0), 0);
      const totalHours = designTasks.reduce((sum, task) => sum + (task.timeInHours || task.data_task?.timeInHours || 0), 0);

      // Top 3 users in design department - only users who have design tasks
      const designUsersHeader = createTop3Header("Top 3 Design Users");
      
      // Get unique user IDs from design tasks
      const designUserIds = [...new Set(designTasks.map(task => task.userUID || task.createbyUID).filter(Boolean))];
      
      // Filter users to only those who have design tasks
      const designUsers = users.filter(user => designUserIds.includes(user.id || user.uid));
      
      // Calculate top 3 design users with task counts
      const designUserTaskCounts = {};
      designTasks.forEach(task => {
        const userId = task.userUID || task.createbyUID;
        if (userId) {
          if (!designUserTaskCounts[userId]) {
            designUserTaskCounts[userId] = {
              userId,
              taskCount: 0,
              marketCounts: {}
            };
          }
          designUserTaskCounts[userId].taskCount++;
          
          // Count markets for this user
          const taskMarkets = task.markets || task.data_task?.markets || [];
          if (Array.isArray(taskMarkets)) {
            taskMarkets.forEach(market => {
              if (market) {
                designUserTaskCounts[userId].marketCounts[market] = 
                  (designUserTaskCounts[userId].marketCounts[market] || 0) + 1;
              }
            });
          }
        }
      });
      
      // Get top 3 design users by task count
      const top3DesignUsers = Object.values(designUserTaskCounts)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3)
        .map(userData => {
          const user = designUsers.find(u => u.id === userData.userId || u.uid === userData.userId);
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

      // Top 3 AI models used in design
      const aiModelsHeader = createTop3Header("Top 3 AI Models");
      const aiModelCounts = {};
      designTasks.forEach(task => {
        const aiModels = task.aiModels || task.data_task?.aiModels || [];
        if (Array.isArray(aiModels)) {
          aiModels.forEach(model => {
            if (model) {
              aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
            }
          });
        }
      });
      
      const top3AIModels = Object.entries(aiModelCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([model, count]) => ({
          icon: Icons.generic.ai,
          label: model,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      // Calculate products usage in design department
      const productCounts = {};
      designTasks.forEach(task => {
        const product = task.products || task.data_task?.products;
        if (product) {
          productCounts[product] = (productCounts[product] || 0) + 1;
        }
      });
      
      // Get top 3 products by usage in design department
      const top3Products = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([product, count]) => ({
          icon: Icons.buttons.submit,
          label: product,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      // Top 3 markets in design department
      const marketsHeader = createTop3Header("Top 3 Design Markets");
      const marketCounts = {};
      designTasks.forEach(task => {
        const taskMarkets = task.markets || task.data_task?.markets || [];
        if (Array.isArray(taskMarkets)) {
          taskMarkets.forEach(market => {
            if (market) {
              marketCounts[market] = (marketCounts[market] || 0) + 1;
            }
          });
        }
      });
      
      const top3Markets = Object.entries(marketCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([market, count]) => ({
          icon: Icons.buttons.submit,
          label: market,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      return [
        // Total Hours Section
        createTop3Header("Total Hours"),
        {
          icon: Icons.generic.design,
          label: "Total Tasks",
          value: totalTasks.toString(),
          subValue: ""
        },
        {
          icon: Icons.generic.ai,
          label: "Total AI Hours",
          value: `${totalAIHours}h`,
          subValue: ""
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${totalHours}h`,
          subValue: ""
        },
        
        // Top 3 Users Section
        designUsersHeader,
        ...top3DesignUsers,
        
        // Top AI Models Section
        aiModelsHeader,
        ...top3AIModels,
        
        // Top 3 Products Section
        createTop3Header("Top 3 Products"),
        ...top3Products,
        
        // Top 3 Markets Section
        marketsHeader,
        ...top3Markets
      ];
    }
  },

  [CARD_TYPES.DEPARTMENT_DEV]: {
    title: "Development Department",
    subtitle: "Dev Team Metrics",
    description: "Development department task breakdown and analytics",
    icon: Icons.generic.code,
    type: "department",
    color: "blue",
    getValue: (data) => {
      const tasks = data.tasks || [];
      const devTasks = tasks.filter(task => 
        task.departments === 'developer' || task.data_task?.departments === 'developer'
      );
      return devTasks.length.toString();
    },
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      const tasks = data.tasks || [];
      const users = data.users || [];
      const devTasks = tasks.filter(task => 
        task.departments === 'developer' || task.data_task?.departments === 'developer'
      );
      
      if (devTasks.length === 0) {
        return [{
          icon: Icons.generic.code,
          label: "No dev tasks",
          value: "No tasks found for Development department",
          subValue: ""
        }];
      }

      // Department stats
      const totalTasks = devTasks.length;
      const totalAIHours = devTasks.reduce((sum, task) => sum + (task.aiTime || task.data_task?.aiTime || 0), 0);
      const totalHours = devTasks.reduce((sum, task) => sum + (task.timeInHours || task.data_task?.timeInHours || 0), 0);

      // Top 3 users in dev department - only users who have dev tasks
      const devUsersHeader = createTop3Header("Top 3 Dev Users");
      
      // Get unique user IDs from dev tasks
      const devUserIds = [...new Set(devTasks.map(task => task.userUID || task.createbyUID).filter(Boolean))];
      
      // Filter users to only those who have dev tasks
      const devUsers = users.filter(user => devUserIds.includes(user.id || user.uid));
      
      // Calculate top 3 dev users with task counts
      const devUserTaskCounts = {};
      devTasks.forEach(task => {
        const userId = task.userUID || task.createbyUID;
        if (userId) {
          if (!devUserTaskCounts[userId]) {
            devUserTaskCounts[userId] = {
              userId,
              taskCount: 0,
              marketCounts: {}
            };
          }
          devUserTaskCounts[userId].taskCount++;
          
          // Count markets for this user
          const taskMarkets = task.markets || task.data_task?.markets || [];
          if (Array.isArray(taskMarkets)) {
            taskMarkets.forEach(market => {
              if (market) {
                devUserTaskCounts[userId].marketCounts[market] = 
                  (devUserTaskCounts[userId].marketCounts[market] || 0) + 1;
              }
            });
          }
        }
      });
      
      // Get top 3 dev users by task count
      const top3DevUsers = Object.values(devUserTaskCounts)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3)
        .map(userData => {
          const user = devUsers.find(u => u.id === userData.userId || u.uid === userData.userId);
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

      // Top 3 AI models used in dev
      const aiModelsHeader = createTop3Header("Top 3 AI Models");
      const aiModelCounts = {};
      devTasks.forEach(task => {
        const aiModels = task.aiModels || task.data_task?.aiModels || [];
        if (Array.isArray(aiModels)) {
          aiModels.forEach(model => {
            if (model) {
              aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
            }
          });
        }
      });
      
      const top3AIModels = Object.entries(aiModelCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([model, count]) => ({
          icon: Icons.generic.ai,
          label: model,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      // Calculate products usage in dev department
      const productCounts = {};
      devTasks.forEach(task => {
        const product = task.products || task.data_task?.products;
        if (product) {
          productCounts[product] = (productCounts[product] || 0) + 1;
        }
      });
      
      // Get top 3 products by usage in dev department
      const top3Products = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([product, count]) => ({
          icon: Icons.buttons.submit,
          label: product,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      // Top 3 markets in dev department
      const marketsHeader = createTop3Header("Top 3 Dev Markets");
      const marketCounts = {};
      devTasks.forEach(task => {
        const taskMarkets = task.markets || task.data_task?.markets || [];
        if (Array.isArray(taskMarkets)) {
          taskMarkets.forEach(market => {
            if (market) {
              marketCounts[market] = (marketCounts[market] || 0) + 1;
            }
          });
        }
      });
      
      const top3Markets = Object.entries(marketCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([market, count]) => ({
          icon: Icons.buttons.submit,
          label: market,
          value: `${count} task${count !== 1 ? 's' : ''}`,
          subValue: ""
        }));

      return [
        // Total Hours Section
        createTop3Header("Total Hours"),
        {
          icon: Icons.generic.code,
          label: "Total Tasks",
          value: totalTasks.toString(),
          subValue: ""
        },
        {
          icon: Icons.generic.ai,
          label: "Total AI Hours",
          value: `${totalAIHours}h`,
          subValue: ""
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${totalHours}h`,
          subValue: ""
        },
        
        // Top 3 Users Section
        devUsersHeader,
        ...top3DevUsers,
        
        // Top AI Models Section
        aiModelsHeader,
        ...top3AIModels,
        
        // Top 3 Products Section
        createTop3Header("Top 3 Products"),
        ...top3Products,
        
        // Top 3 Markets Section
        marketsHeader,
        ...top3Markets
      ];
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

  try {

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
      case CARD_TYPES.DEPARTMENT_VIDEO:
        const videoTasks = data.tasks?.filter(task => 
          task.departments === 'video' || task.data_task?.departments === 'video'
        )?.length || 0;
        return `department-video-${videoTasks}-${new Date().getTime()}`;
      case CARD_TYPES.DEPARTMENT_DESIGN:
        const designTasks = data.tasks?.filter(task => 
          task.departments === 'design' || task.data_task?.departments === 'design'
        )?.length || 0;
        return `department-design-${designTasks}-${new Date().getTime()}`;
      case CARD_TYPES.DEPARTMENT_DEV:
        const devTasks = data.tasks?.filter(task => 
          task.departments === 'developer' || task.data_task?.departments === 'developer'
        )?.length || 0;
        return `department-dev-${devTasks}-${new Date().getTime()}`;
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
  } catch (error) {
    console.error(`Error creating card ${cardType}:`, error);
    return null;
  }
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
    CARD_TYPES.DEPARTMENT_VIDEO,
    CARD_TYPES.DEPARTMENT_DESIGN,
    CARD_TYPES.DEPARTMENT_DEV,
    CARD_TYPES.REPORTERS
  ],

  DASHBOARD_WITH_USER: [
    CARD_TYPES.SELECTED_USER, // Show when user is selected - FIRST
    CARD_TYPES.TASKS,
    CARD_TYPES.DEPARTMENT_VIDEO,
    CARD_TYPES.DEPARTMENT_DESIGN,
    CARD_TYPES.DEPARTMENT_DEV,
    CARD_TYPES.REPORTERS // LAST
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
