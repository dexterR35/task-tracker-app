import React, { useEffect } from 'react';
import { logger } from '@/utils/logger';
import Badge from '@/components/ui/Badge/Badge';

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
            <div className="text-xs text-gray-300 mb-2">Selected {field.label.toLowerCase()}:</div>
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((item, index) => {
                const option = field.options?.find(opt => opt.value === item);
                const label = option?.label || item;
                
                // Get variant based on field type
                const getBadgeVariant = () => {
                  if (field.name === 'markets') return 'crimson'; // Amber for markets
                  if (field.name === 'aiModels') return 'crimson'; // Green for AI models
                  return 'default'; // Gray default
                };
                
                const badgeVariant = getBadgeVariant();
                
                return (
                  <Badge
                    key={index}
                    variant={badgeVariant}
                    size="sm"
                    className="inline-flex items-center gap-1"
                  >
                    <span className="text-inherit">{label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(index)}
                      className="ml-1 hover:opacity-75 transition-opacity text-inherit"
                    >
                      ×
                    </button>
                  </Badge>
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
