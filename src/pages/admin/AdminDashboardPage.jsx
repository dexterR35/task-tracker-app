import React, { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData, useMonthSelection } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Modal from "@/components/ui/Modal/Modal";
import TaskTable from "@/features/tasks/components/TaskTable/TaskTable";
import { TaskForm } from "@/components/forms";
import DashboardCard from "@/components/Card/DashboardCard";
import { createDashboardCards } from "@/components/Card/cardConfig";
import { useReporterMetrics } from "@/hooks/useReporterMetrics";
import { useTop3Calculations } from "@/hooks/useTop3Calculations";
import Badge from "@/components/ui/Badge/Badge";
import { canAccessCharts } from "@/utils/permissions";
import { showError, showAuthError } from "@/utils/toast";

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [showCards, setShowCards] = useState(true);

  // Get auth functions separately
  const { canAccess } = useAuth();
  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  const selectedReporterId = searchParams.get("reporter") || "";

  // Get basic data from useAppData hook
  const { user, users, reporters, error, isLoading: appDataLoading } = useAppData(); // Remove selectedUserId since we handle filtering in component

  // Check user permissions (only for UI display, not security)
  const userCanAccessCharts = canAccessCharts(user);

  // Use month selection hook for month-specific functionality
  // Always get ALL tasks (no user filtering at API level for admin)
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

  // Create a reusable filtering function to avoid duplication
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
    tasks: tasks, // ✅ Global tasks - never filtered
    reporters: reporters,
    users: users,
    reporterMetrics: reporterMetrics,
    periodName:
      selectedMonth?.monthName || currentMonth?.monthName || "Loading...",
    periodId: selectedMonth?.monthId || currentMonth?.monthId || "unknown",
    isCurrentMonth: isCurrentMonth,
    isUserAdmin: isUserAdmin,
    currentUser: user,
  };

  // Use the enhanced hook to calculate top 3 metrics for different scenarios
  // All filtering is now handled by useTop3Calculations internally

  // General metrics (month-filtered only, no user/reporter filtering)
  const top3Metrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 3,
  });

  // Reporters metrics (month-filtered only, no user filtering)
  const reportersMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 3,
  });

  // Department-specific metrics (month-filtered only)
  const videoMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: "video",
    limit: 3,
  });

  const designMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: "design",
    limit: 3,
  });

  const devMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: "developer",
    limit: 3,
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

  // Create dashboard cards with hook-based metrics
  const dashboardCards = useMemo(() => {
    // Create a custom card data object that includes all calculated metrics
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
      selectedReporterId
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
  ]);

  if (error || monthError) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        Error loading tasks: {(error || monthError)?.message || "Unknown error"}
      </div>
    );
  }

  // Admin access is already protected by router - no need to check again
  // Trust the router-level protection

  return (
    <div>
      {/* Page Header */}

      <div className="mb-6">
        <h1>{isUserAdmin ? "Task Management" : "My Dashboard"}</h1>
        <p className="text-small">
          {title} •{" "}
          {selectedMonth?.monthName || currentMonth?.monthName || "Loading..."}
        </p>
      </div>

      {/* Controls Section - First */}
      <div className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Month Selection */}
          <div className="card-small">
            <div className="mb-4">
              <h4>Time Period</h4>
              <p className="text-exsmall">
                {availableMonths.length} periods available
              </p>
            </div>
            <div className="space-y-2">
              <select
                id="selectedMonth"
                value={selectedMonth?.monthId || currentMonth?.monthId || ""}
                onChange={(e) => selectMonth(e.target.value)}
                disabled={isInitialLoading}
              >
                {isInitialLoading ? (
                  <option value="">Loading months...</option>
                ) : availableMonths.length > 0 ? (
                  availableMonths.map((month) => (
                    <option key={month.monthId} value={month.monthId}>
                      {month.monthName} {month.isCurrent ? "(Current)" : ""}
                    </option>
                  ))
                ) : (
                  <option value="">No months available</option>
                )}
              </select>
              <div className="flex items-start justify-between">
                <Badge variant="primary" size="sm">
                  {isCurrentMonth ? "Current Period" : "Historical Data"}
                </Badge>
                {!isCurrentMonth && (
                  <DynamicButton
                    onClick={resetToCurrentMonth}
                    variant="outline"
                    size="sm"
                    iconName="refresh"
                    iconPosition="center"
                  />
                )}
              </div>
            </div>
          </div>

          {/* User Filter - Admin Only */}
          {isUserAdmin && (
            <>
              <div className="card-small">
                <div className="mb-4">
                  <h4>User Filter</h4>
                  <p className="text-exsmall">
                    {appDataLoading ? "Loading..." : `${users.length} users available`}
                  </p>
                </div>
                <div className="space-y-2">
                  <select
                    id="selectedUser"
                    value={selectedUserId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    disabled={appDataLoading}
                  >
                    {appDataLoading ? (
                      <option value="">Loading users...</option>
                    ) : (
                      <>
                        <option value="">All Users</option>
                        {users.map((user) => (
                          <option
                            key={user.userUID || user.id}
                            value={user.userUID || user.id}
                          >
                            {user.name || user.email}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="flex items-start justify-between ">
                    <span className="text-exsmall">
                      {appDataLoading 
                        ? "Loading..."
                        : selectedUserId
                          ? `Filtered by: ${selectedUserName}`
                          : "Showing all users"}
                    </span>
                    {!appDataLoading && selectedUserId && (
                      <DynamicButton
                        onClick={() => handleUserSelect("")}
                        variant="outline"
                        size="sm"
                        iconName="cancel"
                        iconPosition="center"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="card-small">
                <div className="mb-4">
                  <h4>Reporter Filter</h4>
                  <p className="text-exsmall">
                    {appDataLoading ? "Loading..." : `${reporters.length} reporters available`}
                  </p>
                </div>
                <div className="space-y-2">
                  <select
                    id="selectedReporter"
                    value={selectedReporterId}
                    onChange={(e) => handleReporterSelect(e.target.value)}
                    disabled={appDataLoading}
                  >
                    {appDataLoading ? (
                      <option value="">Loading reporters...</option>
                    ) : (
                      <>
                        <option value="">All Reporters</option>
                        {reporters.map((reporter) => (
                          <option
                            key={reporter.id || reporter.uid}
                            value={reporter.id || reporter.uid}
                          >
                            {reporter.name || reporter.reporterName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="flex items-start justify-between ">
                    <span className="text-exsmall">
                      {appDataLoading 
                        ? "Loading..."
                        : selectedReporterId
                          ? `Filtered by: ${selectedReporterName}`
                          : "Showing all reporters"}
                    </span>
                    {!appDataLoading && selectedReporterId && (
                      <DynamicButton
                        onClick={() => handleReporterSelect("")}
                        variant="outline"
                        size="sm"
                        iconName="cancel"
                        iconPosition="center"
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="card-small">
            <div className="mb-4">
              <h4>Actions</h4>
              <p className="text-exsmall">
                {isInitialLoading 
                  ? "Loading..."
                  : canCreateTasks
                    ? "Create task available"
                    : "Create restricted"}
              </p>
            </div>
            <div className="space-y-2">
              <DynamicButton
                onClick={handleCreateTask}
                variant="primary"
                size="md"
                iconName="add"
                iconPosition="left"
                className="w-full"
                disabled={isInitialLoading}
              >
                {isInitialLoading ? "Loading..." : "Create Task"}
              </DynamicButton>
              {!isInitialLoading && !canCreateTasks && (
                <span className="text-exsmall text-red-error dark:text-amber-400">
                  {!isCurrentMonth
                    ? "History data - create disabled"
                    : !currentMonth?.boardExists
                      ? "Current month board not created yet"
                      : "Creation not available"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className=" overflow-hidden mb-6">
        {/* Cards Section Header */}
        <div className="py-4 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3>Dashboard Cards</h3>
              <p className="text-exsmall">
                {dashboardCards.length} cards •{" "}
                {selectedMonth?.monthName || currentMonth?.monthName}
              </p>
            </div>
            <DynamicButton
              onClick={() => setShowCards(!showCards)}
              variant="outline"
              size="md"
              iconName={showCards ? "hide" : "show"}
              iconPosition="left"
            >
              {showCards ? "Hide" : "Show"}
            </DynamicButton>
          </div>
        </div>

        {/* Dashboard Cards Content */}
        {!showCards && (
          <div className="pt-4">
            <div className="grid grid-cols-1 gap-6">
              {dashboardCards.map((card) => (
                <DashboardCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Professional Tasks Section */}
      <div>
        {/* Professional Section Header */}
        <div className=" py-4 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="capitalize">
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
              <p className="text-exsmall">
                {(() => {
                  const filteredTasks = getFilteredTasks(
                    tasks,
                    selectedUserId,
                    selectedReporterId,
                    currentMonthId
                  );
                  return `${filteredTasks.length} tasks`;
                })()}{" "}
                •{" "}
                {selectedMonth?.monthName ||
                  currentMonth?.monthName ||
                  "Loading..."}
              </p>
            </div>
            <DynamicButton
              onClick={() => setShowTable(!showTable)}
              variant="outline"
              size="md"
              iconName={showTable ? "hide" : "show"}
              iconPosition="left"
            >
              {showTable ? "Hide" : "Show"}
            </DynamicButton>
          </div>
        </div>

        {/* Table Content */}
        <div className="py-4 ">
          {showTable && (
            <>
              {/* Show loading when data is being fetched */}
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Loading tasks...</span>
                  </div>
                </div>
              ) : (
                <TaskTable
                  tasks={getFilteredTasks(
                    tasks,
                    selectedUserId,
                    selectedReporterId,
                    currentMonthId
                  )}
                  users={users}
                  reporters={reporters}
                  user={user}
                  monthId={selectedMonth?.monthId || currentMonth?.monthId}
                  isAdminView={isUserAdmin}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        maxWidth="max-w-4xl"
      >
        <TaskForm
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
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
