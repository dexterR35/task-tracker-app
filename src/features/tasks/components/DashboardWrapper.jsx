import React, { useMemo, useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useSubscribeToMonthTasksQuery } from "../tasksApi";
import { useSubscribeToUsersQuery } from "../../users/usersApi";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useGlobalMonthId } from "../../../shared/hooks/useGlobalMonthId";
import DynamicButton from "../../../shared/components/ui/DynamicButton";
import { format } from "date-fns";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// Lazy load components that are not immediately needed
const OptimizedTaskMetricsBoard = lazy(
  () => import("./OptimizedTaskMetricsBoard")
);
const TasksTable = lazy(() => import("./TasksTable"));
const TaskForm = lazy(() => import("./TaskForm"));

const DashboardWrapper = ({
  showTable = true,
  className = "",
  onGenerateBoard = null,
  isGeneratingBoard = false,
  board = { exists: false },
  showTaskForm = false,
  onToggleTaskForm = null,
  showTableToggle = true,
}) => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { monthId } = useGlobalMonthId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTasksTable, setShowTasksTable] = useState(showTable);

  // Get selected user from URL params (admin only)
  const selectedUserId = searchParams.get("user") || "";
  
  // Get users list for admin
  const { data: usersList = [] } = useSubscribeToUsersQuery();

  // Derive userId based on admin status and selection
  const userId = isAdmin ? selectedUserId : user?.uid;

  // Derive title based on context
  const title = isAdmin && selectedUserId 
    ? `Viewing ${usersList.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}'s Board`
    : `${user?.name || user?.email}'s - Board`;

  // Derive showCreateBoard
  const showCreateBoard = isAdmin && !board?.exists;

  // Handle user selection (admin only)
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Memoize the query parameters to prevent unnecessary re-renders
  const queryParams = useMemo(
    () => ({
      monthId,
      userId: userId || null,
    }),
    [monthId, userId]
  );

  // Use the real-time subscription to get tasks
  const { data: tasks = [], error: tasksError } = useSubscribeToMonthTasksQuery(
    queryParams,
    {
      // Skip if no monthId or not authenticated
      skip: !monthId || !isAuthenticated,
      // No polling needed - onSnapshot handles real-time updates
    }
  );

  // Memoize tasks to prevent unnecessary re-renders
  const memoizedTasks = useMemo(() => tasks, [tasks]);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Handle table toggle
  const toggleTableVisibility = () => {
    setShowTasksTable(!showTasksTable);
  };

  // Handle create task
  const handleCreateTask = async () => {
    if (!board?.exists) {
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
          {board?.exists ? (
            <span className="ml-2 text-green-success"> • Board ready </span>
          ) : (
            <span className="ml-2 text-red-error"> • Board not ready </span>
          )}
        </p>
      </div>

      {/* Board Status Warning if not created */}
      {!board?.exists && showCreateBoard && (
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
      {board?.exists && isAdmin && (
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
      {board?.exists && (
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
      {showTaskForm && board?.exists && (
        <div className="bg-purple-500">
          <Suspense
            fallback={
              <div className="p-4 text-center">Loading task form...</div>
            }
          >
            <TaskForm />
          </Suspense>
        </div>
      )}

      {/* Main Dashboard Content */}
      {board?.exists && (
        <div>
          <Suspense
            fallback={
              <div className="p-4 text-center">Loading metrics board...</div>
            }
          >
            <OptimizedTaskMetricsBoard userId={userId} showSmallCards={true} />
          </Suspense>

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
          {showTasksTable && memoizedTasks.length > 0 && (
            <Suspense
              fallback={
                <div className="p-4 text-center">Loading tasks table...</div>
              }
            >
              <TasksTable tasks={memoizedTasks} error={null} />
            </Suspense>
          )}

          {/* Show message if no tasks */}
          {showTasksTable && memoizedTasks.length === 0 && (
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
      {!board?.exists && !isAdmin && (
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
