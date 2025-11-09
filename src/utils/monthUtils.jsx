import React, { useState } from "react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  isValid,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  addWeeks,
} from "date-fns";
import {
  parseMonthId,
  getCurrentMonthId,
} from "@/utils/dateUtils";
import { Icons } from "@/components/icons";
import { useAppDataContext } from "@/context/AppDataContext";
import { useCreateMonthBoard } from "@/features/months/monthsApi";
import { showSuccess, showError } from "@/utils/toast";
import { logger } from "@/utils/logger";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { CARD_SYSTEM } from "@/constants";


export const getWeeksInMonth = (monthId) => {
  const date = typeof monthId === "string" ? parseMonthId(monthId) : monthId;
  if (!isValid(date)) {
    logger.error("Invalid date provided to getWeeksInMonth");
    return [];
  }

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const weeks = [];
  let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday

  // Adjust if week starts before month
  if (currentWeekStart < monthStart) {
    currentWeekStart = addWeeks(currentWeekStart, 1);
  }

  let weekNumber = 1;

  while (currentWeekStart <= monthEnd) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 }); // Sunday

    // Get week days (Monday-Friday only)
    const weekDays = eachDayOfInterval({
      start: currentWeekStart,
      end: weekEnd,
    }).filter((day) => !isWeekend(day) && day >= monthStart && day <= monthEnd);

    if (weekDays.length > 0) {
      weeks.push({
        weekNumber,
        startDate: currentWeekStart,
        endDate: weekEnd,
        days: weekDays,
        startDateStr: format(currentWeekStart, "yyyy-MM-dd"),
        endDateStr: format(weekEnd, "yyyy-MM-dd"),
        label: `Week ${weekNumber} (${format(currentWeekStart, "MMM dd")} - ${format(weekEnd, "MMM dd")})`,
      });
    }

    currentWeekStart = addWeeks(currentWeekStart, 1);
    weekNumber++;
  }

  return weeks;
};

export const getTasksForWeek = (tasks, week) => {
  if (!tasks || !Array.isArray(tasks) || !week) {
    return {};
  }

  const weekTasks = {};

  // Initialize each day with empty array
  week.days.forEach((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    weekTasks[dayStr] = [];
  });

  // Filter and group tasks by day
  tasks.forEach((task) => {
    if (!task.data_task?.startDate) return;

    const taskStartDate = new Date(task.data_task.startDate);
    const taskEndDate = task.data_task.endDate
      ? new Date(task.data_task.endDate)
      : taskStartDate;

    // Check if task falls within this week
    if (taskStartDate >= week.startDate && taskStartDate <= week.endDate) {
      const dayStr = format(taskStartDate, "yyyy-MM-dd");
      if (weekTasks[dayStr]) {
        weekTasks[dayStr].push(task);
      }
    }
  });

  return weekTasks;
};

export const getCurrentWeekNumber = (monthId) => {
  const date = typeof monthId === "string" ? parseMonthId(monthId) : monthId;
  if (!isValid(date)) return 1;

  const today = new Date();
  const monthStart = startOfMonth(date);

  // If today is not in this month, return first week
  if (today < monthStart || today > endOfMonth(date)) {
    return 1;
  }

  const weeks = getWeeksInMonth(monthId);
  const currentWeek = weeks.find(
    (week) => today >= week.startDate && today <= week.endDate
  );

  return currentWeek ? currentWeek.weekNumber : 1;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

const validateMonthId = (monthId) => {
  if (!monthId || typeof monthId !== "string") {
    return { isValid: false, error: "Month ID must be a non-empty string" };
  }

  const monthIdRegex = /^\d{4}-\d{2}$/;
  if (!monthIdRegex.test(monthId)) {
    return { isValid: false, error: "Month ID must be in format YYYY-MM" };
  }

  const [year, month] = monthId.split("-");
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (yearNum < 1900 || yearNum > 2100) {
    return { isValid: false, error: "Year must be between 1900 and 2100" };
  }

  if (monthNum < 1 || monthNum > 12) {
    return { isValid: false, error: "Month must be between 01 and 12" };
  }

  return { isValid: true, error: null };
};

const createLocalDate = (year, month, day) => {
  // Create date in local timezone to avoid timezone shifts
  return new Date(year, month - 1, day);
};

// ============================================================================
// MONTH UTILITY FUNCTIONS
// ============================================================================

export const getCurrentMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, we want 1-12

  // Use date-fns for consistent date handling
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  return {
    monthId: `${year}-${String(month).padStart(2, "0")}`,
    monthName: now.toLocaleString("default", { month: "long" }),
    year: year,
    month: month,
    startDate: startDate,
    endDate: endDate,
    daysInMonth: getDaysInMonth(now),
  };
};

export const getMonthBoundaries = (monthId) => {
  // Validate input
  const validation = validateMonthId(monthId);
  if (!validation.isValid) {
    logger.error("Invalid monthId in getMonthBoundaries:", validation.error);
    throw new Error(validation.error);
  }

  const [year, month] = monthId.split("-");
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  try {
    // Use date-fns for consistent date handling with proper timezone
    const firstDay = createLocalDate(yearNum, monthNum, 1);
    const lastDay = endOfMonth(firstDay);

    return {
      min: format(firstDay, "yyyy-MM-dd"),
      max: format(lastDay, "yyyy-MM-dd"),
    };
  } catch (error) {
    logger.error("Error in getMonthBoundaries:", error);
    throw new Error(`Failed to get month boundaries: ${error.message}`);
  }
};

