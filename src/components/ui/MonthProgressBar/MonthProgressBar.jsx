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
    } else {
      totalDays = getDaysInMonth(monthStart);
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
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs capitalize">
          {monthName} 
        </span>
        <Icons.generic.clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-400 dark:bg-primary rounded-full h-2 ">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out  ${
                isCurrentMonth ? "bg-btn-primary" : "bg-red-error"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
 
          {/* <p className="absolute -top-6.5 right-7 text-xs  ">
            {progress}%
          </p> */}
        </div>
        
        {/* Days info */}
        <p className="flex justify-between text-xs ">
          {isCurrentMonth ? (
            <>
              <span className="text-xs">{daysPassed} days passed</span>
              <span className="text-xs">{daysRemaining} days left</span>
            </>
          ) : (
            <>
              <span className="text-red-error text-xs">Month history</span>
              <span className="text-xs">{totalDays} days completed</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default MonthProgressBar;
