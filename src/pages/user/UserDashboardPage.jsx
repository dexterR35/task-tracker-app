import React, { useState } from "react";
import { format } from "date-fns";
import { useAppDataContext } from "@/components/layout/AuthLayout";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";
import Modal from "@/components/ui/Modal/Modal";
import ReactHookFormWrapper from "@/components/forms/ReactHookFormWrapper";
import TaskTable from "@/features/tasks/components/TaskTable/TaskTable";
import { logger } from "@/utils/logger";
import { getUserUID } from "@/utils/authUtils";
import { createDebugLogger } from "@/utils/debugUtils";

// User Dashboard - Shows user's own data with task creation
const UserDashboardPage = () => {
  const debug = createDebugLogger('UserDashboard');
  
  // Get all data from context (pre-fetched data, no API calls!)
  const { 
    monthId, 
    monthName, 
    boardExists, 
    user, 
    tasks, 
    reporters, 
    error 
  } = useAppDataContext();
  
  // Debug logging
  const userUID = getUserUID(user);
  debug('Component State', {
    user,
    userUID,
    tasks,
    tasksLength: tasks?.length,
    monthId,
    isLoading,
    error
  });
  
  // boardExists is now provided by Redux selector
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  // For regular users, tasks are already filtered by the API call in useAppData
  const userTasks = tasks;

  // Title for user dashboard
  const title = "My Dashboard";


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

      {/* Board warning is now handled globally by AuthLayout */}



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
        <ReactHookFormWrapper
          formType="task"
          mode="create"
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default UserDashboardPage;
