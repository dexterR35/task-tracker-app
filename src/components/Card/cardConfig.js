import { Icons } from "@/components/icons";
import {
  calculateDailyHours,
  calculateDailyTasks,
  calculateDailyAIHours,
  calculateDailyDepartmentMetrics,
  calculateDailyReporterMetrics,
  calculateDailyTasksByReporter,
  getChartColor,
  getChartType,
} from "@/utils/chartUtils";

// Convert card color to hex for charts, icons, badges
export const getCardColorHex = (color) => {
  switch (color) {
    case "green":
      return "#10b981"; // green-success
    case "blue":
      return "#3b82f6"; // blue-default
    case "purple":
      return "#8b5cf6"; // btn-primary
    case "red":
      return "#ef4444"; // red-error
    case "yellow":
      return "#f59e0b"; // warning
    case "pink":
      return "#ec4899"; // btn-secondary
    default:
      return "#6b7280"; // secondary
  }
};

// Helper function to create "No data" entry
const createNoDataEntry = (icon, label) => ({
  icon,
  label,
  value: "No data",
  subValue: "",
});

// Helper function to create "No tasks created" entry
const createNoTasksEntry = (icon, label) => ({
  icon,
  label,
  value: "No tasks created",
  subValue: "",
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
  if (cardType === "reporters" && data.reportersMetrics) {
    return data.reportersMetrics;
  }

  // Check for department-specific metrics
  if (department === "video" && data.videoMetrics) {
    return data.videoMetrics;
  }
  if (department === "design" && data.designMetrics) {
    return data.designMetrics;
  }
  if (department === "developer" && data.devMetrics) {
    return data.devMetrics;
  }

  // Check if general metrics are already calculated and passed in the data
  if (data.top3Metrics) {
    return data.top3Metrics;
  }

  // Fallback: return empty metrics if hook data is not available
  return {
    sections: {
      totalHours: [],
      top3Markets: [],
      top3AIModels: [],
      top3Products: [],
      top3Users: [],
      top3Reporters: [],
      allUsers: [],
    },
    totalHours: 0,
    totalAIHours: 0,
    top3Markets: [],
    top3AIModels: [],
    top3Products: [],
    top3Users: [],
    top3Reporters: [],
  };
};

// Card configuration system for dynamic card generation
export const CARD_TYPES = {
  TASKS: "tasks",
  REPORTERS: "reporters",
  SELECTED_USER: "selected-user",
  DEPARTMENT_VIDEO: "department-video",
  DEPARTMENT_DESIGN: "department-design",
  DEPARTMENT_DEV: "department-dev",
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
    hasChart: true,
    chartType: "bar",
    getValue: (data) => {
      // For regular users, show only their own tasks
      if (data.currentUser && data.currentUser.role === 'user') {
        const userUID = data.currentUser.uid || data.currentUser.userUID;
        const userTasks = (data.tasks || []).filter(task => 
          task.userUID === userUID || 
          task.createbyUID === userUID ||
          task.userUID === data.currentUser.uid ||
          task.createbyUID === data.currentUser.uid
        );
        return getValueWithNoTasksCheck(
          { ...data, tasks: userTasks },
          (data) => data.tasks?.length?.toString() || "0"
        );
      }
      
      // For admin users, show filtered tasks based on selection
      if (data.selectedUserId && data.selectedReporterId) {
        // Both user and reporter selected
        const filteredTasks = (data.tasks || []).filter(task => {
          const matchesUser = task.userUID === data.selectedUserId || task.createbyUID === data.selectedUserId;
          const matchesReporter = task.reporters === data.selectedReporterId || task.data_task?.reporters === data.selectedReporterId;
          return matchesUser && matchesReporter;
        });
        return getValueWithNoTasksCheck(
          { ...data, tasks: filteredTasks },
          (data) => data.tasks?.length?.toString() || "0"
        );
      }
      
      if (data.selectedUserId) {
        // Only user selected
        const filteredTasks = (data.tasks || []).filter(task => 
          task.userUID === data.selectedUserId || task.createbyUID === data.selectedUserId
        );
        return getValueWithNoTasksCheck(
          { ...data, tasks: filteredTasks },
          (data) => data.tasks?.length?.toString() || "0"
        );
      }
      
      if (data.selectedReporterId) {
        // Only reporter selected
        const filteredTasks = (data.tasks || []).filter(task => 
          task.reporters === data.selectedReporterId || task.data_task?.reporters === data.selectedReporterId
        );
        return getValueWithNoTasksCheck(
          { ...data, tasks: filteredTasks },
          (data) => data.tasks?.length?.toString() || "0"
        );
      }
      
      // No filters - show all tasks for admin
      return getValueWithNoTasksCheck(
        data,
        (data) => data.tasks?.length?.toString() || "0"
      );
    },
    getStatus: (data) => (data.isCurrentMonth ? "Current" : "Historical"),
    getSubtitle: (data) => "View all",
    getChartData: (data) => {
      try {
        const monthId = data.periodId || data.currentMonthId;
        const chartData = calculateDailyTasks(data.tasks || [], monthId);
        return chartData;
      } catch (error) {
        return [];
      }
    },
    getChartColor: (data) => getCardColorHex("green"),
    getBadges: (data) => {
      const badges = [];
      if (data.isCurrentMonth) {
        badges.push({ label: "Current", color: getCardColorHex("green") });
      }
      if (data.tasks && data.tasks.length > 0) {
        badges.push({ label: "Active", color: getCardColorHex("green") });
      }
      return badges;
    },
    getDetails: (data) =>
      getDetailsWithNoTasksCheck(data, Icons.generic.task, (data) => {
        // Use the hook-based calculation utility
        const metrics = getTop3MetricsForCards(data);

        return [
          // Total Hours Section
          ...metrics.sections.totalHours,

          // Top 3 Products Section
          ...metrics.sections.top3Products,

          // All Users Section
          ...metrics.sections.allUsers,
        ];
      }),
  },

  [CARD_TYPES.REPORTERS]: {
    title: "Reporters",
    subtitle: "Task Assignments",
    description: "Reporter workload breakdown with markets",
    icon: Icons.generic.user,
    type: "reporters",
    color: "purple",
    hasChart: true,
    chartType: "bar",
    getValue: (data) =>
      getValueWithNoTasksCheck(
        data,
        (data) => data.reporterMetrics?.totalReporters?.toString() || "0"
      ),
    getStatus: (data) =>
      data.reporterMetrics?.isFiltered ? "Filtered" : "All Tasks",
    getSubtitle: (data) => "View all",
    getChartData: (data) => {
      try {
        const monthId = data.periodId || data.currentMonthId;
        const chartData = calculateDailyTasksByReporter(
          data.tasks || [],
          monthId
        );
        return chartData;
      } catch (error) {
        return [];
      }
    },
    getChartColor: (data) => getCardColorHex("purple"),
    getBadges: (data) => {
      const badges = [];
      if (data.isCurrentMonth) {
        badges.push({ label: "Current", color: getCardColorHex("green") });
      }
      if (data.reporters && data.reporters.length > 0) {
        badges.push({ label: "Active", color: getCardColorHex("purple") });
      }
      return badges;
    },
    getDetails: (data) =>
      getDetailsWithNoTasksCheck(data, Icons.generic.user, (data) => {
        // Use the hook-based calculation utility with cardType for reporters
        const metrics = getTop3MetricsForCards(data, { cardType: "reporters" });

        return [...metrics.sections.top3Reporters];
      }),
  },

  [CARD_TYPES.SELECTED_USER]: {
    title: "Selected User",
    subtitle: "User Details",
    description: "Selected user's task and market breakdown",
    icon: Icons.generic.user,
    type: "users",
    color: "blue",
    hasChart: true,
    chartType: "bar",
    getValue: (data) => {
      const selectedReporterId = data.selectedReporterId;
      const selectedUserName = data.selectedUserName || "No User Selected";

      if (selectedReporterId) {
        // Find reporter name
        const reporter = data.reporters?.find(
          (r) => r.id === selectedReporterId || r.uid === selectedReporterId
        );
        const reporterName =
          reporter?.name ||
          reporter?.reporterName ||
          `Reporter ${selectedReporterId}`;
        return `${selectedUserName} + ${reporterName}`;
      }

      return selectedUserName;
    },
    getStatus: (data) => {
      const selectedReporterId = data.selectedReporterId;
      return selectedReporterId ? "User + Reporter" : "User Only";
    },
    getSubtitle: (data) => "View all",
    getChartData: (data) => {
      const monthId = data.periodId || data.currentMonthId;
      const selectedUserId = data.selectedUserId;
      const selectedReporterId = data.selectedReporterId;

      if (!selectedUserId) {
        return [];
      }

      // Filter tasks for selected user and reporter
      const filteredTasks = (data.tasks || []).filter((task) => {
        const matchesUser =
          task.userUID === selectedUserId ||
          task.createbyUID === selectedUserId;
        const matchesReporter =
          !selectedReporterId ||
          task.reporters === selectedReporterId ||
          task.data_task?.reporters === selectedReporterId;
        return matchesUser && matchesReporter;
      });

      return calculateDailyHours(filteredTasks, monthId);
    },
    getChartColor: (data) => getChartColor("users", "blue"),
    getDetails: (data) => {
      const selectedUserId = data.selectedUserId;
      const selectedReporterId = data.selectedReporterId;

      if (!selectedUserId) {
        return [
          {
            icon: Icons.generic.user,
            label: "No user selected",
            value: "Select a user to see details",
            subValue: "",
          },
        ];
      }

      // Use selected user metrics (all filtering is now handled by useTop3Calculations)
      const metrics = data.selectedUserMetrics || getTop3MetricsForCards(data);
      const hasTasks = metrics.totalHours > 0;

      // Get reporter name if selected
      let reporterInfo = "";
      if (selectedReporterId) {
        const reporter = data.reporters?.find(
          (r) => r.id === selectedReporterId || r.uid === selectedReporterId
        );
        const reporterName =
          reporter?.name ||
          reporter?.reporterName ||
          `Reporter ${selectedReporterId}`;
        reporterInfo = ` (with ${reporterName})`;
      }

      // If no tasks, show appropriate message
      if (!hasTasks) {
        // Check if no tasks exist at all globally
        const totalTasks = data.tasks?.length || 0;
        if (totalTasks === 0) {
          return [createNoTasksEntry(Icons.generic.clock, "No tasks created")];
        } else {
          // Tasks exist but none match the current filter
          return [
            createNoDataEntry(
              Icons.generic.clock,
              selectedReporterId ? "No tasks with this reporter" : "No data"
            ),
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
          isHeader: true,
        },
        {
          icon: Icons.generic.user,
          label: "Total Tasks",
          value: metrics.departmentMetrics?.totalTasks?.toString() || "0",
          subValue: "",
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${metrics.totalHours}h`,
          subValue: "",
        },

        // Section 1: All Products (from pre-calculated metrics)
        {
          icon: Icons.generic.package,
          label: selectedReporterId
            ? "Products (User + Reporter)"
            : "Products (User)",
          value: "",
          subValue: "",
          isHeader: true,
        },
        ...metrics.top3Products,

        // Section 2: All Markets (from pre-calculated metrics)
        {
          icon: Icons.generic.trendingUp,
          label: selectedReporterId
            ? "Markets (User + Reporter)"
            : "Markets (User)",
          value: "",
          subValue: "",
          isHeader: true,
        },
        ...metrics.top3Markets,

        // Section 3: Product-Market Combinations (from pre-calculated metrics)
        {
          icon: Icons.generic.target,
          label: selectedReporterId
            ? "Product-Market Combinations (User + Reporter)"
            : "Product-Market Combinations (User)",
          value: "",
          subValue: "",
          isHeader: true,
        },
        ...Object.entries(metrics.productMarketCombinations || {}).map(
          ([product, data]) => {
            // Format market counts as badges (same format as top 3 reporters)
            const marketEntries = Object.entries(data.markets)
              .sort(([, a], [, b]) => b - a)
              .map(([market, count]) => {
                if (count === 1) {
                  return market;
                } else {
                  return `${count}x${market}`;
                }
              })
              .join(" ");

            return {
              icon: Icons.generic.package,
              label: product,
              value: `${data.totalTasks} task${data.totalTasks !== 1 ? "s" : ""}`,
              subValue: marketEntries || "No markets",
            };
          }
        ),
      ];
    },
  },

  [CARD_TYPES.DEPARTMENT_VIDEO]: {
    title: "Video Department",
    subtitle: "Video Team Metrics",
    description: "Video department task breakdown and analytics",
    icon: Icons.generic.video,
    type: "department",
    color: "red",
    hasChart: true,
    chartType: "area",
    getValue: (data) =>
      getValueWithNoTasksCheck(data, (data) => {
        // Use the pre-calculated metrics from useTop3Calculations
        const metrics = getTop3MetricsForCards(data, { department: "video" });
        return metrics.departmentMetrics?.totalTasks?.toString() || "0";
      }),
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getChartData: (data) => {
      const monthId = data.periodId || data.currentMonthId;
      return calculateDailyDepartmentMetrics(
        data.tasks || [],
        monthId,
        "video"
      );
    },
    getChartColor: (data) => getCardColorHex("red"),
    getBadges: (data) => {
      const badges = [];
      if (data.isCurrentMonth) {
        badges.push({ label: "Current", color: getCardColorHex("green") });
      }
      const metrics = getTop3MetricsForCards(data, { department: "video" });
      if (metrics.departmentMetrics?.totalTasks > 0) {
        badges.push({ label: "Active", color: getCardColorHex("red") });
      }
      return badges;
    },
    getDetails: (data) =>
      getDetailsWithNoTasksCheck(data, Icons.generic.video, (data) => {
        // Use the hook-based calculation utility with video department filter
        const metrics = getTop3MetricsForCards(data, { department: "video" });

        // Check if no video tasks exist
        if (metrics.departmentMetrics?.totalTasks === 0) {
          return [createNoDataEntry(Icons.generic.video, "No video tasks")];
        }

        return [
          // Department Stats Section
          ...metrics.sections.departmentStats,

          // All Users Section
          {
            icon: Icons.generic.user,
            label: "All Video Users",
            value: "",
            subValue: "",
            isHeader: true,
          },
          ...metrics.top3Users,

          // Top 3 Products Section
          ...metrics.sections.top3Products,

          // Top 3 Markets Section
          {
            icon: Icons.generic.trendingUp,
            label: "Top 3 Video Markets",
            value: "",
            subValue: "",
            isHeader: true,
          },
          ...metrics.top3Markets,
        ];
      }),
  },

  [CARD_TYPES.DEPARTMENT_DESIGN]: {
    title: "Design Department",
    subtitle: "Design Team Metrics",
    description: "Design department task breakdown and analytics",
    icon: Icons.generic.design,
    type: "department",
    color: "purple",
    hasChart: true,
    chartType: "area",
    getValue: (data) =>
      getValueWithNoTasksCheck(data, (data) => {
        // Use the pre-calculated metrics from useTop3Calculations
        const metrics = getTop3MetricsForCards(data, { department: "design" });
        return metrics.departmentMetrics?.totalTasks?.toString() || "0";
      }),
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getChartData: (data) => {
      const monthId = data.periodId || data.currentMonthId;
      return calculateDailyDepartmentMetrics(
        data.tasks || [],
        monthId,
        "design"
      );
    },
    getChartColor: (data) => getCardColorHex("purple"),
    getBadges: (data) => {
      const badges = [];
      if (data.isCurrentMonth) {
        badges.push({ label: "Current", color: getCardColorHex("green") });
      }
      const metrics = getTop3MetricsForCards(data, { department: "design" });
      if (metrics.departmentMetrics?.totalTasks > 0) {
        badges.push({ label: "Active", color: getCardColorHex("purple") });
      }
      return badges;
    },
    getDetails: (data) =>
      getDetailsWithNoTasksCheck(data, Icons.generic.design, (data) => {
        // Use the hook-based calculation utility with design department filter
        const metrics = getTop3MetricsForCards(data, { department: "design" });

        // Check if no design tasks exist
        if (metrics.departmentMetrics?.totalTasks === 0) {
          return [createNoDataEntry(Icons.generic.design, "No design tasks")];
        }

        return [
          // Department Stats Section
          ...metrics.sections.departmentStats,

          // All Users Section
          {
            icon: Icons.generic.user,
            label: "All Design Users",
            value: "",
            subValue: "",
            isHeader: true,
          },
          ...metrics.top3Users,

          // Top 3 Products Section
          ...metrics.sections.top3Products,

          // Top 3 Markets Section
          {
            icon: Icons.generic.trendingUp,
            label: "Top 3 Design Markets",
            value: "",
            subValue: "",
            isHeader: true,
          },
          ...metrics.top3Markets,
        ];
      }),
  },

  [CARD_TYPES.DEPARTMENT_DEV]: {
    title: "Development Department",
    subtitle: "Dev Team Metrics",
    description: "Development department task breakdown and analytics",
    icon: Icons.generic.code,
    type: "department",
    color: "blue",
    hasChart: true,
    chartType: "area",
    getValue: (data) =>
      getValueWithNoTasksCheck(data, (data) => {
        // Use the pre-calculated metrics from useTop3Calculations
        const metrics = getTop3MetricsForCards(data, {
          department: "developer",
        });
        return metrics.departmentMetrics?.totalTasks?.toString() || "0";
      }),
    getStatus: (data) => "Active",
    getSubtitle: (data) => "View all",
    getChartData: (data) => {
      try {
        const monthId = data.periodId || data.currentMonthId;
        const chartData = calculateDailyDepartmentMetrics(
          data.tasks || [],
          monthId,
          "developer"
        );
        return chartData;
      } catch (error) {
        return [];
      }
    },
    getChartColor: (data) => getCardColorHex("blue"),
    getBadges: (data) => {
      const badges = [];
      if (data.isCurrentMonth) {
        badges.push({ label: "Current", color: getCardColorHex("green") });
      }
      const metrics = getTop3MetricsForCards(data, { department: "developer" });
      if (metrics.departmentMetrics?.totalTasks > 0) {
        badges.push({ label: "Active", color: getCardColorHex("blue") });
      }
      return badges;
    },
    getDetails: (data) =>
      getDetailsWithNoTasksCheck(data, Icons.generic.code, (data) => {
        // Use the hook-based calculation utility with developer department filter
        const metrics = getTop3MetricsForCards(data, {
          department: "developer",
        });

        // Check if no dev tasks exist
        if (metrics.departmentMetrics?.totalTasks === 0) {
          return [createNoDataEntry(Icons.generic.code, "No dev tasks")];
        }

        return [
          // Department Stats Section
          ...metrics.sections.departmentStats,

          // All Users Section
          {
            icon: Icons.generic.user,
            label: "All Dev Users",
            value: "",
            subValue: "",
            isHeader: true,
          },
          ...metrics.top3Users,

          // Top 3 Products Section
          ...metrics.sections.top3Products,

          // Top 3 Markets Section
          {
            icon: Icons.generic.trendingUp,
            label: "Top 3 Dev Markets",
            value: "",
            subValue: "",
            isHeader: true,
          },
          ...metrics.top3Markets,
        ];
      }),
  },
};

// Map user occupation to department for access control
const mapOccupationToDepartment = (occupation) => {
  if (!occupation) return null;

  const occ = occupation.toLowerCase();

  // Video department mappings
  if (occ.includes("video") || occ.includes("editor")) {
    return "video";
  }

  // Design department mappings
  if (occ.includes("design") || occ.includes("designer")) {
    return "design";
  }

  // Development department mappings
  if (
    occ.includes("dev") ||
    occ.includes("developer") ||
    occ.includes("programmer") ||
    occ.includes("engineer")
  ) {
    return "developer";
  }

  return null;
};

// Role-based access control for dashboard cards
export const canUserAccessCard = (user, cardType) => {
  // Admin can access all cards
  if (user?.role === "admin") {
    return true;
  }

  // Regular users can only access their department card and their own card
  if (user?.role === "user") {
    const userDepartment = mapOccupationToDepartment(user?.occupation);

    switch (cardType) {
      case CARD_TYPES.TASKS:
      case CARD_TYPES.REPORTERS:
        // All users can see general task and reporter cards
        return true;

      case CARD_TYPES.DEPARTMENT_VIDEO:
        return userDepartment === "video";

      case CARD_TYPES.DEPARTMENT_DESIGN:
        return userDepartment === "design";

      case CARD_TYPES.DEPARTMENT_DEV:
        return userDepartment === "developer";

      case CARD_TYPES.SELECTED_USER:
        // Users can see their own selected user card
        return true;

      default:
        return false;
    }
  }

  return false;
};

// Create dashboard cards with optional selected user and reporter
export const createDashboardCards = (
  data,
  selectedUserId = null,
  selectedUserName = null,
  selectedReporterId = null,
  currentUser = null
) => {
  // Generate simple, stable IDs - cards are memoized and don't need complex IDs
  const generateId = (cardType, cardData) => {
    switch (cardType) {
      case CARD_TYPES.TASKS:
        return "tasks-card";
      case CARD_TYPES.REPORTERS:
        return "reporters-card";
      case CARD_TYPES.SELECTED_USER:
        return "selected-user-card";
      case CARD_TYPES.DEPARTMENT_VIDEO:
        return "department-video-card";
      case CARD_TYPES.DEPARTMENT_DESIGN:
        return "department-design-card";
      case CARD_TYPES.DEPARTMENT_DEV:
        return "department-dev-card";
      default:
        return `${cardType}-card`;
    }
  };

  // Create base cards (filtered by user access)
  const baseCards = CARD_SETS.DASHBOARD.filter((cardType) => {
    // Filter cards based on user access permissions
    if (currentUser) {
      return canUserAccessCard(currentUser, cardType);
    }
    // If no user provided, show all cards (fallback for admin or testing)
    return true;
  })
    .map((cardType) => {
      const config = CARD_CONFIGS[cardType];
      if (!config) {
        return null;
      }

      try {
        const card = {
          id: generateId(cardType, data),
          title: config.title,
          subtitle: config.getSubtitle
            ? config.getSubtitle(data)
            : config.subtitle,
          description: config.description,
          icon: config.icon,
          type: config.type,
          color: config.color || "default",
          value: config.getValue(data),
          status: config.getStatus(data),
          details: config.getDetails(data),
          hasChart: config.hasChart || false,
          chartType: config.chartType || "area",
          chartData: config.getChartData ? config.getChartData(data) : [],
          chartColor: config.getChartColor
            ? config.getChartColor(data)
            : "#6b7280",
          badges: config.getBadges ? config.getBadges(data) : [],
        };

        return card;
      } catch (error) {
        return null;
      }
    })
    .filter((card) => card !== null);

  // Add selected user card if user is selected and has access
  if (
    selectedUserId &&
    (!currentUser || canUserAccessCard(currentUser, CARD_TYPES.SELECTED_USER))
  ) {
    // Create selected user card with data (filtering is now handled by useTop3Calculations)
    const cardData = {
      ...data,
      selectedUserId,
      selectedUserName,
      selectedReporterId,
    };

    const config = CARD_CONFIGS[CARD_TYPES.SELECTED_USER];
    if (config) {
      try {
        const selectedUserCard = {
          id: generateId(CARD_TYPES.SELECTED_USER, cardData),
          title: config.title,
          subtitle: config.getSubtitle
            ? config.getSubtitle(cardData)
            : config.subtitle,
          description: config.description,
          icon: config.icon,
          type: config.type,
          color: config.color || "default",
          value: config.getValue(cardData),
          status: config.getStatus(cardData),
          details: config.getDetails(cardData),
          hasChart: config.hasChart || false,
          chartType: config.chartType || "area",
          chartData: config.getChartData ? config.getChartData(cardData) : [],
          chartColor: config.getChartColor
            ? config.getChartColor(cardData)
            : "#6b7280",
        };

        // Add selected user card at the beginning
        return [selectedUserCard, ...baseCards];
      } catch (error) {
        // Silently handle card creation errors
      }
    }
  }

  // Return base cards only
  return baseCards;
};

// Predefined card sets for common use cases
export const CARD_SETS = {
  DASHBOARD: [
    CARD_TYPES.DEPARTMENT_VIDEO,
    CARD_TYPES.DEPARTMENT_DESIGN,
    CARD_TYPES.DEPARTMENT_DEV,
  ],
};
