import { useSearchParams, useNavigate } from "react-router-dom";

import { useNotifications } from "../../shared/hooks/useNotifications";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import { useGenerateMonthBoardMutation, useSubscribeToMonthTasksQuery } from "../../features/tasks/tasksApi";

import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import { format } from "date-fns";

const AdminDashboardPage = () => {
  const { addSuccess, addError } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get("user") || "";
  const { data: usersList = [], isLoading: usersLoading } = useSubscribeToUsersQuery();
  const [generateBoard, { isLoading: generatingBoard }] =
    useGenerateMonthBoardMutation();

  const currentMonth = format(new Date(), "yyyy-MM");

  // Use the proper RTK Query hook for real-time data
  const { data: tasks = [] } = useSubscribeToMonthTasksQuery(
    { monthId: currentMonth, userId: impersonatedUserId || null, useCache: true },
    { skip: !currentMonth }
  );

  const handleGenerateAnalytics = async (monthId) => {
    try {
      // Use the tasks from the RTK Query hook
      if (tasks.length === 0) {
        addError(
          `Cannot generate analytics: No tasks found for ${format(new Date(monthId + "-01"), "MMMM yyyy")}. Please create at least one task before generating analytics.`
        );
        return;
      }

      addSuccess(
        `Generating analytics for ${format(new Date(monthId + "-01"), "MMMM yyyy")}...`
      );
      navigate(`/preview/${monthId}`);
    } catch (error) {
      addError(`Failed to check tasks: ${error.message}`);
    }
  };

  const handleGenerateBoard = async (monthId) => {
    try {
      await generateBoard({ monthId });
      addSuccess(`Board generated for ${format(new Date(monthId + "-01"), "MMMM yyyy")}`);
    } catch (error) {
      addError(`Failed to generate board: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage tasks and view analytics for all users
          </p>
        </div>

        {/* User Selection */}
        {usersList.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View as User (Optional)
            </label>
            <select
              value={impersonatedUserId}
              onChange={(e) => {
                const newUrl = e.target.value
                  ? `/admin?user=${e.target.value}`
                  : "/admin";
                navigate(newUrl);
              }}
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              {usersList.map((user) => (
                <option key={user.userUID || user.id} value={user.userUID || user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <DashboardWrapper
          tasks={tasks}
          isLoading={usersLoading}
          onGenerateAnalytics={handleGenerateAnalytics}
          onGenerateBoard={handleGenerateBoard}
          generatingBoard={generatingBoard}
          currentMonth={currentMonth}
          impersonatedUserId={impersonatedUserId}
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
