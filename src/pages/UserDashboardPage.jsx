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
  const { data: board = { exists: true } } = useGetMonthBoardExistsQuery({
    monthId,
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { addError } = useNotifications();

  const myTasks = useMemo(
    () => (tasks || []).filter((t) => t.userUID === user?.uid),
    [tasks, user]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">My Dashboard</h2>
        </div>
        {!board?.exists && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded">
            This month's board is not created yet. Please contact an admin.
          </div>
        )}
        <div className="mb-6">
          <DynamicButton
            variant="success"
            onClick={() => {
              if (!board?.exists) {
                addError(
                  "Cannot create task: Board for current month is not created yet."
                );
                return;
              }
              setShowTaskForm(!showTaskForm);
            }}
            disabled={!board?.exists}
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
            <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">
              No tasks found.
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
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
