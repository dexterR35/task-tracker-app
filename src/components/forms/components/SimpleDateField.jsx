import React from 'react';
import { useAppData } from '@/hooks/useAppData';
import BaseField from './BaseField';


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
  
  const fieldName = field.name;
  const error = errors[fieldName];

  // Get month boundaries for date restrictions - ALWAYS restrict to current month only
  const getMonthBoundaries = () => {
    // Use current month from monthId (e.g., "2025-01")
    const [year, month] = monthId.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    return {
      min: `${year}-${String(parseInt(month)).padStart(2, '0')}-01`,
      max: `${year}-${String(parseInt(month)).padStart(2, '0')}-${lastDay}`
    };
  };

  const monthBoundaries = getMonthBoundaries();
  const currentMonthName = monthName;

  return (
    <BaseField field={field} error={error} formValues={formValues}>
      <div className="simple-date-field-container">
        <div className="mb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select a day within {currentMonthName} (month and year are fixed)
          </p>
        </div>
        
        <input
          type="date"
          {...register(fieldName)}
          min={monthBoundaries.min}
          max={monthBoundaries.max}
          className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'error' : ''}`}
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
