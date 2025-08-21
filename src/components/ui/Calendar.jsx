import { useState, useMemo } from "react";
import dayjs from "dayjs";

const Calendar = ({ 
  selectedDate, 
  onDateSelect, 
  minDate = null, 
  maxDate = null,
  className = "",
  disabled = false 
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || dayjs());

  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');

    const days = [];
    let day = startOfCalendar;

    while (day.isBefore(endOfCalendar) || day.isSame(endOfCalendar, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }

    return days;
  }, [currentMonth]);

  const isCurrentMonth = (date) => {
    return date.isSame(currentMonth, 'month');
  };

  const isSelected = (date) => {
    return selectedDate && date.isSame(selectedDate, 'day');
  };

  const isToday = (date) => {
    return date.isSame(dayjs(), 'day');
  };

  const isDisabled = (date) => {
    if (disabled) return true;
    if (minDate && date.isBefore(minDate, 'day')) return true;
    if (maxDate && date.isAfter(maxDate, 'day')) return true;
    return false;
  };

  const handleDateClick = (date) => {
    if (!isDisabled(date)) {
      onDateSelect(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const goToToday = () => {
    setCurrentMonth(dayjs());
    onDateSelect(dayjs());
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={goToPreviousMonth}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentMonth.format('MMMM YYYY')}
          </h2>
          <button
            onClick={goToToday}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Today
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled(date)}
              className={`
                relative p-2 text-sm rounded-lg transition-colors
                ${isCurrentMonth(date) ? 'text-gray-900' : 'text-gray-400'}
                ${isSelected(date) ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                ${isToday(date) && !isSelected(date) ? 'bg-blue-100 text-blue-900' : ''}
                ${isDisabled(date) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {date.format('D')}
              {isToday(date) && !isSelected(date) && (
                <div className="absolute top-1 right-1 w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
