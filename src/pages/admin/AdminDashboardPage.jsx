import { useSearchParams, useNavigate } from "react-router-dom";

import { useNotifications } from "../../shared/hooks/useNotifications";
import { useGetUsersQuery } from "../../features/users/usersApi";
import { useGenerateMonthBoardMutation, useSubscribeToMonthTasksQuery } from "../../features/tasks/tasksApi";

import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import { format } from "date-fns";

const AdminDashboardPage = () => {
  const { addSuccess, addError } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get("user") || "";
  const { data: usersList = [], isLoading: usersLoading } = useGetUsersQuery({
    useCache: true,
  });
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
      const result = await generateBoard({ monthId: monthId }).unwrap();
      addSuccess(
        `Month board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`
      );
    } catch (error) {
      addError(`Failed to create month board: ${error.message}`);
    }
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    const hasUserFilter = uid && uid !== "";

    // Build URL parameters - only include user filter
    const newSearchParams = new URLSearchParams();

    // Only include user if there's a filter
    if (hasUserFilter) {
      newSearchParams.set("user", uid);
    }

    // Navigate to the appropriate URL
    const queryString = newSearchParams.toString();
    const url = queryString ? `/admin?${queryString}` : "/admin";
    navigate(url);
  };

  return (
    <>
      <DashboardWrapper
        title="Admin Dashboard"
        showUserFilter={true}
        usersList={usersList}
        usersLoading={usersLoading}
        onUserSelect={handleUserSelect}
        impersonatedUserId={impersonatedUserId}
        monthId={currentMonth}
        isAdmin={true}
        onGenerateAnalytics={handleGenerateAnalytics}
        onGenerateBoard={handleGenerateBoard}
        generatingBoard={generatingBoard}
      />
    </>
  );
};

export default AdminDashboardPage;
