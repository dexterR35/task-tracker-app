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
import { showError, showAuthError } from "@/utils/toast";
import { Icons } from "@/components/icons";
import MonthProgressBar from "@/components/ui/MonthProgressBar";


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
    user, // Add user to dependencies for role-based access control
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
        <div className="flex items-center justify-between">
          <h1>{isUserAdmin ? "Task Management" : "My Dashboard"}</h1>
          {isUserAdmin && (
            <DynamicButton
              onClick={handleCreateTask}
              variant="primary"
              size="md"
              iconName="add"
              iconPosition="left"
              className="px-6 py-3 text-gray-200"
            >
              Create Task
            </DynamicButton>
          )}
        </div>
        <p className="text-small">
          {title} •{" "}
          {isInitialLoading ? (
            <span className="inline-block w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded "></span>
          ) : (
            selectedMonth?.monthName || currentMonth?.monthName || "No month selected"
          )}
        </p>
        
        {/* Month Progress Bar */}
        <div className="mt-4">
          <MonthProgressBar 
            monthId={selectedMonth?.monthId || currentMonth?.monthId}
            monthName={selectedMonth?.monthName || currentMonth?.monthName}
            isCurrentMonth={isCurrentMonth}
            startDate={selectedMonth?.startDate || currentMonth?.startDate}
            endDate={selectedMonth?.endDate || currentMonth?.endDate}
            daysInMonth={selectedMonth?.daysInMonth || currentMonth?.daysInMonth}
          />
        </div>
      </div>

      {/* Controls Section - First */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Current Month Board Info */}
          {isInitialLoading ? (
            <SkeletonCard />
          ) : (
            <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 w-full">
              <div className="h-auto">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-3 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${isCurrentMonth ? (currentMonth?.boardExists ? "#2fd181" : "#ef4444") : "#ef4444"}20` }}
                      >
                        <Icons.generic.dashboard
                          className="w-6 h-6"
                          style={{ color: isCurrentMonth ? (currentMonth?.boardExists ? "#2fd181" : "#ef4444") : "#ef4444" }}
                        />
                      </div>
                      <div className="leading-6">
                        <h3 className="text-sm font-semibold text-gray-300 !mb-0">
                          Current Board
                        </h3>
                        <p className="text-xs text-gray-400 mt-0">
                          {selectedMonth?.monthName || currentMonth?.monthName || "No month"}
                        </p>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                      <div className={`w-2 h-2 rounded-full ${isCurrentMonth ? (currentMonth?.boardExists ? "bg-green-success" : "bg-red-error") : "bg-red-error"}`}></div>
                      <span className="text-xs font-medium text-green-success">
                        {isCurrentMonth ? (currentMonth?.boardExists ? "Active" : "Inactive") : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Main Value */}
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-100 mb-2">
                        {tasks?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">Tasks</div>
                    </div>

                    {/* Enhanced Data */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icons.generic.clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">Year</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {(selectedMonth?.monthId || currentMonth?.monthId) ? (selectedMonth?.monthId || currentMonth?.monthId).split('-')[0] : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icons.generic.task className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">Status</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {isCurrentMonth ? (currentMonth?.boardExists ? "Active" : "Inactive") : "Inactive"}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Month Selection */}
          {isInitialLoading ? (
            <SkeletonCard />
          ) : (
            <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 w-full">
              <div className="h-auto">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-3 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: "#2a9df420" }}
                      >
                        <Icons.generic.clock
                          className="w-6 h-6"
                          style={{ color: "#2a9df4" }}
                        />
                      </div>
                      <div className="leading-6">
                        <h3 className="text-sm font-semibold text-gray-300 !mb-0">
                          Month Period
                        </h3>
                        <p className="text-xs text-gray-400 mt-0">
                          {availableMonths.length} periods
                        </p>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                      <div className={`w-2 h-2 rounded-full ${isCurrentMonth ? "bg-green-success" : "bg-blue-default"}`}></div>
                      <span className="text-xs font-medium text-green-success">
                        {isCurrentMonth ? "Current" : "History"}
                      </span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Main Value */}
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-100 mb-2">
                        {availableMonths.length}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">Periods</div>
                    </div>

                    {/* Month Selector */}
                    <div className="mb-6">
                      <select
                        id="selectedMonth"
                        value={selectedMonth?.monthId || currentMonth?.monthId || ""}
                        onChange={(e) => selectMonth(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    </div>

                    {/* Enhanced Data */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icons.generic.clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">Current</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {isCurrentMonth ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icons.generic.clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">Status</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {isCurrentMonth ? "Current" : "Historical"}
                        </span>
                      </div>
                    </div>

                  </div>
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
                <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 w-full">
                  <div className="h-auto">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div
                            className="p-3 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: "#3d48c920" }}
                          >
                            <Icons.generic.user
                              className="w-6 h-6"
                              style={{ color: "#3d48c9" }}
                            />
                          </div>
                          <div className="leading-6">
                            <h3 className="text-sm font-semibold text-gray-300 !mb-0">
                              User Filter
                            </h3>
                            <p className="text-xs text-gray-400 mt-0">
                              {users.length} users
                            </p>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                          <div className={`w-2 h-2 rounded-full ${selectedUserId ? "bg-blue-default" : "bg-gray-500"}`}></div>
                          <span className="text-xs font-medium text-green-success">
                            {selectedUserId ? "Filtered" : "All Users"}
                          </span>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1">
                    {/* Main Value */}
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-100 mb-2">
                        {users.length}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">Users</div>
                    </div>

                        {/* User Selector */}
                        <div className="mb-6">
                          <select
                            id="selectedUser"
                            value={selectedUserId}
                            onChange={(e) => handleUserSelect(e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        </div>

                        {/* Enhanced Data */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icons.generic.user className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Selected</span>
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {selectedUserId ? selectedUserName : "All Users"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icons.buttons.filter className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Status</span>
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {selectedUserId ? "Filtered" : "All Users"}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}

              {appDataLoading ? (
                <SkeletonCard />
              ) : (
                <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 w-full">
                  <div className="h-auto">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div
                            className="p-3 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: "#ef444420" }}
                          >
                            <Icons.admin.reporters
                              className="w-6 h-6"
                              style={{ color: "#ef4444" }}
                            />
                          </div>
                          <div className="leading-6">
                            <h3 className="text-sm font-semibold text-gray-300 !mb-0">
                              Reporter Filter
                            </h3>
                            <p className="text-xs text-gray-400 mt-0">
                              {reporters.length} reporters
                            </p>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                          <div className={`w-2 h-2 rounded-full ${selectedReporterId ? "bg-red-error" : "bg-gray-500"}`}></div>
                          <span className="text-xs font-medium text-green-success">
                            {selectedReporterId ? "Filtered" : "All Reporters"}
                          </span>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1">
                        {/* Main Value */}
                        <div className="mb-6">
                          <div className="text-3xl font-bold text-gray-100 mb-2">
                            {reporters.length}
                          </div>
                          <div className="text-sm text-gray-400 mb-1">Reporters</div>
                        </div>

                        {/* Reporter Selector */}
                        <div className="mb-6">
                          <select
                            id="selectedReporter"
                            value={selectedReporterId}
                            onChange={(e) => handleReporterSelect(e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                        </div>

                        {/* Enhanced Data */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icons.admin.reporters className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Selected</span>
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {selectedReporterId ? selectedReporterName : "All Reporters"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icons.buttons.filter className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Status</span>
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {selectedReporterId ? "Filtered" : "All Reporters"}
                            </span>
                          </div>
                        </div>

                      </div>
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
            <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 w-full">
              <div className="h-auto">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-3 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${canCreateTasks ? "#f59e0b" : "#ef4444"}20` }}
                      >
                        <Icons.buttons.add
                          className="w-6 h-6"
                          style={{ color: canCreateTasks ? "#f59e0b" : "#ef4444" }}
                        />
                      </div>
                      <div className="leading-6">
                        <h3 className="text-sm font-semibold text-gray-300 !mb-0">
                          Actions
                        </h3>
                        <p className="text-xs text-gray-400 mt-0">
                          {canCreateTasks
                            ? "Create available"
                            : "Create restricted"}
                        </p>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                      <div className={`w-2 h-2 rounded-full ${canCreateTasks ? "bg-green-success" : "bg-red-error"}`}></div>
                      <span className="text-xs font-medium text-green-success">
                        {canCreateTasks ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Main Value */}
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-100 mb-2">
                        {canCreateTasks ? "1" : "0"}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">Actions</div>
                    </div>

                    {/* Action Button */}
                    <div className="mb-6">
                      <DynamicButton
                        onClick={handleCreateTask}
                        variant={canCreateTasks ? "primary" : "outline"}
                        size="sm"
                        iconName="add"
                        iconPosition="left"
                        disabled={!canCreateTasks}
                        className="w-full"
                      >
                        {canCreateTasks ? "Create Task" : "Create Disabled"}
                      </DynamicButton>
                    </div>

                    {/* Enhanced Data */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icons.generic.task className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">Status</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {canCreateTasks ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icons.generic.clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">Permission</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {canCreateTasks ? "Granted" : "Restricted"}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="overflow-hidden mb-8">
        {/* Cards Section Header */}
        <div className="py-6 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard Cards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
        {showCards && (
          <div className="pt-6">
            {isInitialLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {dashboardCards.map((card) => (
                  <DashboardCard key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Professional Tasks Section */}
      <div>
        {/* Professional Section Header */}
        <div className="py-6 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isInitialLoading || isLoading ? (
                  <span className="inline-block w-40 h-3 bg-gray-200 dark:bg-gray-700 rounded"></span>
                ) : (
                  (() => {
                    const filteredTasks = getFilteredTasks(
                      tasks,
                      selectedUserId,
                      selectedReporterId,
                      currentMonthId
                    );
                    return `${filteredTasks.length} tasks`;
                  })()
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
        <div className="py-6">
          {showTable && (
            <>
              {/* Show loading when data is being fetched */}
              {isLoading || isInitialLoading ? (
                <SkeletonTable rows={5} />
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
