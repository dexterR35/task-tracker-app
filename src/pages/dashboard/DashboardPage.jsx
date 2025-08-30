import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { useUnifiedLoading } from "../../shared/hooks/useUnifiedLoading";
import { useCacheManagement } from "../../shared/hooks/useCacheManagement";
import Loader from "../../shared/components/ui/Loader";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import OptimizedTaskMetricsBoard from "../../shared/components/dashboard/DashboardMetrics";
import DashboardTaskTable from "../../shared/components/dashboard/DashboardTaskTable";
import TaskForm from "../../shared/task/TaskForm";
import { format } from "date-fns";
import { logger } from "../../shared/utils/logger";
import { showInfo, showError, showSuccess } from "../../shared/utils/toast";

const DashboardPage = () => {
  const { user, canAccess } = useAuth();
  
  // Determine if user is admin based on permissions
  const isUserAdmin = canAccess('admin');
  const [searchParams, setSearchParams] = useSearchParams();
  const { clearCacheOnDataChange } = useCacheManagement();

  // Local state for UI controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);


  // Get selected user from URL params (admin only)
  const selectedUserId = searchParams.get("user") || "";
  
  // Derive userId based on context: URL param > current user
  const userId = isUserAdmin ? selectedUserId : user?.uid;

  // Use unified loading hook for data loading (auth is handled by router)
  const {
    isLoading,
    message: loadingMessage,
    progress,
    monthId,
    monthName,
    startDate,
    endDate,
    daysInMonth,
    boardExists,
    isGenerating,
    generateBoard,
    isNewMonth,
    dashboardData
  } = useUnifiedLoading(userId, !!user); // Pass authentication state



  // Show notification when new month is detected - ALWAYS call useEffect
  useEffect(() => {
    if (isNewMonth && monthName) {
      showInfo(`New month detected: ${monthName}. Board status will be updated automatically.`);
    }
  }, [isNewMonth, monthName]);

  // Show unified loading state for data loading
  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text={loadingMessage || "Loading. shit.."} 
        fullScreen={true}
      />
    );
  }

  // Don't render anything if not authenticated (router should handle this, but safety check)
  if (!user) {
    return null;
  }

  // Show error state
  if (dashboardData?.error) {
    return (
      <div className="card mt-10">
        <div className="text-center py-8">
          <h2>Error Loading Dashboard</h2>
          <p className="text-sm">
            {dashboardData.error?.message ||
              "Failed to load dashboard data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  // Handle user selection (admin only)
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Handle generate month board (admin only)
  const handleGenerateBoard = async () => {
    if (!canAccess('admin')) {
      showError("You need admin permissions to generate month boards.");
      return;
    }

    if (!monthId) {
      showError("Current month not available. Please refresh the page.");
      return;
    }

    try {
      const result = await generateBoard({
        monthId,
        meta: {
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email,
          monthName: monthName || format(new Date(monthId + "-01"), "MMMM yyyy"),
        },
      });

      clearCacheOnDataChange('tasks', 'create');

      showSuccess(
        `Board for ${monthName || format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`
      );
    } catch (error) {
      logger.error("[DashboardPage] Error generating month board:", error);
      showError(
        `Failed to create board: ${error?.data?.message || error?.message || "Unknown error"}`
      );
    }
  };

  // Handle create task
  const handleCreateTask = async () => {
    if (!boardExists) {
      showError(
        `Cannot create task: Board for ${monthName || 'current month'} is not created yet. Please create the board first.`
      );
      return;
    }
    setShowCreateModal(true);
  };

  // Handle form success
  const handleFormSuccess = (result) => {
    console.log('Task created successfully:', result);
    setShowCreateModal(false); // Hide modal after successful creation
    clearCacheOnDataChange('tasks', 'create');
    showSuccess("Task created successfully! The task list will update automatically.");
  };

  // Handle form error
  const handleFormError = (error) => {
    console.error('Task creation failed:', error);
    showError("Failed to create task. Please try again.");
  };

  // Derive title based on context
  const title = isUserAdmin && selectedUserId 
    ? `Viewing ${dashboardData?.users?.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}'s Board`
    : `${user?.name || user?.email}'s - Board`;

  // Derive showCreateBoard - only for admins when board doesn't exist
  const showCreateBoard = isUserAdmin && !boardExists;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Dashboard Header */}
      <div className="mt-2 py-2 flex-center flex-col !items-start">
        <h2 className="capitalize mb-0">{title}</h2>
        <p className="text-xs font-base soft-white">
          <span>Month:</span> {monthName || 'Loading...'} ({monthId})
          {boardExists ? (
            <span className="ml-2 text-green-success"> • Board ready</span>
          ) : (
            <span className="ml-2 text-red-error"> • Board not ready</span>
          )}
        </p>
        {/* Additional month info */}
        {startDate && endDate && daysInMonth && (
          <p className="text-xs text-gray-400 mt-1">
            Period: {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')} ({daysInMonth} days)
          </p>
        )}
      </div>

      {/* Board Status Warning if not created */}
      {!boardExists && showCreateBoard && (
        <div className="card mt-2 border border-red-error text-red-error text-sm rounded-lg">
          <div className="flex-center !flex-row !items-center !justify-between gap-4">
            <p className="text-white-dark text-sm">
              ❌ The board for {monthName || 'current month'}{" "}
              is not created yet. Please create the board first.
            </p>
            <DynamicButton
              variant="danger"
              onClick={handleGenerateBoard}
              loading={isGenerating}
              size="sm"
              iconName="generate"
              iconPosition="left"
            >
              {isGenerating ? "Creating..." : "Create Board"}
            </DynamicButton>
          </div>
        </div>
      )}

      {/* User Filter (Admin Only) */}
      {isUserAdmin && (
        <div className="mt-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-300">
              View User:
            </label>
            <select
              value={selectedUserId}
              onChange={handleUserSelect}
              className="border border-gray-600 rounded px-3 py-2 bg-gray-800 text-white"
            >
              <option value="">All Users</option>
              {dashboardData?.users?.map((user) => (
                <option key={user.userUID || user.id} value={user.userUID || user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
            {/* {isUserChanging && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-400">Loading user data...</span>
              </div>
            )} */}
          </div>
        </div>
      )}

      {/* Create Task Button - Only show when board exists */}
      {boardExists && (
        <div className="mb-6">
          <DynamicButton
            variant="primary"
            onClick={handleCreateTask}
            size="sm"
            iconName="generate"
            iconPosition="left"
          >
            Create Task
          </DynamicButton>
        </div>
      )}

      {/* Main Dashboard Content - Only show when board exists */}
      {boardExists && (
        <div className="space-y-8">
          {/* Metrics Board */}
          <OptimizedTaskMetricsBoard 
            userId={userId} 
            showSmallCards={true}
          />
          
          {/* Tasks Table - Integrated into dashboard with toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-2">
              <h3 className="text-lg font-semibold text-white">
                {isUserAdmin && selectedUserId 
                  ? `Tasks for ${dashboardData?.users?.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}`
                  : isUserAdmin 
                  ? "All Tasks" 
                  : "My Tasks"
                }
              </h3>
              <DynamicButton
                variant="outline"
                onClick={() => setShowTable(!showTable)}
                size="sm"
                iconName={showTable ? "hide" : "show"}
                iconPosition="left"
              >
                {showTable ? "Hide Table" : "Show Table"}
              </DynamicButton>
            </div>
            
            {showTable && (
              <DashboardTaskTable
                userId={userId}
                hideCreateButton={true} // Hide the create button since it's now in the main page
              />
            )}
          </div>
        </div>
      )}

      {/* Board not ready message - shows for non-admin users when board doesn't exist */}
      {!boardExists && !isUserAdmin && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Board not ready for {monthName || 'current month'}
            . Please contact an admin to create the board.
          </p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Task
              </h2>
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                iconName="close"
                iconPosition="center"
              />
            </div>
            <div className="p-6">
              <TaskForm
                mode="create"
                onSubmit={handleFormSuccess}
                onError={handleFormError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
