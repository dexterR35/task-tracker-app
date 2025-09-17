import React, { useMemo } from "react";
import { parseMonthId, getCurrentMonthId, normalizeTimestamp } from "@/utils/dateUtils";
import { format, getDaysInMonth } from "date-fns";
import { Icons } from "@/components/icons";

const MonthProgressBar = ({ monthId, monthName, isCurrentMonth, startDate, endDate, daysInMonth }) => {
  const getMonthProgress = useMemo(() => {
    if (!monthId || !startDate || !endDate) {
      return { progress: 0, daysPassed: 0, totalDays: 0, daysRemaining: 0 };
    }
    
    // Use dateUtils to normalize the dates from your month data
    const monthStart = normalizeTimestamp(startDate);
    const monthEnd = normalizeTimestamp(endDate);
    
    if (!monthStart || !monthEnd) {
      return { progress: 0, daysPassed: 0, totalDays: 0, daysRemaining: 0 };
    }
    
    // Calculate the actual number of days in this month using date-fns
    // Try parsing the monthId to get the correct year and month
    let totalDays;
    const monthIdParts = monthId.split('-');
    if (monthIdParts.length === 2) {
      const year = parseInt(monthIdParts[0]);
      const month = parseInt(monthIdParts[1]) - 1; // month is 0-indexed in Date constructor
      const firstDayOfMonth = new Date(year, month, 1);
      totalDays = getDaysInMonth(firstDayOfMonth);
      console.log(`MonthId: ${monthId}, Year: ${year}, Month: ${month + 1}, Total days: ${totalDays}`);
    } else {
      totalDays = getDaysInMonth(monthStart);
      console.log(`Using monthStart for totalDays: ${totalDays}`);
    }
    
    const currentMonthId = getCurrentMonthId();
    
    // If it's not the current month, show 100% progress
    if (monthId !== currentMonthId) {
      return { progress: 100, daysPassed: totalDays, totalDays: totalDays, daysRemaining: 0 };
    }
    
    const now = new Date();
    
    // Calculate days passed using dateUtils format function
    const currentDay = parseInt(format(now, 'd'));
    const daysPassed = Math.min(Math.max(0, currentDay), totalDays);
    const daysRemaining = Math.max(0, totalDays - daysPassed);
    const progress = Math.round((daysPassed / totalDays) * 100);
    
    return { progress, daysPassed, totalDays, daysRemaining };
  }, [monthId, startDate, endDate]);
  
  const { progress, daysPassed, totalDays, daysRemaining } = getMonthProgress;
  
  // Show for all months now
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {monthName} Progress
        </span>
        <Icons.generic.clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
      
      <div className="space-y-2">
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                isCurrentMonth ? "bg-btn-primary" : "bg-red-error"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Progress percentage indicator */}
          <div className="absolute -top-6 right-0 text-xs font-medium text-gray-600 dark:text-gray-400">
            {progress}%
          </div>
        </div>
        
        {/* Days info */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          {isCurrentMonth ? (
            <>
              <span>{daysPassed} days passed</span>
              <span>{daysRemaining} days left</span>
            </>
          ) : (
            <>
              <span className="text-red-error">Month history</span>
              <span>{totalDays} days completed</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthProgressBar;
