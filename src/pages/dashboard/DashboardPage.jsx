import React, { useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../features/auth/authSlice";
import {
  useSubscribeToMonthBoardQuery,
  useSubscribeToMonthTasksQuery,
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
  const {
    data: board = { exists: false },
    isLoading: boardLoading,
    error: boardError,
  } = useSubscribeToMonthBoardQuery({ monthId });

  // Get tasks loading state to ensure all data is loaded
  const { 
    data: tasks = [], 
    isLoading: tasksLoading,
    error: tasksError 
  } = useSubscribeToMonthTasksQuery(
    { monthId, userId: user?.uid },
    { skip: !monthId || !user }
  );

  // Simplified loading logic - only show loading when data is being fetched
  const isLoading = boardLoading || tasksLoading || isGeneratingBoard;

  // Show loading state only when data is being fetched
  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Loading dashboard..." 
        fullScreen={true}
      />
    );
  }

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
      console.error("[DashboardPage] Error generating month board:", error);
      const { showError } = await import("../../shared/utils/toast");
      showError(
        `Failed to create board: ${error?.data?.message || error?.message || "Unknown error"}`
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardWrapper
        board={board}
        onGenerateBoard={handleGenerateBoard}
        isGeneratingBoard={isGeneratingBoard}
        showTaskForm={showTaskForm}
        onToggleTaskForm={() => setShowTaskForm(!showTaskForm)}
      />
    </div>
  );
};

export default DashboardPage;
