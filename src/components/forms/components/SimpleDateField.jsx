import React from 'react';
import { useAppData } from '@/hooks/useAppData';
import BaseField from './BaseField';

/**
 * Simple Date Field Component using HTML5 date input
 * Restricts dates to the selected month boundaries
 */
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
  const { currentMonth, selectedMonth } = useAppData();
  
  const fieldName = field.name;
  const fieldValue = watch(fieldName);
  const error = errors[fieldName];

  // Get month boundaries for date restrictions
  const getMonthBoundaries = () => {
    // Use selected month or current month
    const activeMonth = selectedMonth || currentMonth;
    
    if (activeMonth?.monthId) {
      const [year, month] = activeMonth.monthId.split('-');
      return {
        min: `${year}-${String(parseInt(month)).padStart(2, '0')}-01`,
        max: `${year}-${String(parseInt(month)).padStart(2, '0')}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`
      };
    }
    
    // Fallback to current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    
    return {
      min: `${year}-${String(month).padStart(2, '0')}-01`,
      max: `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    };
  };

  const monthBoundaries = getMonthBoundaries();
  const activeMonth = selectedMonth || currentMonth;

  return (
    <BaseField field={field} error={error}>
      <div className="simple-date-field-container">
        <div className="mb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select a date within {activeMonth?.monthName || 'the current month'}
          </p>
        </div>
        
        <input
          type="date"
          {...register(fieldName)}
          min={monthBoundaries.min}
          max={monthBoundaries.max}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onChange={(e) => {
            setValue(fieldName, e.target.value);
            trigger(fieldName);
            clearErrors(fieldName);
          }}
        />
        
        {/* Month Boundaries Info */}
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Available range:</strong> {monthBoundaries.min} to {monthBoundaries.max}
          </p>
        </div>
      </div>
    </BaseField>
  );
};

export default SimpleDateField;
