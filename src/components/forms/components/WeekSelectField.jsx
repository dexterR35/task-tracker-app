import React, { useState, useEffect } from 'react';
import { getWeeksInMonth } from '@/utils/monthUtils';
import { logger } from '@/utils/logger';
import Badge from '@/components/ui/Badge/Badge';

const WeekSelectField = ({ 
  monthId,
  selectedWeek,
  onWeekChange,
  label = "Filter by Week",
  className = "",
  disabled = false
}) => {
  const [weeks, setWeeks] = useState([]);

  // Get weeks for the current month
  useEffect(() => {
    if (!monthId) return;
    
    try {
      const monthWeeks = getWeeksInMonth(monthId);
      setWeeks(monthWeeks);
    } catch (error) {
      logger.error('Error getting weeks for month:', error);
    }
  }, [monthId]);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      onWeekChange?.(null);
    } else {
      const weekNumber = parseInt(value);
      const week = weeks.find(w => w.weekNumber === weekNumber);
      onWeekChange?.(week);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <select
        id="week-select"
        name="week-select"
        value={selectedWeek?.weekNumber || ''}
        onChange={handleChange}
        className="w-full "
        disabled={disabled}
      >
        <option value="">All Weeks</option>
        {weeks.map((week) => (
          <option key={week.weekNumber} value={week.weekNumber}>
            Week {week.weekNumber}
          </option>
        ))}
      </select>
      
      {/* Badge display for selected week */}
      {selectedWeek && (
        <div className="mt-2">
          <Badge
            variant="amber"
            size="sm"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md"
          >
            <span className='text-inherit text-xs'>Week {selectedWeek.weekNumber}</span>
            <button
              type="button"
              onClick={() => onWeekChange?.(null)}
              className="ml-1 hover:opacity-75 transition-opacity text-inherit"
              title="Remove week selection"
            >
              ×
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
};

export default WeekSelectField;
