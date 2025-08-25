import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import { useGenerateMonthBoardMutation, useGetMonthBoardExistsQuery } from "../../features/tasks/tasksApi";
import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import TaskForm from "../../features/tasks/components/TaskForm";
import { format } from "date-fns";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import { ChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { addSuccess, addError } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL state for user selection
  const selectedUserId = searchParams.get("user") || "";
  
  // Local state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  
  // API hooks
  const { data: usersList = [], isLoading: usersLoading } = useSubscribeToUsersQuery();
  const [generateBoard, { isLoading: generatingBoard }] = useGenerateMonthBoardMutation();
  
  // Check if board exists
  const currentMonth = format(new Date(), "yyyy-MM");
  const { 
    data: board = { exists: false }, 
    isLoading: boardLoading,
    error: boardError 
  } = useGetMonthBoardExistsQuery({ monthId: currentMonth });

  const handleGenerateAnalytics = async (monthId) => {
    try {
      addSuccess(
        `Generating analytics for ${format(new Date(monthId + "-01"), "MMMM yyyy")}...`
      );
      navigate(`/preview/${monthId}`);
    } catch (error) {
      addError(`Failed to generate analytics: ${error.message}`);
    }
  };

  const handleGenerateBoard = async (monthId) => {
    try {
      setShowCreateBoard(true);
      await generateBoard({ monthId });
      addSuccess(
        `Board generated for ${format(new Date(monthId + "-01"), "MMMM yyyy")}`
      );
    } catch (error) {
      addError(`Failed to generate board: ${error.message}`);
    } finally {
      setShowCreateBoard(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    
    if (!userId) {
      // Clear user filter
      setSearchParams({}, { replace: true });
    } else {
      // Set user filter
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Handle create task
  const handleCreateTask = () => {
    if (!board?.exists) {
      addError(
        `Cannot create task: Board for ${format(new Date(currentMonth + "-01"), "MMMM yyyy")} is not created yet. Please create the board first.`
      );
      return;
    }
    setShowTaskForm(!showTaskForm);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Admin Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Admin Dashboard</h1>
          <div className="text-sm text-gray-300">
            <strong>Month:</strong>{" "}
            {format(new Date(currentMonth + "-01"), "MMMM yyyy")} ({currentMonth})
            {board?.exists ? (
              <span className="ml-2 text-green-400">• Board ready</span>
            ) : (
              <span className="ml-2 text-red-400">• Board not ready</span>
            )}
          </div>
        </div>

        {/* Board Management Section */}
        {!board?.exists && (
          <div className="mb-6 card border border-red-error text-red-error text-sm px-4 py-4 rounded-lg bg-red-900/20">
            <div className="flex-center !flex-row !items-center !justify-start gap-4">
              <div>
                Hey {user?.name}, the board for{" "}
                {format(new Date(currentMonth + "-01"), "MMMM yyyy")} is not created yet
              </div>
              <DynamicButton
                variant="danger"
                onClick={() => handleGenerateBoard(currentMonth)}
                loading={generatingBoard}
                loadingText="Creating Board..."
                size="xs"
              >
                Create Board - {format(new Date(currentMonth + "-01"), "MMMM yyyy")}
              </DynamicButton>
            </div>
          </div>
        )}

        {/* User Selector (Admin Only) */}
        {board?.exists && (
          <div className="mb-6">
            <label htmlFor="userSelect" className="block text-sm font-medium text-gray-200 mb-2">
              Filter by User
            </label>
            <div className="relative">
              <select
                id="userSelect"
                value={selectedUserId}
                onChange={handleUserSelect}
                className="w-full md:w-64 px-3 py-2 border border-gray-600 rounded-md bg-primary text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={usersLoading}
              >
                <option value="">All Users</option>
                {usersList.map((user) => (
                  <option key={user.userUID} value={user.userUID}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {usersLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {usersLoading && (
              <p className="text-sm text-gray-400 mt-1">Loading users...</p>
            )}
          </div>
        )}

        {/* Admin Action Buttons */}
        {board?.exists && (
          <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
            <DynamicButton
              onClick={handleCreateTask}
              variant="primary"
              icon={PlusIcon}
              size="md"
            >
              {showTaskForm ? "Hide Form" : "Create Task"}
            </DynamicButton>
            
            <DynamicButton
              onClick={() => handleGenerateAnalytics(currentMonth)}
              variant="outline"
              icon={ChartBarIcon}
              size="md"
            >
              Generate Charts
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
        <DashboardWrapper
          monthId={currentMonth}
          userId={selectedUserId || null}
          isAdmin={true}
          className=""
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
