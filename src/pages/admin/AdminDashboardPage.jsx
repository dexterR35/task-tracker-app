import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import TaskTable from "@/features/tasks/components/TaskTable/TaskTable";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createSmallCards } from "@/components/Card/smallCards/smallCardConfig";
import { showError, showAuthError } from "@/utils/toast";
import { MonthProgressBar, getWeeksInMonth, getCurrentWeekNumber } from "@/utils/monthUtils.jsx";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import Loader from "@/components/ui/Loader/Loader";

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTable, setShowTable] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Get auth functions separately
  const { canAccess } = useAuth();
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
  const selectedUser = users.find((u) => (u.userUID || u.id) === selectedUserId);
  const selectedUserName = selectedUser?.name || selectedUser?.email || "Unknown User";
  
  const selectedReporter = reporters.find((r) => (r.id || r.uid) === selectedReporterId);
  const selectedReporterName = selectedReporter?.name || selectedReporter?.reporterName;

  // Handle user selection with role-based access control and logging
  const handleUserSelect = useCallback(
    (userId) => {
      // Regular users can only select themselves
      if (!isUserAdmin && userId && userId !== user?.userUID) {
        console.warn("🚫 User selection blocked: Regular user cannot select other users", {
          userId,
          currentUserUID: user?.userUID,
          isUserAdmin
        });
        return; // Prevent regular users from selecting other users
      }
      
      const currentParams = Object.fromEntries(searchParams.entries());
      
      if (!userId) {
        delete currentParams.user;
      } else {
        currentParams.user = userId;
      }
      setSearchParams(currentParams, { replace: true });
    },
    [setSearchParams, searchParams, isUserAdmin, user, users]
  );

  // Handle reporter selection with role-based access control and logging
  const handleReporterSelect = useCallback(
    (reporterId) => {
      const currentParams = Object.fromEntries(searchParams.entries());
      
      if (!reporterId) {
        delete currentParams.reporter;
      } else {
        currentParams.reporter = reporterId;
      }
      setSearchParams(currentParams, { replace: true });
    },
    [setSearchParams, searchParams, reporters]
  );


  // Derive title based on context and role - simplified
  const title = (() => {
    const weekInfo = selectedWeek ? ` - Week ${selectedWeek.weekNumber}` : "";
    
    if (!isUserAdmin) return `My Tasks${weekInfo}`;
    
    if (selectedUserId && selectedReporterId) {
      return `Tasks - ${selectedUserName} & ${selectedReporterName}${weekInfo}`;
    } else if (selectedUserId) {
      return `Tasks - ${selectedUserName}${weekInfo}`;
    } else if (selectedReporterId) {
      return `Tasks - ${selectedReporterName}${weekInfo}`;
    } else {
      return `All Tasks - All Users${weekInfo}`;
    }
  })();

  // Get current month ID for filtering - simplified
  const currentMonthId = selectedMonth?.monthId || currentMonth?.monthId;

  // Task creation is only allowed for current month with existing board - simplified
  const canCreateTasks = isCurrentMonth && currentMonth.boardExists;

  // Handle create task - memoized to prevent recreation
  const handleCreateTask = useCallback(() => {
    if (!canCreateTasks) {
      showError("Create Task is not available for this month");
      return;
    }
    setShowCreateModal(true);
  }, [canCreateTasks]);

  // Handle week selection
  const handleWeekChange = useCallback((week) => {
    // If week is null or empty, clear the selection (show all weeks)
    setSelectedWeek(week);
    
    // Update URL parameters
    const currentParams = Object.fromEntries(searchParams.entries());
    if (!week) {
      delete currentParams.week;
    } else {
      currentParams.week = week.weekNumber.toString();
    }
    setSearchParams(currentParams, { replace: true });
  }, [searchParams, setSearchParams]);

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
        console.warn('Error parsing week parameter:', error);
      }
    } else {
      setSelectedWeek(null);
    }
  }, [selectedWeekParam, selectedMonth?.monthId, currentMonth?.monthId]);

  // Add logging for combined selections and security checks - optimized
  useEffect(() => {
    if (selectedUserId && selectedReporterId) {
      console.log("🔍 Combined selection active", {
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
    if (isUserAdmin && selectedUserId) {
      console.log("🔐 Admin viewing user data", {
        adminUserUID: user?.userUID,
        viewingUserUID: selectedUserId,
        viewingUserName: selectedUserName,
        timestamp: new Date().toISOString()
      });
    }
  }, [isUserAdmin, selectedUserId, selectedUserName, user?.userUID]);

  // Small cards data preparation - memoized to prevent unnecessary re-renders
  const smallCardsData = useMemo(() => ({
    tasks, // ✅ Global tasks - never filtered
    reporters,
    users,
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
  }), [
    tasks, reporters, users, selectedMonth, currentMonth, isCurrentMonth,
    isUserAdmin, user, selectedUserId, selectedUserName, selectedReporterId,
    selectedReporterName, selectedWeek, canCreateTasks, handleCreateTask, handleUserSelect,
    handleReporterSelect, handleWeekChange, selectMonth, availableMonths
  ]);

  // Create small cards - memoized to prevent unnecessary re-renders
  const smallCards = useMemo(() => createSmallCards(smallCardsData), [smallCardsData]);

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
      <div className="mb-4">
        <div className="flex items-end justify-between">
          <div>
            <h2>Task Management </h2>
            <p className="text-small mt-0">
              {title} •{" "}
              {isInitialLoading ? (
                <span>Loading...</span>
              ) : (
                selectedMonth?.monthName ||
                currentMonth?.monthName ||
                "No month selected"
              )}
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
        <div className="my-6 card">
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
      <div className="mb-2 ">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Dynamic Small Cards */}
          {isInitialLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            : smallCards.map((card) => <SmallCard key={card.id} card={card} />)}
        </div>
      </div>



      {/* table task section */}
      <div>
        <div className="py-6 border-bottom">
          <div className="flex items-center justify-between">
            <div>
              <h3>
                {(() => {
                  const weekInfo = selectedWeek ? ` - Week ${selectedWeek.weekNumber}` : "";
                  
                  // For regular users, show "My Tasks"
                  if (!isUserAdmin) {
                    return `My Tasks - ${user?.name || user?.email || 'User'}${weekInfo}`;
                  }
                  
                  // For admin users, show filtered titles
                  if (selectedUserId && selectedReporterId) {
                    return `${selectedUserName} & ${selectedReporterName} Tasks${weekInfo}`;
                  } else if (selectedUserId) {
                    return `${selectedUserName} Tasks${weekInfo}`;
                  } else if (selectedReporterId) {
                    return `${selectedReporterName} Tasks${weekInfo}`;
                  } else {
                    return `All Tasks${weekInfo}`;
                  }
                })()}
              </h3>
              <p className="text-sm">
                Task management and tracking
              </p>
            </div>
            <DynamicButton
              onClick={() => setShowTable(!showTable)}
              variant="outline"
              size="lg"
              iconName={showTable ? "hide" : "show"}
              iconPosition="left"
              disabled={isInitialLoading}
              className="w-24"
            >
              {showTable ? "Hide" : "Show"}
            </DynamicButton>
          </div>
        </div>

        {/* Table Content */}
        <div className="py-2">
          {showTable && (
            <TaskTable
              selectedUserId={selectedUserId}
              selectedReporterId={selectedReporterId}
              selectedMonthId={currentMonthId}
              selectedWeek={selectedWeek}
              error={error}
              isLoading={isLoading}
            />
          )}
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
          }
        }}
      />

    </div>
  );
};

export default AdminDashboardPage;
