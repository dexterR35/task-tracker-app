import React from "react";
import { useAppData } from "@/hooks/useAppData";
import { useTaskColumns } from "@/components/Table/tableColumns.jsx";
import TanStackTable from "@/components/Table/TanStackTable";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import TaskForm from "@/features/tasks/components/TaskForm/TaskForm";
import { useTableActions } from "@/hooks/useTableActions";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { showError, showAuthError } from "@/utils/toast";

// Custom Task Edit Modal Component
const TaskEditModal = ({ isOpen, onClose, onSuccess, mode, item: task, ...props }) => {
  if (!isOpen || !task) return null;
  
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg bg-white-dark shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-300">
          <h2 className="text-xl font-semibold text-white-dark">
            Edit Task: {task?.data_task?.taskName || task?.data_task?.departments || 'Unknown Task'}
          </h2>
          <DynamicButton
            onClick={onClose}
            variant="outline"
            size="sm"
            iconName="cancel"
            iconPosition="center"
            className="text-gray-400 hover:text-white border-gray-400 hover:border-white"
          />
        </div>
        <div className="p-6">
          <TaskForm
            mode="edit"
            initialData={task}
            onSuccess={onSuccess}
            {...props}
          />
        </div>
      </div>
    </div>
  );
};

const TaskTable = ({
  className = "",
  tasks = [],
  monthId,
  error: tasksError = null,
  reporters = [], // Reporters data for TaskForm
  user = null, // User data for TaskForm
}) => {
  // Get delete mutation from useAppData
  const { deleteTask } = useAppData();
  
  // Get task columns with monthId and reporters data for reporter name lookup
  const taskColumns = useTaskColumns(monthId, reporters);
  
  // Delete wrapper with error handling for permission issues
  const handleTaskDeleteMutation = async (task) => {
    if (!deleteTask) {
      console.error('deleteTask mutation not available');
      throw new Error('Delete task mutation not available');
    }
    
    try {
      return await deleteTask({ 
        monthId: task.monthId,  // Always use task's own monthId
        taskId: task.id,
        userData: user  // Pass user data for permission validation
      });
    } catch (error) {
      // Show permission error toast if it's a permission issue
      if (error?.message?.includes('permission') || error?.message?.includes('User lacks required')) {
        showAuthError('You do not have permission to delete tasks');
      }
      throw error;
    }
  };


  // Always allow button clicks - permission checking happens at form submission
  const handleEditWithPermission = (task) => {
    handleEdit(task);
  };

  const handleDeleteWithPermission = (task) => {
    handleDelete(task);
  };

  // Use table actions hook
  const {
    showEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    rowActionId,
    handleSelect,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeEditModal,
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions('task', {
    getItemDisplayName: (task) => task?.data_task?.taskName || task?.data_task?.departments || 'Unknown Task',
    deleteMutation: handleTaskDeleteMutation,
  });

  return (
    <div className={className}>
      <TanStackTable
        data={tasks}
        columns={taskColumns}
        tableType="tasks"
        error={tasksError}
        onSelect={handleSelect}
        onEdit={handleEditWithPermission}
        onDelete={handleDeleteWithPermission}
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

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <TaskEditModal
          isOpen={showEditModal}
          onClose={closeEditModal}
          onSuccess={handleEditSuccess}
          mode="edit"
          item={editingItem}
          user={user}
          monthId={monthId}
          reporters={reporters}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${itemToDelete?.data_task?.taskName || itemToDelete?.data_task?.departments || 'Unknown Task'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default TaskTable;