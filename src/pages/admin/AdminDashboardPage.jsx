import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData, useMonthSelection } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Modal from "@/components/ui/Modal/Modal";
import LazyTaskTable from "@/components/lazy/LazyTaskTable";
import { TaskForm } from "@/components/forms";
import Loader from "@/components/ui/Loader/Loader";
import DashboardCard from "@/components/ui/Card/DashboardCard";
import { createCards, CARD_SETS, CARD_TYPES } from "@/components/ui/Card/cardConfig";
import { useReporterMetrics } from "@/hooks/useReporterMetrics";
import { useFilterOptions } from "@/hooks/useDataFilter";



// Universal Dashboard Page - Shows tasks based on user role
// Admin: All tasks with user filters and full management
// User: Only their own tasks with month selection
const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);

  // Get auth functions separately
  const { canAccess } = useAuth();
  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";

  // Get basic data from useAppData hook
  const {
    user,
    users,
    reporters,
    createTask,
    updateTask,
    deleteTask,
    error
  } = useAppData(selectedUserId);
  
  // Use month selection hook for month-specific functionality
  const {
    tasks,                    // Current display tasks (current or selected month)
    currentMonthTasks,       // Current month tasks
    availableMonths,         // For dropdown options
    currentMonth,            // Current month info
    selectedMonth,           // Selected month info
    isCurrentMonth,          // Boolean check
    isLoading,               // Loading state for selected month
    error: monthError,       // Error state
    selectMonth,             // Function to select month
    resetToCurrentMonth      // Function to reset
  } = useMonthSelection(selectedUserId);
  
  // Task creation is only allowed for current month
  const canCreateTasks = isCurrentMonth && currentMonth.boardExists;
  
  // Get selected user name for display
  const selectedUser = users.find((u) => (u.userUID || u.id) === selectedUserId);
  const selectedUserName = selectedUser?.name || selectedUser?.email || "Unknown User";
  
  // Handle user selection (admin only) - memoized with useCallback
  const handleUserSelect = useCallback((userId) => {
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  }, [setSearchParams]);

  // Derive title based on context and role
  const title = isUserAdmin
    ? (selectedUserId ? `All Tasks - ${selectedUserName}` : "All Tasks - All Users")
    : "My Tasks";

  // Create filter options from dashboard state
  const filterOptions = useFilterOptions({
    selectedUserId,
    selectedMonthId: selectedMonth?.monthId || currentMonth?.monthId
  });

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

  // Dashboard cards data using dynamic configuration
  const dashboardCards = selectedUserId
    ? [
        ...createCards([CARD_TYPES.TASKS, CARD_TYPES.REPORTERS], commonCardData),
        ...createCards([CARD_TYPES.SELECTED_USER], {
          ...commonCardData,
          filteredTasks: tasks,
          selectedUserId: selectedUserId,
          selectedUserName: selectedUserName
        })
      ]
    : createCards(CARD_SETS.DASHBOARD, commonCardData);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Metrics Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden mb-8">
          {/* Metrics Section Header */}
          <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Metrics
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {dashboardCards.length} metrics • {selectedMonth?.monthName || currentMonth?.monthName || 'Loading...'}
                </p>
              </div>
              <DynamicButton
                onClick={() => setShowMetrics(!showMetrics)}
                variant="outline"
                size="sm"
                iconName={showMetrics ? "eye-off" : "eye"}
                iconPosition="left"
              >
                {showMetrics ? "Hide" : "Show"}
              </DynamicButton>
            </div>
          </div>

          {/* Dashboard Cards Content */}
          {showMetrics && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  {isUserAdmin && selectedUserId
                    ? `${selectedUserName} Tasks`
                    : "Tasks"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {tasks.length} tasks • {selectedMonth?.monthName || currentMonth?.monthName || 'Loading...'}
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
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {selectedUserId 
                      ? `${selectedUserName} has no tasks for this period`
                      : 'No tasks available for the selected criteria'
                    }
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
                  tasks={tasks}
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
    </div>
  );
};

export default AdminDashboardPage;
