import { useSearchParams, useNavigate } from "../hooks/useImports";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useGetUsersQuery } from "../redux/services/usersApi";
import {
  useGenerateMonthBoardMutation,
} from "../redux/services/tasksApi";
import DashboardWrapper from "../components/dashboard/DashboardWrapper";
import dayjs from "dayjs";

const AdminDashboardPage = () => {
  const { addSuccess, addError } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get("user") || "";
  const { data: usersList = [], isLoading: usersLoading } = useGetUsersQuery();
  const [generateBoard, { isLoading: generatingBoard }] = useGenerateMonthBoardMutation();

  const handleGenerateAnalytics = (monthId) => {
    addSuccess(`Generating analytics for ${dayjs(monthId + "-01").format("MMMM YYYY")}...`);
    navigate(`/preview/${monthId}`);
  };

  const handleGenerateBoard = async (monthId) => {
    const currentMonth = dayjs().format("YYYY-MM");
    if (monthId !== currentMonth) {
      addError(`Cannot create board: You can only generate boards for the current month (${dayjs(currentMonth + "-01").format("MMMM YYYY")}). Selected month: ${dayjs(monthId + "-01").format("MMMM YYYY")}`);
      return;
    }
    
    try {
      await generateBoard({ monthId: currentMonth }).unwrap();
      addSuccess(`Month board for ${dayjs(currentMonth + "-01").format("MMMM YYYY")} created successfully!`);
    } catch (error) {
      addError(`Failed to create month board: ${error.message}`);
    }
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    const currentMonth = dayjs().format("YYYY-MM");
    const urlMonthId = searchParams.get("monthId");
    const selectedMonth = urlMonthId || currentMonth;
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
    <DashboardWrapper
      title="Admin Dashboard"
      showUserFilter={true}
      usersList={usersList}
      usersLoading={usersLoading}
      onUserSelect={handleUserSelect}
      impersonatedUserId={impersonatedUserId}
      showCalendar={false}
      isAdmin={true}
      onGenerateAnalytics={handleGenerateAnalytics}
      onGenerateBoard={handleGenerateBoard}
      generatingBoard={generatingBoard}
    />
  );
};

export default AdminDashboardPage;
