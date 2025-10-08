import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import TanStackTable from "@/components/Table/TanStackTable";
import { useTaskColumns } from "@/components/Table/tableColumns.jsx";
import { useTableActions } from "@/hooks/useTableActions";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import { showError, showAuthError, showSuccess } from "@/utils/toast";

const TaskTable = ({
  className = "",
  selectedUserId = "",
  selectedReporterId = "",
  selectedMonthId = null,
  error: tasksError = null,
  isLoading = false,
  onCountChange = null,
}) => {
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Get auth functions separately
  const { canAccess, user } = useAuth();
  const isUserAdmin = canAccess("admin");

  // Get data from useAppData hook
  const {
    tasks,
    reporters,
    deleteTask,
  } = useAppData();

  // Delete wrapper - simplified since useTableActions now handles permission errors
  const handleTaskDeleteMutation = async (task) => {
    if (!deleteTask) {
      throw new Error('Delete task mutation not available');
    }
    
    try {
      await deleteTask({ 
        monthId: task.monthId,  // Always use task's own monthId
        taskId: task.id,
        userData: user  // Pass user data for permission validation
      });
      showSuccess(`Task "${task.data_task?.taskName}" deleted successfully!`);
    } catch (error) {
      showError(`Failed to delete task: ${error.message}`);
      throw error; // Re-throw to maintain error handling in bulk operations
    }
  };

  // Use table actions hook
  const {
    showEditModal: showTableEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    rowActionId,
    handleSelect,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions('task', {
    getItemDisplayName: (task) => {
      if (task?.data_task?.taskName) return task.data_task.taskName;
      if (task?.data_task?.departments) {
        const departments = task.data_task.departments;
        return Array.isArray(departments) ? departments.join(', ') : departments;
      }
      return task?.data_task?.taskName || task?.id;
    },
    deleteMutation: handleTaskDeleteMutation,
  });

  // Handle edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  // Handle edit success
  const handleEditTaskSuccess = () => {
    setShowEditModal(false);
    setEditingTask(null);
    handleEditSuccess();
    showSuccess('Task updated successfully!');
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Get task columns for the table
  const taskColumns = useTaskColumns(selectedMonthId, reporters, user);


  // Extract stable user values to prevent unnecessary re-renders
  const userUID = useMemo(() => user?.userUID, [user?.userUID]);
  
  // Reusable filtering function with role-based access control
  const getFilteredTasks = useCallback(
    (tasks, selectedUserId, selectedReporterId, currentMonthId) => {
      if (!tasks || !Array.isArray(tasks)) {
        return [];
      }
      return tasks.filter((task) => {
        // Always filter by month first
        if (currentMonthId && task.monthId !== currentMonthId) return false;

        // Role-based filtering: Regular users can only see their own tasks
        if (!isUserAdmin) {
          // Check if this task belongs to the current user
          const isUserTask = userUID && (
            task.userUID === userUID || 
            task.createbyUID === userUID
          );
          
          // Regular users can ONLY see their own tasks
          return isUserTask;
        }

        // If both user and reporter are selected, show tasks that match BOTH
        if (selectedUserId && selectedReporterId) {
          const matchesUser =
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId;
          const matchesReporter =
            task.reporters === selectedReporterId ||
            task.data_task?.reporters === selectedReporterId;
          return matchesUser && matchesReporter;
        }

        // If only user is selected, show tasks for that user
        if (selectedUserId && !selectedReporterId) {
          return (
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId
          );
        }

        // If only reporter is selected, show tasks for that reporter
        if (selectedReporterId && !selectedUserId) {
          return (
            task.reporters === selectedReporterId ||
            task.data_task?.reporters === selectedReporterId
          );
        }

        // If neither user nor reporter is selected, show tasks based on role
        if (!isUserAdmin) {
          const userUID = user?.uid || user?.userUID;
          const isUserTask = userUID && (task.userUID === userUID || task.createbyUID === userUID);
          const isReporterTask = task.reporters || task.data_task?.reporters;
          return isUserTask || isReporterTask;
        }

        return true; // Admin sees all tasks
      });
    },
    [isUserAdmin, userUID, user]
  );

  // Get filtered tasks
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }
    return getFilteredTasks(
      tasks,
      selectedUserId,
      selectedReporterId,
      selectedMonthId
    );
  }, [tasks, selectedUserId, selectedReporterId, selectedMonthId, getFilteredTasks]);

  // Notify parent component about count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(filteredTasks?.length || 0);
    }
  }, [filteredTasks?.length, onCountChange]);


  return (
    <div className={`task-table ${className}`}>

      {/* Table */}
      <TanStackTable
        data={filteredTasks}
        columns={taskColumns}
        tableType="tasks"
        error={tasksError}
        isLoading={isLoading}
        onSelect={handleSelect}
        onEdit={handleEditTask}
        onDelete={handleDelete}
        enableRowSelection={true}
        showBulkActions={true}
        bulkActions={[
          {
            label: "View Selected",
            icon: "edit",
            variant: "primary",
            onClick: (selectedTasks) => {
              if (selectedTasks.length === 1) {
                handleSelect(selectedTasks[0]);
                showSuccess(`Viewing task: ${selectedTasks[0].data_task?.taskName}`);
              } else {
                showError("Please select only ONE task to view");
              }
            }
          },
          {
            label: "Edit Selected",
            icon: "edit",
            variant: "edit",
            onClick: (selectedTasks) => {
              if (selectedTasks.length === 1) {
                handleEditTask(selectedTasks[0]);
                showSuccess(`Opening edit form for: ${selectedTasks[0].data_task?.taskName}`);
              } else {
                showError("Please select only ONE task to edit");
              }
            }
          },
          {
            label: "Delete Selected",
            icon: "delete",
            variant: "danger",
            onClick: async (selectedTasks) => {
              if (selectedTasks.length === 1) {
                handleDelete(selectedTasks[0]);
              } else {
                showError("Please select only ONE task to delete");
              }
            }
          }
        ]}
        initialColumnVisibility={{
          'isVip': false,        // Hide VIP column by default
          'reworked': true,     // Hide Reworked column by default
          'startDate': true,    // Hide Start Date column by default
          'endDate': false,      // Hide End Date column by default
          'observations': false  // Hide Observations column by default
        }}
      />


      {/* Edit Task Modal */}
      <TaskFormModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        mode="edit"
        task={editingTask}
        monthId={selectedMonthId}
        onSuccess={handleEditTaskSuccess}
        onError={(error) => {
          // Handle permission errors
          if (
            error?.message?.includes("permission") ||
            error?.message?.includes("User lacks required")
          ) {
            showAuthError("You do not have permission to edit tasks");
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${(() => {
          if (itemToDelete?.data_task?.taskName) return itemToDelete.data_task.taskName;
          if (itemToDelete?.data_task?.departments) {
            const departments = itemToDelete.data_task.departments;
            return Array.isArray(departments) ? departments.join(', ') : departments;
          }
          return itemToDelete?.data_task?.taskName || itemToDelete?.id;
        })()}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default TaskTable;
