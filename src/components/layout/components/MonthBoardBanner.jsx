import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { useGenerateMonthBoardMutation } from '@/features/tasks/tasksApi';
import { showSuccess, showError } from '@/utils/toast';
import { logger } from '@/utils/logger';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { Icons } from '@/components/icons';

const MonthBoardBanner = () => {
  const { canAccess } = useAuth();
  const appData = useAppData();
  const [generateMonthBoard, { isLoading: isGenerating }] = useGenerateMonthBoardMutation();

  // Extract month data
  const { monthId, monthName, boardExists, startDate, endDate, daysInMonth } = appData || {};

  // Don't show banner if board exists or data is not available
  if (boardExists || !monthId || !monthName) {
    return null;
  }

  const handleGenerateBoard = async () => {
    if (!monthId) {
      showError("Current month not available. Please refresh the page.");
      return;
    }

    logger.log("Generating month board", { monthId, monthName });

    try {
      const result = await generateMonthBoard({
        monthId,
        startDate: startDate,
        endDate: endDate,
        daysInMonth: daysInMonth,
        userData: appData.user,
      });

      if (result.data) {
        showSuccess("Month board generated successfully!");
        logger.log("Month board generated successfully", { monthId });
      } else {
        const errorMessage = result.error?.message || result.error?.data?.message || "Failed to generate month board. Please try again.";
        showError(errorMessage);
        logger.error("Board generation failed:", result.error);
      }
    } catch (error) {
      showError(`An error occurred while generating the month board: ${error.message || error}`);
      logger.error("Month board generation error", { monthId, error: error.message });
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Icons.buttons.alert className="w-5 h-5 mr-2" />
            Month Board Not Available
          </h3>
          <p className="text-sm">
            The month board for {monthName} has not been generated yet. 
            {canAccess("admin") 
              ? " Generate it to enable task management features." 
              : " Task creation is disabled until the board is available."
            }
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <DynamicButton
            onClick={handleGenerateBoard}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-white text-white hover:bg-white hover:text-yellow-600"
          >
            {isGenerating ? "Generating..." : "Generate Board Now"}
          </DynamicButton>
        </div>
      </div>
    </div>
  );
};

export default MonthBoardBanner;
