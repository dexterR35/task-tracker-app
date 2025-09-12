import React, { useState } from "react";

import { useDeleteTaskMutation } from "@/features/tasks/tasksApi";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import DynamicTable from "@/components/ui/Table/DynamicTable.jsx";
import { useTaskColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError, showSuccess } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import UniversalFormRHF from "@/components/forms/UniversalFormRHF";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";

const TaskTable = ({
  className = "",
  tasks = [],
  monthId,
  isLoading = false,
  error: tasksError = null,
  reporters = [], // Reporters data for TaskForm
  user = null, // User data for TaskForm
}) => {
  
  // TaskTable component rendering

  const [rowActionId, setRowActionId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // API hooks for task CRUD
  const [deleteTask] = useDeleteTaskMutation();
  // Get task columns with monthId and reporters data for reporter name lookup
  const taskColumns = useTaskColumns(monthId, reporters);
  
  // Task columns configured for the table
  // Handle task selection
  const handleTaskSelect = (task) => {
    showSuccess(`Selected task: ${task.jiraLink || task.departments}`);
  };

  // Handle task edit - open modal with TaskForm
  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };



  // Handle task delete
  const handleTaskDelete = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      setRowActionId(taskToDelete.id);

      // Extract task ID and month ID
      const taskId = taskToDelete.id;
      const taskMonthId = taskToDelete.monthId || monthId;

      // Delete task using Redux mutation (automatically updates cache)
      await deleteTask({ 
        monthId: taskMonthId, 
        boardId: taskToDelete.boardId, // Get boardId from task data
        taskId: taskId,
        userData: user // Pass user data for permission checks
      }).unwrap();
      
      showSuccess("Task deleted successfully!");
    } catch (error) {
      logger.error("Task delete error:", error);
      showError(`Failed to delete task: ${error?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
      setTaskToDelete(null);
      setShowDeleteConfirm(false);
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
              Edit Task: {editingTask.jiraLink || editingTask.departments}
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
            <UniversalFormRHF
              formType="task"
              mode="edit"
              initialValues={editingTask}
              user={user}
              monthId={monthId}
              reporters={reporters}
              onSuccess={() => setShowEditModal(false)}
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

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setTaskToDelete(null);
          }}
          onConfirm={confirmDeleteTask}
          title="Delete Task"
          message={`Are you sure you want to delete task "${taskToDelete?.jiraLink || taskToDelete?.departments}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={rowActionId === taskToDelete?.id}
        />
      </div>
  );
};

export default TaskTable;
