import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, addDays, startOfWeek } from 'date-fns';
import { Icons } from '@/components/icons';

/**
 * Get color from user's color_set field in database
 * Handles color with or without # prefix
 */
export const getUserColor = (user) => {
  if (!user) return '#64748B'; // Default gray
  
  const colorSet = user.color_set || user.colorSet;
  if (!colorSet) return '#64748B'; // Default gray if no color_set
  
  // Add # prefix if not present
  return colorSet.startsWith('#') ? colorSet : `#${colorSet}`;
};

/**
 * Generate a gradient background showing all user colors
 * Creates a linear gradient that displays all colors horizontally
 */
export const generateMultiColorGradient = (users) => {
  if (!users || users.length === 0) return null;
  if (users.length === 1) return users[0].color;
  
  // Create a gradient with all colors evenly distributed
  const percentageStep = 100 / users.length;
  const stops = users.map((u, index) => {
    const start = index * percentageStep;
    const end = (index + 1) * percentageStep;
    // Use the same color for both start and end to create solid color blocks
    return `${u.color} ${start}%, ${u.color} ${end}%`;
  }).join(', ');
  
  return `linear-gradient(to right, ${stops})`;
};

/**
 * Generate calendar days for a month
 * Returns an array of 42 days (6 weeks) starting from the first Monday of the month
 */
export const generateCalendarDays = (monthDate) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday

  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(calendarStart, i);
    days.push({
      date,
      isCurrentMonth: date >= monthStart && date <= monthEnd,
    });
  }
  return days;
};

/**
 * Base Calendar Grid Component
 * Renders the calendar grid structure (day headers and grid)
 */
