import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentMonth } from "../../hooks/useCurrentMonth";
import { useCentralizedDataAnalytics } from "../../hooks/analytics/useCentralizedDataAnalytics";
import DynamicButton from "../ui/DynamicButton";
import TasksTable from "../../task/TasksTable";
import TaskForm from "../../task/TaskForm";
import { showError, showSuccess } from "../../utils/toast";

const DashboardTaskTable = ({
  userId = null,
  className = "",
  hideCreateButton = false, // New prop to hide the create button
}) => {
  const { user, canAccess } = useAuth();
  const isAdmin = canAccess('admin');
  const { monthId, monthName, boardExists } = useCurrentMonth();
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Use the centralized hook directly
  const {
    tasks = [],
    users,
    isLoading,
    error: tasksError,
  } = useCentralizedDataAnalytics(userId);

  // Handle create task
  const handleCreateTask = async () => {
    if (!boardExists) {
      showError(
        `Cannot create task: Board for ${monthName || 'current month'} is not created yet. Please create the board first.`
      );
      return;
    }
    setShowTaskForm(!showTaskForm);
  };

  // Handle form success
  const handleFormSuccess = (result) => {
    console.log('Task created successfully:', result);
    setShowTaskForm(false); // Hide form after successful creation
    showSuccess("Task created successfully! The task list will update automatically.");
  };

  // Handle form error
  const handleFormError = (error) => {
    console.error('Task creation failed:', error);
    showError("Failed to create task. Please try again.");
  };

  // Derive title based on context
  const title = userId && isAdmin 
    ? `Tasks for ${users?.find(u => (u.userUID || u.id) === userId)?.name || userId}`
    : isAdmin 
    ? "All Tasks" 
    : "My Tasks";

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (tasksError) {
    return (
      <div className="card mt-4">
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Tasks</h3>
          <p className="text-sm text-gray-400">
            {tasksError?.message || "Failed to load tasks data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header - Only show if not hiding create button */}
      {!hideCreateButton && (
        <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2">
          <h3 className="mb-0">{title}</h3>
          <div className="flex items-center space-x-2">
            {boardExists && (
              <DynamicButton
                variant="primary"
                onClick={handleCreateTask}
                size="sm"
                iconName="generate"
                iconPosition="left"
              >
                {showTaskForm ? "Hide Form" : "Create Task"}
              </DynamicButton>
            )}
          </div>
        </div>
      )}

      {/* Task Form - Only show if not hiding create button */}
      {!hideCreateButton && showTaskForm && boardExists && (
        <div className="mb-6">
          <TaskForm
            onSubmit={handleFormSuccess}
            onError={handleFormError}
          />
        </div>
      )}

      {/* Tasks Table */}
      <div>
        {tasks.length > 0 ? (
          <TasksTable 
            tasks={tasks} 
            error={null} 
            monthId={monthId}
            onSelect={(task) => {
              // For now, just show a success message since we removed task detail pages
              // In the future, this could open a modal or expand the row inline
              showSuccess(`Selected task: ${task.taskName || task.taskNumber}`);
              console.log('Task selected:', task);
            }}
          />
        ) : (
          <div className="border border-gray-700 rounded-lg p-6 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">No Tasks Found</h3>
            <p className="text-sm text-gray-400">
              {isAdmin 
                ? `No tasks found for ${monthName || 'current month'}.`
                : `No tasks found for ${monthName || 'current month'}. Create your first task!`
              }
            </p>
            {boardExists && !hideCreateButton && (
              <DynamicButton
                variant="primary"
                onClick={handleCreateTask}
                size="sm"
                className="mt-3"
                iconName="generate"
                iconPosition="left"
              >
                Create First Task
              </DynamicButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTaskTable;
