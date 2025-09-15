import React, { useEffect } from 'react';
import BaseField from './BaseField';
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
    <BaseField field={field} error={fieldError} formValues={formValues}>
      {/* Hidden input for React Hook Form validation */}
      <input
        {...registerProps}
        type="hidden"
        value={JSON.stringify(selectedValues)}
      />
      
      <select
        value=""
        className="form-input"
        onChange={(e) => handleAddValue(e.target.value)}
      >
        <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
        {availableOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Selected Items Display */}
      {selectedValues.length > 0 && (
        <div className="selected-items-container">
          <div className="selected-items-list">
            {selectedValues.map((item, index) => (
              <span
                key={index}
                className="selected-item"
              >
                {field.options?.find(opt => opt.value === item)?.label || item}
                <button
                  type="button"
                  onClick={() => handleRemoveValue(index)}
                  className="ml-2 hover:opacity-75"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </BaseField>
  );
};

export default MultiSelectField;
