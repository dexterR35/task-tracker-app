import React from 'react';
import { INPUT_CLASSES } from '../utils/formConstants';
import BaseField from './BaseField';

const MultiSelectField = ({ field, setValue, watch, errors }) => {
  const selectedValues = watch(field.name) || [];
  const availableOptions = field.options?.filter(option => !selectedValues.includes(option.value)) || [];
  const fieldError = errors[field.name];

  const handleAddValue = (value) => {
    if (value && !selectedValues.includes(value)) {
      const newValues = [...selectedValues, value];
      setValue(field.name, newValues, { shouldValidate: true });
    }
  };

  const handleRemoveValue = (index) => {
    const newValues = selectedValues.filter((_, i) => i !== index);
    setValue(field.name, newValues, { shouldValidate: true });
  };

  return (
    <BaseField field={field} error={fieldError}>
      <select
        value=""
        className={INPUT_CLASSES}
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
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
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