export const getMonthDateRange = (monthId) => {
  // Validate input
  const validation = validateMonthId(monthId);
  if (!validation.isValid) {
    logger.error("Invalid monthId in getMonthDateRange:", validation.error);
    throw new Error(validation.error);
  }

  const [year, month] = monthId.split("-");
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  // Use date-fns for consistent date handling
  const firstDay = createLocalDate(yearNum, monthNum, 1);
  const lastDay = endOfMonth(firstDay);

  // Return ISO strings for API compatibility, but ensure they represent the correct dates
  return {
    startDate: firstDay.toISOString(),
    endDate: lastDay.toISOString(),
  };
};

export const getMonthInfo = (date = new Date()) => {
  // Validate input date
  if (!isValid(date)) {
    logger.error("Invalid date provided to getMonthInfo");
    throw new Error("Invalid date provided");
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthId = `${year}-${String(month).padStart(2, "0")}`;
  const yearId = year.toString();

  // Use date-fns for consistent date handling
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

  return {
    monthId,
    yearId,
    year: year, // Add year field for month board creation
    month: month, // Add month field for month board creation
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthName: date.toLocaleString("default", { month: "long" }),
    daysInMonth: getDaysInMonth(date),
  };
};

export const calculateMonthProgress = (monthId, daysInMonth = 30) => {
  if (!monthId) {
    return { progress: 0, daysPassed: 0, totalDays: 0, daysRemaining: 0 };
  }

  const validation = validateMonthId(monthId);
  if (!validation.isValid) {
    logger.error(
      "Invalid monthId in calculateMonthProgress:",
      validation.error
    );
    return { progress: 0, daysPassed: 0, totalDays: 0, daysRemaining: 0 };
  }

  let totalDays;
  try {
    const monthIdParts = monthId.split("-");
    const year = parseInt(monthIdParts[0], 10);
    const month = parseInt(monthIdParts[1], 10);
    const firstDayOfMonth = createLocalDate(year, month, 1);
    totalDays = getDaysInMonth(firstDayOfMonth);
  } catch (error) {
    logger.error("Error calculating days in month:", error);
    totalDays = daysInMonth || 30;
  }

  const currentMonthId = getCurrentMonthId();
  // If it's not the current month, show 100% progress
  if (monthId !== currentMonthId) {
    return {
      progress: 100,
      daysPassed: totalDays,
      totalDays: totalDays,
      daysRemaining: 0,
    };
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
    daysRemaining,
  };
};

export const MonthProgressBar = ({
  monthId,
  monthName,
  isCurrentMonth,
  daysInMonth,
}) => {
  const progressData = calculateMonthProgress(monthId, daysInMonth);

  if (!monthId) {
    return null;
  }

  const primaryColor = isCurrentMonth
    ? '#2b67f6'
    : CARD_SYSTEM.COLOR_HEX_MAP.pink;

  return (
    <div className="w-full card">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold">
            {monthName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isCurrentMonth ? "Current Month" : "Past Month"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold" style={{ color: primaryColor }}>
            {progressData.progress}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {progressData.daysPassed}/{progressData.totalDays} days
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className="mb-2">
        <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressData.progress}%`,
              backgroundColor: primaryColor,
            }}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: primaryColor }}
          ></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {progressData.daysPassed} days passed
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {progressData.daysRemaining} days remaining
          </span>
        </div>
      </div>
    </div>
  );
};

export const MonthBoardBanner = () => {
  let appData;
  try {
    appData = useAppDataContext();
  } catch (error) {
    logger.warn(
      "MonthBoardBanner: AppDataContext not available:",
      error.message
    );
    return null;
  }
  const [generateMonthBoard] = useCreateMonthBoard();
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    monthId,
    monthName,
    boardExists,
    startDate,
    endDate,
    isInitialLoading,
  } = appData || {};

  const startDateStr =
    startDate instanceof Date ? startDate.toISOString() : startDate;
  const endDateStr = endDate instanceof Date ? endDate.toISOString() : endDate;

  // Don't show banner if:
  // 1. Still loading initial data
  // 2. Board already exists
  // 3. No month data available

  if (isInitialLoading || boardExists || !monthId || !monthName) {
    return null;
  }

  const handleGenerateBoard = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMonthBoard(monthId, appData.user);

      if (result.success) {
        showSuccess(`Month board for ${monthName} created successfully!`);
        logger.log("Month board generated successfully", {
          monthId,
          monthName,
        });
      } else {
        showError(result.message || "Failed to create month board");
        logger.error("Month board generation failed", {
          monthId,
          monthName,
          error: result.message,
        });
      }
    } catch (error) {
      const errorMessage = error?.message || "Failed to create month board";
      showError(errorMessage);
      logger.error("Month board generation error", {
        monthId,
        monthName,
        error,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Icons.generic.calendar className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
              Create Month Board
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Generate the task board for {monthName} to start tracking tasks
            </p>
          </div>
        </div>
        <DynamicButton
          onClick={handleGenerateBoard}
          disabled={isGenerating}
          iconName="add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm"
        >
          {isGenerating ? "Creating..." : "Create Board"}
        </DynamicButton>
      </div>
    </div>
  );
};
