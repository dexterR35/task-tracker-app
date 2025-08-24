import { useSearchParams, useNavigate } from "react-router-dom";

import { useNotifications } from "../../shared/hooks/useNotifications";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import { useGenerateMonthBoardMutation } from "../../features/tasks/tasksApi";

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

  const handleGenerateAnalytics = async (monthId) => {
    try {
      addSuccess(
        `Generating analytics for ${format(new Date(monthId + "-01"), "MMMM yyyy")}...`
      );
      navigate(`/preview/${monthId}`);
    } catch (error) {
      addError(`Failed to generate analytics: ${error.message}`);
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



        <DashboardWrapper
          isLoading={usersLoading}
          onGenerateAnalytics={handleGenerateAnalytics}
          onGenerateBoard={handleGenerateBoard}
          generatingBoard={generatingBoard}
          monthId={currentMonth}
          impersonatedUserId={impersonatedUserId}
          usersList={usersList}
          usersLoading={usersLoading}
          showUserFilter={true}
          isAdmin={true}
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
