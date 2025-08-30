import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentMonth } from "../../hooks/useCurrentMonth";
import { useCentralizedDataAnalytics } from "../../hooks/analytics/useCentralizedDataAnalytics";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "../../../features/tasks/tasksApi";
import { useCacheManagement } from "../../hooks/useCacheManagement";
import DynamicButton from "../ui/DynamicButton";
import DynamicTable from "../ui/DynamicTable";
import { getColumns } from "../ui/tableColumns.jsx";
import { showError, showSuccess } from "../../utils/toast";
import { logger } from "../../utils/logger";
import { sanitizeText } from "../../forms/sanitization";
import TaskForm from "../../task/TaskForm";

const DashboardTaskTable = ({
  userId = null,
  className = "",
  hideCreateButton = false, // New prop to hide the create button
}) => {
  const { user, canAccess } = useAuth();
  const isAdmin = canAccess('admin');
  const { monthId, monthName, boardExists } = useCurrentMonth();
  const [rowActionId, setRowActionId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Use the centralized hook directly - single source of truth
  const {
    tasks = [],
    users,
    isLoading,
    error: tasksError,
  } = useCentralizedDataAnalytics(userId);

  // API hooks for task CRUD
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  
  // Cache management
  const { clearCacheOnDataChange } = useCacheManagement();

  // Get task columns
  const taskColumns = getColumns('tasks');

  // Handle task selection
  const handleTaskSelect = (task) => {
    showSuccess(`Selected task: ${task.taskName || task.taskNumber}`);
    console.log('Task selected:', task);
  };

  // Handle task edit - open modal with TaskForm
  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  // Handle edit form success
  const handleEditFormSuccess = (result) => {
    console.log('Task updated successfully:', result);
    setShowEditModal(false);
    setEditingTask(null);
    clearCacheOnDataChange('tasks', 'update');
    showSuccess("Task updated successfully! The task list will update automatically.");
  };

  // Handle edit form error
  const handleEditFormError = (error) => {
    console.error('Task update failed:', error);
    showError("Failed to update task. Please try again.");
  };

  // Handle task delete
  const handleTaskDelete = async (task) => {
    if (!window.confirm(`Are you sure you want to delete task: ${task.taskName || task.taskNumber}?`)) {
      return;
    }

    try {
      setRowActionId(task.id);

      // Extract the document ID from the task ID (in case it's a full path)
      let taskId = task.id;
      if (typeof taskId === "string" && taskId.includes("/")) {
        const pathParts = taskId.split("/");
        taskId = pathParts[pathParts.length - 1];
      }

      // Preserve the original monthId from the task
      const taskMonthId = task.monthId || monthId;

      // Delete task using Redux mutation (automatically updates cache)
      await deleteTask({ monthId: taskMonthId, id: taskId }).unwrap();
      
      clearCacheOnDataChange('tasks', 'delete');
      showSuccess("Task deleted successfully!");
    } catch (error) {
      logger.error("Task delete error:", error);
      showError(`Failed to delete task: ${error?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
    }
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
      {/* Section Header */}
      <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2">
        <h3 className="mb-0">{title}</h3>
        <div className="flex items-center space-x-2">
          {!boardExists && (
            <div className="text-sm text-red-400">
              Board not ready for {monthName || 'current month'}
            </div>
          )}
        </div>
      </div>

      {/* Tasks Table - Using DynamicTable with built-in CRUD */}
      <div>
        {tasks.length > 0 ? (
          <DynamicTable
            data={tasks}
            columns={taskColumns}
            tableType="tasks"
            onSelect={handleTaskSelect}
            onEdit={handleTaskEdit}
            onDelete={handleTaskDelete}
            isLoading={isLoading}
            error={tasksError}
            showPagination={true}
            showFilters={true}
            showColumnToggle={true}
            pageSize={25}
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            enableColumnResizing={true}
            enableRowSelection={false}
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
                : `No tasks found for ${monthName || 'current month'}.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Task: {editingTask.taskName || editingTask.taskNumber}
              </h2>
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                iconName="close"
                iconPosition="center"
              />
            </div>
            <div className="p-6">
              <TaskForm
                mode="edit"
                taskId={editingTask.id}
                initialValues={editingTask}
                onSubmit={handleEditFormSuccess}
                onError={handleEditFormError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTaskTable;
