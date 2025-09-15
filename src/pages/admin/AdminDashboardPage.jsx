import React, { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData, useMonthSelection } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Modal from "@/components/ui/Modal/Modal";
import LazyTaskTable from "@/components/lazy/LazyTaskTable";
import { TaskForm } from "@/components/forms";
import Loader from "@/components/ui/Loader/Loader";
import DashboardCard from "@/components/ui/Card/DashboardCard";
import { createDashboardCards } from "@/components/ui/Card/cardConfig";
import { useReporterMetrics } from "@/hooks/useReporterMetrics";
import { useTop3Calculations } from "@/hooks/useTop3Calculations";


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
  const {
    user,
    users,
    reporters,
    error
  } = useAppData(); // Remove selectedUserId since we handle filtering in component
  
  // Use month selection hook for month-specific functionality
  // Always get ALL tasks (no user filtering at API level for admin)
  const {
    tasks,                    // Current display tasks (current or selected month)
    availableMonths,         // For dropdown options
    currentMonth,            // Current month info
    selectedMonth,           // Selected month info
    isCurrentMonth,          // Boolean check
    isLoading,               // Loading state for selected month
    error: monthError,       // Error state
    selectMonth,             // Function to select month
    resetToCurrentMonth      // Function to reset
  } = useMonthSelection(); // Remove selectedUserId to get ALL tasks
  
  // Task creation is only allowed for current month
  const canCreateTasks = isCurrentMonth && currentMonth.boardExists;
  
  // Get selected user name for display
  const selectedUser = users.find((u) => (u.userUID || u.id) === selectedUserId);
  const selectedUserName = selectedUser?.name || selectedUser?.email || "Unknown User";
  
  // Get selected reporter name for display
  const selectedReporter = reporters.find((r) => (r.id || r.uid) === selectedReporterId);
  const selectedReporterName = selectedReporter?.name || selectedReporter?.reporterName || "Unknown Reporter";
  
  // Handle user selection (admin only) - memoized with useCallback
  const handleUserSelect = useCallback((userId) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    if (!userId) {
      delete currentParams.user;
    } else {
      currentParams.user = userId;
    }
    setSearchParams(currentParams, { replace: true });
  }, [setSearchParams, searchParams]);
  
  // Handle reporter selection (admin only) - memoized with useCallback
  const handleReporterSelect = useCallback((reporterId) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    if (!reporterId) {
      delete currentParams.reporter;
    } else {
      currentParams.reporter = reporterId;
    }
    setSearchParams(currentParams, { replace: true });
  }, [setSearchParams, searchParams]);

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
  const getFilteredTasks = useCallback((tasks, selectedUserId, selectedReporterId, currentMonthId) => {
    return tasks.filter(task => {
      // Always filter by month first
      if (currentMonthId && task.monthId !== currentMonthId) return false;
      
      // If both user and reporter are selected, show tasks that match BOTH
      if (selectedUserId && selectedReporterId) {
        const matchesUser = task.userUID === selectedUserId || task.createbyUID === selectedUserId;
        const matchesReporter = task.reporters === selectedReporterId || task.data_task?.reporters === selectedReporterId;
        return matchesUser && matchesReporter;
      }
      
      // If only user is selected, show tasks for that user
      if (selectedUserId && !selectedReporterId) {
        return task.userUID === selectedUserId || task.createbyUID === selectedUserId;
      }
      
      // If only reporter is selected, show tasks for that reporter
      if (selectedReporterId && !selectedUserId) {
        return task.reporters === selectedReporterId || task.data_task?.reporters === selectedReporterId;
      }
      
      // If neither user nor reporter is selected, show all tasks (month-filtered)
      return true;
    });
  }, []);


  // Calculate reporter metrics using global tasks (reporters card shows all data)
  const reporterMetrics = useReporterMetrics(tasks, reporters, {});

  // Common data for cards
  const commonCardData = {
    tasks: tasks, // ✅ Global tasks - never filtered
    reporters: reporters,
    users: users,
    reporterMetrics: reporterMetrics,
    periodName: selectedMonth?.monthName || currentMonth?.monthName || 'Loading...',
    periodId: selectedMonth?.monthId || currentMonth?.monthId || 'unknown',
    isCurrentMonth: isCurrentMonth,
    isUserAdmin: isUserAdmin,
    currentUser: user
  };



  // Use the enhanced hook to calculate top 3 metrics for different scenarios
  // All filtering is now handled by useTop3Calculations internally
  
  // General metrics (month-filtered only, no user/reporter filtering)
  const top3Metrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 3
  });

  // Reporters metrics (month-filtered only, no user filtering)
  const reportersMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 3
  });

  // Department-specific metrics (month-filtered only)
  const videoMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: 'video',
    limit: 3
  });

  const designMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: 'design',
    limit: 3
  });

  const devMetrics = useTop3Calculations(commonCardData, {
    selectedUserId: null,
    selectedReporterId: null,
    selectedMonthId: currentMonthId,
    department: 'developer',
    limit: 3
  });

  // Selected user metrics (user + month + reporter filtered, include all data)
  const selectedUserMetrics = useTop3Calculations(commonCardData, {
    selectedUserId,
    selectedReporterId,
    selectedMonthId: currentMonthId,
    department: null,
    limit: 3,
    includeAllData: true // Include all products/markets for selected user card
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
      currentMonthId: currentMonthId // Pass month ID for any remaining filtering needs
    };

    
    const cards = createDashboardCards(
      cardDataWithMetrics, 
      selectedUserId, 
      selectedUserName,
      selectedReporterId
    );
    
    return cards;
  }, [commonCardData, selectedUserId, selectedUserName, selectedReporterId, top3Metrics, reportersMetrics, videoMetrics, designMetrics, devMetrics, selectedUserMetrics, currentMonthId]);


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
  
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isUserAdmin ? "Task Management" : "My Dashboard"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {title} • {selectedMonth?.monthName || currentMonth?.monthName || 'Loading...'}
            </p>
          </div>
        </div>

        {/* Controls Section - First */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Month Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Time Period</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{availableMonths.length} periods available</p>
              </div>
              <div className="space-y-3">
                <select
                  id="selectedMonth"
                  value={selectedMonth?.monthId || currentMonth?.monthId || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => selectMonth(e.target.value)}
                >
                  {availableMonths.map((month) => (
                    <option key={month.monthId} value={month.monthId}>
                      {month.monthName} {month.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded ${
                    isCurrentMonth 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {isCurrentMonth ? 'Current Period' : 'Historical Data'}
                  </span>
                  {!isCurrentMonth && (
                    <DynamicButton
                      onClick={resetToCurrentMonth}
                      variant="outline"
                      size="sm"
                      iconName="refresh"
                      iconPosition="center"
                      className="px-2"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* User Filter - Admin Only */}
            {isUserAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">User Filter</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{users.length} users available</p>
                </div>
                <div className="space-y-3">
                  <select
                    id="selectedUser"
                    value={selectedUserId}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => handleUserSelect(e.target.value)}
                  >
                    <option value="">All Users</option>
                    {users.map((user) => (
                      <option key={user.userUID || user.id} value={user.userUID || user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {selectedUserId ? `Filtered by: ${selectedUserName}` : 'Showing all users'}
                    </span>
                    {selectedUserId && (
                      <DynamicButton
                        onClick={() => handleUserSelect("")}
                        variant="outline"
                        size="sm"
                        iconName="x"
                        iconPosition="center"
                        className="px-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reporter Filter - Admin Only */}
            {isUserAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Reporter Filter</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{reporters.length} reporters available</p>
                </div>
                <div className="space-y-3">
                  <select
                    id="selectedReporter"
                    value={selectedReporterId}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => handleReporterSelect(e.target.value)}
                  >
                    <option value="">All Reporters</option>
                    {reporters.map((reporter) => (
                      <option key={reporter.id || reporter.uid} value={reporter.id || reporter.uid}>
                        {reporter.name || reporter.reporterName}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {selectedReporterId ? `Filtered by: ${selectedReporterName}` : 'Showing all reporters'}
                    </span>
                    {selectedReporterId && (
                      <DynamicButton
                        onClick={() => handleReporterSelect("")}
                        variant="outline"
                        size="sm"
                        iconName="x"
                        iconPosition="center"
                        className="px-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Actions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {canCreateTasks ? 'Task creation available' : 'Creation restricted'}
                </p>
              </div>
              <div className="space-y-3">
                <DynamicButton
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  size="sm"
                  iconName="add"
                  iconPosition="left"
                  disabled={!canCreateTasks}
                  className="w-full"
                >
                  Create Task
                </DynamicButton>
                {!canCreateTasks && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-amber-600 dark:text-amber-400">
                      {!isCurrentMonth ? 'Historical data - creation disabled' : 
                       !currentMonth?.boardExists ? 'Current month board not created yet' : 'Creation not available'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden mb-8">
          {/* Cards Section Header */}
          <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dashboard Cards
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {dashboardCards.length} cards • {selectedMonth?.monthName || currentMonth?.monthName || 'Loading...'}
                </p>
              </div>
              <DynamicButton
                onClick={() => setShowCards(!showCards)}
                variant="outline"
                size="sm"
                iconName={showCards ? "eye-off" : "eye"}
                iconPosition="left"
              >
                {showCards ? "Hide" : "Show"}
              </DynamicButton>
            </div>
          </div>

          {/* Dashboard Cards Content */}
          {showCards && (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                {dashboardCards.map((card) => (
                  <DashboardCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Professional Tasks Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
          {/* Professional Section Header */}
          <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {(() => {
                    const filteredTasks = getFilteredTasks(tasks, selectedUserId, selectedReporterId, currentMonthId);
                    return `${filteredTasks.length} tasks`;
                  })()} • {selectedMonth?.monthName || currentMonth?.monthName || 'Loading...'}
                </p>
              </div>
              <DynamicButton
                onClick={() => setShowTable(!showTable)}
                variant="outline"
                size="sm"
                iconName={showTable ? "eye-off" : "eye"}
                iconPosition="left"
              >
                {showTable ? "Hide" : "Show"}
              </DynamicButton>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6 bg-red-500">
            {showTable && (
              isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader size="md" text="Loading tasks..." />
                </div>
              ) : (() => {
                const filteredTasks = getFilteredTasks(tasks, selectedUserId, selectedReporterId, currentMonthId);
                return filteredTasks.length === 0;
              })() ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {(() => {
                      if (selectedUserId && selectedReporterId) {
                        return `${selectedUserName} has no tasks assigned to ${selectedReporterName} for this period`;
                      } else if (selectedUserId) {
                        return `${selectedUserName} has no tasks for this period`;
                      } else if (selectedReporterId) {
                        return `${selectedReporterName} has no tasks for this period`;
                      } else {
                        return 'No tasks available for the selected criteria';
                      }
                    })()}
                  </p>
                  {canCreateTasks && (
                    <DynamicButton
                      onClick={() => setShowCreateModal(true)}
                      variant="primary"
                      size="sm"
                      iconName="add"
                      iconPosition="left"
                    >
                      Create First Task
                    </DynamicButton>
                  )}
                </div>
              ) : (
                <LazyTaskTable
                  tasks={getFilteredTasks(tasks, selectedUserId, selectedReporterId, currentMonthId)}
                  users={users}
                  reporters={reporters}
                  user={user}
                  monthId={selectedMonth?.monthId || currentMonth?.monthId}
                  isAdminView={isUserAdmin}
                />
              )
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
          />
        </Modal>
      </div>
 
  );
};

export default AdminDashboardPage;
