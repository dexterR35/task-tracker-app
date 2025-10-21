/**
 * Comprehensive Month Utilities
 * All month-related functionality in one place
 */

import React, { useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { parseMonthId, getCurrentMonthId, normalizeTimestamp } from "@/utils/dateUtils";
import { Icons } from "@/components/icons";
import { useAppData } from "@/hooks/useAppData";
import { useGenerateMonthBoardMutation } from "@/features/months/monthsApi";
import { showSuccess, showError } from "@/utils/toast";
import { logger } from "@/utils/logger";
import DynamicButton from "@/components/ui/Button/DynamicButton";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate month ID format
 * @param {string} monthId - Month ID to validate
 * @returns {Object} Validation result with isValid and error message
 */
const validateMonthId = (monthId) => {
  if (!monthId || typeof monthId !== 'string') {
    return { isValid: false, error: 'Month ID must be a non-empty string' };
  }
  
  const monthIdRegex = /^\d{4}-\d{2}$/;
  if (!monthIdRegex.test(monthId)) {
    return { isValid: false, error: 'Month ID must be in format YYYY-MM' };
  }
  
  const [year, month] = monthId.split('-');
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  
  if (yearNum < 1900 || yearNum > 2100) {
    return { isValid: false, error: 'Year must be between 1900 and 2100' };
  }
  
  if (monthNum < 1 || monthNum > 12) {
    return { isValid: false, error: 'Month must be between 01 and 12' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Safe date creation with timezone handling
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day
 * @returns {Date} Date object in local timezone
 */
const createLocalDate = (year, month, day) => {
  // Create date in local timezone to avoid timezone shifts
  return new Date(year, month - 1, day);
};

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
  
  // Use date-fns for consistent date handling
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  
  return {
    monthId: `${year}-${String(month).padStart(2, '0')}`,
    monthName: now.toLocaleString('default', { month: 'long' }),
    year: year,
    month: month,
    startDate: startDate,
    endDate: endDate,
    daysInMonth: getDaysInMonth(now)
  };
};


/**
 * Get month boundaries for date restrictions
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {Object} Min and max date strings for the month
 */
export const getMonthBoundaries = (monthId) => {
  // Validate input
  const validation = validateMonthId(monthId);
  if (!validation.isValid) {
    logger.error('Invalid monthId in getMonthBoundaries:', validation.error);
    throw new Error(validation.error);
  }
  
  const [year, month] = monthId.split('-');
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  
  // Use date-fns for consistent date handling
  const firstDay = createLocalDate(yearNum, monthNum, 1);
  const lastDay = endOfMonth(firstDay);
  
  return {
    min: format(firstDay, 'yyyy-MM-dd'),
    max: format(lastDay, 'yyyy-MM-dd')
  };
};

/**
 * Get month date range for API calls
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {Object} Start and end dates for the month
 */
export const getMonthDateRange = (monthId) => {
  // Validate input
  const validation = validateMonthId(monthId);
  if (!validation.isValid) {
    logger.error('Invalid monthId in getMonthDateRange:', validation.error);
    throw new Error(validation.error);
  }
  
  const [year, month] = monthId.split('-');
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  
  // Use date-fns for consistent date handling
  const firstDay = createLocalDate(yearNum, monthNum, 1);
  const lastDay = endOfMonth(firstDay);
  
  // Return ISO strings for API compatibility, but ensure they represent the correct dates
  return {
    startDate: firstDay.toISOString(),
    endDate: lastDay.toISOString()
  };
};

/**
 * Get comprehensive month info for API usage
 * @param {Date} date - Date object (defaults to current date)
 * @returns {Object} Complete month information
 */
export const getMonthInfo = (date = new Date()) => {
  // Validate input date
  if (!isValid(date)) {
    logger.error('Invalid date provided to getMonthInfo');
    throw new Error('Invalid date provided');
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthId = `${year}-${String(month).padStart(2, '0')}`;
  const yearId = year.toString();
  
  // Use date-fns for consistent date handling
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);
  
  return {
    monthId,
    yearId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthName: date.toLocaleString('default', { month: 'long' }),
    daysInMonth: getDaysInMonth(date),
  };
};


/**
 * Calculate month progress
 * @param {string} monthId - Month ID
 * @param {number} daysInMonth - Total days in month (fallback)
 * @returns {Object} Progress information
 */
export const calculateMonthProgress = (monthId, daysInMonth = 30) => {
  if (!monthId) {
    return { progress: 0, daysPassed: 0, totalDays: 0, daysRemaining: 0 };
  }
  
  // Validate monthId format
  const validation = validateMonthId(monthId);
  if (!validation.isValid) {
    logger.error('Invalid monthId in calculateMonthProgress:', validation.error);
    return { progress: 0, daysPassed: 0, totalDays: 0, daysRemaining: 0 };
  }
  
  // Calculate the actual number of days in this month using date-fns
  let totalDays;
  try {
    const monthIdParts = monthId.split('-');
    const year = parseInt(monthIdParts[0], 10);
    const month = parseInt(monthIdParts[1], 10);
    const firstDayOfMonth = createLocalDate(year, month, 1);
    totalDays = getDaysInMonth(firstDayOfMonth);
  } catch (error) {
    logger.error('Error calculating days in month:', error);
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
  const progressData = calculateMonthProgress(monthId, daysInMonth);

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
        logger.log("Month board generated successfully", { monthId, monthName });
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