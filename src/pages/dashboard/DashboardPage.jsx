import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../features/auth/authSlice";
import { showError, showSuccess } from "../../shared/utils/toast";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import {
  useSubscribeToMonthBoardQuery,
  useGenerateMonthBoardMutation,
  useGetMonthBoardExistsQuery,
} from "../../features/tasks/tasksApi";
import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import DashboardLoader from "../../shared/components/ui/DashboardLoader";
import { format } from "date-fns";

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = useSelector(selectIsAdmin);
  const [searchParams, setSearchParams] = useSearchParams();

  // Use current month as default
  const monthId = format(new Date(), "yyyy-MM");

  // URL state for user selection (admin only)
  const selectedUserId = searchParams.get("user") || "";

  // Local state
  const [showTaskForm, setShowTaskForm] = useState(false);

  // API hooks - Admin specific
  const { data: usersList = [], isLoading: usersLoading } =
    useSubscribeToUsersQuery();
  const [generateMonthBoard, { isLoading: isGeneratingBoard }] =
    useGenerateMonthBoardMutation();

  // Board queries - different for admin vs user
  const adminBoardQuery = useSubscribeToMonthBoardQuery({ monthId });
  const userBoardQuery = useGetMonthBoardExistsQuery({ monthId });

  // Use appropriate board query based on role
  const boardData = isAdmin ? adminBoardQuery : userBoardQuery;
  const {
    data: board = { exists: false },
    isLoading: boardLoading,
    error: boardError,
  } = boardData;

  // Ensure user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex-center">
        <div className="card p-8 text-center max-w-md mx-4">
          <h2 className="text-red-error mb-4">Access Denied</h2>
          <p className="mb-6">
            You need to be authenticated to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Handle user selection (admin only)
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Handle generate month board (admin only)
  const handleGenerateBoard = async () => {
    try {
      await generateMonthBoard({
        monthId,
        meta: {
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email,
          monthName: format(new Date(monthId + "-01"), "MMMM yyyy"),
        },
      }).unwrap();

      showSuccess(
        `Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`
      );
    } catch (error) {
      showError(`Failed to create board: ${error.message}`);
    }
  };

  // Handle toggle task form
  const handleToggleTaskForm = () => {
    setShowTaskForm(!showTaskForm);
  };

  // Determine dashboard configuration based on role
  const getDashboardConfig = () => {
    if (isAdmin) {
      return {
        title: `${user?.name || user?.email}'s - Board`,
        userId: selectedUserId || null, // null means all users
        showCreateBoard: true,
        onGenerateBoard: handleGenerateBoard,
        isGeneratingBoard,
        usersList,
        usersLoading,
        selectedUserId,
        onUserSelect: handleUserSelect,
      };
    } else {
      return {
        title: `${user?.name || user?.email}'s - Board`,
        userId: user?.uid,
        showCreateBoard: false,
        onGenerateBoard: null,
        isGeneratingBoard: false,
        usersList: [],
        usersLoading: false,
        selectedUserId: "",
        onUserSelect: null,
      };
    }
  };

  const config = getDashboardConfig();

  return (
    <DashboardLoader>
      <div className="min-h-screen p-2">
        <div className="max-w-7xl mx-auto">
          <DashboardWrapper
            monthId={monthId}
            userId={config.userId}
            isAdmin={isAdmin}
            showCreateBoard={config.showCreateBoard}
            onGenerateBoard={config.onGenerateBoard}
            isGeneratingBoard={config.isGeneratingBoard}
            board={board}
            boardLoading={boardLoading}
            boardError={boardError}
            usersList={config.usersList}
            usersLoading={config.usersLoading}
            selectedUserId={config.selectedUserId}
            onUserSelect={config.onUserSelect}
            showTaskForm={showTaskForm}
            onToggleTaskForm={handleToggleTaskForm}
            title={config.title}
          />
        </div>
      </div>
    </DashboardLoader>
  );
};

export default DashboardPage;
