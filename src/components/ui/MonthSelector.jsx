import { useState } from "react";
import dayjs from "dayjs";
import Calendar from "./Calendar";

const MonthSelector = ({ 
  selectedMonth, 
  onMonthSelect, 
  className = "",
  disabled = false,
  showCalendar = false 
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleMonthSelect = (date) => {
    const monthId = date.format("YYYY-MM");
    onMonthSelect(monthId);
    setIsCalendarOpen(false);
  };

  const handleDropdownChange = (e) => {
    onMonthSelect(e.target.value);
  };

  const generateMonthOptions = () => {
    const months = [];
    const currentDate = dayjs();
    const currentYear = currentDate.year();
    
    // Generate months for current year to 3 years ahead
    for (let yearOffset = 0; yearOffset <= 3; yearOffset++) {
      const year = currentYear + yearOffset;
      
      for (let month = 1; month <= 12; month++) {
        const monthDate = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`);
        const monthId = monthDate.format("YYYY-MM");
        const monthName = monthDate.format("MMMM YYYY");
        const isCurrentMonth = monthId === currentDate.format("YYYY-MM");
        const isDisabled = year > currentYear; // Disable future years
        
        months.push(
          <option 
            key={monthId} 
            value={monthId}
            disabled={isDisabled}
          >
            {monthName} {isCurrentMonth ? '(Current)' : ''} {isDisabled ? '(Disabled)' : ''}
          </option>
        );
      }
    }
    return months;
  };

  return (
    <div className={`relative ${className}`}>
      {showCalendar ? (
        <div>
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="block truncate">
              {dayjs(selectedMonth + "-01").format("MMMM YYYY")}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
          
          {isCalendarOpen && (
            <div className="absolute z-50 mt-1 w-80">
              <Calendar
                selectedDate={dayjs(selectedMonth + "-01")}
                onDateSelect={handleMonthSelect}
                maxDate={dayjs()}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      ) : (
        <select
          value={selectedMonth}
          onChange={handleDropdownChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateMonthOptions()}
        </select>
      )}
      
      {/* Click outside to close calendar */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsCalendarOpen(false)}
        />
      )}
    </div>
  );
};

export default MonthSelector;
