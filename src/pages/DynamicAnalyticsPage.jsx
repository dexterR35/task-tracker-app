import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDataContext } from "@/context/AppDataContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Badge from "@/components/ui/Badge/Badge";
import { logger } from "@/utils/logger";
import { normalizeTimestamp } from "@/utils/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { differenceInDays } from "date-fns";
import { matchesUserName, matchesReporterName } from "@/utils/taskFilters";
import { getWeeksInMonth } from "@/utils/monthUtils";
import { getTaskUserUID, getUserName } from "@/components/Cards/configs/analyticsSharedConfig";
import TanStackTable from "@/components/Table/TanStackTable";
import { createColumnHelper } from "@tanstack/react-table";
import { useTableActions } from "@/hooks/useTableActions";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import { useDeleteTask } from "@/features/tasks/tasksApi";
import { showError, showSuccess } from "@/utils/toast";
import { useDeliverableCalculation, useDeliverablesOptionsFromProps } from "@/features/deliverables/DeliverablesManager";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import { CARD_SYSTEM } from "@/constants";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { Icons } from "@/components/icons";

// Helper function to convert Firestore Timestamp to Date
const convertToDate = (timestamp) => {
  return normalizeTimestamp(timestamp);
};

// Column helper for analytics table
const columnHelper = createColumnHelper();

// Header component with tooltip using existing Tooltip component
const ColumnHeaderWithTooltip = ({ title, description }) => {
  return (
    <div className="flex items-center gap-1">
      <span>{title}</span>
      <Tooltip content={description}>
        <span className="text-gray-400 dark:text-gray-500 cursor-help text-xs hover:text-gray-600 dark:hover:text-gray-300">
          ℹ️
        </span>
      </Tooltip>
    </div>
  );
};

// Helper function to calculate duration days (same as dashboard table)
const getDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  try {
    // Use date utilities for consistent date handling
    const start = normalizeTimestamp(startDate);
    const end = normalizeTimestamp(endDate);

    // Check if dates are valid
    if (!start || !end) return null;

    // Use date-fns for accurate day calculation
    const diffDays = differenceInDays(end, start);

    // If end is before start, return 0
    if (diffDays < 0) return 0;

    // Return calendar days (including partial days)
    return Math.ceil(diffDays);
  } catch {
    return null;
  }
};

// Create analytics table columns
const createAnalyticsColumns = () => [
  columnHelper.accessor("jiraName", {
    header: () => (
      <ColumnHeaderWithTooltip
        title="JIRA LINK"
        description="Jira ticket ID or name. Click to open in Jira."
      />
    ),
    cell: ({ getValue, row }) => {
      const taskName = getValue();
      if (!taskName || taskName === 'N/A') {
        return (
          <span className="text-gray-600 dark:text-gray-400">No Link</span>
        );
      }

      const handleJiraClick = (e) => {
        e.stopPropagation(); // Prevent row selection when clicking Jira link
        const fullJiraUrl = `https://gmrd.atlassian.net/browse/${taskName}`;
        window.open(fullJiraUrl, "_blank", "noopener,noreferrer");
      };

      return (
        <Badge 
          variant="green" 
          size="md"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleJiraClick}
        >
          {taskName}
        </Badge>
      );
    },
    size: 120,
  }),
  columnHelper.accessor("taskHours", {
    header: () => (
      <ColumnHeaderWithTooltip
        title="TASK HR"
        description="Total hours logged for the task (actual time spent)."
      />
    ),
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return "-";
      return (
        <Badge colorHex={CARD_SYSTEM.COLOR_HEX_MAP.select_badge} size="md">
          {value}h
        </Badge>
      );
    },
    size: 100,
  }),
  columnHelper.accessor("deliverableHours", {
    header: () => (
      <ColumnHeaderWithTooltip
        title="DELIVERABLE HR"
        description="Base hours from deliverables (without variations). Uses Management Settings rates × quantity."
      />
    ),
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return "-";
      return (
        <span className="text-gray-900 dark:text-gray-200">
          {value}h
        </span>
      );
    },
    size: 120,
  }),
  columnHelper.accessor("variationHours", {
    header: () => (
      <ColumnHeaderWithTooltip
        title="VARIATION HR"
        description="Hours from variations only. Uses Management Settings variation rates × variation quantity."
      />
    ),
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return "-";
      return (
        <span className="text-gray-900 dark:text-gray-200">
          {value}h
        </span>
      );
    },
    size: 120,
  }),
  columnHelper.accessor("totalDeliverableAndVariation", {
    header: () => (
      <ColumnHeaderWithTooltip
        title="TOTAL DEL+VAR HR"
        description="Sum of Deliverable HR + Variation HR (total estimated time from deliverables)."
      />
    ),
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return "-";
      return (
        <span className="text-gray-900 dark:text-gray-200">
          {value}h
        </span>
      );
    },
    size: 150,
  }),
  columnHelper.accessor("difference", {
    header: () => (
      <ColumnHeaderWithTooltip
        title="DIFFERENCE"
        description="Task HR minus Total Del+Var HR. Green = over estimate, Red = under estimate."
      />
    ),
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return "-";
      const diff = parseFloat(value);
      const variant = diff > 0 ? 'green' : diff < 0 ? 'red' : 'gray';
      return (
        <Badge variant={variant} size="md">
          {diff > 0 ? '+' : ''}{value}h
        </Badge>
      );
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.createdAt, {
    id: "doneBy",
    header: () => (
      <ColumnHeaderWithTooltip
        title="DONE BY"
        description="Days between task added and task finished."
      />
    ),
    cell: ({ getValue, row }) => {
      // Calculate duration between task added (createdAt) and task finish (endDate)
      const createdAt = getValue();
      const endDate = row.original?.data_task?.endDate;

      const days = getDurationDays(createdAt, endDate);

      if (days === null || days === undefined) {
        return (
          <span className="text-gray-600 dark:text-gray-400">-</span>
        );
      }

      if (days === 0) {
        return (
          <span className="text-gray-900 dark:text-gray-200">
            Same day
          </span>
        );
      }

      return (
        <span className="text-gray-900 dark:text-gray-200">
          {days} days
        </span>
      );
    },
    size: 120,
  }),
];

const DynamicAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isDataReady, setIsDataReady] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Extract URL parameters
  const userName = searchParams.get('user');
  const reporterName = searchParams.get('reporter');
  const monthIdParam = searchParams.get('month');
  const monthId = monthIdParam || null; // null means show all months
  const weekParam = searchParams.get('week');
  
  
  // Use real data from context
  const { tasks, isLoading, error, loadingStates, monthId: contextMonthId, reporters, deliverables, users: allUsers } = useAppDataContext();
  const { user, canDeleteTask, canUpdateTask, canViewTasks } = useAuth();
  const userCanDeleteTasks = canDeleteTask();
  const userCanUpdateTasks = canUpdateTask();
  const userCanViewTasks = canViewTasks();
  
  // Get delete task hook
  const [deleteTask] = useDeleteTask();
  
  // Delete wrapper
  const handleTaskDeleteMutation = async (task) => {
    if (!deleteTask) {
      throw new Error("Delete task mutation not available");
    }

    try {
      await deleteTask(
        task.monthId,
        task.id,
        user || {}
      );
    } catch (error) {
      showError(`Failed to delete task: ${error.message}`);
      throw error;
    }
  };

  // Use table actions hook
  const {
    showEditModal: showTableEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    rowActionId,
    handleSelect,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeEditModal,
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions("task", {
    getItemDisplayName: (task) => {
      if (task?.data_task?.taskName) return task.data_task.taskName;
      if (task?.jiraName) return task.jiraName;
      return task?.id || 'Unknown';
    },
    deleteMutation: handleTaskDeleteMutation,
    onDeleteSuccess: () => {
      showSuccess("Task deleted successfully");
    },
    onSelectSuccess: () => {
      // Navigation handled by handleSelect
    },
  });

  // Analytics table columns
  const analyticsColumns = useMemo(() => createAnalyticsColumns(), []);

  // Bulk actions for analytics table
  const bulkActions = useMemo(() => {
    const actions = [];

    // Always add Jira link action first
    actions.push({
      label: "View Jira Link",
      icon: "code",
      variant: "secondary",
      onClick: (selectedTasks) => {
        if (selectedTasks.length === 1) {
          const task = selectedTasks[0];
          const taskName = task.data_task?.taskName || task.jiraName;

          if (taskName && taskName !== 'N/A') {
            const fullJiraUrl = `https://gmrd.atlassian.net/browse/${taskName}`;
            window.open(fullJiraUrl, "_blank", "noopener,noreferrer");
          } else {
            showError("No Jira ticket or URL available for this task");
          }
        } else {
          showError("Please select only ONE task to view Jira link");
        }
      },
    });

    // Add view action if user has permission
    if (userCanViewTasks) {
      actions.push({
        label: "View Selected",
        icon: "eye",
        variant: "secondary",
        onClick: (selectedTasks) => {
          if (selectedTasks.length === 1) {
            const task = selectedTasks[0];
            const params = new URLSearchParams();
            if (task.monthId) params.set("monthId", task.monthId);
            if (task.createdByName) params.set("user", task.createdByName);
            navigate(`/task/${task.id}?${params.toString()}`);
          } else {
            showError("Please select only ONE task to view");
          }
        },
      });
    }

    // Add edit action if user has permission
    if (userCanUpdateTasks) {
      actions.push({
        label: "Edit Selected",
        icon: "edit",
        variant: "primary",
        onClick: (selectedTasks) => {
          if (selectedTasks.length === 1) {
            handleEdit(selectedTasks[0]);
          } else {
            showError("Please select only ONE task to edit");
          }
        },
      });
    }

    // Add delete action if user has permission
    if (userCanDeleteTasks) {
      actions.push({
        label: "Delete Selected",
        icon: "delete",
        variant: "crimson",
        onClick: async (selectedTasks) => {
          if (selectedTasks.length === 1) {
            handleDelete(selectedTasks[0]);
          } else {
            showError("Please select only ONE task to delete");
          }
        },
      });
    }

    return actions;
  }, [
    userCanViewTasks,
    userCanUpdateTasks,
    userCanDeleteTasks,
    navigate,
    handleEdit,
    handleDelete,
  ]);

  // Transform deliverables to options format using existing hook
  const { deliverablesOptions } = useDeliverablesOptionsFromProps(deliverables);
  
  // Manage data ready state to prevent flickering
  useEffect(() => {
    if (!isLoading && !loadingStates?.isInitialLoading && tasks) {
      // Small delay to ensure data is fully processed
      const timer = setTimeout(() => {
        setIsDataReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsDataReady(false);
    }
  }, [isLoading, loadingStates?.isInitialLoading, tasks]);
  
  // Use actual monthId from context if 'current' is specified, otherwise use the provided monthId or null for all data
  const actualMonthId = monthId === 'current' ? contextMonthId : monthId;
  
  // Filter tasks based on parameters (for hooks)
  const filteredTasksForHooks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    return tasks.filter(task => {
      // Filter by month only if explicitly provided
      if (actualMonthId && task.monthId !== actualMonthId) {
        return false;
      }
      
      // Filter by user if specified
      if (userName && !matchesUserName(task, userName)) {
        return false;
      }
      
      // Filter by reporter if specified
      if (reporterName && !matchesReporterName(task, reporterName)) {
        return false;
      }
      
      // Filter by week if specified (requires monthId to be set)
      if (weekParam && actualMonthId) {
        try {
          const weekNumber = parseInt(weekParam);
          if (!isNaN(weekNumber)) {
            const weeks = getWeeksInMonth(actualMonthId);
            const week = weeks.find(w => w.weekNumber === weekNumber);
            
            if (week && week.days) {
              const taskDate = task.createdAt;
              if (!taskDate) return false;
              
              let taskDateObj;
              if (taskDate && typeof taskDate === 'object' && taskDate.seconds) {
                taskDateObj = new Date(taskDate.seconds * 1000);
              } else if (taskDate && typeof taskDate === 'object' && taskDate.toDate) {
                taskDateObj = taskDate.toDate();
              } else {
                taskDateObj = new Date(taskDate);
              }
              
              if (isNaN(taskDateObj.getTime())) return false;
              
              const taskDateStr = taskDateObj.toISOString().split('T')[0];
              
              const isInWeek = week.days.some(day => {
                try {
                  const dayDate = day instanceof Date ? day : new Date(day);
                  if (isNaN(dayDate.getTime())) return false;
                  const dayStr = dayDate.toISOString().split('T')[0];
                  return dayStr === taskDateStr;
                } catch (error) {
                  logger.warn('Error processing week day:', error, day);
                  return false;
                }
              });
              
              if (!isInWeek) return false;
            }
          }
        } catch (error) {
          logger.warn('Error processing week filter:', error);
        }
      }
      
      return true;
    });
  }, [tasks, userName, reporterName, actualMonthId, weekParam]);

  // Calculate user statistics - MUST be before any conditional returns
  const userStats = useMemo(() => {
    if (!filteredTasksForHooks || filteredTasksForHooks.length === 0) return [];
    
    const stats = {};
    
    filteredTasksForHooks.forEach(task => {
      const userId = getTaskUserUID(task);
      if (!userId) return;
      
      if (!stats[userId]) {
        stats[userId] = {
          userId,
          userName: getUserName(userId, allUsers),
          tasks: [],
          totalTaskCount: 0,
          totalTaskHours: 0,
          totalDeliverableCount: 0,
          totalDeliverableHours: 0,
          totalVariationCount: 0,
          totalVariationHours: 0,
        };
      }
      
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      stats[userId].tasks.push(task);
      stats[userId].totalTaskCount += 1;
      stats[userId].totalTaskHours += taskHours;
      
      // Calculate deliverable hours and count using existing hook
      const deliverablesUsed = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      const { deliverablesList } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
      
      deliverablesList.forEach(deliverable => {
        const quantity = deliverable.quantity || 1;
        const variationsQuantity = deliverable.variationsQuantity || 0;
        
        stats[userId].totalDeliverableCount += quantity;
        stats[userId].totalVariationCount += variationsQuantity;
        
        // Calculate base deliverable hours (total time minus variation time)
        const totalTimeInHours = deliverable.time || 0;
        const variationTimeInHours = deliverable.totalvariationsTimeInMinutes ? deliverable.totalvariationsTimeInMinutes / 60 : 0;
        const baseDeliverableHours = totalTimeInHours - variationTimeInHours;
        
        stats[userId].totalDeliverableHours += baseDeliverableHours;
        stats[userId].totalVariationHours += variationTimeInHours;
      });
    });
    
    return Object.values(stats).sort((a, b) => a.userName.localeCompare(b.userName));
  }, [filteredTasksForHooks, allUsers, deliverablesOptions]);

  // Summary cards data - MUST be after userStats is initialized
  const summaryCards = useMemo(() => {
    if (!selectedUserId) return [];
    
    const selectedUserStat = userStats.find(s => s.userId === selectedUserId);
    if (!selectedUserStat) return [];
    
    const totalDeliverableHours = selectedUserStat.totalDeliverableHours || 0;
    const totalVariationHours = selectedUserStat.totalVariationHours || 0;
    const totalDelVarHours = totalDeliverableHours + totalVariationHours;
    const avgTaskHours = selectedUserStat.totalTaskCount > 0 
      ? (selectedUserStat.totalTaskHours / selectedUserStat.totalTaskCount).toFixed(2)
      : '0.00';
    const difference = selectedUserStat.totalTaskHours - totalDelVarHours;
    
    return [
      {
        id: 'total-tasks',
        title: 'Total Tasks',
        subtitle: selectedUserStat.userName,
        value: selectedUserStat.totalTaskCount || 0,
        description: `Average ${avgTaskHours}h per task`,
        color: 'blue',
        icon: Icons.generic.task,
        badge: {
          text: `${selectedUserStat.totalTaskHours.toFixed(2)}h`,
          color: 'blue',
        },
        details: [
          {
            label: 'Total Hours',
            value: `${selectedUserStat.totalTaskHours.toFixed(2)}h`,
          },
        ],
      },
      {
        id: 'total-deliverables',
        title: 'Total Deliverables',
        subtitle: 'Base Deliverables',
        value: selectedUserStat.totalDeliverableCount || 0,
        description: `${totalDeliverableHours.toFixed(2)}h from deliverables`,
        color: 'green',
        icon: Icons.generic.deliverable,
        badge: {
          text: `${totalDeliverableHours.toFixed(2)}h`,
          color: 'green',
        },
        details: [
          {
            label: 'Deliverable Hours',
            value: `${totalDeliverableHours.toFixed(2)}h`,
          },
        ],
      },
      {
        id: 'total-variations',
        title: 'Total Variations',
        subtitle: 'Variations Added',
        value: selectedUserStat.totalVariationCount || 0,
        description: `${totalVariationHours.toFixed(2)}h from variations`,
        color: 'pink',
        icon: Icons.generic.star,
        badge: {
          text: `${totalVariationHours.toFixed(2)}h`,
          color: 'pink',
        },
        details: [
          {
            label: 'Variation Hours',
            value: `${totalVariationHours.toFixed(2)}h`,
          },
        ],
      },
      {
        id: 'total-del-var',
        title: 'Total Del+Var',
        subtitle: 'Estimated Hours',
        value: `${totalDelVarHours.toFixed(2)}h`,
        description: 'From deliverables & variations',
        color: 'purple',
        icon: Icons.generic.clock,
        details: [
          {
            label: 'Deliverable',
            value: `${totalDeliverableHours.toFixed(2)}h`,
          },
          {
            label: 'Variation',
            value: `${totalVariationHours.toFixed(2)}h`,
          },
        ],
      },
      {
        id: 'difference',
        title: 'Difference',
        subtitle: 'Actual vs Estimated',
        value: `${difference > 0 ? '+' : ''}${difference.toFixed(2)}h`,
        description: difference > 0 
          ? 'Over estimated time' 
          : difference < 0 
            ? 'Under estimated time'
            : 'Perfect match',
        color: difference > 0 ? 'amber' : difference < 0 ? 'red' : 'green',
        icon: Icons.generic.chart,
        badge: {
          text: difference > 0 ? 'Over' : difference < 0 ? 'Under' : 'Match',
          color: difference > 0 ? 'amber' : difference < 0 ? 'red' : 'green',
        },
        details: [
          {
            label: 'Task Hours',
            value: `${selectedUserStat.totalTaskHours.toFixed(2)}h`,
          },
          {
            label: 'Estimated Hours',
            value: `${totalDelVarHours.toFixed(2)}h`,
          },
        ],
      },
    ];
  }, [userStats, selectedUserId]);
  
  // Calculate task details for selected user with full task objects - MUST be before any conditional returns
  const selectedUserTaskDetails = useMemo(() => {
    if (!selectedUserId) return [];
    
    const userStat = userStats.find(s => s.userId === selectedUserId);
    if (!userStat) return [];
    
    return userStat.tasks.map(task => {
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      const jiraName = task.data_task?.taskName || task.taskName || 'N/A';
      
      // Calculate deliverable + variation hours using existing hook
      const deliverablesUsed = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      const { deliverablesList } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
      
      let taskDeliverableHours = 0;
      let taskVariationHours = 0;
      
      deliverablesList.forEach(deliverable => {
        // Calculate base deliverable hours (total time minus variation time)
        const totalTimeInHours = deliverable.time || 0;
        const variationTimeInHours = deliverable.totalvariationsTimeInMinutes ? deliverable.totalvariationsTimeInMinutes / 60 : 0;
        const baseDeliverableHours = totalTimeInHours - variationTimeInHours;
        
        taskDeliverableHours += baseDeliverableHours;
        taskVariationHours += variationTimeInHours;
      });
      
      const totalDeliverableAndVariation = taskDeliverableHours + taskVariationHours;
      const difference = taskHours - totalDeliverableAndVariation;
      
      return {
        ...task, // Keep full task object for bulk actions
        jiraName,
        taskHours: parseFloat(taskHours.toFixed(2)),
        deliverableHours: parseFloat(taskDeliverableHours.toFixed(2)),
        variationHours: parseFloat(taskVariationHours.toFixed(2)),
        totalDeliverableAndVariation: parseFloat(totalDeliverableAndVariation.toFixed(2)),
        difference: parseFloat(difference.toFixed(2)),
      };
    });
  }, [selectedUserId, userStats, allUsers, deliverablesOptions]);
  
  // Determine page title
  const pageTitle = (() => {
    const weekInfo = weekParam ? ` - Week ${weekParam}` : "";
    const monthInfo = monthId ? (monthId === 'current' ? ' (Current Month)' : ` (Month: ${monthId})`) : ' (All Data)';
    
    if (userName && reporterName) {
      return `Analytics: ${userName} & ${reporterName}${weekInfo}${monthInfo}`;
    } else if (userName) {
      return `User Analytics: ${userName}${weekInfo}${monthInfo}`;
    } else if (reporterName) {
      return `Reporter Analytics: ${reporterName}${weekInfo}${monthInfo}`;
    }
    return `Analytics Overview${weekInfo}${monthInfo}`;
  })();
  
  // Show loading state with skeleton cards - use data ready state to prevent flickering
  const shouldShowLoading = !isDataReady;
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          
          {/* Loading State */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.red }}>Error loading analytics data: {error.message}</p>
          <DynamicButton
            onClick={() => navigate(-1)}
            variant="primary"
            size="sm"
            iconName="arrowLeft"
            iconCategory="buttons"
            iconPosition="left"
          >
            Back
          </DynamicButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1>{pageTitle}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {userName && reporterName 
                  ? ` Analytics for user ${userName} and reporter ${reporterName}${monthId ? ` (${monthId === 'current' ? 'Current Month' : monthId})` : ' (All Data)'}`
                  : userName 
                    ? ` Metrics for user ${userName}${monthId ? ` (${monthId === 'current' ? 'Current Month' : monthId})` : ' (All Data)'}`
                    : reporterName
                      ? `Reporter analysis for ${reporterName}${monthId ? ` (${monthId === 'current' ? 'Current Month' : monthId})` : ' (All Data)'}`
                      : monthId 
                        ? `Overall system analytics (${monthId === 'current' ? 'Current Month' : monthId})`
                        : 'Overall system analytics - All Data'
                }
              </p>
            </div>
            <DynamicButton
              onClick={() => navigate(-1)}
              variant="primary"
              size="sm"
              iconName="arrowLeft"
              iconCategory="buttons"
              iconPosition="left"
            >
              Back
            </DynamicButton>
          </div>
        </div>
        
        {/* Users List */}
        <div className="mb-8">
          <h3 className="mb-4">Users</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userStats.map((userStat, index) => {
              // Cycle through different colors from constants
              const availableColors = Object.keys(CARD_SYSTEM.COLOR_HEX_MAP).filter(
                key => !['gray', 'dark_gray', 'color_default', 'select_badge', 'filter_color', 'indigo', 'soft_purple'].includes(key)
              );
              const color = availableColors[index % availableColors.length];
              
              return (
                <SmallCard
                  key={userStat.userId}
                  card={{
                    id: `user-${userStat.userId}`,
                    title: userStat.userName,
                    subtitle: 'User Statistics',
                    value: userStat.totalTaskCount || 0,
                    description: `${userStat.totalTaskHours.toFixed(2)}h total hours`,
                    color: color,
                    icon: Icons.generic.user,
                    badge: {
                      text: `${userStat.totalTaskCount} tasks`,
                      color: color,
                    },
                    details: [
                      {
                        label: 'Total Hours',
                        value: `${userStat.totalTaskHours.toFixed(2)}h`,
                      },
                      {
                        label: 'Deliverables',
                        value: `${userStat.totalDeliverableCount} (${userStat.totalDeliverableHours.toFixed(2)}h)`,
                      },
                      {
                        label: 'Variations',
                        value: `${userStat.totalVariationCount} (${userStat.totalVariationHours.toFixed(2)}h)`,
                      },
                    ],
                    content: (
                      <DynamicButton
                        onClick={() => setSelectedUserId(userStat.userId)}
                        variant="primary"
                        size="sm"
                        className="w-full uppercase"
                      >
                        View Tasks
                      </DynamicButton>
                    ),
                  }}
                />
              );
            })}
          </div>
        </div>
        
        {/* Selected User Details */}
        {selectedUserId && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3>
                Task Details: {userStats.find(s => s.userId === selectedUserId)?.userName}
              </h3>
              <DynamicButton
                onClick={() => setSelectedUserId(null)}
                variant="secondary"
                size="sm"
              >
                Close
              </DynamicButton>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {summaryCards.map((card) => (
                <SmallCard key={card.id} card={card} />
              ))}
            </div>
            
            {/* Detailed Tasks Table - TanStackTable */}
            <div className="card overflow-visible">
              <h4 className="mb-4">All Tasks</h4>
              <div className="overflow-visible">
                <TanStackTable
                data={selectedUserTaskDetails}
                columns={analyticsColumns}
                tableType="tasks"
                error={null}
                isLoading={false}
                onSelect={handleSelect}
                onEdit={userCanUpdateTasks ? handleEdit : null}
                onDelete={userCanDeleteTasks ? handleDelete : null}
                enableRowSelection={true}
                showBulkActions={true}
                bulkActions={bulkActions}
                enablePagination={true}
                pageSize={10}
                showFilters={true}
                showColumnToggle={false}
              />
              </div>
            </div>
          </div>
        )}
        
      </div>

      {/* Edit Task Modal - managed by useTableActions */}
      {showTableEditModal && editingItem && (
        <TaskFormModal
          isOpen={showTableEditModal}
          onClose={closeEditModal}
          mode="edit"
          task={editingItem}
          monthId={editingItem?.monthId || actualMonthId}
          onSuccess={handleEditSuccess}
          onError={(error) => {
            if (
              error?.message?.includes("permission") ||
              error?.message?.includes("User lacks required")
            ) {
              showError("You do not have permission to edit tasks");
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${(() => {
          if (itemToDelete?.data_task?.taskName)
            return itemToDelete.data_task.taskName;
          if (itemToDelete?.jiraName)
            return itemToDelete.jiraName;
          return itemToDelete?.id || 'Unknown';
        })()}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default DynamicAnalyticsPage;
