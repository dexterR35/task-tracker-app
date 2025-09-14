import React, { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMonthSelectionWithTasks } from "@/hooks/useAppData";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Modal from "@/components/ui/Modal/Modal";
import LazyTaskTable from "@/components/lazy/LazyTaskTable";
import LazyUniversalForm from "@/components/lazy/LazyUniversalForm";
import Loader from "@/components/ui/Loader/Loader";

// Universal Dashboard Page - Shows tasks based on user role
// Admin: All tasks with user filters and full management
// User: Only their own tasks with month selection
const AdminDashboardPage = () => {
  // Get all data directly from useAppData hook (RTK Query handles caching)
  const {
    user,
    users,
    reporters,
    error
  } = useAppData();
  
  // Get auth functions separately
  const { canAccess } = useAuth();
  
  // Use smart month selection with task fetching
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
  } = useMonthSelectionWithTasks();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);


  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  
  // Task creation is only allowed for current month
  const canCreateTasks = isCurrentMonth && currentMonth.boardExists;
  
  // Role-based data filtering
  const displayTasks = useMemo(() => {
    // Get the correct user UID based on role
    const currentUserUID = isUserAdmin ? user?.uid : user?.userUID;
    
    
    if (isUserAdmin) {
      // Admin sees all tasks (with optional user filter)
      return selectedUserId 
        ? tasks.filter(task => task.userUID === selectedUserId)
        : tasks;
    } else {
      // Regular users see only their own tasks
      const userTasks = tasks.filter(task => task.userUID === currentUserUID);
      return userTasks;
    }
  }, [tasks, isUserAdmin, selectedUserId, user]);

  // Get selected user name for display - memoized
  const selectedUser = useMemo(() => 
    users.find((u) => (u.userUID || u.id) === selectedUserId),
    [users, selectedUserId]
  );
  
  const selectedUserName = useMemo(() =>
    selectedUser?.name || selectedUser?.email || "Unknown User",
    [selectedUser]
  );
  // Handle user selection (admin only) - memoized with useCallback
  const handleUserSelect = useCallback((userId) => {
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  }, [setSearchParams]);

  // Use the role-based filtered tasks
  const filteredTasks = displayTasks;

  // Derive title based on context and role - memoized
  const title = useMemo(() => {
    if (isUserAdmin) {
      if (selectedUserId) {
        return `All Tasks - ${selectedUserName}`;
      }
      return "All Tasks - All Users";
    } else {
      return "My Tasks";
    }
  }, [isUserAdmin, selectedUserId, selectedUserName]);

  if (error || monthError) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        Error loading tasks: {(error || monthError)?.message || "Unknown error"}
      </div>
    );
  }

  // Admin access is already protected by router - no need to check again
  // Trust the router-level protection



  const rightContent = (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="text-white text-sm font-medium">Tasks Count</div>
      <div className="text-green-200 text-2xl font-bold">{filteredTasks.length}</div>
      {!isCurrentMonth && selectedMonth && (
        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-yellow-900/20 border border-yellow-500/30">
          <span className="text-yellow-400 text-xs font-medium">📅 Historical Data</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminPageHeader
        title={isUserAdmin ? "Task Management" : "My Dashboard"}
        subtitle={`${title} - ${selectedMonth?.monthName || currentMonth?.monthName || 'Loading...'}`}
        icon="tasks"
        gradient="from-green-900 via-emerald-900 to-teal-900"
        rightContent={rightContent}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Section */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Month Selector */}
            <div className="space-y-2">
              <label htmlFor="selectedMonth" className="block text-sm font-medium text-gray-300">
                Select Month
              </label>
              <div className="flex gap-2">
                <select
                  id="selectedMonth"
                  value={selectedMonth?.monthId || currentMonth?.monthId || ''}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  onChange={(e) => {
                    selectMonth(e.target.value);
                  }}
                >
                  {availableMonths.map((month) => (
                    <option
                      key={month.monthId}
                      value={month.monthId}
                    >
                      {month.monthName} {month.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
                {!isCurrentMonth && (
                  <DynamicButton
                    onClick={resetToCurrentMonth}
                    variant="outline"
                    size="sm"
                    title="Reset to current month"
                    iconName="refresh"
                    iconPosition="center"
                  />
                )}
              </div>
            </div>

            {/* User Filter - Admin Only */}
            {isUserAdmin && (
              <div className="space-y-2">
                <label htmlFor="selectedUser" className="block text-sm font-medium text-gray-300">
                  Filter by User
                </label>
                <div className="flex gap-2">
                  <select
                    id="selectedUser"
                    value={selectedUserId}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    onChange={(e) => {
                      handleUserSelect(e.target.value);
                    }}
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
                  {selectedUserId && (
                    <DynamicButton
                      onClick={() => handleUserSelect("")}
                      variant="outline"
                      size="sm"
                      iconName="x"
                      iconPosition="center"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Create Task Button */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Actions
              </label>
              <DynamicButton
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="md"
                iconName="add"
                iconPosition="left"
                disabled={!canCreateTasks}
                title={!isCurrentMonth ? "Task creation only available for current month" : !currentMonth.boardExists ? "Month board not available" : ""}
                className="w-full shadow-lg"
              >
                Create Task
              </DynamicButton>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isUserAdmin && selectedUserId
                    ? `${selectedUserName} Tasks`
                    : "All Tasks"}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {filteredTasks.length} tasks for {selectedMonth?.monthName || currentMonth?.monthName || 'Loading...'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {!canCreateTasks && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                    <span className="text-yellow-400 text-sm font-medium">
                      {!isCurrentMonth ? "Historical data - creation disabled" : "Board not available"}
                    </span>
                  </div>
                )}
                <DynamicButton
                  onClick={() => setShowTable(!showTable)}
                  variant="outline"
                  size="sm"
                  iconName={showTable ? "eye-off" : "eye"}
                  iconPosition="left"
                >
                  {showTable ? "Hide Table" : "Show Table"}
                </DynamicButton>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {showTable && (
              isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Loader size="lg" text="Loading tasks for selected month..." />
                  </div>
                </div>
              ) : (
                <LazyTaskTable
                  tasks={filteredTasks}
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
          <LazyUniversalForm
            formType="task"
            mode="create"
            user={user}
            monthId={selectedMonth?.monthId || currentMonth?.monthId}
            reporters={reporters}
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
