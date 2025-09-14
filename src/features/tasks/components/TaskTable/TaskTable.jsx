import React from "react";
import { useAppData } from "@/hooks/useAppData";
import { useTaskColumns } from "@/components/ui/Table/tableColumns.jsx";
import TanStackTable from "@/components/ui/Table/TanStackTable";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import ReactHookFormWrapper from "@/components/forms/ReactHookFormWrapper";
import { useTableActions } from "@/hooks/useTableActions";

// Custom Task Edit Modal Component
const TaskEditModal = ({ isOpen, onClose, onSuccess, mode, item: task, ...props }) => {
  if (!isOpen || !task) return null;
  
  return (
    <div className="fixed bg-gray-600 inset-0 bg-white-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg bg-white-dark shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-300">
          <h2 className="text-xl font-semibold text-white-dak">
            Edit Task: {task?.jiraLink || task?.departments || 'Unknown Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <ReactHookFormWrapper
            formType="task"
            mode="edit"
            initialValues={task}
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
  isLoading = false,
  error: tasksError = null,
  reporters = [], // Reporters data for TaskForm
  user = null, // User data for TaskForm
}) => {
  // Get delete mutation from useAppData
  const { deleteTask } = useAppData();
  
  // Get task columns with monthId and reporters data for reporter name lookup
  const taskColumns = useTaskColumns(monthId, reporters);
  
  // Simple delete wrapper - always use task's monthId
  const handleTaskDeleteMutation = async (task) => {
    if (!deleteTask) {
      console.error('deleteTask mutation not available');
      throw new Error('Delete task mutation not available');
    }
    
    return await deleteTask({ 
      monthId: task.monthId,  // Always use task's own monthId
      taskId: task.id 
    });
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
    getItemDisplayName: (task) => task?.jiraLink || task?.departments || 'Unknown Task',
    deleteMutation: handleTaskDeleteMutation,
  });

  return (
    <div className={className}>
      <TanStackTable
        data={tasks}
        columns={taskColumns}
        tableType="tasks"
        isLoading={isLoading}
        error={tasksError}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
        message={`Are you sure you want to delete task "${itemToDelete?.jiraLink || itemToDelete?.departments || 'Unknown Task'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default TaskTable;