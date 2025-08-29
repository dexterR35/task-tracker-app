import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCentralizedDataAnalytics } from "../../hooks/analytics/useCentralizedDataAnalytics";
import { useAuth } from "../../hooks/useAuth";
import { useGlobalMonthId } from "../../hooks/useGlobalMonthId";
import DynamicButton from "../ui/DynamicButton";
import { format } from "date-fns";


// Import components directly since data is already loaded
import OptimizedTaskMetricsBoard from "./DashboardMetrics";

const DashboardWrapper = ({
  className = "",
  onGenerateBoard = null,
  isGeneratingBoard = false,
  // New props for target user context
  targetUserId = null,
  targetUserOccupation = null,
}) => {
  const { user, canAccess } = useAuth();
  const isAdmin = canAccess('admin');
  const { monthId } = useGlobalMonthId();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get selected user from URL params (admin only) or target user
  const selectedUserId = searchParams.get("user") || "";
  
  // Derive userId based on context: target user > URL param > current user
  const userId = targetUserId || (isAdmin ? selectedUserId : user?.uid);

  // Use centralized data system - gets all data in one call
  const {
    tasks,
    users: usersList,
    monthBoard: board,
    isLoading,
    isFetching,
    error: tasksError,
    hasData,
    boardExists
  } = useCentralizedDataAnalytics(monthId, userId);

  // Show loading state if data is being fetched or loaded
  const showLoading = isLoading || isFetching;

  // Derive title based on context
  const title = targetUserId 
    ? `${usersList.find(u => (u.userUID || u.id) === targetUserId)?.name || targetUserId}'s Board`
    : isAdmin && selectedUserId 
    ? `Viewing ${usersList.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}'s Board`
    : `${user?.name || user?.email}'s - Board`;

  // Derive showCreateBoard
  const showCreateBoard = isAdmin && !boardExists;

  // Handle user selection (admin only) - navigate to user profile page
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      // Navigate to user profile page instead of staying on admin dashboard
      navigate(`/admin/users/${userId}`);
    }
  };

  // Don't render anything if not authenticated or still loading
  if (!user) {
    return null;
  }

  // Show loading state
  if (showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (tasksError) {
    return (
      <div className="card mt-10">
        <div className="text-center py-8">
          <h2>Error Loading Dashboard</h2>
          <p className="text-sm">
            {tasksError?.message ||
              "Failed to load dashboard data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Dashboard Header */}
      <div className="mt-2 py-2 flex-center flex-col !items-start">
        <h2 className="capitalize mb-0">{title}</h2>
        <p className="text-xs font-base soft-white">
          <span>Month:</span> {format(new Date(monthId + "-01"), "MMMM")} (
          {monthId})
          {boardExists ? (
            <span className="ml-2 text-green-success"> • Board ready </span>
          ) : (
            <span className="ml-2 text-red-error"> • Board not ready </span>
          )}
        </p>
      </div>

      {/* Board Status Warning if not created */}
      {!boardExists && showCreateBoard && (
        <div className="card mt-2 border border-red-error text-red-error text-sm rounded-lg">
          <div className="flex-center !flex-row !items-center !justify-between gap-4">
            <p className="text-white-dark text-sm">
              ❌ The board for {format(new Date(monthId + "-01"), "MMMM yyyy")}{" "}
              is not created yet. Please create the board first.
            </p>
            {onGenerateBoard && (
              <DynamicButton
                variant="danger"
                onClick={onGenerateBoard}
                loading={isGeneratingBoard}
                size="sm"
                iconName="generate"
                iconPosition="left"
              >
                {isGeneratingBoard ? "Creating..." : "Create Board"}
              </DynamicButton>
            )}
          </div>
        </div>
      )}

      {/* User Filter (Admin Only) */}
      {isAdmin && (
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
              {usersList.map((user) => (
                <option key={user.userUID || user.id} value={user.userUID || user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
        {/* Navigate to Tasks Page */}
        <DynamicButton
          variant="primary"
          onClick={() => navigate(isAdmin ? '/admin/tasks' : '/user/tasks')}
          size="md"
          iconName="list"
          iconPosition="left"
          className="min-w-30"
        >
          View Tasks
        </DynamicButton>
      </div>

      {/* Main Dashboard Content - Only show when board exists */}
      {boardExists && (
        <div>
          <OptimizedTaskMetricsBoard 
            userId={userId} 
            showSmallCards={true}
            userOccupation={targetUserOccupation}
          />
        </div>
      )}

      {/* Board not ready message - shows for non-admin users when board doesn't exist */}
      {!boardExists && !isAdmin && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Board not ready for {format(new Date(monthId + "-01"), "MMMM yyyy")}
            . Please contact an admin to create the board.
          </p>
          {/* Debug info */}
          <p className="text-xs text-gray-500 mt-2">
            Debug: boardExists = {String(boardExists)}, isAdmin = {String(isAdmin)}
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardWrapper;
