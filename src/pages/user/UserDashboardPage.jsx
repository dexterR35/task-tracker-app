import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import { 
  selectCurrentMonthId, 
  selectCurrentMonthName, 
  selectBoardExists
} from "@/features/currentMonth";
import { showSuccess, showError } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import { DynamicButton, Loader, Modal } from "@/components/ui";
import { TaskForm } from "@/features/tasks";
import { useUserData } from "@/hooks";
import { tasksApi } from "@/features/tasks";

// User Dashboard - Shows user's own data with task creation
const UserDashboardPage = () => {
  // Get month data
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  
  // Use custom hook for user data fetching
  const { user, reporters, tasks, isLoading, error } = useUserData();
  
  // Use the currentMonth state as the source of truth
  const boardExists = useSelector(selectBoardExists);
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  const dispatch = useDispatch();
  
  // Use the current user's ID for this dashboard
  const userId = user?.uid || user?.id;

  // Handle create task
  const handleCreateTask = async (taskData) => {
    try {
      const result = await dispatch(tasksApi.endpoints.createTask.initiate({
        ...taskData,
        userId: userId,
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

  // For regular users, tasks are already filtered by the API call in AppLayout
  const userTasks = tasks;

  // Title for user dashboard
  const title = "My Dashboard";

  if (isLoading) {
    return <Loader size="xl" text="Loading user dashboard..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-red-400">
        Error loading dashboard: {error.message || "Unknown error"}
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
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              {user.email} • {user.role}
            </p>
          )}
        </div>
        
        {/* User Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
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

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">My Tasks</h3>
          <p className="text-2xl font-bold">{userTasks.length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Completed</h3>
          <p className="text-2xl font-bold">
            {userTasks.filter(task => task.status === 'completed').length}
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">In Progress</h3>
          <p className="text-2xl font-bold">
            {userTasks.filter(task => task.status === 'in-progress').length}
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


      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
          reporters={reporters}
          monthId={monthId}
          userId={userId}
          isAdminView={false}
        />
      </Modal>
    </div>
  );
};

export default UserDashboardPage;
