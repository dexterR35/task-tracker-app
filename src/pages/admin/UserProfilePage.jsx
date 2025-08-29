import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCentralizedDataAnalytics } from "../../shared/hooks/analytics/useCentralizedDataAnalytics";
import { useGlobalMonthId } from "../../shared/hooks/useGlobalMonthId";
import { useAuth } from "../../shared/hooks/useAuth";
import { format } from "date-fns";
import Loader from "../../shared/components/ui/Loader";
import { Icons } from "../../shared/icons";
import OptimizedTaskMetricsBoard from "../../features/tasks/components/OptimizedTaskMetricsBoard";
import TasksTable from "../../features/tasks/components/TasksTable";

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, canAccess } = useAuth();
  const { monthId } = useGlobalMonthId();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const navigate = useNavigate();

  // Use centralized data system to get data filtered for the specific user
  const { 
    users: usersList, 
    tasks: userTasks, 
    analytics: userAnalytics,
    isLoading, 
    isFetching 
  } = useCentralizedDataAnalytics(monthId, userId);

  // Find the specific user
  const targetUser = usersList.find(u => (u.userUID || u.id) === userId);

  // Check if current user has permission to view this user's data
  const canViewUser = canAccess('admin') || currentUser?.uid === userId;

  // Show loading state if data is being fetched or loaded
  const showLoading = isLoading || isFetching;

  // Don't render if not authenticated or no permission
  if (!currentUser || !canViewUser) {
    return (
      <div className="min-h-screen flex-center">
        <div className="card p-8 text-center max-w-md mx-4">
          <h2 className="text-red-error mb-4">Access Denied</h2>
          <p className="mb-6">
            You don't have permission to view this user's profile.
          </p>
          <Link to="/admin/users" className="btn-primary">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  if (showLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Loading user profile..." 
        fullScreen={true}
      />
    );
  }

  // User not found
  if (!targetUser) {
    return (
      <div className="min-h-screen flex-center">
        <div className="card p-8 text-center max-w-md mx-4">
          <h2 className="text-red-error mb-4">User Not Found</h2>
          <p className="mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/admin/users" className="btn-primary">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* User Profile Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Link 
            to="/admin/users" 
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Icons.buttons.back className="w-5 h-5 mr-2" />
            Back to Users
          </Link>
          <div className="h-8 w-px bg-gray-600"></div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {targetUser.name || targetUser.email}'s Dashboard
            </h1>
            <p className="text-sm text-gray-400">
              Viewing {targetUser.occupation || targetUser.role || 'user'} tasks and analytics for {monthId ? format(new Date(monthId + "-01"), "MMMM yyyy") : 'current month'}
            </p>
          </div>
        </div>
      </div>

      {/* User Information Card */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Name:</p>
            <p className="text-white">{targetUser.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400">Email:</p>
            <p className="text-white">{targetUser.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400">Role:</p>
            <p className="text-white">{targetUser.role || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400">Occupation:</p>
            <p className="text-white">{targetUser.occupation || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {targetUser.name || targetUser.email}'s Metrics
        </h2>
        <OptimizedTaskMetricsBoard 
          userId={userId}
          userOccupation={targetUser.occupation}
        />
      </div>

      {/* User Tasks Table */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {targetUser.name || targetUser.email}'s Tasks
        </h2>
        <TasksTable 
          tasks={userTasks}
          onSelect={(task) => {
            // Handle task selection - navigate to task detail with task data
            const taskId = task.id;
            const taskMonthId = task.monthId || monthId;
            navigate(`/admin/tasks/${taskMonthId}/${taskId}`, {
              state: { taskData: task }
            });
          }}
        />
      </div>
    </div>
  );
};

export default UserProfilePage;
