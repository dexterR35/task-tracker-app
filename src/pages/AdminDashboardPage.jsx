import {
  dayjs,
  useMemo,
  useState,
  useEffect,
  useSearchParams,
  useNavigate,
} from "../hooks/useImports";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationCleanup } from "../hooks/useNotificationCleanup";
import { useGetUsersQuery } from "../redux/services/usersApi";
import {
  useGetMonthTasksQuery,
  useGetMonthBoardExistsQuery,
  useGenerateMonthBoardMutation,
} from "../redux/services/tasksApi";
import DynamicButton from "../components/button/DynamicButton";
import TaskForm from "../components/task/TaskForm";
import TasksTable from "../components/task/TasksTable";
import AnalyticsSummary from "../components/AnalyticsSummary";
import Skeleton from "../components/ui/Skeleton";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { addSuccess, addError } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get("user") || "";
  const urlMonthId = searchParams.get("monthId");
  const [selectedMonth, setSelectedMonth] = useState(urlMonthId || dayjs().format("YYYY-MM"));
  const monthId = selectedMonth;
  
  // Clean up notifications when month or user changes
  useNotificationCleanup([monthId, impersonatedUserId]);
  const { data: usersList = [], isLoading: usersLoading } = useGetUsersQuery();

  const { data: tasks = [], isLoading: tasksLoading } = useGetMonthTasksQuery({
    monthId,
  });
  const {
    data: board = { exists: false },
    refetch: refetchBoard,
    isLoading: boardLoading,
  } = useGetMonthBoardExistsQuery({ monthId });


  const [generateBoard, { isLoading: generatingBoard }] =
    useGenerateMonthBoardMutation();

  const [showTaskForm, setShowTaskForm] = useState(false);



  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((t) => {
      if (impersonatedUserId && t.userUID !== impersonatedUserId) return false;
      return true; // Show all tasks for selected month
    });
  }, [tasks, impersonatedUserId]);

  const handleGenerateAnalytics = () => {
    if (!board?.exists) {
      addError(`Cannot generate analytics: Month board for ${dayjs(monthId + "-01").format("MMMM YYYY")} is not created yet. Please create the month board first.`);
      return;
    }
    
    if (!tasks || tasks.length === 0) {
      addError(`Cannot generate analytics: No tasks found for ${dayjs(monthId + "-01").format("MMMM YYYY")}. Please create some tasks first.`);
      return;
    }
    
    addSuccess(`Generating analytics for ${dayjs(monthId + "-01").format("MMMM YYYY")}...`);
    navigate(`/preview/${monthId}`);
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    const currentMonth = dayjs().format("YYYY-MM");
    const isCurrentMonth = selectedMonth === currentMonth;
    const hasUserFilter = uid && uid !== "";
    
    // Only add parameters if we're not in default state
    if (isCurrentMonth && !hasUserFilter) {
      // Default state: current month, all users - clean URL
      navigate("/admin");
    } else {
      // Non-default state: add parameters
      const newSearchParams = new URLSearchParams();
      if (!isCurrentMonth) {
        newSearchParams.set("monthId", selectedMonth);
      }
      if (hasUserFilter) {
        newSearchParams.set("user", uid);
      }
      navigate(`/admin?${newSearchParams.toString()}`);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <h2>Admin Dashboard</h2>
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
        <div className="card flex-center !flex-row !justify-start gap-10">
          <h2>View User Task</h2>
          <div className="flex-center space-x-4 m-0">
            <div>
              <label>Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const newMonth = e.target.value;
                  setSelectedMonth(newMonth);
                  
                  const currentMonth = dayjs().format("YYYY-MM");
                  const isCurrentMonth = newMonth === currentMonth;
                  const hasUserFilter = impersonatedUserId && impersonatedUserId !== "";
                  
                  // Only add parameters if we're not in default state
                  if (isCurrentMonth && !hasUserFilter) {
                    // Default state: current month, all users - clean URL
                    navigate("/admin");
                  } else {
                    // Non-default state: add parameters
                    const newSearchParams = new URLSearchParams();
                    if (!isCurrentMonth) {
                      newSearchParams.set("monthId", newMonth);
                    }
                    if (hasUserFilter) {
                      newSearchParams.set("user", impersonatedUserId);
                    }
                    navigate(`/admin?${newSearchParams.toString()}`);
                  }
                }}
                className="border rounded px-3 py-2 min-w-[200px]"
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

            {usersLoading ? (
              <div className="space-y-2">
                <Skeleton variant="text" width="160px" height="20px" />
                <Skeleton variant="input" width="256px" />
              </div>
            ) : (
              <div>
                <label>User</label>
                <select
                  value={impersonatedUserId || ""}
                  onChange={handleUserSelect}
                  className="border rounded px-3 py-2 min-w-[200px]"
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

        <div className="mb-6 flex-center !flex-row md:flex-row gap-4 !mx-0 justify-start">
          <DynamicButton
            variant="primary"
            onClick={() => {
              const currentMonth = dayjs().format("YYYY-MM");
              if (monthId !== currentMonth) {
                addError(`Cannot create task: You can only create tasks for the current month (${dayjs(currentMonth + "-01").format("MMMM YYYY")}). Selected month: ${dayjs(monthId + "-01").format("MMMM YYYY")}`);
                return;
              }
              
              if (!board?.exists) {
                addError(`Cannot create task: Month board for ${dayjs(monthId + "-01").format("MMMM YYYY")} is not created yet. Please create the month board first.`);
                return;
              }
              setShowTaskForm(!showTaskForm);
            }}
          >
            {showTaskForm ? "Hide Form" : "Create Task Tracker"}
          </DynamicButton>
          {!board?.exists && (
            <DynamicButton
              variant="primary"
              onClick={async () => {
                const currentMonth = dayjs().format("YYYY-MM");
                if (monthId !== currentMonth) {
                  addError(`Cannot create board: You can only generate boards for the current month (${dayjs(currentMonth + "-01").format("MMMM YYYY")}). Selected month: ${dayjs(monthId + "-01").format("MMMM YYYY")}`);
                  return;
                }
                
                try {
                  // Always use current month for board creation
                  await generateBoard({ monthId: currentMonth }).unwrap();
                  await refetchBoard();
                  addSuccess(`Month board for ${dayjs(currentMonth + "-01").format("MMMM YYYY")} created successfully!`);
                } catch (error) {
                  addError(`Failed to create month board: ${error.message}`);
                }
              }}
              loading={generatingBoard}
              loadingText="Generating..."
            >
              Create Board - {dayjs(monthId + "-01").format("MMMM YYYY")}
            </DynamicButton>
          )}
          <DynamicButton 
            variant="outline" 
            onClick={handleGenerateAnalytics}
          >
            Generate Analytics ({dayjs(monthId + "-01").format("MMMM YYYY")})
          </DynamicButton>

        </div>

        {showTaskForm && (
          <div className="mb-6">
            <TaskForm />
          </div>
        )}

        <div className="space-y-8">
          <AnalyticsSummary tasks={filteredTasks} loading={tasksLoading} />
          {!tasksLoading && filteredTasks.length === 0 ? (
            <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">
              No tasks found.
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

export default AdminDashboardPage;
