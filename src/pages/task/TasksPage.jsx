import React, { useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useCentralizedDataAnalytics } from "../../shared/hooks/analytics/useCentralizedDataAnalytics";
import { useAuth } from "../../shared/hooks/useAuth";
import { useGlobalMonthId } from "../../shared/hooks/useGlobalMonthId";
import { format } from "date-fns";
import { Icons } from "../../shared/icons";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import TasksTable from "../../shared/task/TasksTable";
import TaskForm from "../../shared/task/TaskForm";
import TaskDetailPage from "../../pages/task/TaskDetailPage";
import { showError, showSuccess } from "../../shared/utils/toast";

const TasksPage = () => {
  const { user, canAccess } = useAuth();
  const isAdmin = canAccess('admin');
  const { monthId: currentMonthId } = useGlobalMonthId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const navigate = useNavigate();
  const params = useParams();

  // Check if we're viewing a specific task (detail view)
  const isDetailView = params.taskId && params.monthId;
  
  // Determine which user's tasks to show
  const targetUserId = isAdmin ? null : user?.uid;
  
  // Use centralized data system - gets data based on role and current month
  const {
    tasks,
    monthBoard: board,
    isLoading,
    isFetching,
    error: tasksError,
    hasData,
    boardExists
  } = useCentralizedDataAnalytics(currentMonthId, targetUserId);

  // Show loading state if data is being fetched or loaded
  const showLoading = isLoading || isFetching;

  // Don't render if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex-center">
        <div className="card p-8 text-center max-w-md mx-4">
          <h2 className="text-red-error mb-4">Access Denied</h2>
          <p className="mb-6">
            You need to be logged in to access this page.
          </p>
          <DynamicButton onClick={() => navigate('/login')} variant="primary">
            Login
          </DynamicButton>
        </div>
      </div>
    );
  }

  // Show loading state
  if (showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (tasksError) {
    return (
      <div className="card mt-10">
        <div className="text-center py-8">
          <h2>Error Loading Tasks</h2>
          <p className="text-sm">
            {tasksError?.message ||
              "Failed to load tasks data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  // If we're in detail view, show the task detail
  if (isDetailView) {
    return <TaskDetailPage />;
  }

  // Handle create task
  const handleCreateTask = async () => {
    if (!boardExists) {
      showError(
        `Cannot create task: Board for ${format(new Date(currentMonthId + "-01"), "MMMM yyyy")} is not created yet. Please create the board first.`
      );
      return;
    }
    setShowTaskForm(!showTaskForm);
  };

  // Handle form success
  const handleFormSuccess = (result) => {
    console.log('Task created successfully:', result);
    setShowTaskForm(false); // Hide form after successful creation
    showSuccess("Task created successfully! The task list will update automatically.");
  };

  // Handle form error
  const handleFormError = (error) => {
    console.error('Task creation failed:', error);
    showError("Failed to create task. Please try again.");
  };

  // Derive title and navigation based on role
  const title = isAdmin ? "All Tasks" : "My Tasks";

  const dashboardPath = isAdmin ? '/admin' : '/user';

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <DynamicButton 
            onClick={() => navigate(dashboardPath)}
            variant="outline"
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Icons.buttons.back className="w-5 h-5 mr-2" />
            Back to Dashboard
          </DynamicButton>
          <div className="h-8 w-px bg-gray-600"></div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-400">
              {format(new Date(currentMonthId + "-01"), "MMMM yyyy")} • {tasks.length} tasks
              {boardExists ? (
                <span className="ml-2 text-green-success"> • Board ready</span>
              ) : (
                <span className="ml-2 text-red-error"> • Board not ready</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Board Status Warning if not created */}
      {!boardExists && (
        <div className="card mt-2 border border-red-error text-red-error text-sm rounded-lg mb-6">
          <div className="flex-center !flex-row !items-center !justify-between gap-4">
            <p className="text-white-dark text-sm">
              ❌ The board for {format(new Date(currentMonthId + "-01"), "MMMM yyyy")}{" "}
              is not created yet. {isAdmin ? 'Please create the board first.' : 'Please contact an admin to create the board first.'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {boardExists && (
        <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
          <DynamicButton
            variant="primary"
            onClick={handleCreateTask}
            size="md"
            iconName="generate"
            iconPosition="left"
            className="min-w-30"
          >
            {showTaskForm ? "Hide Task Form" : "Create Task"}
          </DynamicButton>
        </div>
      )}

      {/* Task Form */}
      {showTaskForm && boardExists && (
        <div className="mb-6">
          <TaskForm
            onSubmit={handleFormSuccess}
            onError={handleFormError}
          />
        </div>
      )}

      {/* Tasks Table */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {isAdmin ? "All Tasks" : "My Tasks"}
        </h2>
        {tasks.length > 0 ? (
          <TasksTable tasks={tasks} error={null} />
        ) : (
          <div className="border rounded-lg p-6 text-center text-sm text-gray-200">
            {isAdmin 
              ? `No tasks found for ${format(new Date(currentMonthId + "-01"), "MMMM yyyy")}.`
              : `No tasks found for ${format(new Date(currentMonthId + "-01"), "MMMM yyyy")}. Create your first task!`
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
