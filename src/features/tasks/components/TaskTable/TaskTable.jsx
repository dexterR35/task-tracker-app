import React, { useState } from "react";

import { useFetchData } from "@/hooks/useFetchData.js";
import { useDeleteTaskMutation } from "@/features/tasks";
import { useCacheManagement } from "@/hooks/useCacheManagement.js";
import { normalizeTaskData } from "@/components/forms/utils/sanitization/sanitization";
import { DynamicButton } from "@/components";
import DynamicTable from "@/components/ui/Table/DynamicTable.jsx";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError, showSuccess } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import { TaskForm } from "@/features/tasks";

const TaskTable = ({
  className = "",
}) => {

  const [rowActionId, setRowActionId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Use the centralized hook directly - single source of truth
  const {
    monthId,
    tasks = [],
    isLoading,
    error: tasksError,
  } = useFetchData();

  // API hooks for task CRUD
  const [deleteTask] = useDeleteTaskMutation();
  // Cache management
  const { clearCacheOnDataChange } = useCacheManagement();
  // Get task columns with monthId for date formatting
  const taskColumns = getColumns('tasks', monthId);
  // Handle task selection
  const handleTaskSelect = (task) => {
    showSuccess(`Selected task: ${task.taskName || task.taskNumber}`);
  };

  // Handle task edit - open modal with TaskForm
  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };



  // Handle task delete
  const handleTaskDelete = async (task) => {
    if (!window.confirm(`Are you sure you want to delete task: ${task.taskName || task.taskNumber}?`)) {
      return;
    }

    try {
      setRowActionId(task.id);

      // Use utility function to normalize task data
      const { taskId, monthId: taskMonthId } = normalizeTaskData(task, { monthId });

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





  // Render edit modal
  const renderEditModal = () => {
    if (!showEditModal || !editingTask) return null;
    
    return (
      <div className="fixed bg-gray-600 inset-0 bg-white-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="rounded-lg  bg-white-dark shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-white-dak">
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
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
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

      {/* Edit Task Modal */}
      {renderEditModal()}
    </div>
  );
};

export default TaskTable;
