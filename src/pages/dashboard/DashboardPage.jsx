import React, { useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";

import { useGenerateMonthBoardMutation } from "../../features/tasks/tasksApi";
import { useCacheManagement } from "../../shared/hooks/useCacheManagement";
import DashboardWrapper from "../../shared/components/dashboard/DashboardWrapper";
import Loader from "../../shared/components/ui/Loader";
import { useGlobalMonthId } from "../../shared/hooks/useGlobalMonthId";
import { format } from "date-fns";
import { logger } from "../../shared/utils/logger";

const DashboardPage = () => {
  const { user, canAccess } = useAuth();


  const { monthId, setMonthId } = useGlobalMonthId();

  // Local state
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [generateMonthBoard, { isLoading: isGeneratingBoard }] =
    useGenerateMonthBoardMutation();
  const { clearCacheOnDataChange } = useCacheManagement();

  // Simplified loading logic - only show loading when generating board
  const isLoading = isGeneratingBoard;

  // Show loading state only when generating board
  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Generating board..." 
        fullScreen={true}
      />
    );
  }

  // Handle generate month board (admin only)
  const handleGenerateBoard = async () => {
    // Check if user has admin access before proceeding
    if (!canAccess('admin')) {
      const { showError } = await import("../../shared/utils/toast");
      showError("You need admin permissions to generate month boards.");
      return;
    }

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

      logger.log(`[DashboardPage] Month board generated successfully. API result:`, result);

      // Clear cache to ensure UI updates immediately
      clearCacheOnDataChange('tasks', 'create');

      // Update the global month ID to the newly created board from API
      if (result?.monthId) {
        logger.log(`[DashboardPage] Setting global monthId to API-generated value: ${result.monthId}`);
        setMonthId(result.monthId);
      } else {
        // Fallback to the original monthId if API doesn't return one
        logger.log(`[DashboardPage] API didn't return monthId, using fallback: ${monthId}`);
        setMonthId(monthId);
      }

      const { showSuccess } = await import("../../shared/utils/toast");
      showSuccess(
        `Board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`
      );
    } catch (error) {
      logger.error("[DashboardPage] Error generating month board:", error);
      const { showError } = await import("../../shared/utils/toast");
      showError(
        `Failed to create board: ${error?.data?.message || error?.message || "Unknown error"}`
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardWrapper
        onGenerateBoard={handleGenerateBoard}
        isGeneratingBoard={isGeneratingBoard}
        showTaskForm={showTaskForm}
        onToggleTaskForm={() => setShowTaskForm(!showTaskForm)}
      />
    </div>
  );
};

export default DashboardPage;
