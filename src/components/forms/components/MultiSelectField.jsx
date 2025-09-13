import React from 'react';
import { 
  INPUT_CLASSES, 
  FIELD_LABEL_CLASSES, 
  ERROR_MESSAGE_CLASSES, 
  HELP_TEXT_CLASSES, 
  REQUIRED_INDICATOR 
} from '../utils/formConstants';

const MultiSelectField = ({ field, setValue, watch, errors }) => {
  const selectedValues = watch(field.name) || [];
  const availableOptions = field.options?.filter(option => !selectedValues.includes(option.value)) || [];
  const fieldError = errors[field.name];
  const isFieldRequired = field.required;

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
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className={FIELD_LABEL_CLASSES}>
          {field.label}
          {isFieldRequired && ` ${REQUIRED_INDICATOR}`}
        </label>
      )}
      
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
      
      {fieldError && (
        <div className={ERROR_MESSAGE_CLASSES}>
          {fieldError.message}
        </div>
      )}
      
      {field.helpText && (
        <p className={HELP_TEXT_CLASSES}>{field.helpText}</p>
      )}
    </div>
  );
};

export default MultiSelectField;
