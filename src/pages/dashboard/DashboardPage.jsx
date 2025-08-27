import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../features/auth/authSlice";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import {
  useSubscribeToMonthBoardQuery,
  useGenerateMonthBoardMutation,
  useGetMonthBoardExistsQuery,
} from "../../features/tasks/tasksApi";
import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import Loader from "../../shared/components/ui/Loader";
import { useGlobalMonthId } from "../../shared/hooks/useGlobalMonthId";
import { format } from "date-fns";

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = useSelector(selectIsAdmin);
  const [searchParams, setSearchParams] = useSearchParams();

  const { monthId, setMonthId, needsBoardGeneration } = useGlobalMonthId();

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

  // Check if any API operations are loading
  const isLoading = boardLoading || usersLoading || isGeneratingBoard;

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
      // logger.debug(`[DashboardPage] Starting month board generation for monthId: ${monthId}`);
      
      // Use the month ID from the API response
      const result = await generateMonthBoard({
        monthId,
        meta: {
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email,
          monthName: format(new Date(monthId + "-01"), "MMMM yyyy"),
        },
      }).unwrap();

      console.log(`[DashboardPage] Month board generated successfully. API result:`, result);

      // Update the global month ID to the newly created board from API
      if (result?.monthId) {
        console.log(`[DashboardPage] Setting global monthId to API-generated value: ${result.monthId}`);
        setMonthId(result.monthId);
      } else {
        // Fallback to the original monthId if API doesn't return one
        console.log(`[DashboardPage] API didn't return monthId, using fallback: ${monthId}`);
        setMonthId(monthId);
      }

      const { showSuccess } = await import("../../shared/utils/toast");
      showSuccess(
        `Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`
      );
    } catch (error) {
      console.error(`[DashboardPage] Failed to generate month board:`, error);
      const { showError } = await import("../../shared/utils/toast");
      showError(`Failed to create board: ${error.message}`);
    }
  };

  // Handle toggle task form
  const handleToggleTaskForm = () => {
    setShowTaskForm(!showTaskForm);
  };

  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Please wait..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen p-2">
      <div className="max-w-7xl mx-auto">
        <DashboardWrapper
            userId={isAdmin ? selectedUserId || null : user?.uid}
            isAdmin={isAdmin}
            showCreateBoard={isAdmin && needsBoardGeneration}
            onGenerateBoard={isAdmin ? handleGenerateBoard : null}
            isGeneratingBoard={isGeneratingBoard}
            board={board}
            boardLoading={boardLoading}
            boardError={boardError}
            usersList={isAdmin ? usersList : []}
            usersLoading={isAdmin ? usersLoading : false}
            selectedUserId={isAdmin ? selectedUserId : ""}
            onUserSelect={isAdmin ? handleUserSelect : null}
            showTaskForm={showTaskForm}
            onToggleTaskForm={handleToggleTaskForm}
            title={`${user?.name || user?.email}'s - Board`}
          />
        </div>
      </div>
    );
  };

export default DashboardPage;
