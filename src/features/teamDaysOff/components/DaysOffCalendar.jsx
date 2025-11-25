import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, getDaysInMonth, addDays, startOfWeek, eachMonthOfInterval } from 'date-fns';
import { Icons } from '@/components/icons';

/**
 * Calendar component to display days off for each user per month
 */
const DaysOffCalendar = ({ teamDaysOff = [] }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Generate months for the current year
  const months = useMemo(() => {
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    return eachMonthOfInterval({ start: startDate, end: endDate });
  }, [currentYear]);

  // Get days off entry for a specific user
  const getUserDaysOffEntry = (userUID) => {
    const entry = teamDaysOff.find(e => (e.userUID || e.userId) === userUID);
    return entry;
  };

  // Check if a user has days off (we don't track specific dates, just totals)
  const hasDaysOff = (userUID) => {
    const entry = getUserDaysOffEntry(userUID);
    return entry && (entry.daysOff || 0) > 0;
  };

  // Generate calendar days for a month
  const generateCalendarDays = (monthDate) => {
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

  const navigateYear = (direction) => {
    setCurrentYear(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  return (
    <div className="days-off-calendar card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Days Off Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateYear('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Icons.buttons.chevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
            {currentYear}
          </span>
          <button
            onClick={() => navigateYear('next')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Icons.buttons.chevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map((monthDate, monthIndex) => {
          const calendarDays = generateCalendarDays(monthDate);
          const monthName = format(monthDate, 'MMMM yyyy');
          
          return (
            <div key={monthIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-smallCard">
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
                    return <div key={dayIndex} className="aspect-square" />;
                  }

                  // Check which users have days off (we show all users with daysOff > 0)
                  // Since we don't track specific dates, we'll show users who have taken days off
                  const usersOff = teamDaysOff.filter(entry => 
                    hasDaysOff(entry.userUID || entry.userId)
                  );

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        aspect-square rounded text-xs flex items-center justify-center
                        ${usersOff.length > 0 
                          ? 'bg-blue-500 text-white font-semibold' 
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }
                      `}
                      title={usersOff.length > 0 ? `${usersOff.length} user(s) off` : ''}
                    >
                      {day.date.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* User legend for this month */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {teamDaysOff
                    .filter(entry => (entry.daysOff || 0) > 0)
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span className="text-xs">
                          {entry.userName}: {entry.daysOff?.toFixed(2) || 0} days off
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DaysOffCalendar;

