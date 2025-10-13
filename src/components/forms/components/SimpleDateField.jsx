import React, { useState, useRef, useEffect } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { getMonthBoundaries, getMonthInfo } from '@/utils/monthUtils.jsx';
import { format, startOfMonth, endOfMonth, getDaysInMonth, addDays, startOfWeek, endOfWeek } from 'date-fns';

const SimpleDateField = ({ 
  field, 
  register, 
  errors, 
  setValue, 
  watch, 
  trigger, 
  clearErrors,
  formValues 
}) => {
  const { monthId, monthName } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date(monthId));
  const inputRef = useRef(null);
  
  const fieldName = field.name;
  const error = errors[fieldName];
  const watchedValue = watch(fieldName);

  // Navigation functions for month selection
  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  useEffect(() => {
    if (watchedValue) {
      setSelectedDate(watchedValue);
    }
  }, [watchedValue]);

  const handleDateSelect = (date) => {
    // Create date without timezone issues
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    const day = date.getDate();
    
    // Format as YYYY-MM-DD to avoid timezone issues
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDate(dateStr);
    setValue(fieldName, dateStr);
    trigger(fieldName);
    setIsOpen(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Select a date';
    
    // Parse date string (YYYY-MM-DD) to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month - 1 because Date constructor expects 0-11
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateCalendarDays = () => {
    // Use month utilities for consistent date handling
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
    
    const days = [];
    const today = new Date();
    
    // Use month boundaries for date restrictions
    const minDate = new Date(2020, 0, 1); // Allow dates from 2020 onwards
    const maxDate = new Date(2030, 11, 31); // Allow dates up to 2030

    // Generate 42 days (6 weeks) starting from calendar start
    for (let i = 0; i < 42; i++) {
      const date = addDays(calendarStart, i);
      
      const isCurrentMonth = date >= monthStart && date <= monthEnd;
      const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      
      // Create date string for comparison (avoid timezone issues)
      const dateStr = format(date, 'yyyy-MM-dd');
      const isSelected = selectedDate === dateStr;
      
      // Use proper date comparison with month boundaries
      const isDisabled = date < minDate || date > maxDate;
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      });
    }
    
    return days;
  };

  // No month navigation - restricted to current month only
  // Use date-fns for month name formatting
  const currentMonthName = format(currentMonth, 'MMMM yyyy');

  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Hidden input for form registration */}
        <input
          type="hidden"
          {...register(fieldName)}
          value={selectedDate}
        />
        
        {/* Custom input display */}
        <div
          ref={inputRef}
          className={`
            w-full px-4 py-3 border rounded-lg cursor-pointer transition-all duration-200
            ${error 
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500'
            }
            focus:ring-2 focus:ring-opacity-20
          `}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm ${selectedDate ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {selectedDate ? formatDate(selectedDate) : 'Select a date'}
            </span>
            <svg className="w-5 h-5 text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Large Calendar Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Calendar */}
            <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-6 w-96 max-w-full">
              {/* Calendar Header - With Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-gray-800">
                  {currentMonthName}
                </h3>
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                    disabled={day.isDisabled}
                    className={`
                      w-10 h-10 text-sm rounded-lg font-medium transition-all duration-200
                      ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${day.isToday ? 'bg-blue-500 text-white font-bold shadow-lg' : ''}
                      ${day.isSelected ? 'bg-blue-600 text-white font-bold shadow-lg' : ''}
                      ${day.isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50 hover:text-blue-700'}
                      ${!day.isCurrentMonth ? 'hover:bg-gray-50' : ''}
                      ${!day.isToday && !day.isSelected && !day.isDisabled ? 'hover:scale-105' : ''}
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Select any date (2020-2030)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {error && <div className="error-message">{error.message}</div>}
    </div>
  );
};

export default SimpleDateField;
