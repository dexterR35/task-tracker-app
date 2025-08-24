import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useNotifications } from "../../../shared/hooks/useNotifications";
import { useNotificationCleanup } from "../../../shared/hooks/useNotificationCleanup";
import {
  useSubscribeToMonthTasksQuery,
  useGetMonthBoardExistsQuery,
} from "../tasksApi";
import TaskForm from "./TaskForm";
import TasksTable from "./TasksTable";
import OptimizedTaskMetricsBoard from "./OptimizedTaskMetricsBoard";

import DynamicButton from "../../../shared/components/ui/DynamicButton";
import { format } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const DashboardWrapper = ({
  title = "Dashboard",
  showUserFilter = false,
  usersList = [],
  usersLoading = false,
  onUserSelect,
  impersonatedUserId = null,
  monthId: propMonthId = null,
  isAdmin = false,
  onGenerateAnalytics,
  onGenerateBoard,
  generatingBoard = false,
}) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Use provided monthId or default to current month
  const monthId = propMonthId || format(new Date(), "yyyy-MM");

  // Read impersonatedUserId from URL
  const urlImpersonatedUserId = searchParams.get("user");

  // Check if board exists first
  const { data: board = { exists: false }, isLoading: boardLoading } =
    useGetMonthBoardExistsQuery({
      monthId,
    });

  // Use URL-based impersonatedUserId if available, otherwise fall back to prop
  const effectiveImpersonatedUserId =
    urlImpersonatedUserId || impersonatedUserId;

  // For non-admin users, always filter to their own tasks
  const finalUserId = !isAdmin ? user?.uid : effectiveImpersonatedUserId;

  // Only subscribe to tasks if board exists and board query is not loading
  const shouldSkipTaskQuery = boardLoading || !board?.exists;

  // Normalize userId to prevent duplicate queries
  const normalizedUserId =
    finalUserId && finalUserId.trim() !== "" ? finalUserId : null;

  // Debug: Log user selection information
  // console.log('DashboardWrapper - urlImpersonatedUserId:', urlImpersonatedUserId);
  // console.log('DashboardWrapper - impersonatedUserId:', impersonatedUserId);
  // console.log('DashboardWrapper - effectiveImpersonatedUserId:', effectiveImpersonatedUserId);
  // console.log('DashboardWrapper - finalUserId:', finalUserId);
  // console.log('DashboardWrapper - normalizedUserId:', normalizedUserId);

  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useSubscribeToMonthTasksQuery(
    {
      monthId,
      userId: normalizedUserId,
    },
    {
      skip: shouldSkipTaskQuery,
    }
  );
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTasksTable, setShowTasksTable] = useState(true); // New state for table visibility

  const { addError } = useNotifications();

  // Clean up notifications when month changes
  useNotificationCleanup([monthId]);

  // Tasks are already filtered by the server query, so use them directly
  const filteredTasks = tasks || [];

  const handleCreateTask = () => {
    if (!board?.exists) {
      if (isAdmin) {
        addError(
          `Cannot create task: Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. Please create the board first.`
        );
      } else {
        addError(
          `Cannot create task: Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. Please contact an admin.`
        );
      }
      return;
    }
    setShowTaskForm(!showTaskForm);
  };

  const handleUserSelect = (event) => {
    const selectedUserId = event.target.value;

    // If no user is selected, use clean URL
    if (!selectedUserId) {
      setSearchParams({}, { replace: true });
    } else {
      // Only include user parameter
      const newSearchParams = new URLSearchParams();
      newSearchParams.set("user", selectedUserId);
      setSearchParams(newSearchParams);
    }
    // Call the original onUserSelect if provided
    if (onUserSelect) {
      onUserSelect(event);
    }
  };
  const toggleTableVisibility = () => {
    setShowTasksTable(!showTasksTable);
  };
  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">{title}</h1>
        <div className="text-sm text-gray-300">
          <strong>Month:</strong>{" "}
          {format(new Date(monthId + "-01"), "MMMM yyyy")} ({monthId})
          {board?.exists ? (
            <span className="ml-2 text-green-400">• Board ready</span>
          ) : (
            <span className="ml-2 text-red-400">• Board not ready</span>
          )}
        </div>
      </div>

      {/* User Filter (Admin Only) */}
      {board?.exists && showUserFilter && isAdmin && (
        <div className="mb-6">
          <label htmlFor="userSelect">Filter by User</label>
          <select
            id="userSelect"
            value={effectiveImpersonatedUserId || ""}
            onChange={handleUserSelect}
            className="w-full md:w-52"
            disabled={usersLoading}
          >
            <option value="">All Users</option>
            {usersList.map((user) => (
              <option key={user.userUID} value={user.userUID}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Board Status Warning if not created */}
      {!board?.exists && (
        <div className="mb-6 card border border-red-error text-red-error text-sm px-4 py-4 rounded-lg bg-red-900/20">
          {isAdmin ? (
            <div className="flex-center !flex-row !items-center !justify-start gap-4">
              <div>
                Hey {user.name}, the board for{" "}
                {format(new Date(monthId + "-01"), "MMMM yyyy")} is not created
                yet
              </div>
              <DynamicButton
                variant="danger"
                onClick={() => onGenerateBoard(monthId)}
                loading={generatingBoard}
                loadingText="Creating Board..."
                size="xs"
              >
                Create Board - {format(new Date(monthId + "-01"), "MMMM yyyy")}
              </DynamicButton>
            </div>
          ) : (
            <>
              The board for {format(new Date(monthId + "-01"), "MMMM yyyy")} is
              not created yet. Please contact an admin to create the board.
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {board?.exists && (
        <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
          <DynamicButton variant="primary" onClick={handleCreateTask} size="md">
            {showTaskForm ? "Hide Form" : "Create Task"}
          </DynamicButton>

          {isAdmin && onGenerateAnalytics && (
            <DynamicButton
              variant="success"
              size="md"
              onClick={() => onGenerateAnalytics(monthId)}
            >
              Generate Analytics (
              {format(new Date(monthId + "-01"), "MMMM yyyy")})
            </DynamicButton>
          )}
        </div>
      )}

      {/* Task Form */}
      {showTaskForm && board?.exists && (
        <div className="mb-6">
          <TaskForm />
        </div>
      )}
      {board?.exists && !boardLoading && (
        <OptimizedTaskMetricsBoard
          monthId={monthId}
          userId={normalizedUserId}
          showSmallCards={true}
          className=""
        />
      )}
      <div className="space-y-8">
        {!tasksLoading && filteredTasks.length === 0 ? (
          <div className="card text-gray-300">
            <div className="flex-center !flex-col !space-y-2">
              <span>
                {tasksError
                  ? "Error loading tasks"
                  : "No tasks found for the selected month."}
              </span>
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header with Toggle Button */}
            <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2 mb-6">
              <h3 className=" mb-0">
                Total Tasks
              </h3>
              <DynamicButton
                onClick={toggleTableVisibility}
                variant="outline" // You can customize the style
                icon={showTasksTable ? ChevronUpIcon : ChevronDownIcon}
                size="sm"
                className="w-38"
              >
                {showTasksTable ? "Hide Table" : "Show Table"}
              </DynamicButton>
            </div>

            {/* Tasks Table */}
            {showTasksTable && (
              <TasksTable
                monthId={monthId}
                userFilter={normalizedUserId}
                isAdmin={isAdmin}
                boardExists={board?.exists}
                boardLoading={boardLoading}
                tasks={filteredTasks}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWrapper;
