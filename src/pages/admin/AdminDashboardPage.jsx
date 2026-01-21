import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { filterTasksByUserAndReporter } from "@/utils/taskFilters";
import { useTasks } from "@/features/tasks/tasksApi";

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Get auth functions separately
  const { canAccess, canCreateTask } = useAuth();
  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  const selectedReporterId = searchParams.get("reporter") || "";
  const selectedWeekParam = searchParams.get("week") || "";
  const selectedDepartmentFilter = searchParams.get("department") || "";
  const selectedFilter = searchParams.get("filter") || "";
  
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

  // Get selected user and reporter info - simplified without excessive memoization
  const selectedUser = users.find(u => u.userUID === selectedUserId) || null;
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

  // Hardcoded efficiency data for performance card
  const efficiencyData = {
    averageTaskCompletion: 2.3, // days
    productivityScore: 87, // percentage
    qualityRating: 4.2, // out of 5
    onTimeDelivery: 94, // percentage
    clientSatisfaction: 4.6, // out of 5
  };

  // Simple inline calculations for user filter card
  const userFilterTasksData = useMemo(() => ({
    totalTasks: (tasks || []).length,
  }), [tasks]);
  
  const userFilterHoursData = useMemo(() => ({
    totalHours: (tasks || []).reduce((sum, task) => sum + (parseFloat(task.totalTime) || 0), 0),
  }), [tasks]);

  // Calculate values for reporter filter card
  const reporterFilteredTasks = useMemo(() => {
    if (!selectedReporterId || !tasks) return [];
    return filterTasksByUserAndReporter(tasks, {
      selectedReporterId,
    });
  }, [tasks, selectedReporterId]);
  
  const reporterFilterTasksData = useMemo(() => ({
    totalTasks: reporterFilteredTasks.length,
  }), [reporterFilteredTasks]);
  
  const reporterFilterHoursData = useMemo(() => ({
    totalHours: reporterFilteredTasks.reduce((sum, task) => sum + (parseFloat(task.totalTime) || 0), 0),
  }), [reporterFilteredTasks]);

  // Calculate date ranges for week/month filters
  const weekStart = useMemo(() => {
    if (!selectedWeek) return null;
    if (selectedWeek.startDate) {
      const date = new Date(selectedWeek.startDate);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    if (selectedWeek.days && selectedWeek.days.length > 0) {
      const sortedDays = [...selectedWeek.days]
        .map(day => day instanceof Date ? day : new Date(day))
        .filter(day => !isNaN(day.getTime()))
        .sort((a, b) => a - b);
      if (sortedDays.length > 0) {
        const date = new Date(sortedDays[0]);
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }
    return null;
  }, [selectedWeek]);

  const weekEnd = useMemo(() => {
    if (!selectedWeek) return null;
    if (selectedWeek.endDate) {
      const date = new Date(selectedWeek.endDate);
      date.setHours(23, 59, 59, 999);
      return date;
    }
    if (selectedWeek.days && selectedWeek.days.length > 0) {
      const sortedDays = [...selectedWeek.days]
        .map(day => day instanceof Date ? day : new Date(day))
        .filter(day => !isNaN(day.getTime()))
        .sort((a, b) => a - b);
      if (sortedDays.length > 0) {
        const date = new Date(sortedDays[sortedDays.length - 1]);
        date.setHours(23, 59, 59, 999);
        return date;
      }
    }
    return null;
  }, [selectedWeek]);

  // Note: monthStart/monthEnd are not needed for database filtering
  // Month filtering is already done via monthId in the query path
  // Only week filtering uses createdAt date range
  const monthStart = null;
  const monthEnd = null;

  // Build filters for database-level filtering (for cards and actions)
  const cardsFilters = useMemo(() => ({
    selectedUserId: isUserAdmin && selectedUserId ? selectedUserId : null,
    selectedReporterId: selectedReporterId || null,
    selectedDepartment: selectedDepartmentFilter || null,
    selectedFilter: selectedFilter || null,
    weekStart,
    weekEnd,
    // monthStart/monthEnd not needed - month filtering done via monthId in query path
  }), [
    isUserAdmin,
    selectedUserId,
    selectedReporterId,
    selectedDepartmentFilter,
    selectedFilter,
    weekStart,
    weekEnd,
  ]);

  // Get filtered tasks from database for cards (with all filters)
  const {
    tasks: filteredTasksForCards = [],
  } = useTasks(
    currentMonthId || null,
    isUserAdmin ? 'admin' : 'user',
    user?.userUID || null,
    cardsFilters
  );

  // Simple inline calculations for actions card
  const actionsFilteredTasks = filteredTasksForCards;
  
  const actionsTasksData = useMemo(() => ({
    totalTasks: actionsFilteredTasks.length,
  }), [actionsFilteredTasks]);
  
  const actionsHoursData = useMemo(() => ({
    totalHours: actionsFilteredTasks.reduce((sum, task) => sum + (parseFloat(task.totalTime) || 0), 0),
  }), [actionsFilteredTasks]);
  
  const actionsDeliverablesData = useMemo(() => {
    const uniqueDeliverables = new Set();
    actionsFilteredTasks.forEach(task => {
      if (task.deliverables && Array.isArray(task.deliverables)) {
        task.deliverables.forEach(d => uniqueDeliverables.add(d));
      }
    });
    return { totalDeliverables: uniqueDeliverables.size };
  }, [actionsFilteredTasks]);
  
  const actionsDeliverablesHoursData = useMemo(() => {
    let totalHours = 0;
    actionsFilteredTasks.forEach(task => {
      if (task.deliverables && Array.isArray(task.deliverables) && task.deliverables.length > 0) {
        totalHours += parseFloat(task.totalTime) || 0;
      }
    });
    return { totalDeliverablesWithVariationsHours: totalHours };
  }, [actionsFilteredTasks]);

  // Cache for stable card references (ID badge)
  const cardCacheRef = useRef(new Map());

  // Create small cards - optimized memoization to prevent re-renders
  const smallCards = useMemo(() => {
    const newCards = createCards({
      tasks: filteredTasksForCards, // Use filtered tasks with all filters
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
      efficiency: efficiencyData,
      // Pre-calculated values from hooks
      userFilterTotalTasks: userFilterTasksData.totalTasks,
      userFilterTotalHours: userFilterHoursData.totalHours,
      reporterFilterTotalTasks: reporterFilterTasksData.totalTasks,
      reporterFilterTotalHours: reporterFilterHoursData.totalHours,
      actionsTotalTasks: actionsTasksData.totalTasks,
      actionsTotalHours: actionsHoursData.totalHours,
      actionsTotalDeliverables: actionsDeliverablesData.totalDeliverables,
      actionsTotalDeliverablesWithVariationsHours: actionsDeliverablesHoursData.totalDeliverablesWithVariationsHours,
    }, 'main');

    // Memoize each card individually to ensure stable references (ID badge)
    // This ensures the card object reference never changes unless the data actually changes
    return newCards.map(newCard => {
      const cacheKey = `${newCard.id}-${newCard.color}-${newCard.value}-${newCard.title}-${newCard.subtitle}-${JSON.stringify(newCard.details)}-${JSON.stringify(newCard.badge)}`;
      const cachedCard = cardCacheRef.current.get(cacheKey);
      
      // If card data matches cached version, return cached card (stable reference)
      if (cachedCard && 
          cachedCard.id === newCard.id &&
          cachedCard.color === newCard.color &&
          cachedCard.value === newCard.value &&
          cachedCard.title === newCard.title &&
          cachedCard.subtitle === newCard.subtitle &&
          JSON.stringify(cachedCard.details) === JSON.stringify(newCard.details) &&
          JSON.stringify(cachedCard.badge) === JSON.stringify(newCard.badge)) {
        return cachedCard;
      }
      
      // Otherwise, cache and return new card
      cardCacheRef.current.set(cacheKey, newCard);
      return newCard;
    });
  }, [
    // Only include data that actually affects card content
    filteredTasksForCards, reporters, users, deliverables, selectedMonth, currentMonth, isCurrentMonth,
    isUserAdmin, user, selectedUserId, selectedUserName, selectedReporterId,
    selectedReporterName, selectedWeek, canCreateTasks, selectMonth, availableMonths,
    // Include hook results
    userFilterTasksData.totalTasks, userFilterHoursData.totalHours,
    reporterFilterTasksData.totalTasks, reporterFilterHoursData.totalHours,
    actionsTasksData.totalTasks, actionsHoursData.totalHours,
    actionsDeliverablesData.totalDeliverables, actionsDeliverablesHoursData.totalDeliverablesWithVariationsHours,
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
