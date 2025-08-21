import  { useMemo, useState, dayjs } from "../hooks/useImports";
import { useAuth } from "../hooks/useAuth";
import {
  useGetMonthTasksQuery,
  useGetMonthBoardExistsQuery,
} from "../redux/services/tasksApi";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationCleanup } from "../hooks/useNotificationCleanup";
import TaskForm from "../components/task/TaskForm";
import TasksTable from "../components/task/TasksTable";
import AnalyticsSummary from "../components/AnalyticsSummary";
import DynamicButton from "../components/button/DynamicButton";

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMonthId = searchParams.get("monthId");
  const [selectedMonth, setSelectedMonth] = useState(urlMonthId || dayjs().format("YYYY-MM"));
  const monthId = selectedMonth;
  const { data: tasks = [], isLoading: tasksLoading } = useGetMonthTasksQuery({
    monthId,
  });
  const { data: board = { exists: false } } = useGetMonthBoardExistsQuery({
    monthId,
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { addError } = useNotifications();
  
  // Clean up notifications when month changes
  useNotificationCleanup([monthId]);

  const myTasks = useMemo(
    () => (tasks || []).filter((t) => t.userUID === user?.uid),
    [tasks, user]
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <h2 className="capitalize">{user.name} - DashBoard</h2>
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
        
        {/* Month Selection */}
        <div className="mb-4 card">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const newMonth = e.target.value;
                  setSelectedMonth(newMonth);
                  // Update URL parameters
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.set("monthId", newMonth);
                  setSearchParams(newSearchParams);
                }}
                className="border rounded px-3 py-2"
              >
                {(() => {
                  const months = [];
                  const currentDate = dayjs();
                  const currentYear = currentDate.year();
                  
                  // Generate months for current year to 3 years ahead
                  for (let yearOffset = 0; yearOffset <= 3; yearOffset++) {
                    const year = currentYear + yearOffset;
                    const isCurrentYear = year === currentYear;
                    
                    for (let month = 1; month <= 12; month++) {
                      const monthDate = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`);
                      const monthId = monthDate.format("YYYY-MM");
                      const monthName = monthDate.format("MMMM YYYY");
                      const isCurrentMonth = monthId === currentDate.format("YYYY-MM");
                      const isDisabled = year > currentYear; // Disable future years
                      
                      months.push(
                        <option 
                          key={monthId} 
                          value={monthId}
                          disabled={isDisabled}
                        >
                          {monthName} {isCurrentMonth ? '(Current)' : ''} {isDisabled ? '(Disabled)' : ''}
                        </option>
                      );
                    }
                  }
                  return months;
                })()}
              </select>
            </div>
          </div>
        </div>
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
        <div className="mb-6">
          <DynamicButton
            variant="success"
            onClick={() => {
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
            }}
          >
            {showTaskForm ? "Hide Form" : "Create Task"}
          </DynamicButton>
        </div>
        {showTaskForm && board?.exists && (
          <div className="mb-6">
            <TaskForm />
          </div>
        )}
        <div className="space-y-8">
          <AnalyticsSummary tasks={myTasks} loading={tasksLoading} />
          {!tasksLoading && myTasks.length === 0 ? (
            <p className="card">
              No tasks found.
            </p>
          ) : (
            <div>
              <h2>
                Tasks ({myTasks.length})
              </h2>
              <TasksTable tasks={myTasks} loading={tasksLoading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
