import React, { useMemo, useState } from "react";
import { useSubscribeToMonthTasksQuery } from "../tasksApi";
import { useAuth } from "../../../shared/hooks/useAuth";
import OptimizedTaskMetricsBoard from "./OptimizedTaskMetricsBoard";
import TasksTable from "./TasksTable";
import TaskForm from "./TaskForm";
import DynamicButton from "../../../shared/components/ui/DynamicButton";
import { showError } from "../../../shared/utils/toast";
import { format } from "date-fns";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const DashboardWrapper = ({
  monthId,
  userId = null,
  isAdmin = false,
  showTable = true,
  className = "",
  showCreateBoard = false,
  onGenerateBoard = null,
  isGeneratingBoard = false,
  board = { exists: false },
  boardError = null,
  usersList = [],
  usersLoading = false,
  selectedUserId = "",
  onUserSelect = null,
  showTaskForm = false,
  onToggleTaskForm = null,
  showTableToggle = true,
  title = "Dashboard",
}) => {
  const { isAuthenticated, user } = useAuth();
  const [showTasksTable, setShowTasksTable] = useState(showTable);

  // Memoize the query parameters to prevent unnecessary re-renders
  const queryParams = useMemo(
    () => ({
      monthId,
      userId: userId || null,
    }),
    [monthId, userId]
  );

  // Use the real-time subscription to get tasks
  const {
    data: tasks = [],
    error: tasksError,
  } = useSubscribeToMonthTasksQuery(queryParams, {
    // Skip if no monthId or not authenticated
    skip: !monthId || !isAuthenticated,
    // No polling needed - onSnapshot handles real-time updates
  });

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Handle table toggle
  const toggleTableVisibility = () => {
    setShowTasksTable(!showTasksTable);
  };

  // Handle create task
  const handleCreateTask = () => {
    if (!board?.exists) {
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
      <div className={`space-y-6 ${className}`}>
        <div className="text-center text-red-error py-8">
          <h3 className="text-xl font-semibold mb-2 text-red-error">
            Error Loading Dashboard
          </h3>
          <p className="text-sm">
            {tasksError?.message ||
              "Failed to load dashboard data. Please try refreshing the page."}
          </p>
          <DynamicButton
            onClick={() => window.location.reload()}
            variant="primary"
            size="md"
            className="mt-4 w-32"
          >
            Retry
          </DynamicButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="mb-6">
        <h3 className="text-3xl font-bold text-gray-200 mb-2 capitalize">
          {title}
        </h3>

        <div className="text-sm text-gray-200">
          <span className="font-medium">Month:</span>{" "}
          {format(new Date(monthId + "-01"), "MMMM yyyy")} ({monthId})
          {board?.exists ? (
            <span className="ml-2 text-green-400">• Board ready</span>
          ) : (
            <span className="ml-2 text-red-error">• Board not ready</span>
          )}
        </div>
      </div>

      {/* Board Status Warning if not created */}
      {!board?.exists && showCreateBoard && (
        <div className="card border border-red-error text-red-error text-sm px-4 py-4 rounded-lg bg-red-900/20">
          <div className="flex-center !flex-row !items-center !justify-between gap-4">
            <p className="text-gray-200 text-sm">
              ❌ The board for {format(new Date(monthId + "-01"), "MMMM yyyy")}{" "}
              is not created yet. Please create the board first.
            </p>
            {onGenerateBoard && (
              <DynamicButton
                variant="primary"
                onClick={onGenerateBoard}
                loading={isGeneratingBoard}
                icon={PlusIcon}
                size="sm"
              >
                {isGeneratingBoard ? "Creating Board..." : "Generate Board"}
              </DynamicButton>
            )}
          </div>
        </div>
      )}

      {/* User Selector (Admin Only) */}
      {board?.exists && isAdmin && onUserSelect && (
        <div className="mb-6">
          <label htmlFor="userSelect">Filter by User</label>
          <div className="relative">
            <select
              id="userSelect"
              value={selectedUserId}
              onChange={onUserSelect}
              className="w-full md:w-64 px-3 py-2 rounded-md bg-primary text-gray-200"
              disabled={usersLoading}
            >
              <option key="all-users" value="">
                All Users
              </option>
              {usersList.map((user) => (
                <option
                  key={user.userUID || user.id}
                  value={user.userUID || user.id}
                >
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {usersLoading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {usersLoading && (
            <p className="text-sm text-gray-300 mt-1">Loading users...</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {board?.exists && (
        <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
          <DynamicButton variant="primary" onClick={handleCreateTask} size="md">
            {showTaskForm ? "Hide Form" : "Add Task"}
          </DynamicButton>
        </div>
      )}

      {/* Task Form */}
      {showTaskForm && board?.exists && (
        <div className="mb-6">
          <TaskForm />
        </div>
      )}

      {/* Main Dashboard Content */}
      {board?.exists && (
        <div className="space-y-8">
          {/* Metrics Board - Always show, even with zero data */}
          <OptimizedTaskMetricsBoard
            monthId={monthId}
            userId={userId}
            showSmallCards={true}
          />

          {/* Table Header with Toggle Button */}
          {showTableToggle && (
            <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2 mb-6">
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
            <TasksTable
              monthId={monthId}
              tasks={tasks}
              error={null}
            />
          )}

          {/* Show message if no tasks */}
          {showTasksTable && tasks.length === 0 && (
            <div className="bg-primary border rounded-lg p-6 text-center text-sm text-gray-200">
              {userId
                ? `No tasks found for user ${userId} in ${monthId}.`
                : `No tasks found for ${monthId}.`}
            </div>
          )}

          {/* Show/hide table message */}
          {!showTasksTable && (
            <div className="bg-primary border rounded-lg p-6 text-center text-sm text-gray-200">
              Table is hidden. Click "Show Table" to view tasks.
            </div>
          )}
        </div>
      )}

      {/* Board not ready message */}
      {!board?.exists && !showCreateBoard && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Board not ready for {format(new Date(monthId + "-01"), "MMMM yyyy")}
            . Please contact an admin to create the board.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardWrapper;
