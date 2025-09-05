import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { useAuth } from "@/features/auth";
import { 
  selectCurrentMonthId, 
  selectCurrentMonthName, 
  selectBoardExists
} from "@/features/currentMonth";
import { showSuccess } from "@/utils/toast.js";
import { DynamicButton, Loader, Modal } from "@/components/ui";
import { TaskTable, TaskForm } from "@/features/tasks";
import { useAdminData } from "@/hooks";

// Admin Tasks Page - Shows all tasks with creation form and table
const AdminTasksPage = () => {
  // Get auth data
  const { user, canAccess } = useAuth();
  
  // Get month data
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  
  // Use custom hook for admin data fetching
  const { users, reporters, tasks, isLoading, error } = useAdminData();
  
  // Use the currentMonth state as the source of truth
  const boardExists = useSelector(selectBoardExists);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);
  
  // Get auth data
  const isUserAdmin = canAccess('admin');
  
  // Get selected user from URL params (admin only)
  const selectedUserId = searchParams.get("user") || "";
  
  // Derive userId based on context: URL param > current user
  const userId = isUserAdmin ? selectedUserId : user?.uid;

  // Handle user selection (admin only)
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Handle create task
  const handleCreateTask = async (taskData) => {
    try {
      const result = await dispatch(tasksApi.endpoints.createTask.initiate({
        ...taskData,
        userId: userId || user?.uid,
        monthId: monthId
      }));

      if (result.data) {
        showSuccess("Task created successfully!");
        setShowCreateModal(false);
        logger.info("Task created", { taskData, result: result.data });
      } else {
        showError("Failed to create task. Please try again.");
        logger.error("Task creation failed", { taskData, error: result.error });
      }
    } catch (error) {
      showError("An error occurred while creating the task.");
      logger.error("Task creation error", { taskData, error });
    }
  };

  // Filter tasks based on selected user (admin only)
  const filteredTasks = isUserAdmin && selectedUserId 
    ? tasks.filter(task => task.userId === selectedUserId)
    : tasks;

  // Derive title based on context
  const title = (() => {
    if (isUserAdmin && selectedUserId) {
      const selectedUser = users.find(u => (u.userUID || u.id) === selectedUserId);
      return `All Tasks - ${selectedUser?.name || selectedUser?.email || 'Unknown User'}`;
    }
    return "All Tasks - All Users";
  })();

  if (isLoading) {
    return <Loader size="xl" text="Loading tasks..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-red-400">
        Error loading tasks: {error.message || "Unknown error"}
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-red-400">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">
            {monthName ? `${monthName} - ${format(new Date(), 'yyyy')}` : 'Current Month'}
          </p>
        </div>
        
        {/* Admin Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          {/* User Selection (Admin Only) */}
          {isUserAdmin && (
            <select
              value={selectedUserId}
              onChange={handleUserSelect}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.userUID || user.id} value={user.userUID || user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          )}
          
          {/* Create Task Button */}
          <DynamicButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!boardExists}
          >
            Create Task
          </DynamicButton>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Tasks</h3>
          <p className="text-2xl font-bold">{filteredTasks.length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Completed</h3>
          <p className="text-2xl font-bold">
            {filteredTasks.filter(task => task.status === 'completed').length}
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">In Progress</h3>
          <p className="text-2xl font-bold">
            {filteredTasks.filter(task => task.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Pending</h3>
          <p className="text-2xl font-bold">
            {filteredTasks.filter(task => task.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Board Warning */}
      {!boardExists && (
        <div className="bg-yellow-600 text-white p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">⚠️ Month Board Not Available</h3>
          <p>
            The month board for {monthName} has not been generated yet. 
            Task creation is disabled until the board is available.
          </p>
        </div>
      )}

      {/* Tasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {isUserAdmin && selectedUserId ? "User Tasks" : "All Tasks"}
          </h2>
          <DynamicButton
            onClick={() => setShowTable(!showTable)}
            variant="outline"
            size="sm"
          >
            {showTable ? "Hide Table" : "Show Table"}
          </DynamicButton>
        </div>

        {showTable && (
          <TaskTable
            tasks={filteredTasks}
            users={users}
            reporters={reporters}
            monthId={monthId}
            isAdminView={isUserAdmin}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        maxWidth="max-w-4xl"
      >
        <TaskForm
          mode="create"
          onSuccess={() => {
            showSuccess("Task created successfully!");
            setShowCreateModal(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default AdminTasksPage;
