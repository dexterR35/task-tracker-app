import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDataContext } from "@/components/layout/AuthLayout";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useGetMonthTasksQuery } from "@/features/tasks/tasksApi";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Modal from "@/components/ui/Modal/Modal";
import LazyTaskTable from "@/components/lazy/LazyTaskTable";
import LazyUniversalForm from "@/components/lazy/LazyUniversalForm";
import Loader from "@/components/ui/Loader/Loader";

// Admin Tasks Page - Shows all tasks with creation form and table
const AdminTasksPage = () => {
  // Get all data from context (pre-fetched data, no API calls!)
  const {
    user,
    users,
    reporters,
    tasks, // Get tasks from context
    error,
    monthId: currentMonthId,
    monthName: currentMonthName,
    boardExists,
    availableMonths
  } = useAppDataContext();
  
  // Get auth functions separately
  const { canAccess } = useAuth();
  
  // State for month selection - always default to current month
  const [selectedMonthId, setSelectedMonthId] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);

  // Auto-select current month when data becomes available
  useEffect(() => {
    if (currentMonthId && !selectedMonthId) {
      setSelectedMonthId(currentMonthId);
    }
  }, [currentMonthId, selectedMonthId]);

  // Always fetch tasks for the selected month (or current month if none selected)
  const targetMonthId = selectedMonthId || currentMonthId;
  
  const { 
    data: selectedMonthTasks = [], 
    isLoading: isLoadingSelectedTasks, 
    error: selectedMonthTasksError 
  } = useGetMonthTasksQuery(
    { 
      monthId: targetMonthId || '', 
      userId: undefined, // Admin gets all tasks
      role: 'admin',
      userData: user
    },
    { skip: !targetMonthId || !user }
  );


  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  
  // Optimized task data logic - reduce hooks
  const isCurrentMonth = selectedMonthId === currentMonthId || !selectedMonthId;
  const canCreateTasks = isCurrentMonth && boardExists;
  
  // Use current month tasks from context, or fetched tasks for other months
  const displayTasks = isCurrentMonth ? tasks : selectedMonthTasks;
  const showMonthLoading = isLoadingSelectedTasks && !isCurrentMonth;

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

  // Handle month selection - memoized with useCallback
  const handleMonthSelect = useCallback((monthId) => {
    setSelectedMonthId(monthId);
  }, []);

  // Reset to current month - memoized with useCallback
  const handleResetToCurrentMonth = useCallback(() => {
    setSelectedMonthId(currentMonthId);
  }, [currentMonthId]);

  // Get display name for selected month
  const selectedMonthName = isCurrentMonth 
    ? currentMonthName 
    : availableMonths.find(m => m.monthId === selectedMonthId)?.monthName || currentMonthName;

  // Memoize sorted months for better performance
  const sortedMonths = useMemo(() => {
    return [...availableMonths].sort((a, b) => {
      // Current month first, then by monthId (newest first)
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return b.monthId.localeCompare(a.monthId);
    });
  }, [availableMonths]);
  
  // Data source: useAppData for current month, empty array for other months

  // Filter tasks based on selected user (admin only) - optimized with useMemo
  const filteredTasks = useMemo(() => {
    if (!isUserAdmin || !selectedUserId) return displayTasks;

    const filtered = displayTasks.filter(
      (task) =>
        task.userUID === selectedUserId ||
        task.createdByUID === selectedUserId // Fallback for old tasks
    );
    
    return filtered;
  }, [displayTasks, isUserAdmin, selectedUserId]);

  // Derive title based on context - memoized
  const title = useMemo(() => {
    if (isUserAdmin && selectedUserId) {
      return `All Tasks - ${selectedUserName}`;
    }
    return "All Tasks - All Users";
  }, [isUserAdmin, selectedUserId, selectedUserName]);

  if (error || selectedMonthTasksError) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        Error loading tasks: {(error || selectedMonthTasksError)?.message || "Unknown error"}
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        You do not have permission to view this page.
      </div>
    );
  }



  const rightContent = (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="text-white text-sm font-medium">Tasks Count</div>
      <div className="text-green-200 text-2xl font-bold">{filteredTasks.length}</div>
      {!isCurrentMonth && selectedMonthId && (
        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-yellow-900/20 border border-yellow-500/30">
          <span className="text-yellow-400 text-xs font-medium">📅 Historical Data</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminPageHeader
        title="Task Management"
        subtitle={`${title} - ${selectedMonthName}`}
        icon="✅"
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
                  value={selectedMonthId || currentMonthId || ''}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  onChange={(e) => {
                    handleMonthSelect(e.target.value);
                  }}
                >
                  {sortedMonths.map((month) => (
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
                    onClick={handleResetToCurrentMonth}
                    variant="outline"
                    size="sm"
                    title="Reset to current month"
                    iconName="refresh"
                    iconPosition="center"
                  />
                )}
              </div>
            </div>

            {/* User Filter */}
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
                title={!isCurrentMonth ? "Task creation only available for current month" : !boardExists ? "Month board not available" : ""}
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
                  {filteredTasks.length} tasks for {selectedMonthName}
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
              showMonthLoading ? (
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
                  monthId={selectedMonthId}
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
            monthId={selectedMonthId}
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

export default AdminTasksPage;
