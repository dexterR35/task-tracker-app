import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCentralizedDataAnalytics } from "../../../shared/hooks/analytics/useCentralizedDataAnalytics";

import { useAuth } from "../../../shared/hooks/useAuth";
import { useGlobalMonthId } from "../../../shared/hooks/useGlobalMonthId";
import DynamicButton from "../../../shared/components/ui/DynamicButton";
import { format } from "date-fns";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// Import components directly since data is already loaded
import OptimizedTaskMetricsBoard from "./OptimizedTaskMetricsBoard";
import TasksTable from "./TasksTable";
import TaskForm from "./TaskForm";

const DashboardWrapper = ({
  showTable = true,
  className = "",
  onGenerateBoard = null,
  isGeneratingBoard = false,
  showTaskForm = false,
  onToggleTaskForm = null,
  showTableToggle = true,
  // New props for target user context
  targetUserId = null,
  targetUserOccupation = null,
  showUserSelector = true,
}) => {
  const { user, canAccess } = useAuth();
  const isAdmin = canAccess('admin');
  const { monthId } = useGlobalMonthId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTasksTable, setShowTasksTable] = useState(showTable);
  const navigate = useNavigate();

  // Get selected user from URL params (admin only) or target user
  const selectedUserId = searchParams.get("user") || "";
  
  // Derive userId based on context: target user > URL param > current user
  const userId = targetUserId || (isAdmin ? selectedUserId : user?.uid);

  // Use centralized data system - gets all data in one call
  const {
    tasks,
    users: usersList,
    monthBoard: board,
    isLoading,
    isFetching,
    error: tasksError,
    hasData,
    boardExists
  } = useCentralizedDataAnalytics(monthId, userId);

  // Show loading state if data is being fetched or loaded
  // But don't show loading for users/reporters since they're loaded globally
  const showLoading = isLoading || isFetching;

  // Derive title based on context
  const title = targetUserId 
    ? `${usersList.find(u => (u.userUID || u.id) === targetUserId)?.name || targetUserId}'s Board`
    : isAdmin && selectedUserId 
    ? `Viewing ${usersList.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}'s Board`
    : `${user?.name || user?.email}'s - Board`;

  // Derive showCreateBoard
  const showCreateBoard = isAdmin && !boardExists;

  // Handle user selection (admin only) - navigate to user profile page
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      // Navigate to user profile page instead of staying on admin dashboard
      navigate(`/admin/users/${userId}`);
    }
  };

  // Don't render anything if not authenticated or still loading
  if (!user) {
    return null;
  }

  // Show loading state
  if (showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Handle table toggle
  const toggleTableVisibility = () => {
    setShowTasksTable(!showTasksTable);
  };

  // Handle create task
  const handleCreateTask = async () => {
    if (!boardExists) {
      const { showError } = await import("../../../shared/utils/toast");
      showError(
        `Cannot create task: Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. Please create the board first.`
      );
      return;
    }
    if (onToggleTaskForm) {
      onToggleTaskForm();
    }
  };

  // Show error state
  if (tasksError) {
    return (
      <div className="card mt-10">
        <div className="text-center py-8">
          <h2>Error Loading Dashboard</h2>
          <p className="text-sm">
            {tasksError?.message ||
              "Failed to load dashboard data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Dashboard Header */}
      <div className="mt-2 py-2 flex-center flex-col !items-start">
        <h2 className="capitalize mb-0">{title}</h2>
        <p className="text-xs font-base soft-white">
          <span>Month:</span> {format(new Date(monthId + "-01"), "MMMM")} (
          {monthId})
          {boardExists ? (
            <span className="ml-2 text-green-success"> • Board ready </span>
          ) : (
            <span className="ml-2 text-red-error"> • Board not ready </span>
          )}
        </p>
      </div>

      {/* Board Status Warning if not created */}
      {!boardExists && showCreateBoard && (
        <div className="card mt-2 border border-red-error text-red-error text-sm rounded-lg">
          <div className="flex-center !flex-row !items-center !justify-between gap-4">
            <p className="text-white-dark text-sm">
              ❌ The board for {format(new Date(monthId + "-01"), "MMMM yyyy")}{" "}
              is not created yet. Please create the board first.
            </p>
            {onGenerateBoard && (
              <DynamicButton
                variant="primary"
                onClick={onGenerateBoard}
                loading={isGeneratingBoard}
                iconName="generate"
                iconPosition="left"
                size="md"
              >
                {isGeneratingBoard ? "Creating Board..." : "Generate Board"}
              </DynamicButton>
            )}
          </div>
        </div>
      )}

      {/* User Selector (Admin Only) */}
      {boardExists && isAdmin && showUserSelector && (
        <div className="my-4">
          <label htmlFor="userSelect">Filter by User</label>
          <div className="relative">
            <select
              id="userSelect"
              value={selectedUserId}
              onChange={handleUserSelect}
              className="w-full md:w-64 px-3 py-2 capitalize"
              disabled=""
            >
              <option key="all-users" value="">
                All Users
              </option>
              {usersList.map((user) => (
                <option
                  key={user.userUID || user.id}
                  value={user.userUID || user.id}
                >
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {boardExists && (
        <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
          <DynamicButton
            variant="primary"
            onClick={handleCreateTask}
            size="md"
            iconName="generate"
            iconPosition="left"
            className=" min-w-30 "
          >
            {showTaskForm ? "Hide Form Task" : "Create Task "}
          </DynamicButton>
        </div>
      )}

      {/* Task Form */}
      {showTaskForm && boardExists && (
        <div className="bg-purple-500">
          <TaskForm />
        </div>
      )}

      {/* Main Dashboard Content - Only show when board exists */}
      {boardExists && (
        <div>
          <OptimizedTaskMetricsBoard 
            userId={userId} 
            showSmallCards={true}
            userOccupation={targetUserOccupation}
          />

          {/* Table Header with Toggle Button */}
          {showTableToggle && (
            <div className="flex flex-row items-end justify-between border-b border-gray-600 pb-4 mb-6">
              <h3 className="mb-0 text-gray-100">
                {isAdmin && selectedUserId
                  ? "User Tasks"
                  : isAdmin
                    ? "All Tasks"
                    : "My Tasks"}
              </h3>
              <DynamicButton
                onClick={toggleTableVisibility}
                variant="outline"
                icon={showTasksTable ? ChevronUpIcon : ChevronDownIcon}
                size="sm"
                className="w-38"
              >
                {showTasksTable ? "Hide Table" : "Show Table"}
              </DynamicButton>
            </div>
          )}

          {/* Tasks Table - Show only if we have data AND showTable is true */}
          {showTasksTable && tasks.length > 0 && (
            <TasksTable tasks={tasks} error={null} />
          )}

          {/* Show message if no tasks */}
          {showTasksTable && tasks.length === 0 && (
            <div className=" border rounded-lg p-6 text-center text-sm text-gray-200">
              {userId
                ? `No tasks found for user ${userId} in ${monthId}.`
                : `No tasks found for ${monthId}.`}
            </div>
          )}

          {/* Show/hide table message */}
          {!showTasksTable && (
            <div className=" border rounded-lg p-6 text-center text-sm text-gray-200">
              Table is hidden. Click "Show Table" to view tasks.
            </div>
          )}
        </div>
      )}

      {/* Board not ready message - shows for non-admin users when board doesn't exist */}
      {!boardExists && !isAdmin && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Board not ready for {format(new Date(monthId + "-01"), "MMMM yyyy")}
            . Please contact an admin to create the board.
          </p>
          {/* Debug info */}
          <p className="text-xs text-gray-500 mt-2">
            Debug: boardExists = {String(boardExists)}, isAdmin = {String(isAdmin)}
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardWrapper;
