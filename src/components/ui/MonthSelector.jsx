import { useState, useRef, useEffect } from "react";
import { format, isSameMonth, startOfMonth } from "date-fns";
import { DayPicker } from "react-day-picker";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const MonthSelector = ({ 
  selectedMonth, 
  onMonthSelect, 
  className = "",
  disabled = true // Always disabled - read-only
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const buttonRef = useRef(null);
  const calendarRef = useRef(null);

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRef.current && 
        !calendarRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCalendarOpen]);

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      setIsCalendarOpen(false);
    }
  };

  const handleMonthSelect = (date) => {
    console.log('MonthSelector: handleMonthSelect called with date:', date);
    if (date) {
      const selectedMonth = format(date, "yyyy-MM");
      console.log('MonthSelector: calling onMonthSelect with:', selectedMonth);
      onMonthSelect(selectedMonth);
    }
    setIsCalendarOpen(false);
  };

  const isDisabled = (day) => {
    if (disabled) return true;
    
    // Allow clicking on any day
    return false;
  };

  const modifiers = {
    disabled: isDisabled,
    selected: (day) => isSameMonth(day, new Date(selectedMonth + "-01")), // Show selected month as selected
    currentMonth: (day) => isSameMonth(day, new Date()),
  };

  const modifiersStyles = {
    disabled: { 
      color: '#6b7280', 
      backgroundColor: '#374151',
      cursor: 'not-allowed',
      textDecoration: 'line-through'
    },
    selected: { 
      backgroundColor: '#1f71ad', 
      color: 'white',
      fontWeight: 'bold'
    },
    currentMonth: {
      backgroundColor: '#0a2470',
      color: '#1f71ad',
      fontWeight: 'bold'
    },
  };

  const handleButtonClick = () => {
    console.log('MonthSelector: handleButtonClick called, disabled:', disabled);
    // Always disabled - no calendar opening
    return;
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleButtonClick();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isCalendarOpen}
        aria-label={`Select month. Current selection: ${format(new Date(selectedMonth + "-01"), "MMMM yyyy")}`}
        className={`w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-primary text-left focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:border-[var(--color-focus)] hover:border-gray-500 transition-colors text-gray-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="block truncate font-medium text-gray-200">
            {format(new Date(selectedMonth + "-01"), "MMMM yyyy")} (Current Month - Auto)
          </span>
          </div>
          <svg className="h-5 w-5 text-gray-400 transition-transform duration-200" 
            style={{ transform: isCalendarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      
      {isCalendarOpen && (
        <div 
          ref={calendarRef}
          className="absolute z-[9999] mt-1 w-80 bg-primary rounded-lg shadow-xl border border-gray-600 p-4 calendar-dropdown w-fit"
          role="dialog"
          aria-modal="true"
          aria-label="Month selection calendar"
          style={{ top: '100%', left: 0 }}
        >
                      <DayPicker
              mode="single"
              selected={new Date(selectedMonth + "-01")}
              onSelect={handleMonthSelect}
              month={new Date(selectedMonth + "-01")}
              disabled={isDisabled}
              showOutsideDays={true}
              captionLayout="buttons"
              fromYear={new Date().getFullYear() - 1}
              toYear={new Date().getFullYear() + 1}
            className="w-full"
  
            components={{
              IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
              IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
            }}
            footer={
              <div className="text-xs text-gray-400 mt-2">
                💡 Click any day to select that month
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

export default MonthSelector;
