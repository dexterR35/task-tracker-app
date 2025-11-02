
import React from 'react';
import Badge from '@/components/ui/Badge/Badge';


const TextField = ({ field, register, errors, formValues, watch, setValue }) => {
  const fieldError = errors[field.name];
  const currentValue = watch ? watch(field.name) : '';
  
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
      
      <input
        {...register(field.name)}
        id={field.name}
        type={field.type || 'text'}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
        value={
          formValues && Object.prototype.hasOwnProperty.call(formValues, field.name)
            ? formValues[field.name]
            : undefined
        }
        onChange={(e) => {
          if (setValue) {
            setValue(field.name, e.target.value);
          }
        }}
      />
      
      {/* Badge display for JIRA field */}
      {currentValue && field.name === 'jiraLink' && (
        <div className="mt-2">
          <Badge
            variant="select_badge"
            size="sm"
            className="inline-flex items-center gap-1"
          >
            <span className='text-inherit'>{currentValue}</span>
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

export default TextField;
