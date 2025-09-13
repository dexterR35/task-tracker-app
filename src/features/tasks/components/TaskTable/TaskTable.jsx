import React from "react";
import { useDeleteTaskMutation } from "@/features/tasks/tasksApi";
import { useTaskColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showSuccess } from "@/utils/toast.js";
import GenericTableContainer from "@/components/ui/Table/GenericTableContainer";
import ReactHookFormWrapper from "@/components/forms/ReactHookFormWrapper";

// Custom Task Edit Modal Component
const TaskEditModal = ({ isOpen, onClose, onSuccess, mode, item: task, ...props }) => {
  if (!isOpen || !task) return null;
  
  return (
    <div className="fixed bg-gray-600 inset-0 bg-white-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg bg-white-dark shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
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
  // API hooks for task CRUD
  const [deleteTask] = useDeleteTaskMutation();
  
  // Get task columns with monthId and reporters data for reporter name lookup
  const taskColumns = useTaskColumns(monthId, reporters);
  
  // Handle task selection
  const handleTaskSelect = (task) => {
    showSuccess(`Selected task: ${task.jiraLink || task.departments}`);
  };

  // Custom delete mutation wrapper for tasks
  const handleTaskDelete = async (deleteData) => {
    const { id: taskId, monthId: taskMonthId, boardId, userData } = deleteData;
    
    return await deleteTask({ 
      monthId: taskMonthId || monthId, 
      boardId: boardId,
      taskId: taskId,
      userData: userData || user
    });
  };

  return (
    <GenericTableContainer
      className={className}
      data={tasks}
      columns={taskColumns}
      tableType="tasks"
      isLoading={isLoading}
      error={tasksError}
      onSelect={handleTaskSelect}
      EditModal={TaskEditModal}
      editModalProps={{
        user,
        monthId,
        reporters
      }}
      deleteMutation={handleTaskDelete}
      deleteItemName="task"
      getItemDisplayName={(task) => task?.jiraLink || task?.departments || 'Unknown Task'}
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
  );
};

export default TaskTable;