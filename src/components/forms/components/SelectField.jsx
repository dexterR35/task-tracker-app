/**
 * Select Field Component
 * 
 * @fileoverview Reusable select dropdown field with validation and error handling
 * @author Senior Developer
 * @version 2.0.0
 */

import React from 'react';
import Badge from '@/components/ui/Badge/Badge';

/**
 * Select Field Component
 * @param {Object} props - Component props
 * @param {Object} props.field - Field configuration object
 * @param {Function} props.register - React Hook Form register function
 * @param {Object} props.errors - Form errors object
 * @param {Object} props.formValues - Current form values
 * @param {Function} props.watch - React Hook Form watch function
 * @param {Function} props.setValue - React Hook Form setValue function
 * @returns {JSX.Element} - Select field component
 */
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
        <label htmlFor={field.name} className="field-label">
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
            variant="crimson"
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
