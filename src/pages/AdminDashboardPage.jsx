import { useSearchParams, useNavigate, useDispatch, useSelector } from "../hooks/useImports";

import { useNotifications } from "../hooks/useNotifications";
import { useGetUsersQuery } from "../redux/services/usersApi";
import {
  useGenerateMonthBoardMutation,
  useGetMonthBoardExistsQuery,
} from "../redux/services/tasksApi";
import {
  markBoardAsManuallyCreated,
} from "../redux/slices/adminSettingsSlice";
import DashboardWrapper from "../components/dashboard/DashboardWrapper";
import { format } from "date-fns";
import { collection, getDocs, useEffect, useState } from "../hooks/useImports";
import { db } from "../firebase";

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
      const tasksRef = collection(db, 'tasks', monthId, 'monthTasks');
      const tasksSnapshot = await getDocs(tasksRef);
      if (tasksSnapshot.empty) {
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
      if (result.boardId) {
        dispatch(markBoardAsManuallyCreated({ monthId, boardId: result.boardId }));
      }
      addSuccess(`Month board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`);
    } catch (error) {
      addError(`Failed to create month board: ${error.message}`);
    }
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    const isCurrentMonth = selectedMonth === currentMonth;
    const hasUserFilter = uid && uid !== "";

    // Build URL parameters
    const newSearchParams = new URLSearchParams();

    // Always include monthId if it's not the current month
    if (!isCurrentMonth) {
      newSearchParams.set("monthId", selectedMonth);
    }

    // Always include user if there's a filter
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

        isAdmin={true}
        onGenerateAnalytics={handleGenerateAnalytics}
        onGenerateBoard={handleGenerateBoard}
        generatingBoard={generatingBoard}
      />


    </>
  );
};

export default AdminDashboardPage;
