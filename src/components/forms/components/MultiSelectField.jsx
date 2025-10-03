import React, { useEffect } from 'react';
import { logger } from '@/utils/logger';

const MultiSelectField = ({ field, register, setValue, watch, errors, trigger, formValues }) => {
  const watchedValue = watch(field.name);
  // Ensure selectedValues is always an array, even if watch returns null, undefined, or non-array
  const selectedValues = Array.isArray(watchedValue) ? watchedValue : [];
  const availableOptions = field.options?.filter(option => !selectedValues.includes(option.value)) || [];
  const fieldError = errors[field.name];

  // Register the field with React Hook Form
  const { onChange, ...registerProps } = register(field.name);

  const handleAddValue = (value) => {
    if (value && !selectedValues.includes(value)) {
      const newValues = [...selectedValues, value];
      setValue(field.name, newValues, { shouldValidate: true });
      trigger(field.name); // Trigger validation
    }
  };

  const handleRemoveValue = (index) => {
    const newValues = selectedValues.filter((_, i) => i !== index);
    setValue(field.name, newValues, { shouldValidate: true });
    trigger(field.name); // Trigger validation
  };

  // Defensive check: Fix non-array values (shouldn't happen with proper form initialization)
  useEffect(() => {
    if (watchedValue !== undefined && !Array.isArray(watchedValue)) {
      logger.warn(`MultiSelectField: Unexpected non-array value for ${field.name}:`, watchedValue, 'Fixing to empty array');
      setValue(field.name, [], { shouldValidate: false });
    }
  }, [watchedValue, field.name, setValue]);

  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="multi-select-container">
        {/* Hidden input for React Hook Form validation */}
        <input
          {...registerProps}
          type="hidden"
          value={JSON.stringify(selectedValues)}
        />
        
        <select
          value=""
          id={field.name}
          className={`form-input ${fieldError ? 'error' : ''}`}
          onChange={(e) => handleAddValue(e.target.value)}
        >
          <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
          {availableOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Selected Items Display with Badges */}
        {selectedValues.length > 0 && (
          <div className="selected-items-container mt-3">
            <div className="text-xs text-gray-500 mb-2">Selected {field.label.toLowerCase()}:</div>
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((item, index) => {
                const option = field.options?.find(opt => opt.value === item);
                const label = option?.label || item;
                
                // Get color based on field type
                const getBadgeColor = () => {
                  if (field.name === 'markets') return '#3b82f6'; // Blue for markets
                  if (field.name === 'aiModels') return '#10b981'; // Green for AI models
                  if (field.name === 'products') return '#f59e0b'; // Orange for products
                  if (field.name === 'departments') return '#8b5cf6'; // Purple for departments
                  return '#6b7280'; // Gray default
                };
                
                const badgeColor = getBadgeColor();
                
                return (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: badgeColor }}
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(index)}
                      className="ml-2 hover:opacity-75 transition-opacity"
                      style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default MultiSelectField;
