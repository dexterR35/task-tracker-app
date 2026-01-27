import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { updateURLParam } from "@/utils/urlParams";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import TaskTable from "@/features/tasks/components/TaskTable/TaskTable";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { showError, showAuthError } from "@/utils/toast";
import { MonthProgressBar, getWeeksInMonth, getCurrentWeekNumber } from "@/utils/monthUtils.jsx";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import Loader from "@/components/ui/Loader/Loader";
import { logger } from "@/utils/logger";
import {
  useTotalTasks,
  useTotalHours,
  useTotalDeliverables,
  useDeliverablesHours,
} from "@/hooks/useAnalytics";
import { useAllTasksForUser } from "@/features/tasks/tasksApi";
import { filterTasksByUserAndReporter } from "@/utils/taskFilters";
import { differenceInDays } from "date-fns";
import { normalizeTimestamp } from "@/utils/dateUtils";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";
import { CARD_SYSTEM } from "@/constants";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
// import { EXPERIENCE_LEVELS } from "@/constants/experienceSystem";
import { 
  EXPERIENCE_POINTS, 
  EXPERIENCE_LEVELS,
  calculateLevel, 
  calculateProgress, 
  getPointsToNextLevel,
  getNextLevel 
} from "@/constants/experienceSystem";

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExperienceCollapsed, setIsExperienceCollapsed] = useState(true);
  // Get auth functions separately
  const { canAccess, canCreateTask } = useAuth();
  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  const selectedReporterId = searchParams.get("reporter") || "";
  const selectedWeekParam = searchParams.get("week") || "";
  
  // Initialize selectedWeek from URL parameter
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Get all data from context
  const appData = useAppDataContext();
  
  const {
    user,
    users,
    reporters,
    tasks,
    deliverables,
    availableMonths,
    currentMonth,
    selectedMonth,
    isCurrentMonth,
    isLoading,
    isInitialLoading,
    error,
    selectMonth,
    setSelectedUserId,
  } = appData || {};

  // Get ALL tasks across ALL months for experience system
  const selectedUserIdForExp = selectedUserId || user?.userUID;
  const { 
    tasks: allTasksForExperience, 
    isLoading: allTasksLoading 
  } = useAllTasksForUser(
    isUserAdmin ? 'admin' : 'user',
    isUserAdmin ? (selectedUserIdForExp || null) : user?.userUID,
    availableMonths || []
  );

  // Get selected user and reporter info - simplified without excessive memoization
  const selectedUser = users.find((u) => (u.userUID || u.id) === selectedUserId);
  const selectedUserName = selectedUser?.name || selectedUser?.email || "Unknown User";
  
  const selectedReporter = reporters.find((r) => r.reporterUID === selectedReporterId);
  const selectedReporterName = selectedReporter?.name || selectedReporter?.reporterName;

  // Handle user selection - completely independent from reporter selection
  const handleUserSelect = useCallback(
    (userId) => {
      // Regular users can only select themselves
      if (!isUserAdmin && userId && userId !== user?.userUID) {
        return;
      }
      
      // Use shared utility to update URL parameter
      updateURLParam(setSearchParams, "user", userId || "");
    },
    [setSearchParams, isUserAdmin, user]
  );

  // Handle reporter selection - completely independent from user selection
  const handleReporterSelect = useCallback(
    (reporterId) => {
      // Use shared utility to update URL parameter
      updateURLParam(setSearchParams, "reporter", reporterId || "");
    },
    [setSearchParams]
  );



  // Get current month ID for filtering - simplified
  const currentMonthId = selectedMonth?.monthId || currentMonth?.monthId;

  // Task creation logic: allow if:
  // 1. User has create_tasks permission
  // 2. AND either:
  //    - Current month is selected AND board exists, OR
  //    - A different month is selected AND that month has a board
  const selectedMonthHasBoard = selectedMonth ? selectedMonth.boardExists : false;
  const canCreateTasks = canCreateTask() && (
    (isCurrentMonth && currentMonth.boardExists) ||
    (!isCurrentMonth && selectedMonthHasBoard)
  );

  // Handle create task - memoized to prevent recreation
  const handleCreateTask = useCallback(() => {
    if (!canCreateTasks) {
      // Check if it's a permission issue or month/board issue
      if (!canCreateTask()) {
        showAuthError("You do not have permission to create tasks");
      } else if (!currentMonth.boardExists && isCurrentMonth) {
        showError("Create Task is not available - current month board not found");
      } else if (!selectedMonthHasBoard && !isCurrentMonth) {
        showError("Create Task is not available - selected month board not found");
      } else {
        showError("Create Task is not available for this month");
      }
      return;
    }
    setShowCreateModal(true);
  }, [canCreateTasks, canCreateTask, isCurrentMonth, currentMonth.boardExists, selectedMonthHasBoard]);

  // Handle week selection - independent from user and reporter selections
  const handleWeekChange = useCallback((week) => {
    // If week is null or empty, clear the selection (show all weeks)
    setSelectedWeek(week);
    
    // Use shared utility to update URL parameter
    const weekValue = week ? week.weekNumber.toString() : "";
    updateURLParam(setSearchParams, "week", weekValue);
  }, [setSearchParams]);

  // Initialize selectedWeek from URL parameter
  useEffect(() => {
    if (selectedWeekParam) {
      try {
        const weekNumber = parseInt(selectedWeekParam);
        if (!isNaN(weekNumber)) {
          // Get weeks for the current month
          const currentMonthId = selectedMonth?.monthId || currentMonth?.monthId;
          if (currentMonthId) {
            const weeks = getWeeksInMonth(currentMonthId);
            const week = weeks.find(w => w.weekNumber === weekNumber);
            if (week) {
              setSelectedWeek(week);
            }
          }
        }
      } catch (error) {
        logger.warn('Error parsing week parameter:', error);
      }
    } else {
      setSelectedWeek(null);
    }
  }, [selectedWeekParam, selectedMonth?.monthId, currentMonth?.monthId]);

  // Add logging for combined selections and security checks - optimized
  useEffect(() => {
    if (selectedUserId && selectedReporterId && import.meta.env.MODE === 'development') {
      logger.log("🔍 Combined selection active", {
        selectedUserId,
        selectedUserName,
        selectedReporterId,
        selectedReporterName,
        currentMonthId,
        totalTasks: tasks?.length || 0
      });
    }
  }, [selectedUserId, selectedReporterId, selectedUserName, selectedReporterName, currentMonthId]);
  // Removed tasks?.length to prevent unnecessary re-renders

  // Security logging for admin actions
  useEffect(() => {
    if (isUserAdmin && selectedUserId && import.meta.env.MODE === 'development') {
      logger.log("🔐 Admin viewing user data", {
        adminUserUID: user?.userUID,
        viewingUserUID: selectedUserId,
        viewingUserName: selectedUserName,
        timestamp: new Date().toISOString()
      });
    }
  }, [isUserAdmin, selectedUserId, selectedUserName, user?.userUID]);

  // Efficiency data is now calculated dynamically in the XP card configuration

  // Calculate values using hooks for user filter card
  const userFilterFilters = useMemo(() => ({
    userId: selectedUserId || user?.userUID,
    monthId: currentMonthId,
  }), [selectedUserId, user?.userUID, currentMonthId]);
  const userFilterTasksData = useTotalTasks(tasks || [], users || [], userFilterFilters);
  const userFilterHoursData = useTotalHours(tasks || [], users || [], userFilterFilters);

  // Calculate values using hooks for reporter filter card
  const reporterFilteredTasks = useMemo(() => {
    if (!selectedReporterId || !tasks) return [];
    return filterTasksByUserAndReporter(tasks, {
      selectedReporterId,
      currentMonthId,
      isUserAdmin,
      currentUserUID: user?.userUID,
    });
  }, [tasks, selectedReporterId, currentMonthId, isUserAdmin, user?.userUID]);
  const reporterFilterFilters = useMemo(() => ({ monthId: currentMonthId }), [currentMonthId]);
  const reporterFilterTasksData = useTotalTasks(reporterFilteredTasks, [], reporterFilterFilters);
  const reporterFilterHoursData = useTotalHours(reporterFilteredTasks, [], reporterFilterFilters);

  // Calculate values using hooks for actions card
  const actionsFilteredTasks = useMemo(() => {
    if (!tasks) return [];
    let filtered = tasks;
    if (currentMonthId) {
      filtered = filtered.filter(task => task.monthId === currentMonthId);
    }
    if (selectedWeek) {
      // Filter by week if selected
      const weekTasks = [];
      selectedWeek.days?.forEach((day) => {
        try {
          const dayDate = day instanceof Date ? day : new Date(day);
          if (isNaN(dayDate.getTime())) return;
          const dayStr = dayDate.toISOString().split("T")[0];
          const dayTasks = filtered.filter((task) => {
            if (!task.createdAt) return false;
            let taskDate;
            if (task.createdAt && typeof task.createdAt === "object" && task.createdAt.seconds) {
              taskDate = new Date(task.createdAt.seconds * 1000);
            } else if (task.createdAt && typeof task.createdAt === "object" && task.createdAt.toDate) {
              taskDate = task.createdAt.toDate();
            } else {
              taskDate = new Date(task.createdAt);
            }
            if (isNaN(taskDate.getTime())) return false;
            const taskDateStr = taskDate.toISOString().split("T")[0];
            return taskDateStr === dayStr;
          });
          weekTasks.push(...dayTasks);
        } catch (error) {
          logger.warn("Error processing day:", error, day);
        }
      });
      filtered = weekTasks;
    }
    // Apply user and reporter filtering
    if (selectedUserId || selectedReporterId) {
      filtered = filterTasksByUserAndReporter(filtered, {
        selectedUserId,
        selectedReporterId,
        currentMonthId: null, // Already filtered
        isUserAdmin,
        currentUserUID: user?.userUID,
      });
    }
    return filtered;
  }, [tasks, currentMonthId, selectedWeek, selectedUserId, selectedReporterId, isUserAdmin, user?.userUID]);
  
  const actionsFilters = useMemo(() => ({ monthId: null }), []); // Already filtered above
  const actionsTasksData = useTotalTasks(actionsFilteredTasks, [], actionsFilters);
  const actionsHoursData = useTotalHours(actionsFilteredTasks, [], actionsFilters);
  const actionsDeliverablesData = useTotalDeliverables(actionsFilteredTasks, [], actionsFilters);
  
  // Transform deliverables to options format
  const deliverablesOptions = useMemo(() => {
    if (!deliverables || deliverables.length === 0) return [];
    return deliverables.map(deliverable => ({
      value: deliverable.name,
      label: deliverable.name,
      department: deliverable.department,
      timePerUnit: deliverable.timePerUnit,
      timeUnit: deliverable.timeUnit,
      requiresQuantity: deliverable.requiresQuantity,
      variationsTime: deliverable.variationsTime,
      variationsTimeUnit: deliverable.variationsTimeUnit || 'min',
      declinariTime: deliverable.declinariTime,
      declinariTimeUnit: deliverable.declinariTimeUnit
    }));
  }, [deliverables]);
  const actionsDeliverablesHoursData = useDeliverablesHours(actionsFilteredTasks, [], deliverablesOptions, actionsFilters);

  // Get ALL tasks for experience calculation (not filtered by month - across all time)
  // Use allTasksForExperience which fetches from all months
  const allUserTasksForExperience = useMemo(() => {
    if (!allTasksForExperience || allTasksForExperience.length === 0) return [];
    const currentUserId = user?.userUID;
    const selectedUserIdForExp = selectedUserId || currentUserId;
    
    // Filter by user only (no month filter for experience system)
    // allTasksForExperience already contains tasks from all months
    return allTasksForExperience.filter(task => {
      if (!selectedUserIdForExp) return true;
      const taskUserId = task.userUID || task.createbyUID;
      return taskUserId === selectedUserIdForExp;
    });
  }, [allTasksForExperience, user?.userUID, selectedUserId]);

  // Calculate totals from ALL tasks (for display in summary)
  const allTasksTotals = useMemo(() => {
    const allTasks = allUserTasksForExperience || [];
    const totalTasks = allTasks.length;
    const totalHours = allTasks.reduce((sum, task) => 
      sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
    const totalDeliverables = allTasks.reduce((sum, task) => {
      const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      return sum + deliverables.reduce((delSum, del) => delSum + (del.count || 1), 0);
    }, 0);
    
    return {
      totalTasks,
      totalHours,
      totalDeliverables,
    };
  }, [allUserTasksForExperience]);

  // Calculate XP and Performance Metrics for Experience System (based on ALL tasks across all time)
  const experienceData = useMemo(() => {
    const userTasksFiltered = allUserTasksForExperience || [];
    
    if (userTasksFiltered.length === 0) {
      const defaultLevel = calculateLevel(0);
      return {
        totalXP: 0,
        points: 0,
        level: defaultLevel.level,
        levelName: defaultLevel.name,
        badge: { 
          name: defaultLevel.name, 
          color: 'gray', 
          xpBadge: `${defaultLevel.badge} XP`,
          badge: defaultLevel.badge,
        },
        xpBadge: `${defaultLevel.badge} XP`,
        badgeEmoji: defaultLevel.badge,
        levelProgress: 0,
        xpToNextLevel: 200,
        nextLevelName: null,
        qualityMetrics: 0,
        productivityScore: 0,
        avgTaskCompletion: 0,
        qualityRating: 0,
        onTimeDelivery: 0,
      };
    }
    
    // Calculate XP using EXPERIENCE_POINTS constants
    const tasksCompleted = userTasksFiltered.length;
    const hoursWorked = userTasksFiltered.reduce((sum, task) => 
      sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
    
    let totalXP = 0;
    let shutterstockCount = 0;
    let aiCount = 0;
    let totalDeliverablesCount = 0;
    let totalVariationsCount = 0;
    
    // Calculate XP breakdown
    let xpFromTasks = 0;
    let xpFromDeliverables = 0;
    let xpFromVariations = 0;
    let xpFromShutterstock = 0;
    let xpFromAI = 0;
    let xpFromBonuses = 0;
    
    // Calculate XP from tasks and deliverables
    userTasksFiltered.forEach(task => {
      // XP for task added
      const taskXP = EXPERIENCE_POINTS.TASK_ADDED;
      totalXP += taskXP;
      xpFromTasks += taskXP;
      
      // XP for deliverables
      const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      deliverables.forEach(deliverable => {
        const quantity = deliverable?.count || 1;
        const deliverableXP = EXPERIENCE_POINTS.DELIVERABLE * quantity;
        totalXP += deliverableXP;
        xpFromDeliverables += deliverableXP;
        totalDeliverablesCount += quantity;
        
        // XP for variations
        const variationsQuantity = deliverable?.variationsCount || deliverable?.variationsQuantity || deliverable?.declinariQuantity || 0;
        if (variationsQuantity > 0) {
          const variationXP = EXPERIENCE_POINTS.VARIATION * variationsQuantity;
          totalXP += variationXP;
          xpFromVariations += variationXP;
          totalVariationsCount += variationsQuantity;
        }
      });
      
      // Check for Shutterstock usage
      const useShutterstock = task.data_task?.useShutterstock || task.useShutterstock || false;
      if (useShutterstock === true) {
        shutterstockCount++;
        const shutterstockXP = EXPERIENCE_POINTS.SHUTTERSTOCK_USED;
        totalXP += shutterstockXP;
        xpFromShutterstock += shutterstockXP;
      }
      
      // Check for AI usage (aiUsed is an array, check if it has items or if _usedAIEnabled is true)
      const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
      const usedAIEnabled = task.data_task?._usedAIEnabled || task._usedAIEnabled || false;
      const hasAIUsage = (aiUsed && Array.isArray(aiUsed) && aiUsed.length > 0) || usedAIEnabled;
      
      if (hasAIUsage) {
        aiCount++;
        const aiXP = EXPERIENCE_POINTS.AI_USED;
        totalXP += aiXP;
        xpFromAI += aiXP;
      }
    });
    
    // Bonus achievements
    if (shutterstockCount >= 10) {
      totalXP += EXPERIENCE_POINTS.BONUS_SHUTTERSTOCK_10;
      xpFromBonuses += EXPERIENCE_POINTS.BONUS_SHUTTERSTOCK_10;
    }
    if (aiCount >= 10) {
      totalXP += EXPERIENCE_POINTS.BONUS_AI_10;
      xpFromBonuses += EXPERIENCE_POINTS.BONUS_AI_10;
    }
    
    // Calculate level using new system
    const currentLevel = calculateLevel(totalXP);
    const levelProgress = calculateProgress(totalXP, currentLevel);
    const xpToNextLevel = getPointsToNextLevel(totalXP, currentLevel);
    const nextLevel = getNextLevel(currentLevel);
    
    // Get badge color from CARD_SYSTEM based on level color
    const getBadgeColor = (levelColor) => {
      // Map hex colors to CARD_SYSTEM color names
      const colorMap = {
        '#94a3b8': 'gray',
        '#60a5fa': 'blue',
        '#34d399': 'green',
        '#a78bfa': 'purple',
        '#f59e0b': 'amber',
        '#ef4444': 'red',
        '#ec4899': 'pink',
        '#8b5cf6': 'purple',
        '#06b6d4': 'blue',
        '#fbbf24': 'amber',
        '#10b981': 'green',
        '#3b82f6': 'blue',
        '#ff006e': 'pink',
      };
      return colorMap[levelColor] || 'gray';
    };
    
    const badge = {
      name: currentLevel.name,
      color: getBadgeColor(currentLevel.color),
      xpBadge: `${currentLevel.badge} XP`,
      badge: currentLevel.badge,
    };
    
    // Calculate performance metrics
    const getDurationDays = (startDate, endDate) => {
      if (!startDate || !endDate) return null;
      try {
        const start = normalizeTimestamp(startDate);
        const end = normalizeTimestamp(endDate);
        if (!start || !end) return null;
        const diffDays = differenceInDays(end, start);
        return diffDays < 0 ? 0 : Math.ceil(diffDays);
      } catch {
        return null;
      }
    };
    
    let totalCompletionDays = 0;
    let validTasks = 0;
    userTasksFiltered.forEach(task => {
      const createdAt = task.createdAt;
      const endDate = task.data_task?.endDate;
      const days = getDurationDays(createdAt, endDate);
      if (days !== null && days !== undefined) {
        totalCompletionDays += days;
        validTasks++;
      }
    });
    const avgTaskCompletion = validTasks > 0 ? totalCompletionDays / validTasks : 0;
    
    const totalTaskHours = userTasksFiltered.reduce((sum, task) => 
      sum + (task.data_task?.timeInHours || task.timeInHours || 0), 0);
    
    // Calculate planned hours
    let totalPlannedHours = 0;
    userTasksFiltered.forEach(task => {
      const deliverablesUsed = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      deliverablesUsed.forEach(deliverable => {
        const deliverableName = deliverable?.name;
        const quantity = deliverable?.count || 1;
        
        if (!deliverableName) return;
        
        const deliverableOption = deliverablesOptions.find(d => 
          d.value && d.value.toLowerCase().trim() === deliverableName.toLowerCase().trim()
        );
        
        if (deliverableOption) {
          const timePerUnit = deliverableOption.timePerUnit || 1;
          const timeUnit = deliverableOption.timeUnit || 'hr';
          const requiresQuantity = deliverableOption.requiresQuantity || false;
          
          let timeInHours = timePerUnit;
          if (timeUnit === 'min') timeInHours = timePerUnit / 60;
          else if (timeUnit === 'hr') timeInHours = timePerUnit;
          else if (timeUnit === 'day') timeInHours = timePerUnit * 8;
          
          let variationsTimeInHours = 0;
          if (requiresQuantity) {
            const variationsTime = deliverableOption.variationsTime || deliverableOption.declinariTime || 0;
            const variationsTimeUnit = deliverableOption.variationsTimeUnit || deliverableOption.declinariTimeUnit || 'min';
            const variationsQuantity = deliverable?.variationsCount || deliverable?.variationsQuantity || deliverable?.declinariQuantity || 0;
            
            if (variationsTime > 0 && variationsQuantity > 0) {
              let variationsTimeInMinutes = variationsTime;
              if (variationsTimeUnit === 'hr') variationsTimeInMinutes = variationsTime * 60;
              variationsTimeInHours = (variationsTimeInMinutes * variationsQuantity) / 60;
            }
          }
          
          totalPlannedHours += (timeInHours * quantity) + variationsTimeInHours;
        }
      });
    });
    
    const productivityScore = totalPlannedHours > 0 
      ? Math.min(100, Math.max(0, (totalPlannedHours / Math.max(totalTaskHours, 1)) * 100))
      : totalTaskHours > 0 ? 50 : 0;
    
    const qualityRating = totalPlannedHours > 0 && totalTaskHours > 0
      ? Math.min(5, Math.max(1, 5 - ((totalTaskHours - totalPlannedHours) / totalPlannedHours) * 2))
      : 3.5;
    
    // Calculate on-time delivery
    let onTimeCount = 0;
    userTasksFiltered.forEach(task => {
      const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
      const deliverablesUsed = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      
      let plannedHours = 0;
      deliverablesUsed.forEach(deliverable => {
        const deliverableName = deliverable?.name;
        const quantity = deliverable?.count || 1;
        
        if (!deliverableName) return;
        
        const deliverableOption = deliverablesOptions.find(d => 
          d.value && d.value.toLowerCase().trim() === deliverableName.toLowerCase().trim()
        );
        
        if (deliverableOption) {
          const timePerUnit = deliverableOption.timePerUnit || 1;
          const timeUnit = deliverableOption.timeUnit || 'hr';
          const requiresQuantity = deliverableOption.requiresQuantity || false;
          
          let timeInHours = timePerUnit;
          if (timeUnit === 'min') timeInHours = timePerUnit / 60;
          else if (timeUnit === 'hr') timeInHours = timePerUnit;
          else if (timeUnit === 'day') timeInHours = timePerUnit * 8;
          
          let variationsTimeInHours = 0;
          if (requiresQuantity) {
            const variationsTime = deliverableOption.variationsTime || deliverableOption.declinariTime || 0;
            const variationsTimeUnit = deliverableOption.variationsTimeUnit || deliverableOption.declinariTimeUnit || 'min';
            const variationsQuantity = deliverable?.variationsCount || deliverable?.variationsQuantity || deliverable?.declinariQuantity || 0;
            
            if (variationsTime > 0 && variationsQuantity > 0) {
              let variationsTimeInMinutes = variationsTime;
              if (variationsTimeUnit === 'hr') variationsTimeInMinutes = variationsTime * 60;
              variationsTimeInHours = (variationsTimeInMinutes * variationsQuantity) / 60;
            }
          }
          
          plannedHours += (timeInHours * quantity) + variationsTimeInHours;
        }
      });
      
      if (plannedHours > 0 && taskHours <= plannedHours * 1.1) {
        onTimeCount++;
      } else if (plannedHours === 0 && taskHours > 0) {
        onTimeCount++;
      }
    });
    
    const onTimeDelivery = userTasksFiltered.length > 0 ? (onTimeCount / userTasksFiltered.length) * 100 : 0;
    const qualityMetrics = (productivityScore + onTimeDelivery) / 2;
    
      return {
        totalXP,
        points: totalXP,
        level: currentLevel.level,
        levelName: currentLevel.name,
        badge,
        xpBadge: badge.xpBadge,
        badgeEmoji: badge.badge,
        levelProgress,
        xpToNextLevel: xpToNextLevel > 0 ? xpToNextLevel : 0,
        nextLevelName: nextLevel ? nextLevel.name : null,
        nextLevelEmoji: nextLevel ? nextLevel.badge : null,
        nextLevelMinPoints: nextLevel ? nextLevel.minPoints : null,
        // XP Breakdown
        xpBreakdown: {
          fromTasks: xpFromTasks,
          fromDeliverables: xpFromDeliverables,
          fromVariations: xpFromVariations,
          fromShutterstock: xpFromShutterstock,
          fromAI: xpFromAI,
          fromBonuses: xpFromBonuses,
        },
        // Counts
        tasksCount: tasksCompleted,
        deliverablesCount: totalDeliverablesCount,
        variationsCount: totalVariationsCount,
        shutterstockCount,
        aiCount,
        qualityMetrics: Math.round(qualityMetrics),
        productivityScore: Math.round(productivityScore),
        avgTaskCompletion: avgTaskCompletion.toFixed(1),
        qualityRating: qualityRating.toFixed(1),
        onTimeDelivery: Math.round(onTimeDelivery),
      };
  }, [allUserTasksForExperience, deliverablesOptions, user?.userUID]);

  // Create small cards - optimized memoization to prevent re-renders
  const smallCards = useMemo(() => createCards({
    tasks,
    reporters,
    users,
    deliverables,
    periodName: selectedMonth?.monthName || currentMonth?.monthName || "Loading...",
    periodId: selectedMonth?.monthId || currentMonth?.monthId || "unknown",
    isCurrentMonth,
    isUserAdmin,
    currentUser: user,
    selectedMonth,
    currentMonth,
    selectedUserId,
    selectedUserName,
    selectedReporterId,
    selectedReporterName,
    selectedWeek,
    canCreateTasks,
    handleCreateTask,
    handleUserSelect,
    handleReporterSelect,
    handleWeekChange,
    selectMonth,
    availableMonths,
    // Pre-calculated values from hooks
    userFilterTotalTasks: userFilterTasksData.totalTasks,
    userFilterTotalHours: userFilterHoursData.totalHours,
    reporterFilterTotalTasks: reporterFilterTasksData.totalTasks,
    reporterFilterTotalHours: reporterFilterHoursData.totalHours,
    actionsTotalTasks: actionsTasksData.totalTasks,
    actionsTotalHours: actionsHoursData.totalHours,
    actionsTotalDeliverables: actionsDeliverablesData.totalDeliverables,
    actionsTotalDeliverablesWithVariationsHours: actionsDeliverablesHoursData.totalDeliverablesWithVariationsHours,
    // Pass filtered tasks and deliverables options for XP card calculations
    actionsFilteredTasks: actionsFilteredTasks,
    deliverablesOptions: deliverablesOptions,
  }, 'main'), [
    // Only include data that actually affects card content
    tasks, reporters, users, deliverables, selectedMonth, currentMonth, isCurrentMonth,
    isUserAdmin, user, selectedUserId, selectedUserName, selectedReporterId,
    selectedReporterName, selectedWeek, canCreateTasks, selectMonth, availableMonths,
    // Include hook results
    userFilterTasksData.totalTasks, userFilterHoursData.totalHours,
    reporterFilterTasksData.totalTasks, reporterFilterHoursData.totalHours,
    actionsTasksData.totalTasks, actionsHoursData.totalHours,
    actionsDeliverablesData.totalDeliverables, actionsDeliverablesHoursData.totalDeliverablesWithVariationsHours,
    // Include filtered tasks and deliverables options for XP card
    actionsFilteredTasks, deliverablesOptions,
    // Excluded handler functions to prevent cross-contamination
  ]);

  // Safety check to prevent errors during initialization - moved after all hooks
  if (!appData || !appData.isInitialized) {
    return (
      <div className="min-h-screen flex-center">
        <Loader size="lg" text="Initializing application data..." variant="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        Error loading tasks: {error?.message || "Unknown error"}
      </div>
    );
  }
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your tasks and track your progress
            </p>
          </div>
          <DynamicButton
            onClick={handleCreateTask}
            variant="primary"
            size="md"
            iconName="add"
            iconPosition="left"
            className="px-4 py-3 m-0"
          >
            ADD TASK
          </DynamicButton>
        </div>

        {/* Month Progress Bar */}
        <div className="mb-6">
          <MonthProgressBar
            monthId={selectedMonth?.monthId || currentMonth?.monthId}
            monthName={selectedMonth?.monthName || currentMonth?.monthName}
            isCurrentMonth={isCurrentMonth}
            startDate={selectedMonth?.startDate || currentMonth?.startDate}
            endDate={selectedMonth?.endDate || currentMonth?.endDate}
            daysInMonth={
              selectedMonth?.daysInMonth || currentMonth?.daysInMonth
            }
          />
        </div>
      </div>

      {/* Experience System Section */}
      <div className="mb-6">
        <div className="card overflow-hidden relative">
          {/* Left accent line like SmallCard */}
          <div
            className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-xl"
            style={{
              backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple,
              opacity: 0.6,
            }}
          />
          
          <div className="pl-2">
            {/* Header with Collapse Button */}
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-3 flex-1">
                {/* Icon with card-style background */}
                <div
                  className="relative flex-shrink-0 p-2.5 rounded-lg"
                  style={{
                    background: `${CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple}12`,
                  }}
                >
                  <Icons.generic.star
                    className="w-5 h-5"
                    style={{
                      color: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple,
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                    Experience & Performance
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Level {experienceData.level} • {experienceData.levelName} {experienceData.badgeEmoji}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={experienceData.badge.color} size="md">
                  {experienceData.badge.name}
                </Badge>
                {experienceData.xpBadge && (
                  <Badge variant="purple" size="sm">
                    {experienceData.xpBadge}
                  </Badge>
                )}
                <button
                  onClick={() => setIsExperienceCollapsed(!isExperienceCollapsed)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  aria-label={isExperienceCollapsed ? "Expand" : "Collapse"}
                >
                  {isExperienceCollapsed ? (
                    <Icons.buttons.chevronDown className="w-5 h-5" />
                  ) : (
                    <Icons.buttons.chevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {!isExperienceCollapsed && (
              <div className="px-4 pb-4 space-y-4">
                {/* Main Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* XP Card */}
                  <Tooltip
                    content={`XP Breakdown:\n\n` +
                      `Tasks: ${experienceData.xpBreakdown.fromTasks.toLocaleString()} XP (${experienceData.tasksCount} tasks)\n` +
                      `Deliverables: ${experienceData.xpBreakdown.fromDeliverables.toLocaleString()} XP (${experienceData.deliverablesCount} items)\n` +
                      `Variations: ${experienceData.xpBreakdown.fromVariations.toLocaleString()} XP (${experienceData.variationsCount} variations)\n` +
                      `Shutterstock: ${experienceData.xpBreakdown.fromShutterstock.toLocaleString()} XP (${experienceData.shutterstockCount} uses)\n` +
                      `AI Usage: ${experienceData.xpBreakdown.fromAI.toLocaleString()} XP (${experienceData.aiCount} uses)\n` +
                      `Bonuses: ${experienceData.xpBreakdown.fromBonuses.toLocaleString()} XP\n\n` +
                      `Total: ${experienceData.totalXP.toLocaleString()} XP`}
                  >
                    <div
                      className="p-4 rounded-lg border relative overflow-hidden cursor-help"
                      style={{
                        background: `${CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple}08`,
                        borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple}20`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple,
                            }}
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Experience Points
                          </span>
                        </div>
                        {experienceData.xpBadge && (
                          <Badge variant="purple" size="xs">
                            {experienceData.xpBadge}
                          </Badge>
                        )}
                      </div>
                      <div
                        className="text-3xl font-bold mb-1"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple,
                        }}
                      >
                        {experienceData.totalXP.toLocaleString()} XP
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {experienceData.points.toLocaleString()} Points
                      </div>
                    </div>
                  </Tooltip>

                  {/* Level Card */}
                  <Tooltip
                    content={experienceData.nextLevelName 
                      ? `Next Level: ${experienceData.nextLevelEmoji} ${experienceData.nextLevelName}\n` +
                        `Required: ${experienceData.nextLevelMinPoints?.toLocaleString()} XP\n` +
                        `Progress: ${experienceData.levelProgress.toFixed(1)}%\n` +
                        `XP Needed: ${experienceData.xpToNextLevel.toLocaleString()} XP\n\n` +
                        `Current: ${experienceData.totalXP.toLocaleString()} / ${experienceData.nextLevelMinPoints?.toLocaleString()} XP`
                      : `Max Level Reached!\n\n` +
                        `Current: ${experienceData.totalXP.toLocaleString()} XP\n` +
                        `Level: ${experienceData.level} - ${experienceData.levelName}`}
                  >
                    <div
                      className="p-4 rounded-lg border relative overflow-hidden cursor-help"
                      style={{
                        background: `${CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.blue}08`,
                        borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.blue}20`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.blue,
                          }}
                        />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Current Level
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="text-3xl font-bold"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.blue,
                          }}
                        >
                          {experienceData.badgeEmoji}
                        </div>
                        <div
                          className="text-2xl font-bold"
                          style={{
                            color: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.blue,
                          }}
                        >
                          {experienceData.levelName}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Level {experienceData.level} • {experienceData.levelProgress.toFixed(1)}% progress
                      </div>
                      {experienceData.nextLevelName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Next: {experienceData.nextLevelEmoji} {experienceData.nextLevelName}
                        </div>
                      )}
                    </div>
                  </Tooltip>

                  {/* Quality Metrics Card */}
                  <div
                    className="p-4 rounded-lg border relative overflow-hidden"
                    style={{
                      background: `${CARD_SYSTEM.COLOR_HEX_MAP.green}08`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}20`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.green,
                        }}
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Quality Metrics
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div
                        className="text-3xl font-bold"
                        style={{
                          color: CARD_SYSTEM.COLOR_HEX_MAP.green,
                        }}
                      >
                        {experienceData.qualityMetrics}%
                      </div>
                      <Badge variant="blue" size="sm">In Progress</Badge>
                    </div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <Tooltip
                  content={(() => {
                    const currentLevelIndex = EXPERIENCE_LEVELS.findIndex(l => l.level === experienceData.level);
                    const visibleLevels = EXPERIENCE_LEVELS.slice(
                      Math.max(0, currentLevelIndex - 2),
                      Math.min(EXPERIENCE_LEVELS.length, currentLevelIndex + 4)
                    );
                    return `Level System:\n\n` +
                      visibleLevels.map(level => {
                        const isCurrent = level.level === experienceData.level;
                        const isNext = level.level === (experienceData.level + 1);
                        const prefix = isCurrent ? '→ ' : isNext ? '↑ ' : '  ';
                        const range = level.maxPoints === Infinity 
                          ? `${level.minPoints.toLocaleString()}+ XP`
                          : `${level.minPoints.toLocaleString()} - ${level.maxPoints.toLocaleString()} XP`;
                        return `${prefix}${level.badge} Level ${level.level}: ${level.name} (${range})`;
                      }).join('\n') +
                      (currentLevelIndex < EXPERIENCE_LEVELS.length - 3 ? '\n\n...' : '');
                  })()}
                >
                  <div className="space-y-2 cursor-help">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Level Progress</span>
                      <span className="text-gray-600 dark:text-gray-400">{experienceData.levelProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${experienceData.levelProgress}%`,
                          backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {experienceData.xpToNextLevel > 0 
                        ? `${experienceData.xpToNextLevel.toLocaleString()} XP needed for ${experienceData.nextLevelName || 'next level'}`
                        : 'Max level reached!'
                      }
                    </div>
                  </div>
                </Tooltip>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Productivity Score */}
                  <div
                    className="p-3 rounded-lg border flex items-center justify-between"
                    style={{
                      background: `${CARD_SYSTEM.COLOR_HEX_MAP.amber}08`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.amber}20`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.amber,
                        }}
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Productivity Score
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: CARD_SYSTEM.COLOR_HEX_MAP.amber,
                      }}
                    >
                      {experienceData.productivityScore}%
                    </span>
                  </div>

                  {/* Avg Task Completion */}
                  <div
                    className="p-3 rounded-lg border flex items-center justify-between"
                    style={{
                      background: `${CARD_SYSTEM.COLOR_HEX_MAP.blue}08`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.blue}20`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.blue,
                        }}
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Avg Completion
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: CARD_SYSTEM.COLOR_HEX_MAP.blue,
                      }}
                    >
                      {experienceData.avgTaskCompletion} days
                    </span>
                  </div>

                  {/* Quality Rating */}
                  <div
                    className="p-3 rounded-lg border flex items-center justify-between"
                    style={{
                      background: `${CARD_SYSTEM.COLOR_HEX_MAP.pink}08`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.pink}20`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.pink,
                        }}
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Quality Rating
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: CARD_SYSTEM.COLOR_HEX_MAP.pink,
                      }}
                    >
                      {experienceData.qualityRating}/5
                    </span>
                  </div>

                  {/* On-Time Delivery */}
                  <div
                    className="p-3 rounded-lg border flex items-center justify-between"
                    style={{
                      background: `${CARD_SYSTEM.COLOR_HEX_MAP.green}08`,
                      borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}20`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.green,
                        }}
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        On-Time Delivery
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: CARD_SYSTEM.COLOR_HEX_MAP.green,
                      }}
                    >
                      {experienceData.onTimeDelivery}%
                    </span>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Statistics Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Tooltip content={`${allTasksTotals.totalTasks} tasks completed\n` +
                      `XP per task: ${EXPERIENCE_POINTS.TASK_ADDED} XP\n` +
                      `Total from tasks: ${experienceData.xpBreakdown.fromTasks.toLocaleString()} XP`}>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-help p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.blue,
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-700 dark:text-gray-300">{allTasksTotals.totalTasks}</div>
                          <div className="text-xs">Tasks Completed</div>
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content={`${allTasksTotals.totalHours.toFixed(1)} hours worked\n` +
                      `Average: ${allTasksTotals.totalTasks > 0 ? (allTasksTotals.totalHours / allTasksTotals.totalTasks).toFixed(1) : 0}h per task`}>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-help p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.amber,
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-700 dark:text-gray-300">{allTasksTotals.totalHours.toFixed(1)}h</div>
                          <div className="text-xs">Total Hours</div>
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content={`${allTasksTotals.totalDeliverables} deliverables used\n` +
                      `XP per deliverable: ${EXPERIENCE_POINTS.DELIVERABLE} XP\n` +
                      `Total from deliverables: ${experienceData.xpBreakdown.fromDeliverables.toLocaleString()} XP\n` +
                      `Variations: ${experienceData.variationsCount} (${experienceData.xpBreakdown.fromVariations.toLocaleString()} XP)`}>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-help p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.green,
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-700 dark:text-gray-300">{allTasksTotals.totalDeliverables}</div>
                          <div className="text-xs">Deliverables</div>
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content={`Current Level: ${experienceData.level}\n` +
                      `Level Name: ${experienceData.levelName} ${experienceData.badgeEmoji}\n` +
                      `Progress: ${experienceData.levelProgress.toFixed(1)}%\n` +
                      (experienceData.nextLevelName 
                        ? `Next Level: ${experienceData.nextLevelName} (${experienceData.nextLevelMinPoints?.toLocaleString()} XP)`
                        : `Max Level Reached!`)}>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-help p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP[experienceData.badge.color] || CARD_SYSTEM.COLOR_HEX_MAP.purple,
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-700 dark:text-gray-300">{experienceData.badgeEmoji} Level {experienceData.level}</div>
                          <div className="text-xs">{experienceData.levelName}</div>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                  
                  {/* XP Sources Breakdown */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">XP Sources</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      <div className="text-xs">
                        <div className="text-gray-500 dark:text-gray-400">Tasks</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{experienceData.xpBreakdown.fromTasks.toLocaleString()} XP</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-gray-500 dark:text-gray-400">Deliverables</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{experienceData.xpBreakdown.fromDeliverables.toLocaleString()} XP</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-gray-500 dark:text-gray-400">Variations</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{experienceData.xpBreakdown.fromVariations.toLocaleString()} XP</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-gray-500 dark:text-gray-400">Shutterstock</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{experienceData.xpBreakdown.fromShutterstock.toLocaleString()} XP</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-gray-500 dark:text-gray-400">AI Usage</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{experienceData.xpBreakdown.fromAI.toLocaleString()} XP</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-gray-500 dark:text-gray-400">Bonuses</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{experienceData.xpBreakdown.fromBonuses.toLocaleString()} XP</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* top cards section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Dynamic Small Cards */}
          {isInitialLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            : smallCards.map((card) => <SmallCard key={card.id} card={card} />)}
        </div>
      </div>

      {/* Delimiter */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-6"></div>

      {/* table task section */}
      <div>
        {/* Table Content */}
        <div>
          <TaskTable
            selectedUserId={selectedUserId}
            selectedReporterId={selectedReporterId}
            selectedMonthId={currentMonthId}
            selectedWeek={selectedWeek}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
        monthId={currentMonthId}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
        onError={(error) => {
          // Handle permission errors
          if (
            error?.message?.includes("permission") ||
            error?.message?.includes("User lacks required")
          ) {
            showAuthError("You do not have permission to create tasks");
          } else if (error?.message?.includes("board not available") || error?.message?.includes("board not found")) {
            showError(error.message || "Month board not available for task creation");
          }
        }}
      />

    </div>
  );
};

export default AdminDashboardPage;