export const BaseCalendarGrid = ({ 
  monthDate,
  renderDay,
  className = ""
}) => {
  const monthName = useMemo(() => {
    return format(monthDate, 'MMMM yyyy');
  }, [monthDate]);

  const calendarDays = useMemo(() => {
    return generateCalendarDays(monthDate);
  }, [monthDate]);

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-smallCard ${className}`}>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
        {monthName}
      </h4>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
          <div key={idx} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, dayIndex) => {
          if (!day.isCurrentMonth) {
            return <div key={dayIndex} style={{ aspectRatio: '5 / 3' }} />;
          }
          return renderDay(day, dayIndex);
        })}
      </div>
    </div>
  );
};

/**
 * Dynamic Calendar Component
 * A flexible calendar that can be configured for different use cases (tasks, days off, etc.)
 * 
 * @param {Object} props
 * @param {Date} props.initialMonth - Initial month to display
 * @param {Function} props.renderDay - Function to render each day cell: (day, dayIndex, dayData) => ReactNode
 * @param {Function} props.getDayData - Function to get data for a specific day: (date) => any
 * @param {Function} props.onMonthChange - Callback when month changes: (year, month) => void
 * @param {Object} props.config - Configuration object
 * @param {boolean} config.showNavigation - Show month/year navigation (default: true)
 * @param {boolean} config.showMultipleMonths - Show all months in year (default: false)
 * @param {string} config.title - Calendar title
 * @param {string} config.description - Calendar description
 * @param {string} config.emptyMessage - Message when no data
 * @param {Function} config.emptyCheck - Function to check if calendar should be hidden: (data) => boolean
 * @param {string} config.className - Additional CSS classes
 * @param {Object} config.monthClassName - CSS classes for month container
 * @param {ReactNode} props.headerActions - Additional actions in header
 * @param {ReactNode} props.footer - Footer content
 */
const DynamicCalendar = ({
  initialMonth = new Date(),
  renderDay,
  getDayData,
  onMonthChange,
  config = {},
  headerActions,
  footer,
  children
}) => {
  const {
    showNavigation = true,
    showMultipleMonths = false,
    title = 'Calendar',
    description = '',
    emptyMessage = 'No data available',
    emptyCheck = null,
    className = '',
    monthClassName = '',
    selectedMonthClassName = '',
    selectedMonthId = null
  } = config;

  const [currentYear, setCurrentYear] = useState(initialMonth.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth.getMonth());

  // Update when initialMonth changes
  React.useEffect(() => {
    setCurrentYear(initialMonth.getFullYear());
    setCurrentMonth(initialMonth.getMonth());
  }, [initialMonth]);

  // Generate months to display
  const months = useMemo(() => {
    if (showMultipleMonths) {
      // Show all 12 months of the year
      const months = [];
      for (let month = 0; month < 12; month++) {
        months.push(new Date(currentYear, month, 1));
      }
      return months;
    } else {
      // Show only current month
      return [new Date(currentYear, currentMonth, 1)];
    }
  }, [currentYear, currentMonth, showMultipleMonths]);

  // Check if we should show the calendar
  const shouldShowCalendar = useMemo(() => {
    if (!emptyCheck) return true;
    // Sample a few days to check if there's any data
    const sampleDays = generateCalendarDays(new Date(currentYear, currentMonth));
    const hasData = sampleDays.some(day => {
      if (!day.isCurrentMonth) return false;
      const dayData = getDayData ? getDayData(day.date) : null;
      return dayData !== null && dayData !== undefined;
    });
    return !emptyCheck({ hasData, months });
  }, [emptyCheck, currentYear, currentMonth, months, getDayData]);

  // Navigation handlers
  const handlePreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  }, [currentMonth]);

  const handlePreviousYear = useCallback(() => {
    setCurrentYear(prev => prev - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setCurrentYear(prev => prev + 1);
  }, []);

  // Notify parent of month changes
  React.useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentYear, currentMonth);
    }
  }, [currentYear, currentMonth, onMonthChange]);

  // Check if a month is selected (for highlighting)
  const isMonthSelected = useCallback((monthDate) => {
    if (!selectedMonthId) return false;
    try {
      const [year, month] = selectedMonthId.split('-').map(Number);
      return monthDate.getFullYear() === year && monthDate.getMonth() === month - 1;
    } catch {
      return false;
    }
  }, [selectedMonthId]);

  if (!shouldShowCalendar) {
    return null;
  }

  return (
    <div className={`dynamic-calendar card p-6 space-y-6 ${className}`}>
      {/* Header */}
      {(title || description || showNavigation || headerActions) && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            {title && (
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          
          {showNavigation && !headerActions && (
            <div className="flex items-center gap-2">
              {showMultipleMonths ? (
                <>
                  <button
                    onClick={handlePreviousYear}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    aria-label="Previous year"
                  >
                    <Icons.buttons.chevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
                    {currentYear}
                  </span>
                  <button
                    onClick={handleNextYear}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    aria-label="Next year"
                  >
                    <Icons.buttons.chevronRight className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePreviousMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    aria-label="Previous month"
                  >
                    <Icons.buttons.chevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300 min-w-[200px] text-center">
                    {format(new Date(currentYear, currentMonth), 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    aria-label="Next month"
                  >
                    <Icons.buttons.chevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}

          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Calendar Grid(s) */}
      <div className={showMultipleMonths ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "w-[50%] "}>
        {months.map((monthDate, monthIndex) => {
          const isSelected = isMonthSelected(monthDate);
          const monthClass = isSelected 
            ? `${monthClassName} ${selectedMonthClassName}`.trim()
            : monthClassName;

          return (
            <div key={monthIndex} onClick={(e) => e.stopPropagation()}>
              <BaseCalendarGrid
                monthDate={monthDate}
                className={monthClass}
                renderDay={(day, dayIndex) => {
                  const dayData = getDayData ? getDayData(day.date) : null;
                  return renderDay ? renderDay(day, dayIndex, dayData, monthDate) : null;
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Children (for additional content like legends, filters, etc.) */}
      {children}

      {/* Footer */}
      {footer && (
        <div className="mt-6">
          {footer}
        </div>
      )}
    </div>
  );
};

export default DynamicCalendar;

