import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { useNotificationCleanup } from "../../shared/hooks/useNotificationCleanup";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import { useGetMonthBoardExistsQuery, useGenerateMonthBoardMutation } from "../../features/tasks/tasksApi";
import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import TaskForm from "../../features/tasks/components/TaskForm";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import DashboardLoader from "../../shared/components/ui/DashboardLoader";
import { format } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "@heroicons/react/24/outline";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { addError, addSuccess } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use current month as default
  const monthId = format(new Date(), "yyyy-MM");
  
  // URL state for user selection
  const selectedUserId = searchParams.get("user") || "";
  
  // Local state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTasksTable, setShowTasksTable] = useState(true);

  // API hooks
  const { data: usersList = [], isLoading: usersLoading } = useSubscribeToUsersQuery();
  const [generateMonthBoard, { isLoading: isGeneratingBoard }] = useGenerateMonthBoardMutation();
  
  // Check if board exists
  const { 
    data: board = { exists: false }, 
    isLoading: boardLoading,
    error: boardError 
  } = useGetMonthBoardExistsQuery({ monthId });

  // Clean up notifications when month changes
  useNotificationCleanup([monthId]);

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

  // Handle generate month board
  const handleGenerateBoard = async () => {
    try {
      await generateMonthBoard({ 
        monthId, 
        meta: {
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email,
          monthName: format(new Date(monthId + "-01"), "MMMM yyyy")
        }
      }).unwrap();
      
      addSuccess(`Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`);
    } catch (error) {
      addError(`Failed to create board: ${error.message}`);
    }
  };

  // Handle create task
  const handleCreateTask = () => {
    if (!board?.exists) {
      addError(
        `Cannot create task: Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. Please create the board first.`
      );
      return;
    }
    setShowTaskForm(!showTaskForm);
  };

  // Toggle table visibility
  const toggleTableVisibility = () => {
    setShowTasksTable(!showTasksTable);
  };

  return (
    <DashboardLoader>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              Admin Dashboard
            </h1>
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

          {/* Board Status Warning if not created */}
          {!board?.exists && (
            <div className="mb-6 card border border-red-error text-red-error text-sm px-4 py-4 rounded-lg bg-red-900/20">
              <div className="flex-center !flex-row !items-center !justify-between gap-4">
                <div>
                  The board for {format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet.
                  Please create the board first.
                </div>
                <DynamicButton
                  variant="primary"
                  onClick={handleGenerateBoard}
                  loading={isGeneratingBoard}
                  icon={PlusIcon}
                  size="sm"
                >
                  {isGeneratingBoard ? "Creating Board..." : "Generate Board"}
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
                  <option key="all-users" value="">All Users</option>
                  {usersList.map((user) => (
                    <option key={user.userUID || user.id} value={user.userUID || user.id}>
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

          {/* Action Buttons */}
          {board?.exists && (
            <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
              <DynamicButton variant="primary" onClick={handleCreateTask} size="md">
                {showTaskForm ? "Hide Form" : "Create Task"}
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
          {board?.exists ? (
            <div className="space-y-8">
              {/* Admin Analytics Cards and Table */}
              <DashboardWrapper
                monthId={monthId}
                userId={selectedUserId || null}
                isAdmin={true}
                showCreateBoard={false}
              />

              {/* Table Header with Toggle Button */}
              <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2 mb-6">
                <h3 className="mb-0">
                  {selectedUserId ? "User Tasks" : "All Tasks"}
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

              {/* Tasks Table - Show/hide based on toggle */}
              {!showTasksTable && (
                <div className="bg-primary border rounded-lg p-6 text-center text-sm text-gray-200">
                  Table is hidden. Click "Show Table" to view tasks.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">
                Board not ready for {format(new Date(monthId + "-01"), "MMMM yyyy")}. 
                Please create the board first.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLoader>
  );
};

export default AdminDashboardPage;
