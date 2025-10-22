import React, { useState, useEffect } from 'react';
import { getWeeksInMonth, getCurrentWeekNumber } from '@/utils/monthUtils';
import { logger } from '@/utils/logger';

const WeekSelector = ({ 
  monthId, 
  onWeekChange,
  selectedWeek = null,
  className = "",
  id = "weekSelector",
  placeholder = "Select Week"
}) => {
  const [weeks, setWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get weeks for the current month
  useEffect(() => {
    if (!monthId) {
      setWeeks([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const monthWeeks = getWeeksInMonth(monthId);
      setWeeks(monthWeeks);
    } catch (error) {
      logger.error('Error getting weeks for month:', error);
      setWeeks([]);
    } finally {
      setIsLoading(false);
    }
  }, [monthId]);

  const handleChange = (e) => {
    const weekNumber = e.target.value;
    if (!weekNumber) {
      onWeekChange?.(null);
      return;
    }
    
    try {
      const weekNumberInt = parseInt(weekNumber);
      const week = weeks.find(w => w.weekNumber === weekNumberInt);
      onWeekChange?.(week || null);
    } catch (error) {
      console.warn('Error selecting week:', error);
    }
  };

  const currentValue = selectedWeek?.weekNumber || "";

  return (
    <select
      id={id}
      value={currentValue}
      onChange={handleChange}
      disabled={isLoading}
      className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <option value="">{placeholder}</option>
      {weeks && weeks.length > 0 ? (
        weeks.map((week) => (
          <option key={week.weekNumber} value={week.weekNumber}>
            Week {week.weekNumber}
          </option>
        ))
      ) : (
        <option value="" disabled>
          {isLoading ? "Loading weeks..." : "No weeks available"}
        </option>
      )}
    </select>
  );
};

export default WeekSelector;
