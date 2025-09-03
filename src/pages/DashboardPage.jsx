import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import { useFetchData } from "@/hooks/useFetchData.js";
import { 
  selectCurrentMonthId, 
  selectCurrentMonthName, 
  selectBoardExists,
  selectCurrentMonthDaysInMonth,
  selectCurrentMonthGenerating,
  selectCurrentMonthStartDate,
  selectCurrentMonthEndDate,
  generateMonthBoard,
  initializeCurrentMonth
} from "@/features/currentMonth";
import { useCurrentMonth } from "@/features/currentMonth"; // For month change detection only
import { useCacheManagement } from "@/hooks/useCacheManagement.js";
import { showSuccess, showError, showInfo } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";
import OptimizedTaskMetricsBoard from "@/components/dashboard/CardsMetrics";
import { TaskTable, TaskForm } from "@/features/tasks";

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const hasInitializedMonth = useRef(false);

  const dispatch = useDispatch();
  
  // Get user data and permissions
  const { user, canAccess, users, isLoading, error } = useFetchData();
  
  // Get month data from Redux store (for data access)
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  const daysInMonth = useSelector(selectCurrentMonthDaysInMonth);
  const boardExists = useSelector(selectBoardExists);
  const isGenerating = useSelector(selectCurrentMonthGenerating);
  const startDate = useSelector(selectCurrentMonthStartDate);
  const endDate = useSelector(selectCurrentMonthEndDate);
  
  // Use useCurrentMonth ONLY for month change detection (not for data access)
  const { monthId: hookMonthId } = useCurrentMonth();
  
  const { clearCacheOnDataChange } = useCacheManagement();

  const isUserAdmin = canAccess('admin');

  // Get selected user from URL params (admin only)
  const selectedUserId = searchParams.get("user") || "";
  
  // Derive userId based on context: URL param > current user
  const userId = isUserAdmin ? selectedUserId : user?.uid;

  // Initialize current month when component mounts and user is authenticated (only once)
  useEffect(() => {
    if (user && !monthId && !hasInitializedMonth.current) {
      hasInitializedMonth.current = true;
      logger.log('[DashboardPage] Initializing current month');
      dispatch(initializeCurrentMonth());
    }
  }, [user, monthId, dispatch]);

  // Monitor month changes from useCurrentMonth hook
  useEffect(() => {
    if (hookMonthId && monthId && hookMonthId !== monthId) {
      logger.log(`[DashboardPage] Month changed from ${monthId} to ${hookMonthId}, reinitializing`);
      hasInitializedMonth.current = false; // Reset flag to allow reinitialization
      dispatch(initializeCurrentMonth());
    }
  }, [hookMonthId, monthId, dispatch]);

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
      const result = await dispatch(generateMonthBoard({
        monthId,
        meta: {
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email,
          monthName: monthName || format(new Date(monthId + "-01"), "MMMM yyyy"),
        },
      })).unwrap();

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

  // Derive title based on context
  const title = isUserAdmin && selectedUserId 
    ? `Viewing ${users?.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}'s Board`
    : `${user?.name || user?.email}'s - Board`;

  // Derive showCreateBoard - only for admins when board doesn't exist
  const showCreateBoard = isUserAdmin && !boardExists;

  // Show loading state
  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Loading dashboard..." 
        fullScreen={true}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-400">
            {error?.message ||
              "Failed to load dashboard data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

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
            <label htmlFor="user-filter" className="text-sm font-medium text-gray-300">
              View User:
            </label>
            <select
              name="user-filter"
              id="user-filter"
              value={selectedUserId}
              onChange={handleUserSelect}
              className="border border-gray-600 rounded px-3 py-2 bg-gray-800 text-white"
            >
              <option value="">All Users</option>
              {users?.map((user) => (
                <option key={user.userUID || user.id} value={user.userUID || user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
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
                  ? `Tasks for ${users?.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}`
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
              <TaskTable
                userId={userId}
                hideCreateButton={true}
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white-dark text-white-dark rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold ">
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
