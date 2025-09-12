import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDataContext } from "@/components/layout/AuthLayout";
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

  // Only fetch additional month data if different from current month
  const shouldFetchAdditionalData = selectedMonthId && selectedMonthId !== currentMonthId;
  
  const { 
    data: selectedMonthTasks = [], 
    isLoading: isLoadingSelectedTasks, 
    error: selectedMonthTasksError 
  } = useGetMonthTasksQuery(
    { 
      monthId: selectedMonthId || currentMonthId || '', 
      userId: undefined, // Admin gets all tasks
      role: 'admin',
      userData: user
    },
    { skip: !shouldFetchAdditionalData && !currentMonthId }
  );


  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";
  
  // Optimized task data logic - reduce hooks
  const isCurrentMonth = selectedMonthId === currentMonthId;
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



  return (
    <div className="mx-auto px-4 py-6">
      {/* Header */}
      <div className=" card flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2>{title}</h2>
          <p className="text-gray-300">
            {selectedMonthId || currentMonthId} - {selectedMonthName}
            {!isCurrentMonth && selectedMonthId && (
              <span className="ml-2 text-yellow-400 text-sm">
                (Viewing Historical Data)
              </span>
            )}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Showing {filteredTasks.length} tasks for {selectedMonthName}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0 items-center">
          {/* Month Selector */}
          <div className="min-w-[200px]">
            <label htmlFor="selectedMonth">Select Month</label>
            <div className="flex gap-2">
              <select
                id="selectedMonth"
                value={selectedMonthId || currentMonthId || ''}
                className="flex-1 px-3 py-2"
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
                >
                  Current
                </DynamicButton>
              )}
            </div>
          </div>

          {/* User Filter */}
          <div className="min-w-[200px]">
            <label htmlFor="selectedUser">Filter by User</label>
            <div className="flex gap-2">
              <select
                id="selectedUser"
                value={selectedUserId}
                className="flex-1 px-3 py-2"
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
                >
                  Clear
                </DynamicButton>
              )}
            </div>
          </div>

          {/* Create Task Button - Only enabled for current month */}
          <DynamicButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
            iconName="add"
            iconPosition="left"
            className="h-fit self-end"
            disabled={!canCreateTasks}
            title={!isCurrentMonth ? "Task creation only available for current month" : !boardExists ? "Month board not available" : ""}
          >
            Create Task
          </DynamicButton>
        </div>
      </div>

      {/* Board warning is now handled globally by AuthLayout */}

      {/* Tasks Section */}
      <div className="bg-gray-100 dark:bg-secondary card">
        <div className="flex justify-between items-center mb-10">
          <h2 className=" text-gray-800 dark:text-white">
            {isUserAdmin && selectedUserId
              ? `${selectedUserName} Tasks`
              : "All Tasks"}
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({filteredTasks.length} tasks)
            </span>
          </h2>
          <DynamicButton
            onClick={() => setShowTable(!showTable)}
            variant="outline"
            size="sm"
          >
            {showTable ? "Hide Table" : "Show Table"}
          </DynamicButton>
        </div>

        {showTable && (
          showMonthLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader size="lg" text="Loading tasks for selected month..." />
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
  );
};

export default AdminTasksPage;
