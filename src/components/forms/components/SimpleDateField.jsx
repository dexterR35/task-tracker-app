import React from 'react';
import { useAppData } from '@/hooks/useAppData';
import { getMonthBoundaries } from '@/utils/monthUtils';
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
  const getMonthBoundariesLocal = () => {
    return getMonthBoundaries(monthId);
  };

  const monthBoundaries = getMonthBoundariesLocal();
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
          id={fieldName}
          min={monthBoundaries.min}
          max={monthBoundaries.max}
          className={`form-input ${error ? 'error' : ''}`}
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
