/**
 * Comprehensive Month Utilities
 * All month-related functionality in one place
 */

import React, { useMemo } from "react";
import { format, getDaysInMonth } from "date-fns";
import { parseMonthId, getCurrentMonthId, normalizeTimestamp } from "@/utils/dateUtils";
import { Icons } from "@/components/icons";
import { useAppData } from "@/hooks/useAppData";
import { useGenerateMonthBoardMutation } from "@/features/months/monthsApi";
import { showSuccess, showError } from "@/utils/toast";
import { logger } from "@/utils/logger";
import DynamicButton from "@/components/ui/Button/DynamicButton";

// ============================================================================
// MONTH UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current month information
 * @returns {Object} Month information with consistent structure
 */
export const getCurrentMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
  
  return {
    monthId: `${year}-${String(month).padStart(2, '0')}`,
    monthName: now.toLocaleString('default', { month: 'long' }),
    year: year,
    month: month,
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0), // Last day of current month
    daysInMonth: new Date(year, month, 0).getDate()
  };
};

/**
 * Generate month ID from date
 * @param {Date|string} date - Date object or date string
 * @returns {string} Month ID in format "YYYY-MM"
 */
export const generateMonthId = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * Get month boundaries for date restrictions
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {Object} Min and max date strings for the month
 */
export const getMonthBoundaries = (monthId) => {
  const [year, month] = monthId.split('-');
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  
  return {
    min: `${year}-${String(parseInt(month)).padStart(2, '0')}-01`,
    max: `${year}-${String(parseInt(month)).padStart(2, '0')}-${lastDay}`
  };
};

/**
 * Get month date range for API calls
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {Object} Start and end dates for the month
 */
export const getMonthDateRange = (monthId) => {
  const [year, month] = monthId.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
};

/**
 * Get comprehensive month info for API usage (replaces getMonthInfo in tasksApi)
 * @param {Date} date - Date object (defaults to current date)
 * @returns {Object} Complete month information
 */
export const getMonthInfo = (date = new Date()) => {
  const monthId = generateMonthId(date);
  const [year] = monthId.split('-');
  const yearId = year;
  
  const startDate = new Date(parseInt(year), parseInt(monthId.split('-')[1]) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(monthId.split('-')[1]), 0);
  
  return {
    monthId,
    yearId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthName: date.toLocaleString('default', { month: 'long' }),
    daysInMonth: endDate.getDate(),
  };
};

/**
 * Get current year ID
 * @returns {string} Current year as string
 */
export const getCurrentYear = () => {
  return new Date().getFullYear().toString();
};

/**
 * Calculate month progress
 * @param {string} monthId - Month ID
 * @param {number} daysInMonth - Total days in month
 * @returns {Object} Progress information
 */
export const calculateMonthProgress = (monthId, daysInMonth = 30) => {
  if (!monthId) {
    return { progress: 0, daysPassed: 0, totalDays: 0, daysRemaining: 0 };
  }
  
  // Calculate the actual number of days in this month using date-fns
  let totalDays;
  const monthIdParts = monthId.split('-');
  if (monthIdParts.length === 2) {
    const year = parseInt(monthIdParts[0]);
    const month = parseInt(monthIdParts[1]) - 1; // month is 0-indexed in Date constructor
    const firstDayOfMonth = new Date(year, month, 1);
    totalDays = getDaysInMonth(firstDayOfMonth);
  } else {
    // Fallback to daysInMonth prop if available
    totalDays = daysInMonth || 30;
  }
  
  const currentMonthId = getCurrentMonthId();
  
  // If it's not the current month, show 100% progress
  if (monthId !== currentMonthId) {
    return { progress: 100, daysPassed: totalDays, totalDays: totalDays, daysRemaining: 0 };
  }
  
  // Calculate progress for current month
  const now = new Date();
  const daysPassed = now.getDate();
  const progress = Math.round((daysPassed / totalDays) * 100);
  const daysRemaining = totalDays - daysPassed;
  
  return {
    progress: Math.min(progress, 100),
    daysPassed,
    totalDays,
    daysRemaining
  };
};

// ============================================================================
// MONTH COMPONENTS
// ============================================================================

/**
 * Month Progress Bar Component
 */
export const MonthProgressBar = ({ monthId, monthName, isCurrentMonth, startDate, endDate, daysInMonth }) => {
  const progressData = useMemo(() => calculateMonthProgress(monthId, daysInMonth), [monthId, daysInMonth]);

  if (!monthId) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icons.generic.clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {monthName} Progress
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {progressData.daysPassed}/{progressData.totalDays} days
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isCurrentMonth 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
              : 'bg-gradient-to-r from-green-500 to-green-600'
          }`}
          style={{ width: `${progressData.progress}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{progressData.daysPassed} days passed</span>
        <span>{progressData.daysRemaining} days remaining</span>
      </div>
    </div>
  );
};

/**
 * Month Board Banner Component
 */
export const MonthBoardBanner = () => {
  const appData = useAppData();
  const [generateMonthBoard, { isLoading: isGenerating }] = useGenerateMonthBoardMutation();

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
  const startDateStr = startDate instanceof Date ? startDate.toISOString() : startDate;
  const endDateStr = endDate instanceof Date ? endDate.toISOString() : endDate;

  // Don't show banner if:
  // 1. Still loading initial data
  // 2. Board already exists
  // 3. No month data available
  if (isInitialLoading || boardExists || !monthId || !monthName) {
    return null;
  }

  const handleGenerateBoard = async () => {
    try {
      const result = await generateMonthBoard({
        monthId,
        monthName,
        startDate: startDateStr,
        endDate: endDateStr,
        daysInMonth,
      }).unwrap();

      if (result.success) {
        showSuccess(`Month board for ${monthName} created successfully!`);
        logger.info("Month board generated successfully", { monthId, monthName });
      } else {
        showError(result.message || "Failed to create month board");
        logger.error("Month board generation failed", { monthId, monthName, error: result.message });
      }
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || "Failed to create month board";
      showError(errorMessage);
      logger.error("Month board generation error", { monthId, monthName, error });
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Icons.generic.calendar className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Create Month Board
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Generate the task board for {monthName} to start tracking tasks
            </p>
          </div>
        </div>
        <DynamicButton
          onClick={handleGenerateBoard}
          disabled={isGenerating}
          iconName="add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
        >
          {isGenerating ? "Creating..." : "Create Board"}
        </DynamicButton>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

// All functions and components are already exported individually above