import React, { useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../features/auth/authSlice";
import {
  useSubscribeToMonthBoardQuery,
  useGenerateMonthBoardMutation,
} from "../../features/tasks/tasksApi";
import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import Loader from "../../shared/components/ui/Loader";
import { useGlobalMonthId } from "../../shared/hooks/useGlobalMonthId";
import { format } from "date-fns";

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = useSelector(selectIsAdmin);

  const { monthId, setMonthId } = useGlobalMonthId();

  // Local state
  const [showTaskForm, setShowTaskForm] = useState(false);
  

  

  const [generateMonthBoard, { isLoading: isGeneratingBoard }] =
    useGenerateMonthBoardMutation();

  // Board queries - both admin and user use real-time subscription
  const boardData = useSubscribeToMonthBoardQuery({ monthId });
  const {
    data: board = { exists: false },
    isLoading: boardLoading,
    error: boardError,
  } = boardData;

  // Debug logging (commented out)
  // console.log(`[DashboardPage] monthId: ${monthId}, board.exists: ${board?.exists}, isAdmin: ${isAdmin}`);

  // Check if any API operations are loading
  const isLoading = boardLoading || isGeneratingBoard;

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
      
      // Debug: Check if monthId was updated
      // console.log(`[DashboardPage] After setMonthId, current monthId: ${monthId}`);

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
            onGenerateBoard={isAdmin ? handleGenerateBoard : null}
            isGeneratingBoard={isGeneratingBoard}
            board={board}
            showTaskForm={showTaskForm}
            onToggleTaskForm={handleToggleTaskForm}
          />
        </div>
      </div>
    );
  };

export default DashboardPage;
