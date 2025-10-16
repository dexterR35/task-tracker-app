import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import TaskTable from "@/features/tasks/components/TaskTable/TaskTable";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createSmallCards } from "@/components/Card/smallCards/smallCardConfig";
import { showError, showAuthError } from "@/utils/toast";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTable, setShowTable] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get auth functions separately
  const { canAccess } = useAuth();
  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  const selectedReporterId = searchParams.get("reporter") || "";

  // Get all data from useAppData hook
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
  } = useAppData(selectedUserId);

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
      const previousUserId = currentParams.user;
      
      if (!userId) {
        delete currentParams.user;
        console.log("👤 User selection cleared", { previousUserId });
      } else {
        currentParams.user = userId;
        const selectedUser = users.find(u => (u.userUID || u.id) === userId);
        console.log("👤 User selected", {
          userId,
          userName: selectedUser?.name || selectedUser?.email || "Unknown",
          previousUserId,
          isUserAdmin
        });
      }
      setSearchParams(currentParams, { replace: true });
    },
    [setSearchParams, searchParams, isUserAdmin, user, users]
  );

  // Handle reporter selection with role-based access control and logging
  const handleReporterSelect = useCallback(
    (reporterId) => {
      const currentParams = Object.fromEntries(searchParams.entries());
      const previousReporterId = currentParams.reporter;
      
      if (!reporterId) {
        delete currentParams.reporter;
        console.log("📊 Reporter selection cleared", { previousReporterId });
      } else {
        currentParams.reporter = reporterId;
        const selectedReporter = reporters.find(r => (r.id || r.uid) === reporterId);
        console.log("📊 Reporter selected", {
          reporterId,
          reporterName: selectedReporter?.name || selectedReporter?.reporterName || "Unknown",
          previousReporterId
        });
      }
      setSearchParams(currentParams, { replace: true });
    },
    [setSearchParams, searchParams, reporters]
  );


  // Derive title based on context and role - simplified
  const title = (() => {
    if (!isUserAdmin) return "My Tasks";
    
    if (selectedUserId && selectedReporterId) {
      return `Tasks - ${selectedUserName} & ${selectedReporterName}`;
    } else if (selectedUserId) {
      return `Tasks - ${selectedUserName}`;
    } else if (selectedReporterId) {
      return `Tasks - ${selectedReporterName}`;
    } else {
      return "All Tasks - All Users";
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

  // Add logging for combined selections and security checks
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
  }, [selectedUserId, selectedReporterId, selectedUserName, selectedReporterName, currentMonthId, tasks?.length]);

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

  // Small cards data preparation - simplified without excessive memoization
  const smallCardsData = {
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
    canCreateTasks,
    handleCreateTask,
    handleUserSelect,
    handleReporterSelect,
    selectMonth,
    availableMonths,
  };

  // Create small cards - only memoize if it's expensive
  const smallCards = useMemo(
    () => createSmallCards(smallCardsData),
    [smallCardsData.tasks, smallCardsData.selectedUserId, smallCardsData.selectedReporterId, smallCardsData.selectedMonth?.monthId, smallCardsData.currentMonth?.monthId]
  );

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
        <div className="my-6">
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
                  // For regular users, show "My Tasks"
                  if (!isUserAdmin) {
                    return `My Tasks - ${user?.name || user?.email || 'User'}`;
                  }
                  
                  // For admin users, show filtered titles
                  if (selectedUserId && selectedReporterId) {
                    return `${selectedUserName} & ${selectedReporterName} Tasks`;
                  } else if (selectedUserId) {
                    return `${selectedUserName} Tasks`;
                  } else if (selectedReporterId) {
                    return `${selectedReporterName} Tasks`;
                  } else {
                    return "All Tasks";
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
