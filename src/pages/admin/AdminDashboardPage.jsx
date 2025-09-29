import React, { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData, useMonthSelection } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import TanStackTable from "@/components/Table/TanStackTable";
import { useTaskColumns } from "@/components/Table/tableColumns.jsx";
import { useTableActions } from "@/hooks/useTableActions";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import DashboardCard from "@/components/Card/DashboardCard";
import { createDashboardCards } from "@/components/Card/cardConfig";
import SmallCard from "@/components/Card/smallCards/SmallCard";

import { createSmallCards } from "@/components/Card/smallCards/smallCardConfig";
import { useReporterMetrics } from "@/hooks/useReporterMetrics";
import { useTop3Calculations } from "@/hooks/useTop3Calculations";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { showError, showAuthError } from "@/utils/toast";
import MonthProgressBar from "@/components/ui/MonthProgressBar";

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTable, setShowTable] = useState(true);
  const [showCards, setShowCards] = useState(false);

  // Get auth functions separately
  const { canAccess } = useAuth();
  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  const selectedReporterId = searchParams.get("reporter") || "";

  // Get basic data from useAppData hook
  const {
    user,
    users,
    reporters,
    error,
    isLoading: appDataLoading,
    deleteTask,
  } = useAppData(); // Remove selectedUserId since we handle filtering in component

  const {
    tasks, // Current display tasks (current or selected month)
    availableMonths, // For dropdown options
    currentMonth, // Current month info
    selectedMonth, // Selected month info
    isCurrentMonth, // Boolean check
    isLoading, // Loading state for selected month
    isInitialLoading, // Loading state for initial month data
    isMonthDataReady, // Flag indicating month data is ready
    error: monthError, // Error state
    selectMonth, // Function to select month
    resetToCurrentMonth, // Function to reset
  } = useMonthSelection(); // Remove selectedUserId to get ALL tasks

  // Task creation is only allowed for current month with existing board
  // Permission validation happens at API level
  const canCreateTasks = isCurrentMonth && currentMonth.boardExists;

  // Always allow button click - permission checking happens at form submission
  const handleCreateTask = () => {
    if (!canCreateTasks) {
      showError("Create Task is not available for this month");
      return;
    }
    setShowCreateModal(true);
  };

  // Get selected user name for display
  const selectedUser = users.find(
    (u) => (u.userUID || u.id) === selectedUserId
  );
  const selectedUserName =
    selectedUser?.name || selectedUser?.email || "Unknown User";

  // Get selected reporter name for display
  const selectedReporter = reporters.find(
    (r) => (r.id || r.uid) === selectedReporterId
  );
  const selectedReporterName =
    selectedReporter?.name || selectedReporter?.reporterName;

  // Handle user selection (admin only) - memoized with useCallback
  const handleUserSelect = useCallback(
    (userId) => {
      const currentParams = Object.fromEntries(searchParams.entries());
      if (!userId) {
        delete currentParams.user;
      } else {
        currentParams.user = userId;
      }
      setSearchParams(currentParams, { replace: true });
    },
    [setSearchParams, searchParams]
  );

  // Handle reporter selection (admin only) - memoized with useCallback
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
    [setSearchParams, searchParams]
  );

  // Delete wrapper with error handling for permission issues
  const handleTaskDeleteMutation = async (task) => {
    if (!deleteTask) {
      console.error('deleteTask mutation not available');
      throw new Error('Delete task mutation not available');
    }
    
    try {
      return await deleteTask({ 
        monthId: task.monthId,  // Always use task's own monthId
        taskId: task.id,
        userData: user  // Pass user data for permission validation
      });
    } catch (error) {
      // Show permission error toast if it's a permission issue
      if (error?.message?.includes('permission') || error?.message?.includes('User lacks required')) {
        showAuthError('You do not have permission to delete tasks');
      }
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
  } = useTableActions('task', {
    getItemDisplayName: (task) => task?.data_task?.taskName || task?.data_task?.departments || 'Unknown Task',
    deleteMutation: handleTaskDeleteMutation,
  });

  // Handle edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  // Handle edit success
  const handleEditTaskSuccess = () => {
    setShowEditModal(false);
    setEditingTask(null);
    handleEditSuccess();
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Derive title based on context and role
  const title = isUserAdmin
    ? (() => {
        if (selectedUserId && selectedReporterId) {
          return `Tasks - ${selectedUserName} & ${selectedReporterName}`;
        } else if (selectedUserId) {
          return `Tasks - ${selectedUserName}`;
        } else if (selectedReporterId) {
          return `Tasks - ${selectedReporterName}`;
        } else {
          return "All Tasks - All Users";
        }
      })()
    : "My Tasks";

  // Get current month ID for filtering
  const currentMonthId = selectedMonth?.monthId || currentMonth?.monthId;

  // Get task columns for the table
  const taskColumns = useTaskColumns(currentMonthId, reporters);

  //  reusable filtering function
  const getFilteredTasks = useCallback(
    (tasks, selectedUserId, selectedReporterId, currentMonthId) => {
      return tasks.filter((task) => {
        // Always filter by month first
        if (currentMonthId && task.monthId !== currentMonthId) return false;

        // If both user and reporter are selected, show tasks that match BOTH
        if (selectedUserId && selectedReporterId) {
          const matchesUser =
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId;
          const matchesReporter =
            task.reporters === selectedReporterId ||
            task.data_task?.reporters === selectedReporterId;
          return matchesUser && matchesReporter;
        }

        // If only user is selected, show tasks for that user
        if (selectedUserId && !selectedReporterId) {
          return (
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId
          );
        }

        // If only reporter is selected, show tasks for that reporter
        if (selectedReporterId && !selectedUserId) {
          return (
            task.reporters === selectedReporterId ||
            task.data_task?.reporters === selectedReporterId
          );
        }

        // If neither user nor reporter is selected, show all tasks (month-filtered)
        return true;
      });
    },
    []
  );

  // Calculate reporter metrics using global tasks (reporters card shows all data)
  const reporterMetrics = useReporterMetrics(tasks, reporters, {});

  // Common data for cards
  const commonCardData = {
    tasks, // ✅ Global tasks - never filtered
    reporters,
    users,
    reporterMetrics,
    periodName:
      selectedMonth?.monthName || currentMonth?.monthName || "Loading...",
    periodId: selectedMonth?.monthId || currentMonth?.monthId || "unknown",
    isCurrentMonth,
    isUserAdmin,
    currentUser: user,
  };

  // General metrics (month-filtered only, no user/reporter filtering)
  const top3Metrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 3,
  });

  // Reporters metrics (month-filtered only, no user filtering) - Show all reporters
  const reportersMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 999, // Show all reporters instead of just top 3
  });

  // Department-specific metrics (month-filtered only)
  const videoMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: "video",
    limit: 999, // Show all users from video department
  });

  const designMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: "design",
    limit: 999, // Show all users from design department
  });

  const devMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: "developer",
    limit: 999, // Show all users from developer department
  });

  // Selected user metrics (user + month + reporter filtered, include all data)
  const selectedUserMetrics = useTop3Calculations(commonCardData, {
    selectedUserId,
    selectedReporterId,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 3,
    includeAllData: true, // Include all products/markets for selected user card
  });

  //  dashboard cards with hook-based metrics
  const dashboardCards = useMemo(() => {
    //  custom card data object that includes all calculated metrics
    const cardDataWithMetrics = {
      ...commonCardData,
      top3Metrics: top3Metrics,
      reportersMetrics: reportersMetrics,
      videoMetrics: videoMetrics,
      designMetrics: designMetrics,
      devMetrics: devMetrics,
      selectedUserMetrics: selectedUserMetrics, // For selected user card metrics
      currentMonthId: currentMonthId, // Pass month ID for any remaining filtering needs
    };

    const cards = createDashboardCards(
      cardDataWithMetrics,
      selectedUserId,
      selectedUserName,
      selectedReporterId,
      user // Pass current user for role-based access control
    );

    return cards;
  }, [
    commonCardData,
    selectedUserId,
    selectedUserName,
    selectedReporterId,
    top3Metrics,
    reportersMetrics,
    videoMetrics,
    designMetrics,
    devMetrics,
    selectedUserMetrics,
    currentMonthId,
    user, //  user for role-based access control
  ]);

  // Small cards data preparation
  const smallCardsData = useMemo(
    () => ({
      ...commonCardData,
      selectedMonth, // Add the full month object
      currentMonth, // Add the full month object
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
    }),
    [
      commonCardData,
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
    ]
  );

  // Create small cards
  const smallCards = useMemo(
    () => createSmallCards(smallCardsData),
    [smallCardsData]
  );

  if (error || monthError) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        Error loading tasks: {(error || monthError)?.message || "Unknown error"}
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
          {isUserAdmin && (
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
          )}
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

      {/* Dashboard Cards */}
      <div className="overflow-hidden mb-2">
        {/* Cards Section Header */}
        <div className="py-6 border-bottom">
          <div className="flex items-center justify-between">
            <div>
              <h3>Dashboard Cards</h3>
              <p className="text-sm ">{dashboardCards.length} cards</p>
            </div>
            <DynamicButton
              onClick={() => setShowCards(!showCards)}
              variant="outline"
              size="lg"
              iconName={showCards ? "hide" : "show"}
              iconPosition="left"
              disabled={isInitialLoading}
              className="w-24"
            >
              {showCards ? "Hide" : "Show"}
            </DynamicButton>
          </div>
        </div>

        {/* Dashboard Cards Content */}
        {showCards && (
          <div className="pt-6">
            {isInitialLoading ? (
              <div className="grid grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {dashboardCards.map((card) => (
                  <DashboardCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* table task section */}
      <div>
        <div className="py-6 border-bottom">
          <div className="flex items-center justify-between">
            <div>
              <h3>
                {(() => {
                  if (selectedUserId && selectedReporterId) {
                    return `${selectedUserName} & ${selectedReporterName} Tasks`;
                  } else if (selectedUserId) {
                    return `${selectedUserName} Tasks`;
                  } else if (selectedReporterId) {
                    return `${selectedReporterName} Tasks`;
                  } else {
                    return "Tasks";
                  }
                })()}
              </h3>
              <p className="text-sm">
               {(() => {
                  const filteredTasks = getFilteredTasks(
                    tasks,
                    selectedUserId,
                    selectedReporterId,
                    currentMonthId
                  );
                  return `${filteredTasks.length} tasks`;
                })()}
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
            <TanStackTable
              data={getFilteredTasks(
                tasks,
                selectedUserId,
                selectedReporterId,
                currentMonthId
              )}
              columns={taskColumns}
              tableType="tasks"
              error={error}
              isLoading={isLoading || isInitialLoading}
              onSelect={handleSelect}
              onEdit={handleEditTask}
              onDelete={handleDelete}
              showPagination={true}
              showFilters={true}
              showColumnToggle={true}
              pageSize={25}
              enableSorting={true}
              enableFiltering={true}
              enablePagination={true}
              enableColumnResizing={true}
              enableRowSelection={false}
              initialColumnVisibility={{
                'data_task.isVip': false,     // Hide VIP column by default
                'data_task.reworked': false   // Hide Reworked column by default
              }}
            />
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
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

      {/* Edit Task Modal */}
      <TaskFormModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        mode="edit"
        task={editingTask}
        onSuccess={handleEditTaskSuccess}
        onError={(error) => {
          // Handle permission errors
          if (
            error?.message?.includes("permission") ||
            error?.message?.includes("User lacks required")
          ) {
            showAuthError("You do not have permission to edit tasks");
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${itemToDelete?.data_task?.taskName || itemToDelete?.data_task?.departments || 'Unknown Task'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default AdminDashboardPage;
