import { Icons } from "@/components/icons";


// Helper function to create "No data" entry
const createNoDataEntry = (icon, label) => ({
  icon,
  label,
  value: "No data",
  subValue: ""
});

// Helper function to create "No tasks created" entry
const createNoTasksEntry = (icon, label) => ({
  icon,
  label,
  value: "No tasks created",
  subValue: ""
});

// Helper function to check if no tasks exist and return appropriate value
const getValueWithNoTasksCheck = (data, getActualValue) => {
  const totalTasks = data.tasks?.length || 0;
  if (totalTasks === 0) {
    return "No tasks created";
  }
  return getActualValue(data);
};

// Helper function to check if no tasks exist and return appropriate details
const getDetailsWithNoTasksCheck = (data, icon, getActualDetails) => {
  const totalTasks = data.tasks?.length || 0;
  if (totalTasks === 0) {
    return [createNoTasksEntry(icon, "No tasks created")];
  }
  return getActualDetails(data);
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




// Utility function to get top 3 metrics for card configurations
// This function uses the metrics calculated by the useTop3Calculations hook
export const getTop3MetricsForCards = (data, options = {}) => {
  const { department, cardType } = options;
  
  // Check for reporters card specifically - should use dedicated reporters metrics
  if (cardType === 'reporters' && data.reportersMetrics) {
    return data.reportersMetrics;
  }
  
  // Check for department-specific metrics
  if (department === 'video' && data.videoMetrics) {
    return data.videoMetrics;
  }
  if (department === 'design' && data.designMetrics) {
    return data.designMetrics;
  }
  if (department === 'developer' && data.devMetrics) {
    return data.devMetrics;
  }
  
  // Check if general metrics are already calculated and passed in the data
  if (data.top3Metrics) {
    return data.top3Metrics;
  }
  
  // Fallback: return empty metrics if hook data is not available
  console.warn('getTop3MetricsForCards: No metrics found in data. Make sure to use useTop3Calculations hook in React components.');
  return {
    sections: {
      totalHours: [],
      top3Markets: [],
      top3AIModels: [],
      top3Products: [],
      top3Users: [],
      top3Reporters: [],
      allUsers: []
    },
    totalHours: 0,
    totalAIHours: 0,
    top3Markets: [],
    top3AIModels: [],
    top3Products: [],
    top3Users: [],
    top3Reporters: []
  };
};


// Card configuration system for dynamic card generation
export const CARD_TYPES = {
  TASKS: 'tasks',
  REPORTERS: 'reporters',
  SELECTED_USER: 'selected-user',
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
    icon: Icons.generic.task,
    type: "tasks",
    color: "green",
    getValue: (data) => getValueWithNoTasksCheck(data, (data) => data.tasks?.length?.toString() || "0"),
    getStatus: (data) => data.isCurrentMonth ? "Current" : "Historical",
    getSubtitle: (data) => "View all",
    getDetails: (data) => getDetailsWithNoTasksCheck(data, Icons.generic.task, (data) => {
      // Use the hook-based calculation utility
      const metrics = getTop3MetricsForCards(data);
      
      return [
        // Total Hours Section
        ...metrics.sections.totalHours,
        
        // Top AI Models Section
        ...metrics.sections.top3AIModels,
        
        // Top 3 Products Section
        ...metrics.sections.top3Products,
        
        // All Users Section
        ...metrics.sections.allUsers
      ];
    })
  },

  [CARD_TYPES.REPORTERS]: {
    title: "Reporters",
    subtitle: "Task Assignments",
    description: "Reporter workload breakdown with markets",
    icon: Icons.generic.user,
    type: "reporters",
    color: "purple",
    getValue: (data) => getValueWithNoTasksCheck(data, (data) => data.reporterMetrics?.totalReporters?.toString() || "0"),
    getStatus: (data) => data.reporterMetrics?.isFiltered ? "Filtered" : "All Tasks",
    getSubtitle: (data) => "View all",
    getDetails: (data) => getDetailsWithNoTasksCheck(data, Icons.generic.user, (data) => {
      // Use the hook-based calculation utility with cardType for reporters
      const metrics = getTop3MetricsForCards(data, { cardType: 'reporters' });
      
      return [
        ...metrics.sections.top3Reporters
      ];
    })
  },


  [CARD_TYPES.SELECTED_USER]: {
    title: "Selected User",
    subtitle: "User Details",
    description: "Selected user's task and market breakdown",
    icon: Icons.generic.user,
    type: "users",
    color: "blue",
    getValue: (data) => {
      const selectedReporterId = data.selectedReporterId;
      const selectedUserName = data.selectedUserName || "No User Selected";
      
      if (selectedReporterId) {
        // Find reporter name
        const reporter = data.reporters?.find(r => r.id === selectedReporterId || r.uid === selectedReporterId);
        const reporterName = reporter?.name || reporter?.reporterName || `Reporter ${selectedReporterId}`;
        return `${selectedUserName} + ${reporterName}`;
      }
      
      return selectedUserName;
    },
    getStatus: (data) => {
      const selectedReporterId = data.selectedReporterId;
      return selectedReporterId ? "User + Reporter" : "User Only";
    },
    getSubtitle: (data) => "View all",
    getDetails: (data) => {
      const selectedUserId = data.selectedUserId;
      const selectedReporterId = data.selectedReporterId;
      
      if (!selectedUserId) {
        return [{
          icon: Icons.generic.user,
          label: "No user selected",
          value: "Select a user to see details",
          subValue: ""
        }];
      }
      
      // Use selected user metrics (all filtering is now handled by useTop3Calculations)
      const metrics = data.selectedUserMetrics || getTop3MetricsForCards(data);
      const hasTasks = metrics.totalHours > 0;
      
      // Get reporter name if selected
      let reporterInfo = "";
      if (selectedReporterId) {
        const reporter = data.reporters?.find(r => r.id === selectedReporterId || r.uid === selectedReporterId);
        const reporterName = reporter?.name || reporter?.reporterName || `Reporter ${selectedReporterId}`;
        reporterInfo = ` (with ${reporterName})`;
      }
      
      // If no tasks, show appropriate message
      if (!hasTasks) {
        // Check if no tasks exist at all globally
        const totalTasks = data.tasks?.length || 0;
        if (totalTasks === 0) {
          return [
            createNoTasksEntry(Icons.generic.clock, "No tasks created")
          ];
        } else {
          // Tasks exist but none match the current filter
          return [
            createNoDataEntry(Icons.generic.clock, selectedReporterId ? "No tasks with this reporter" : "No data")
          ];
        }
      }

      return [
        // Total Hours Section
        {
          icon: Icons.generic.clock,
          label: `Total Hours${reporterInfo}`,
          value: "",
          subValue: "",
          isHeader: true
        },
        {
          icon: Icons.generic.user,
          label: "Total Tasks",
          value: metrics.departmentMetrics?.totalTasks?.toString() || "0",
          subValue: ""
        },
        {
          icon: Icons.generic.ai,
          label: "Total AI Hours",
          value: `${metrics.totalAIHours}h`,
          subValue: ""
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${metrics.totalHours}h`,
          subValue: ""
        },
        
        // Top AI Models Section
        ...metrics.sections.top3AIModels,
        
        // Section 1: All Products (from pre-calculated metrics)
        {
          icon: Icons.generic.package,
          label: selectedReporterId ? "Products (User + Reporter)" : "Products (User)",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Products,
        
        // Section 2: All Markets (from pre-calculated metrics)
        {
          icon: Icons.generic.trendingUp,
          label: selectedReporterId ? "Markets (User + Reporter)" : "Markets (User)",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Markets,
        
        // Section 3: Product-Market Combinations (from pre-calculated metrics)
        {
          icon: Icons.generic.target,
          label: selectedReporterId ? "Product-Market Combinations (User + Reporter)" : "Product-Market Combinations (User)",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...Object.entries(metrics.productMarketCombinations || {}).map(([product, data]) => {
          // Format market counts as badges (same format as top 3 reporters)
          const marketEntries = Object.entries(data.markets)
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
            icon: Icons.generic.package,
            label: product,
            value: `${data.totalTasks} task${data.totalTasks !== 1 ? 's' : ''}`,
            subValue: marketEntries || 'No markets'
          };
        })
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
    getValue: (data) => getValueWithNoTasksCheck(data, (data) => {
      // Use the pre-calculated metrics from useTop3Calculations
      const metrics = getTop3MetricsForCards(data, { department: 'video' });
      return metrics.departmentMetrics?.totalTasks?.toString() || "0";
    }),
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getDetails: (data) => getDetailsWithNoTasksCheck(data, Icons.generic.video, (data) => {
      // Use the hook-based calculation utility with video department filter
      const metrics = getTop3MetricsForCards(data, { department: 'video' });
      
      // Check if no video tasks exist
      if (metrics.departmentMetrics?.totalTasks === 0) {
        return [
          createNoDataEntry(Icons.generic.video, "No video tasks")
        ];
      }
      
      return [
        // Department Stats Section
        ...metrics.sections.departmentStats,
        
        // Top 3 Users Section
        {
          icon: Icons.generic.user,
          label: "Top 3 Video Users",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Users,
        
        // Top AI Models Section
        ...metrics.sections.top3AIModels,
        
        // Top 3 Products Section
        ...metrics.sections.top3Products,
        
        // Top 3 Markets Section
        {
          icon: Icons.generic.trendingUp,
          label: "Top 3 Video Markets",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Markets
      ];
    })
  },

  [CARD_TYPES.DEPARTMENT_DESIGN]: {
    title: "Design Department",
    subtitle: "Design Team Metrics",
    description: "Design department task breakdown and analytics",
    icon: Icons.generic.design,
    type: "department",
    color: "purple",
    getValue: (data) => getValueWithNoTasksCheck(data, (data) => {
      // Use the pre-calculated metrics from useTop3Calculations
      const metrics = getTop3MetricsForCards(data, { department: 'design' });
      return metrics.departmentMetrics?.totalTasks?.toString() || "0";
    }),
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getDetails: (data) => getDetailsWithNoTasksCheck(data, Icons.generic.design, (data) => {
      // Use the hook-based calculation utility with design department filter
      const metrics = getTop3MetricsForCards(data, { department: 'design' });
      
      // Check if no design tasks exist
      if (metrics.departmentMetrics?.totalTasks === 0) {
        return [
          createNoDataEntry(Icons.generic.design, "No design tasks")
        ];
      }
      
      return [
        // Department Stats Section
        ...metrics.sections.departmentStats,
        
        // Top 3 Users Section
        {
          icon: Icons.generic.user,
          label: "Top 3 Design Users",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Users,
        
        // Top AI Models Section
        ...metrics.sections.top3AIModels,
        
        // Top 3 Products Section
        ...metrics.sections.top3Products,
        
        // Top 3 Markets Section
        {
          icon: Icons.generic.trendingUp,
          label: "Top 3 Design Markets",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Markets
      ];
    })
  },

  [CARD_TYPES.DEPARTMENT_DEV]: {
    title: "Development Department",
    subtitle: "Dev Team Metrics",
    description: "Development department task breakdown and analytics",
    icon: Icons.generic.code,
    type: "department",
    color: "blue",
    getValue: (data) => getValueWithNoTasksCheck(data, (data) => {
      // Use the pre-calculated metrics from useTop3Calculations
      const metrics = getTop3MetricsForCards(data, { department: 'developer' });
      return metrics.departmentMetrics?.totalTasks?.toString() || "0";
    }),
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getDetails: (data) => getDetailsWithNoTasksCheck(data, Icons.generic.code, (data) => {
      // Use the hook-based calculation utility with developer department filter
      const metrics = getTop3MetricsForCards(data, { department: 'developer' });
      
      // Check if no dev tasks exist
      if (metrics.departmentMetrics?.totalTasks === 0) {
        return [
          createNoDataEntry(Icons.generic.code, "No dev tasks")
        ];
      }
      
      return [
        // Department Stats Section
        ...metrics.sections.departmentStats,
        
        // Top 3 Users Section
        {
          icon: Icons.generic.user,
          label: "Top 3 Dev Users",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Users,
        
        // Top AI Models Section
        ...metrics.sections.top3AIModels,
        
        // Top 3 Products Section
        ...metrics.sections.top3Products,
        
        // Top 3 Markets Section
        {
          icon: Icons.generic.trendingUp,
          label: "Top 3 Dev Markets",
          value: "",
          subValue: "",
          isHeader: true
        },
        ...metrics.top3Markets
      ];
    })
  }
};

// Create dashboard cards with optional selected user and reporter
export const createDashboardCards = (data, selectedUserId = null, selectedUserName = null, selectedReporterId = null) => {
  // Generate simple, stable IDs - cards are memoized and don't need complex IDs
  const generateId = (cardType, cardData) => {
    switch (cardType) {
      case CARD_TYPES.TASKS:
        return 'tasks-card';
      case CARD_TYPES.REPORTERS:
        return 'reporters-card';
      case CARD_TYPES.SELECTED_USER:
        return 'selected-user-card';
      case CARD_TYPES.DEPARTMENT_VIDEO:
        return 'department-video-card';
      case CARD_TYPES.DEPARTMENT_DESIGN:
        return 'department-design-card';
      case CARD_TYPES.DEPARTMENT_DEV:
        return 'department-dev-card';
      default:
        return `${cardType}-card`;
    }
  };

  // Create base cards (always the same)
  const baseCards = CARD_SETS.DASHBOARD.map(cardType => {
    const config = CARD_CONFIGS[cardType];
    if (!config) {
      console.warn(`Card type ${cardType} not found`);
      return null;
    }

    try {
      return {
        id: generateId(cardType, data),
        title: config.title,
        subtitle: config.getSubtitle ? config.getSubtitle(data) : config.subtitle,
        description: config.description,
        icon: config.icon,
        type: config.type,
        color: config.color || 'default',
        value: config.getValue(data),
        status: config.getStatus(data),
        details: config.getDetails(data)
      };
    } catch (error) {
      console.error(`Error creating card ${cardType}:`, error);
      return null;
    }
  }).filter(card => card !== null);

  // Add selected user card if user is selected
  if (selectedUserId) {
    // Create selected user card with data (filtering is now handled by useTop3Calculations)
    const cardData = {
      ...data,
      selectedUserId,
      selectedUserName,
      selectedReporterId
    };
    
    const config = CARD_CONFIGS[CARD_TYPES.SELECTED_USER];
    if (config) {
      try {
        const selectedUserCard = {
          id: generateId(CARD_TYPES.SELECTED_USER, cardData),
          title: config.title,
          subtitle: config.getSubtitle ? config.getSubtitle(cardData) : config.subtitle,
          description: config.description,
          icon: config.icon,
          type: config.type,
          color: config.color || 'default',
          value: config.getValue(cardData),
          status: config.getStatus(cardData),
          details: config.getDetails(cardData)
        };
        
        // Add selected user card at the beginning
        return [selectedUserCard, ...baseCards];
      } catch (error) {
        console.error(`Error creating selected user card:`, error);
      }
    }
  }
  
  // Return base cards only
  return baseCards;
};

// Predefined card sets for common use cases
export const CARD_SETS = {
  DASHBOARD: [
    CARD_TYPES.TASKS,
    CARD_TYPES.DEPARTMENT_VIDEO,
    CARD_TYPES.DEPARTMENT_DESIGN,
    CARD_TYPES.DEPARTMENT_DEV,
    CARD_TYPES.REPORTERS
  ]
};
