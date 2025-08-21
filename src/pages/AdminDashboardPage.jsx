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
  const [searchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get("user") || "";
  const monthId = useMemo(() => dayjs().format("YYYY-MM"), []);
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
  const monthStart = dayjs(monthId + "-01");
  const monthEnd = monthStart.endOf("month");
  const [dateRange, setDateRange] = useState({
    start: monthStart,
    end: monthEnd,
  });

  useEffect(() => {}, [user, monthId]);

  const filteredTasks = useMemo(() => {
    const start = dateRange.start.startOf("day").valueOf();
    const end = dateRange.end.endOf("day").valueOf();
    return (tasks || []).filter((t) => {
      if (impersonatedUserId && t.userUID !== impersonatedUserId) return false;
      const created = t.createdAt || 0;
      return created >= start && created <= end;
    });
  }, [tasks, dateRange, impersonatedUserId]);

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
    navigate(uid ? `/admin?user=${uid}` : "/admin");
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <h2>Admin Dashboard</h2>
          <div className="mt-2 text-sm text-gray-600">
            <strong>Current Month:</strong> {dayjs(monthId + "-01").format("MMMM YYYY")} ({monthId})
            {!board?.exists && (
              <span className="ml-2 text-red-600">
                • Month board not created yet
              </span>
            )}
            {board?.exists && (
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
              <label>Start Date</label>
              <input
                type="date"
                name="start"
                value={dateRange.start.format("YYYY-MM-DD")}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, start: dayjs(e.target.value) }))
                }
                className="border rounded px-3 py-2"
              />
            </div>
            <div>
              <label>End Date</label>
              <input
                type="date"
                name="end"
                value={dateRange.end.format("YYYY-MM-DD")}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, end: dayjs(e.target.value) }))
                }
                className="border rounded px-3 py-2"
              />
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
                try {
                  await generateBoard({ monthId }).unwrap();
                  await refetchBoard();
                  addSuccess(`Month board for ${dayjs(monthId + "-01").format("MMMM YYYY")} created successfully!`);
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
