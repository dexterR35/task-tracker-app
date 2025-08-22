import { useSearchParams, useNavigate, useDispatch, useSelector } from "../hooks/useImports";

import { useNotifications } from "../hooks/useNotifications";
import { useGetUsersQuery } from "../redux/services/usersApi";
import {
  useGenerateMonthBoardMutation
} from "../redux/services/tasksApi";

import DashboardWrapper from "../components/dashboard/DashboardWrapper";
import { format } from "date-fns";


const AdminDashboardPage = () => {

  const dispatch = useDispatch();
  const { addSuccess, addError } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get("user") || "";
  const { data: usersList = [], isLoading: usersLoading } = useGetUsersQuery({ useCache: true });
  const [generateBoard, { isLoading: generatingBoard }] = useGenerateMonthBoardMutation();

  const currentMonth = format(new Date(), "yyyy-MM");
  const selectedMonth = currentMonth;


  const handleGenerateAnalytics = async (monthId) => {
    try {
      // Get tasks from Redux store instead of making redundant Firestore read
      const tasksApiState = useSelector((state) => state.tasksApi);
      const queries = tasksApiState?.queries || {};
      
      // Try to find tasks for the current month and user filter
      const currentUserId = impersonatedUserId || null;
      const queryKey = currentUserId 
        ? `subscribeToMonthTasks({"monthId":"${monthId}","userId":"${currentUserId}"})`
        : `subscribeToMonthTasks({"monthId":"${monthId}"})`;
      
      const tasks = queries[queryKey]?.data || [];
      
      if (tasks.length === 0) {
        addError(`Cannot generate analytics: No tasks found for ${format(new Date(monthId + "-01"), "MMMM yyyy")}. Please create at least one task before generating analytics.`);
        return;
      }
      
      addSuccess(`Generating analytics for ${format(new Date(monthId + "-01"), "MMMM yyyy")}...`);
      navigate(`/preview/${monthId}`);
    } catch (error) {
      addError(`Failed to check tasks: ${error.message}`);
    }
  };

  const handleGenerateBoard = async (monthId) => {
    try {
      const result = await generateBoard({ monthId: monthId }).unwrap();
      addSuccess(`Month board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`);
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
        monthId={selectedMonth}
        isAdmin={true}
        onGenerateAnalytics={handleGenerateAnalytics}
        onGenerateBoard={handleGenerateBoard}
        generatingBoard={generatingBoard}
      />
    </>
  );
};

export default AdminDashboardPage;
