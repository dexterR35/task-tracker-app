
import React from 'react';
import Badge from '@/components/ui/Badge/Badge';

const SelectField = ({ field, register, errors, formValues, watch, setValue }) => {
  const fieldError = errors[field.name];
  const currentValue = watch ? watch(field.name) : '';
  const selectedOption = field.options?.find(option => option.value === currentValue);
  
  const handleClear = () => {
    if (setValue) {
      setValue(field.name, '');
    }
  };
  
  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label ">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <select
        {...register(field.name)}
        id={field.name}
        className={`form-input ${fieldError ? 'error' : ''}`}
      >
        <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Badge display for selected value */}
      {currentValue && selectedOption && (
        <div className="mt-2">
          <Badge
            variant="amber"
            size="sm"
            className="inline-flex items-center gap-1"
          >
            <span className='text-inherit'>{selectedOption.label}</span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 hover:opacity-75 transition-opacity text-inherit"
            >
              ×
            </button>
          </Badge>
        </div>
      )}
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default SelectField;
