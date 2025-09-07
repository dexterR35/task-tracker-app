import React, { useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { 
  selectCurrentMonthId, 
  selectCurrentMonthName, 
  selectBoardExists
} from "@/features/currentMonth";
import { showSuccess } from "@/utils/toast.js";
import { DynamicButton, Loader, Modal } from "@/components/ui";
import { TaskForm, TaskTable } from "@/features/tasks";
import { useUserData } from "@/hooks";
import { logger } from "@/utils/logger";

// User Dashboard - Shows user's own data with task creation
const UserDashboardPage = () => {
  // Get month data
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  
  // Use custom hook for user data fetching (includes reporters API call)
  const { user, tasks, isLoading, error } = useUserData();
  
  // Debug logging
  const userUID = user?.userUID || user?.uid || user?.id;
  logger.log('UserDashboard Debug:', {
    user,
    userUID,
    tasks,
    tasksLength: tasks?.length,
    monthId,
    isLoading,
    error
  });
  
  // Use the currentMonth state as the source of truth
  const boardExists = useSelector(selectBoardExists);
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  // For regular users, tasks are already filtered by the API call in useUserData
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

      {/* User Tasks Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Tasks</h2>
        <TaskTable 
          tasks={userTasks}
          monthId={monthId}
          isLoading={isLoading}
          error={error}
          reporters={reporters}
        />
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
          reporters={reporters}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default UserDashboardPage;
