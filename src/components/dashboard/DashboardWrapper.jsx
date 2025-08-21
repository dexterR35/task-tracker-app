import { useMemo, useState, useSearchParams, useEffect, useRef } from "../../hooks/useImports";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useNotificationCleanup } from "../../hooks/useNotificationCleanup";
import {
  useSubscribeToMonthTasksQuery,
  useGetMonthBoardExistsQuery,
} from "../../redux/services/tasksApi";
import TaskForm from "../task/TaskForm";
import TasksTable from "../task/TasksTable";
import AnalyticsSummary from "../AnalyticsSummary";
import DynamicButton from "../button/DynamicButton";
import MonthSelector from "../ui/MonthSelector";
import { format } from "date-fns";
import { computeAnalyticsFromTasks } from '../../utils/analyticsUtils';

const DashboardWrapper = ({
  title = "Dashboard",
  showUserFilter = false,
  usersList = [],
  usersLoading = false,
  onUserSelect,
  impersonatedUserId = null,
  isAdmin = false,
  onGenerateAnalytics,
  onGenerateBoard,
  generatingBoard = false,
}) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  
  // Always use current month and auto-detect month changes
  useEffect(() => {
    const currentMonth = format(new Date(), "yyyy-MM");
    if (selectedMonth !== currentMonth) {
      console.log('Month changed from', selectedMonth, 'to', currentMonth);
      setSelectedMonth(currentMonth);
      
      // Update URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("monthId", currentMonth);
      setSearchParams(newSearchParams);
    }
  }, [selectedMonth, searchParams, setSearchParams]);
  
  const monthId = selectedMonth;
  
  // Check if board exists first
  const { data: board = { exists: false }, isLoading: boardLoading } = useGetMonthBoardExistsQuery({
    monthId,
  });
  
  // Only subscribe to tasks if board exists and board query is not loading
  const shouldSkipTaskQuery = boardLoading || !board?.exists;
  
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch } = useSubscribeToMonthTasksQuery({
    monthId,
  }, {
    skip: shouldSkipTaskQuery, // Skip if board is loading or doesn't exist
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { addError } = useNotifications();
  
  // Track last computed analytics to prevent double computation
  const lastComputedRef = useRef({ monthId: null, taskCount: 0, taskIds: [] });
  
  // Clean up notifications when month changes
  useNotificationCleanup([monthId]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks || [];
    
    // Filter by user if impersonating
    if (showUserFilter && impersonatedUserId) {
      filtered = filtered.filter((t) => t.userUID === impersonatedUserId);
    } else if (!isAdmin) {
      // For regular users, only show their tasks
      filtered = filtered.filter((t) => t.userUID === user?.uid);
    }
    
    return filtered;
  }, [tasks, user?.uid, showUserFilter, impersonatedUserId, isAdmin]);

  // Store analytics data from current tasks (Strategy 3: Pre-compute from Redux state)
  useEffect(() => {
    // Only compute analytics if board exists and we have tasks
    if (board?.exists && filteredTasks.length > 0) {
      // Check if we've already computed analytics for this exact task set
      const currentTaskIds = filteredTasks.map(task => task.id).sort();
      const lastComputed = lastComputedRef.current;
      
      if (lastComputed.monthId === monthId && 
          lastComputed.taskCount === filteredTasks.length &&
          JSON.stringify(lastComputed.taskIds) === JSON.stringify(currentTaskIds)) {
        console.log('Analytics already computed for this task set, skipping re-computation for month:', monthId);
        return;
      }
      
      // Import analyticsStorage dynamically to avoid circular dependencies
      import('../../utils/indexedDBStorage').then(async ({ analyticsStorage }) => {
        // Check if analytics are already fresh to avoid unnecessary re-computation
        const isFresh = await analyticsStorage.isAnalyticsFresh(monthId);
        if (!isFresh) {
          // Use the same analytics computation function as tasksApi
          const analyticsData = computeAnalyticsFromTasks(filteredTasks, monthId);
          await analyticsStorage.storeAnalytics(monthId, analyticsData);
          console.log('Analytics pre-computed from Redux state and cached in IndexedDB for month:', monthId);
          
          // Update last computed reference
          lastComputedRef.current = {
            monthId,
            taskCount: filteredTasks.length,
            taskIds: currentTaskIds
          };
        } else {
          console.log('Analytics already fresh, skipping re-computation for month:', monthId);
        }
      });
    } else if (board?.exists && filteredTasks.length === 0) {
      console.log('Board exists but no tasks found, skipping analytics computation for month:', monthId);
    } else if (!board?.exists) {
      console.log('Board does not exist, skipping analytics computation for month:', monthId);
    }
  }, [filteredTasks, monthId, board?.exists]);

  const handleCreateTask = () => {
    if (!board?.exists) {
      if (isAdmin) {
        addError(
          `Cannot create task: Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. Please create the board first.`
        );
      } else {
        addError(
          `Cannot create task: Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. Please contact an admin.`
        );
      }
      return;
    }
    setShowTaskForm(!showTaskForm);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="mt-2 text-sm text-gray-600">
          <strong>Month:</strong> {format(new Date(monthId + "-01"), "MMMM yyyy")} ({monthId})
          {board?.exists && (
            <span className="ml-2 text-green-600">
              • Board ready
            </span>
          )}
        </div>
      </div>

      {/* Admin Settings Link (Admin Only) */}
      {isAdmin && (
        <div className="mb-6 flex justify-end">
          <a
            href="/admin/settings"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Settings
          </a>
        </div>
      )}

      {/* User Filter (Admin Only) */}
      {showUserFilter && isAdmin && (
        <div className="mb-6">
          <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by User
          </label>
          <select
            id="userSelect"
            value={impersonatedUserId || ""}
            onChange={onUserSelect}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={usersLoading}
          >
            <option value="">All Users</option>
            {usersList.map((user) => (
              <option key={user.userUID} value={user.userUID}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Board Status Warning */}
      {monthId === format(new Date(), "yyyy-MM") && !board?.exists && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded">
          {isAdmin ? (
            <>
              Hey admin, the board for {format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. 
              You can create the board using the button below.
            </>
          ) : (
            <>
              The board for {format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. 
              Please contact an admin to create the board.
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
        <DynamicButton
          variant="primary"
          onClick={handleCreateTask}
        >
          {showTaskForm ? "Hide Form" : "Create Task"}
        </DynamicButton>
        
        {isAdmin && !board?.exists && (
          <DynamicButton
            variant="primary"
            onClick={() => onGenerateBoard(monthId)}
            loading={generatingBoard}
            loadingText="Creating Board..."
          >
            Create Board - {format(new Date(monthId + "-01"), "MMMM yyyy")}
          </DynamicButton>
        )}
        
        {isAdmin && onGenerateAnalytics && board?.exists && filteredTasks.length > 0 && (
          <DynamicButton 
            variant="outline" 
            onClick={() => onGenerateAnalytics(monthId)}
          >
            Generate Analytics ({format(new Date(monthId + "-01"), "MMMM yyyy")})
          </DynamicButton>
        )}
      </div>

      {/* Task Form */}
      {showTaskForm && board?.exists && (
        <div className="mb-6">
          <TaskForm />
        </div>
      )}

      {/* Content */}
      <div className="space-y-8">
        {tasksError && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2 rounded">
            <div className="flex items-center justify-between">
              <span>Error loading tasks: {tasksError.message || 'Unknown error'}</span>
              <button
                onClick={() => refetch()}
                className="text-red-600 hover:text-red-800 underline text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <AnalyticsSummary tasks={filteredTasks} loading={tasksLoading} error={tasksError} />
        
        {!tasksLoading && filteredTasks.length === 0 ? (
          <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">
            <div className="flex flex-col items-center space-y-2">
              <span>{tasksError ? 'Error loading tasks' : 'No tasks found for the selected month.'}</span>
              <button
                onClick={() => refetch()}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Refresh Data
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Tasks ({filteredTasks.length})
            </h2>
                    <TasksTable 
          monthId={monthId}
          userFilter={impersonatedUserId}
          isAdmin={isAdmin}
          boardExists={board?.exists}
          boardLoading={boardLoading}
        />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWrapper;

