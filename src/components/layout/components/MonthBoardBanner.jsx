import React from "react";
import { useAppData } from "@/hooks/useAppData";
import { useGenerateMonthBoardMutation } from "@/features/tasks/tasksApi";
import { showSuccess, showError } from "@/utils/toast";
import { logger } from "@/utils/logger";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { Icons } from "@/components/icons";

const MonthBoardBanner = () => {
  const appData = useAppData();
  const [generateMonthBoard, { isLoading: isGenerating }] =
    useGenerateMonthBoardMutation();

  // Extract month data
  const {
    monthId,
    monthName,
    boardExists,
    startDate,
    endDate,
    daysInMonth,
    isInitialLoading,
  } = appData || {};

  // Convert Date objects back to ISO strings if needed
  const startDateStr =
    startDate instanceof Date ? startDate.toISOString() : startDate;
  const endDateStr = endDate instanceof Date ? endDate.toISOString() : endDate;

  // Don't show banner if:
  // - Board exists (main condition)
  // - Missing required month data
  if (boardExists || !monthId || !monthName || (isInitialLoading && !monthId)) {
    return null;
  }

  // Additional check: ensure we have the required data for board generation
  // If we don't have the date data, we can still show the banner and let the API handle defaults
  if (!startDateStr || !endDateStr || !daysInMonth) {
    // Don't return null - let the banner show and handle missing data in the API call
  }

  const handleGenerateBoard = async () => {
    if (!monthId) {
      showError("Current month not available. Please refresh the page.");
      return;
    }

    try {
      const result = await generateMonthBoard({
        monthId,
        startDate: startDateStr || undefined,
        endDate: endDateStr || undefined,
        daysInMonth: daysInMonth || undefined,
        userData: appData.user,
      });

      if (result.data) {
        showSuccess("Month board generated successfully!");
      } else {
        const errorMessage =
          result.error?.message ||
          result.error?.data?.message ||
          "Failed to generate month board. Please try again.";
        showError(errorMessage);
        logger.error("Board generation failed:", result.error);
      }
    } catch (error) {
      showError(
        `An error occurred while generating the month board: ${error.message || error}`
      );
      logger.error("Month board generation error", {
        monthId,
        error: error.message,
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-500 to-red-500 text-white p-4 ">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-0 flex items-center text-gray-200">
            <Icons.buttons.alert className="w-5 h-5" />
            Month Board Not Available
          </h3>
          <p className="text-sm text-gray-200">
            The month board for {monthName} has not been generated yet.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <DynamicButton
            onClick={handleGenerateBoard}
            disabled={isGenerating}
            variant="outline"
            size="md"
            className=""
          >
            {isGenerating ? "Generating..." : "Generate Board Now"}
          </DynamicButton>
        </div>
      </div>
    </div>
  );
};

export default MonthBoardBanner;
