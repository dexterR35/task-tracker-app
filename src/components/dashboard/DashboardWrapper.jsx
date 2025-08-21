import { useMemo, useState, useSearchParams } from "../../hooks/useImports";
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
import dayjs from "dayjs";

const DashboardWrapper = ({
  title,
  showUserFilter = false,
  usersList = [],
  usersLoading = false,
  onUserSelect,
  impersonatedUserId = "",
  showCalendar = false,
  isAdmin = false,
  onGenerateAnalytics,
  onGenerateBoard,
  generatingBoard = false,
}) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMonthId = searchParams.get("monthId");
  const [selectedMonth, setSelectedMonth] = useState(urlMonthId || dayjs().format("YYYY-MM"));
  const monthId = selectedMonth;
  // Use regular query as fallback if subscription fails
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch } = useSubscribeToMonthTasksQuery({
    monthId,
  }, {
    // Skip the subscription if there's an error
    skip: false,
  });

  // Debug logging
  console.log('[DashboardWrapper] Tasks state:', {
    monthId,
    tasksCount: tasks?.length || 0,
    isLoading: tasksLoading,
    error: tasksError,
    hasData: Array.isArray(tasks) && tasks.length > 0
  });
  const { data: board = { exists: false } } = useGetMonthBoardExistsQuery({
    monthId,
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { addError } = useNotifications();
  
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
  }, [tasks, user, showUserFilter, impersonatedUserId, isAdmin]);

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("monthId", newMonth);
    setSearchParams(newSearchParams);
  };

  const handleCreateTask = () => {
    const currentMonth = dayjs().format("YYYY-MM");
    if (monthId !== currentMonth) {
      addError(`Cannot create task: You can only create tasks for the current month (${dayjs(currentMonth + "-01").format("MMMM YYYY")}). Selected month: ${dayjs(monthId + "-01").format("MMMM YYYY")}`);
      return;
    }
    
    if (!board?.exists) {
      addError(
        `Cannot create task: Board for ${dayjs(monthId + "-01").format("MMMM YYYY")} is not created yet.`
      );
      return;
    }
    setShowTaskForm(!showTaskForm);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card">
          <h2 className="capitalize">{title}</h2>
          <div className="mt-2 text-sm text-gray-600">
            <strong>Selected Month:</strong> {dayjs(monthId + "-01").format("MMMM YYYY")} ({monthId})
            {monthId !== dayjs().format("YYYY-MM") && (
              <span className="ml-2 text-orange-600">
                • Not current month (view only)
              </span>
            )}
            {monthId === dayjs().format("YYYY-MM") && !board?.exists && (
              <span className="ml-2 text-red-600">
                • Month board not created yet
              </span>
            )}
            {monthId === dayjs().format("YYYY-MM") && board?.exists && (
              <span className="ml-2 text-green-600">
                • Month board ready
              </span>
            )}
          </div>
        </div>
        
        {/* Month and User Selection */}
        <div className="mb-4 card">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthSelect={handleMonthChange}
                showCalendar={showCalendar}
              />
            </div>
            
            {showUserFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <select
                  value={impersonatedUserId || ""}
                  onChange={onUserSelect}
                  className="border rounded px-3 py-2 min-w-[200px]"
                  disabled={usersLoading}
                >
                  <option value="">All Users</option>
                  {usersList.map((u) => (
                    <option key={u.userUID || u.id} value={u.userUID || u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {monthId !== dayjs().format("YYYY-MM") && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded">
            Viewing tasks for {dayjs(monthId + "-01").format("MMMM YYYY")}. You can only create tasks for the current month.
          </div>
        )}
        {monthId === dayjs().format("YYYY-MM") && !board?.exists && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded">
            The board for {dayjs(monthId + "-01").format("MMMM YYYY")} is not created yet. Please contact an admin.
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
              onClick={onGenerateBoard}
              loading={generatingBoard}
              loadingText="Generating..."
            >
              Create Board - {dayjs(monthId + "-01").format("MMMM YYYY")}
            </DynamicButton>
          )}
          
          {isAdmin && onGenerateAnalytics && (
            <DynamicButton 
              variant="outline" 
              onClick={onGenerateAnalytics}
            >
              Generate Analytics ({dayjs(monthId + "-01").format("MMMM YYYY")})
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
              <TasksTable tasks={filteredTasks} loading={tasksLoading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
