import React, { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData, useMonthSelection } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import TaskTable from "@/features/tasks/components/TaskTable/TaskTable";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import DashboardCard from "@/components/Card/DashboardCard";
import { createDashboardCards } from "@/components/Card/cardConfig";
import { useReporterMetrics } from "@/hooks/useReporterMetrics";
import { useTop3Calculations } from "@/hooks/useTop3Calculations";
import Badge from "@/components/ui/Badge/Badge";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { canAccessCharts } from "@/features/utils/authUtils";
import { showError, showAuthError } from "@/utils/toast";
import { Icons } from "@/components/icons";

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
          {isInitialLoading ? (
            <span className="inline-block w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded "></span>
          ) : (
            selectedMonth?.monthName || currentMonth?.monthName || "No month selected"
          )}
        </p>
      </div>

      {/* Controls Section - First */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Current Month Board Info */}
          {isInitialLoading ? (
            <SkeletonCard />
          ) : (
            <div className="card-small relative">
              <div className="absolute top-3 right-3">
                <Badge 
                  variant={isCurrentMonth ? (currentMonth?.boardExists ? "success" : "error") : "error"} 
                  size="xs"
                >
                  {isCurrentMonth ? (currentMonth?.boardExists ? "Active" : "Missing") : "Inactive"}
                </Badge>
              </div>
              <div className="mb-3">
                <h4 className="text-sm font-semibold">Current Board</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedMonth?.monthName || currentMonth?.monthName || "No month"}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Year</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {(selectedMonth?.monthId || currentMonth?.monthId) ? (selectedMonth?.monthId || currentMonth?.monthId).split('-')[0] : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Total Tasks</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {tasks?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Month ID</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {selectedMonth?.monthId || currentMonth?.monthId || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Month Selection */}
          {isInitialLoading ? (
            <SkeletonCard />
          ) : (
            <div className="card-small relative">
              <div className="absolute top-3 right-3">
                <Icons.generic.clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="mb-3">
                <h4 className="text-sm font-semibold">Time Period</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {availableMonths.length} periods
                </p>
              </div>
              <div className="space-y-2">
                <select
                  id="selectedMonth"
                  value={selectedMonth?.monthId || currentMonth?.monthId || ""}
                  onChange={(e) => selectMonth(e.target.value)}
                >
                  {availableMonths.length > 0 ? (
                    availableMonths.map((month) => (
                      <option key={month.monthId} value={month.monthId}>
                        {month.monthName} {month.isCurrent ? "(Current)" : ""}
                      </option>
                    ))
                  ) : (
                    <option value="">No months available</option>
                  )}
                </select>
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="xs">
                    {isCurrentMonth ? "Current" : "Historical"}
                  </Badge>
                  {!isCurrentMonth && (
                    <DynamicButton
                      onClick={resetToCurrentMonth}
                      variant="outline"
                      size="xs"
                      iconName="refresh"
                      iconPosition="center"
                      className="!p-1 !min-w-0 !h-6"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Filter - Admin Only */}
          {isUserAdmin && (
            <>
              {appDataLoading ? (
                <SkeletonCard />
              ) : (
                <div className="card-small relative">
                  <div className="absolute top-3 right-3">
                    <Icons.generic.user className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold">User Filter</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {users.length} users
                    </p>
                  </div>
                  <div className="space-y-2">
                    <select
                      id="selectedUser"
                      value={selectedUserId}
                      onChange={(e) => handleUserSelect(e.target.value)}
                    >
                      <option value="">All Users</option>
                      {users.map((user) => (
                        <option
                          key={user.userUID || user.id}
                          value={user.userUID || user.id}
                        >
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedUserId ? "Filtered" : "All users"}
                        </span>
                        {selectedUserId && (
                          <Badge variant="primary" size="xs">
                            {selectedUserName}
                          </Badge>
                        )}
                      </div>
                      {selectedUserId && (
                        <DynamicButton
                          onClick={() => handleUserSelect("")}
                          variant="outline"
                          size="xs"
                          iconName="cancel"
                          iconPosition="center"
                          className="!p-1 !min-w-0 !h-6"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {appDataLoading ? (
                <SkeletonCard />
              ) : (
                <div className="card-small relative">
                  <div className="absolute top-3 right-3">
                    <Icons.admin.reporters className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold">Reporter Filter</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reporters.length} reporters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <select
                      id="selectedReporter"
                      value={selectedReporterId}
                      onChange={(e) => handleReporterSelect(e.target.value)}
                    >
                      <option value="">All Reporters</option>
                      {reporters.map((reporter) => (
                        <option
                          key={reporter.id || reporter.uid}
                          value={reporter.id || reporter.uid}
                        >
                          {reporter.name || reporter.reporterName}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedReporterId ? "Filtered" : "All reporters"}
                        </span>
                        {selectedReporterId && (
                          <Badge variant="error" size="xs">
                            {selectedReporterName}
                          </Badge>
                        )}
                      </div>
                      {selectedReporterId && (
                        <DynamicButton
                          onClick={() => handleReporterSelect("")}
                          variant="outline"
                          size="xs"
                          iconName="cancel"
                          iconPosition="center"
                          className="!p-1 !min-w-0 !h-6"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          {isInitialLoading ? (
            <SkeletonCard />
          ) : (
            <div className="card-small relative">
              <div className="absolute top-3 right-3">
                <Icons.buttons.add className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="mb-3">
                <h4 className="text-sm font-semibold">Actions</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {canCreateTasks
                    ? "Create available"
                    : "Create restricted"}
                </p>
              </div>
              <div className="space-y-2">
                <DynamicButton
                  onClick={handleCreateTask}
                  variant="primary"
                  size="sm"
                  iconName="add"
                  iconPosition="left"
                  className="w-full"
                >
                  Create Task
                </DynamicButton>
                {!canCreateTasks && (
                  <span className="text-xs text-red-error dark:text-amber-400">
                    {!isCurrentMonth
                      ? "History - disabled"
                      : !currentMonth?.boardExists
                        ? "Board not created"
                        : "Not available"}
                  </span>
                )}
              </div>
            </div>
          )}
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
                {isInitialLoading ? (
                  <span className="inline-block w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded"></span>
                ) : (
                  `${dashboardCards.length} cards`
                )}
              </p>
            </div>
            <DynamicButton
              onClick={() => setShowCards(!showCards)}
              variant="outline"
              size="md"
              iconName={showCards ? "hide" : "show"}
              iconPosition="left"
              disabled={isInitialLoading}
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
                {isInitialLoading || isLoading ? (
                  <span className="inline-block w-40 h-3 bg-gray-200 dark:bg-gray-700 rounded"></span>
                ) : (
                  <>
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
                      "No month selected"}
                  </>
                )}
              </p>
            </div>
            <DynamicButton
              onClick={() => setShowTable(!showTable)}
              variant="outline"
              size="md"
              iconName={showTable ? "hide" : "show"}
              iconPosition="left"
              disabled={isInitialLoading}
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
                <SkeletonTable rows={3} />
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
    </div>
  );
};

export default AdminDashboardPage;
