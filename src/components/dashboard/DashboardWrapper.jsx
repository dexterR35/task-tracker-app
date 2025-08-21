import { useMemo, useState, useSearchParams,useEffect } from "../../hooks/useImports";
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

const DashboardWrapper = ({
  title,
  showUserFilter = false,
  usersList = [],
  usersLoading = false,
  onUserSelect,
  impersonatedUserId = "",

  isAdmin = false,
  onGenerateAnalytics,
  onGenerateBoard,
  generatingBoard = false,
  noTasksForCurrentMonth = false,
  isCheckingTasks = false,
  onTasksCreated,
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
  // Use regular query as fallback if subscription fails
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch } = useSubscribeToMonthTasksQuery({
    monthId,
  }, {
    // Skip the subscription if there's an error
    skip: false,
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
  }, [tasks, user?.uid, showUserFilter, impersonatedUserId, isAdmin]);

  // Call onTasksCreated when tasks are added and noTasksForCurrentMonth is true
  useEffect(() => {
    console.log('Task count changed:', filteredTasks.length, 'noTasksForCurrentMonth:', noTasksForCurrentMonth, 'monthId:', monthId);
    if (onTasksCreated && noTasksForCurrentMonth && filteredTasks.length > 0) {
      console.log('Tasks created, clearing no tasks state for month:', monthId);
      onTasksCreated();
    }
  }, [filteredTasks.length, noTasksForCurrentMonth, onTasksCreated, monthId]);

  // Store analytics data from current tasks (Strategy 3: Pre-compute from Redux state)
  useEffect(() => {
    if (filteredTasks.length > 0) {
      // Import analyticsStorage dynamically to avoid circular dependencies
      import('../../utils/indexedDBStorage').then(async ({ analyticsStorage }) => {
        // Use the same analytics computation function as tasksApi
        const analyticsData = computeAnalyticsFromTasks(filteredTasks, monthId);
        await analyticsStorage.storeAnalytics(monthId, analyticsData);
        console.log('Analytics pre-computed from Redux state and cached in IndexedDB for month:', monthId);
      });
    }
  }, [filteredTasks, monthId]);

  // Helper function to compute analytics from tasks (same as in tasksApi)
  const computeAnalyticsFromTasks = (tasks, monthId) => {
    const agg = {
      monthId,
      generatedAt: new Date().toISOString(),
      totalTasks: 0,
      totalHours: 0,
      ai: { tasks: 0, hours: 0 },
      reworked: 0,
      byUser: {},
      markets: {},
      products: {},
      aiModels: {},
      deliverables: {},
      aiBreakdownByProduct: {},
      aiBreakdownByMarket: {},
      daily: {},
    };

    for (const t of tasks) {
      agg.totalTasks += 1;
      agg.totalHours += Number(t.timeInHours) || 0;
      if (t.aiUsed) {
        agg.ai.tasks += 1;
        agg.ai.hours += Number(t.timeSpentOnAI) || 0;
      }
      if (t.reworked) agg.reworked += 1;
      
      // User grouping
      if (t.userUID) {
        if (!agg.byUser[t.userUID]) agg.byUser[t.userUID] = { count: 0, hours: 0 };
        agg.byUser[t.userUID].count += 1;
        agg.byUser[t.userUID].hours += Number(t.timeInHours) || 0;
      }
      
      // Daily grouping
      const createdDay = (() => {
        const ms = t.createdAt || 0;
        if (!ms) return null;
        const d = new Date(ms);
        if (isNaN(d.getTime())) return null;
        return format(d, 'yyyy-MM-dd');
      })();
      if (createdDay) {
        if (!agg.daily[createdDay]) agg.daily[createdDay] = { count: 0, hours: 0 };
        agg.daily[createdDay].count += 1;
        agg.daily[createdDay].hours += Number(t.timeInHours) || 0;
      }
      
      // Product grouping
      if (t.product) {
        if (!agg.products[t.product]) agg.products[t.product] = { count: 0, hours: 0 };
        agg.products[t.product].count += 1;
        agg.products[t.product].hours += Number(t.timeInHours) || 0;
      }
      
      // Market grouping
      const addCountHours = (map, key) => {
        if (!map[key]) map[key] = { count: 0, hours: 0 };
        map[key].count += 1;
        map[key].hours += Number(t.timeInHours) || 0;
      };
      if (Array.isArray(t.markets)) {
        t.markets.forEach((m) => addCountHours(agg.markets, m || 'N/A'));
      } else if (t.market) {
        addCountHours(agg.markets, t.market);
      }
      
      // AI breakdown by product/market
      const ensureBreakdown = (map, key) => {
        if (!map[key]) map[key] = { aiTasks: 0, aiHours: 0, nonAiTasks: 0, nonAiHours: 0, totalTasks: 0, totalHours: 0 };
        return map[key];
      };
      const applyBreakdown = (entry, task) => {
        entry.totalTasks += 1;
        entry.totalHours += Number(task.timeInHours) || 0;
        if (task.aiUsed) {
          entry.aiTasks += 1;
          entry.aiHours += Number(task.timeSpentOnAI) || 0;
        } else {
          entry.nonAiTasks += 1;
          entry.nonAiHours += Number(task.timeInHours) || 0;
        }
      };
      if (t.product) {
        const e = ensureBreakdown(agg.aiBreakdownByProduct, t.product);
        applyBreakdown(e, t);
      }
      const marketsList = Array.isArray(t.markets) ? t.markets : (t.market ? [t.market] : []);
      marketsList.forEach((mk) => {
        const e = ensureBreakdown(agg.aiBreakdownByMarket, mk || 'N/A');
        applyBreakdown(e, t);
      });
      
      // AI Models
      if (Array.isArray(t.aiModels)) {
        t.aiModels.forEach((m) => {
          const key = m || 'N/A';
          agg.aiModels[key] = (agg.aiModels[key] || 0) + 1;
        });
      } else if (t.aiModel) {
        const key = t.aiModel || 'N/A';
        agg.aiModels[key] = (agg.aiModels[key] || 0) + 1;
      }
      
      // Deliverables
      if (Array.isArray(t.deliverables)) {
        t.deliverables.forEach((d) => {
          const key = String(d || 'N/A');
          agg.deliverables[key] = (agg.deliverables[key] || 0) + 1;
        });
      } else if (t.deliverable) {
        const key = String(t.deliverable || 'N/A');
        agg.deliverables[key] = (agg.deliverables[key] || 0) + 1;
      }
    }

    return agg;
  };

  // Month is automatically managed - no manual changes needed

  const handleCreateTask = () => {
    // Always work with current month - no restrictions
    
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card">
          <h2 className="capitalize">{title}</h2>
          <div className="mt-2 text-sm text-gray-600">
            <strong>Selected Month:</strong> {format(new Date(monthId + "-01"), "MMMM yyyy")} ({monthId})
            {monthId !== format(new Date(), "yyyy-MM") && (
              <span className="ml-2 text-orange-600">
                • Not current month (view only)
              </span>
            )}
            {monthId === format(new Date(), "yyyy-MM") && !board?.exists && (
              <span className="ml-2 text-red-600">
                • Month board not created yet
              </span>
            )}
            {monthId === format(new Date(), "yyyy-MM") && board?.exists && (
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
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthSelect={() => {}} // No-op since it's read-only
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
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2 rounded">
          Working with current month: {format(new Date(monthId + "-01"), "MMMM yyyy")}. Auto-detects month changes.
        </div>
        {monthId === format(new Date(), "yyyy-MM") && !board?.exists && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded">
            {isAdmin ? (
              <>
                Hey admin, the board for {format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet. 
                First create some tasks, then create the board using the button below.
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
              loading={generatingBoard || isCheckingTasks}
              loadingText={generatingBoard ? "Generating..." : "🔍 Checking for tasks..."}
              disabled={noTasksForCurrentMonth}
            >
              {noTasksForCurrentMonth 
                ? `❌ No Tasks - Create Board (${format(new Date(monthId + "-01"), "MMMM yyyy")})`
                : `Create Board (Requires Tasks) - ${format(new Date(monthId + "-01"), "MMMM yyyy")}`
              }
            </DynamicButton>
          )}
          
          {isAdmin && onGenerateAnalytics && (
            <DynamicButton 
              variant="outline" 
              onClick={() => onGenerateAnalytics(monthId)}
              loading={isCheckingTasks}
              loadingText="🔍 Checking for tasks..."
              disabled={noTasksForCurrentMonth}
            >
              {noTasksForCurrentMonth 
                ? `❌ No Tasks - Generate Analytics (${format(new Date(monthId + "-01"), "MMMM yyyy")})`
                : `Generate Analytics (${format(new Date(monthId + "-01"), "MMMM yyyy")})`
              }
            </DynamicButton>
          )}
          
          {isAdmin && noTasksForCurrentMonth && onTasksCreated && (
            <DynamicButton 
              variant="secondary" 
              onClick={() => onTasksCreated()}
              size="sm"
            >
              🔄 Refresh Task Status
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
                showUserFilter={showUserFilter}
                isAdmin={isAdmin}
                loading={tasksLoading}
                error={tasksError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
