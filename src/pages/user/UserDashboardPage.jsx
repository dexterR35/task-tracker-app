import React, { useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { useNotificationCleanup } from "../../shared/hooks/useNotificationCleanup";
import { useGetMonthBoardExistsQuery } from "../../features/tasks/tasksApi";
import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import TaskForm from "../../features/tasks/components/TaskForm";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import DashboardLoader from "../../shared/components/ui/DashboardLoader";
import { format } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const UserDashboardPage = () => {
  const { user } = useAuth();
  const { addError } = useNotifications();
  
  // Use current month as default
  const monthId = format(new Date(), "yyyy-MM");
  
  // Local state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTasksTable, setShowTasksTable] = useState(true);

  // Check if board exists
  const { 
    data: board = { exists: false }, 
    isLoading: boardLoading,
    error: boardError 
  } = useGetMonthBoardExistsQuery({ monthId });

  // Clean up notifications when month changes
  useNotificationCleanup([monthId]);

  // Handle create task
  const handleCreateTask = () => {
    if (!board?.exists) {
      addError(
        `Cannot create task: Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. Please contact an admin.`
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
              {user?.name}'s Dashboard
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
              <div className="flex-center !flex-row !items-center !justify-start gap-4">
                <div>
                  The board for {format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet.
                  Please contact an admin to create the board.
                </div>
              </div>
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
          {board?.exists && (
            <div className="space-y-8">
              {/* Single DashboardWrapper with table visibility control */}
              <DashboardWrapper
                monthId={monthId}
                userId={user?.uid}
                isAdmin={false}
                showCreateBoard={false}
                showTable={showTasksTable} // Control table visibility
              />

              {/* Table Header with Toggle Button */}
              <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2 mb-6">
                <h3 className="mb-0">My Tasks</h3>
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

              {/* Show/hide table message */}
              {!showTasksTable && (
                <div className="bg-primary border rounded-lg p-6 text-center text-sm text-gray-200">
                  Table is hidden. Click "Show Table" to view tasks.
                </div>
              )}
            </div>
          )}

          {/* Board not ready message */}
          {!board?.exists && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                Board not ready for {format(new Date(monthId + "-01"), "MMMM yyyy")}. 
                Please contact an admin to create the board.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLoader>
  );
};

export default UserDashboardPage;
