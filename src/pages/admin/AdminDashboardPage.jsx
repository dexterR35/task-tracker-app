import React, { useState, useCallback, useMemo, useRef } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import TaskTable from "@/features/tasks/components/TaskTable/TaskTable";
import TaskFormPanel from "@/features/tasks/components/TaskForm/TaskFormPanel";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { showError, showAuthError } from "@/utils/toast";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import { SearchableSelectField } from "@/components/forms/components";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import Loader from "@/components/ui/Loader/Loader";
import { logger } from "@/utils/logger";
import { useTasks } from "@/features/tasks/tasksApi";

const AdminDashboardPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Get auth functions separately
  const { canAccess, canCreateTask } = useAuth();
  const isUserAdmin = canAccess("admin");

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
  } = appData || {};

  // Get current month ID for filtering - simplified
  const currentMonthId = selectedMonth?.monthId || currentMonth?.monthId;

  // Task creation logic: allow if:
  // 1. User has create_tasks permission
  // 2. AND either:
  //    - Current month is selected AND board exists, OR
  //    - A different month is selected AND that month has a board
  const selectedMonthHasBoard = selectedMonth?.boardExists ?? false;
  const canCreateTasks = canCreateTask() && (
    (isCurrentMonth && (currentMonth?.boardExists ?? false)) ||
    (!isCurrentMonth && selectedMonthHasBoard)
  );

  // Handle create task - memoized to prevent recreation
  const handleCreateTask = useCallback(() => {
    if (!canCreateTasks) {
      // Check if it's a permission issue or month/board issue
      if (!canCreateTask()) {
        showAuthError("You do not have permission to create tasks");
      } else if (!(currentMonth?.boardExists) && isCurrentMonth) {
        showError("Create Task is not available - current month board not found");
      } else if (!selectedMonthHasBoard && !isCurrentMonth) {
        showError("Create Task is not available - selected month board not found");
      } else {
        showError("Create Task is not available for this month");
      }
      return;
    }
    setShowCreateModal(true);
  }, [canCreateTasks, canCreateTask, isCurrentMonth, currentMonth?.boardExists, selectedMonthHasBoard]);

  const handleExport = useCallback(() => {
    showError("Export coming soon");
  }, []);

  // Hardcoded efficiency data for performance card
  const efficiencyData = {
    averageTaskCompletion: 2.3, // days
    productivityScore: 87, // percentage
    qualityRating: 4.2, // out of 5
    onTimeDelivery: 94, // percentage
    clientSatisfaction: 4.6, // out of 5
  };

  // Build filters for database-level filtering (for cards and actions)
  const cardsFilters = useMemo(() => ({}), []);

  // Get filtered tasks from database for cards (with all filters)
  const {
    tasks: filteredTasksForCards = [],
  } = useTasks(
    currentMonthId || null,
    isUserAdmin ? 'admin' : 'user',
    user?.id ?? null,
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
      tasks: filteredTasksForCards,
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
      canCreateTasks,
      handleCreateTask,
      selectMonth,
      availableMonths,
      efficiency: efficiencyData,
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
    filteredTasksForCards, reporters, users, deliverables, selectedMonth, currentMonth, isCurrentMonth,
    isUserAdmin, user, canCreateTasks, selectMonth, availableMonths,
    actionsTasksData.totalTasks, actionsHoursData.totalHours,
    actionsDeliverablesData.totalDeliverables, actionsDeliverablesHoursData.totalDeliverablesWithVariationsHours,
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
      {/* Page Header: Title + subtitle left, Export + Add right */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Overview of tasks and progress
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DynamicButton
            onClick={handleExport}
            variant="secondary"
            size="sm"
            iconName="download"
            iconPosition="left"
            className="!text-xs !px-3 !py-1.5"
          >
            Export
          </DynamicButton>
          <DynamicButton
            onClick={handleCreateTask}
            variant="primary"
            size="sm"
            iconName="add"
            iconPosition="left"
            className="!text-xs !px-3 !py-1.5"
          >
            Add
          </DynamicButton>
        </div>
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

      {/* Overview cards */}
      <section className="mb-6" aria-label="Dashboard overview">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Overview
          </span>
          <span className="h-px flex-1 max-w-[2rem] bg-gray-200 dark:bg-gray-600 rounded-full shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isInitialLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            : smallCards.map((card) => <SmallCard key={card.id} card={card} />)}
        </div>
        {/* Month filter below cards */}
        <div className="flex flex-wrap items-end gap-4 mt-4">
          <div className="min-w-[180px] max-w-[220px]">
            <SearchableSelectField
              field={{
                name: "selectedMonth",
                type: "select",
                required: false,
                options:
                  availableMonths?.map((month) => ({
                    value: month.monthId,
                    label: `${month.monthName}${month.isCurrent ? " (Current)" : ""}`,
                  })) || [],
                placeholder: "Select months...",
              }}
              setValue={(fieldName, value) => {
                if (fieldName === "selectedMonth" && selectMonth) selectMonth(value);
              }}
              watch={() => selectedMonth?.monthId || currentMonth?.monthId || ""}
              noOptionsMessage="No months available"
              variant="soft_purple"
            />
          </div>
        </div>
      </section>

      {/* Table */}
      <div>
        {/* Table Content */}
        <div>
          <TaskTable
            selectedMonthId={currentMonthId}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Create Task – right-side panel (aside) */}
      <TaskFormPanel
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
