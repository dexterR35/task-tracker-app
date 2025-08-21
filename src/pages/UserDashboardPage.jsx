import  { useMemo, useState, dayjs } from "../hooks/useImports";
import { useAuth } from "../hooks/useAuth";
import {
  useGetMonthTasksQuery,
  useGetMonthBoardExistsQuery,
} from "../redux/services/tasksApi";
import { useNotifications } from "../hooks/useNotifications";
import TaskForm from "../components/task/TaskForm";
import TasksTable from "../components/task/TasksTable";
import AnalyticsSummary from "../components/AnalyticsSummary";
import DynamicButton from "../components/button/DynamicButton";

const UserDashboardPage = () => {
  const { user } = useAuth();
  const monthId = useMemo(() => dayjs().format("YYYY-MM"), []);
  const { data: tasks = [], isLoading: tasksLoading } = useGetMonthTasksQuery({
    monthId,
  });
  const { data: board = { exists: false } } = useGetMonthBoardExistsQuery({
    monthId,
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { addError } = useNotifications();

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
        {!board?.exists && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded">
            The board for {dayjs(monthId + "-01").format("MMMM YYYY")} is not created yet. Please contact an admin.
          </div>
        )}
        <div className="mb-6">
          <DynamicButton
            variant="success"
            onClick={() => {
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
