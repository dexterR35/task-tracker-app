
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
  
  // Get the register props
  const registerProps = register ? register(field.name) : {};
  
  // Check if we're using manual control (when register returns empty object or no ref)
  // react-hook-form register always returns a ref, so if there's no ref, it's manual control
  const isManualControl = !registerProps || Object.keys(registerProps).length === 0 || !registerProps.ref;
  
  // For manual control, always provide a value (even if empty string) to avoid controlled/uncontrolled warning
  // For react-hook-form, don't provide value prop (let register handle it)
  const inputValue = isManualControl
    ? (formValues && formValues[field.name] !== undefined ? formValues[field.name] : '')
    : undefined;
  
  const handleChange = (e) => {
    if (isManualControl && setValue) {
      setValue(field.name, e.target.value);
    }
  };
  
  // Build input props based on control type
  const inputProps = isManualControl
    ? {
        id: field.name,
        name: field.name,
        type: field.type || 'text',
        placeholder: field.placeholder,
        autoComplete: field.autoComplete || 'off',
        readOnly: field.readOnly || false,
        disabled: field.disabled || false,
        value: inputValue,
        onChange: handleChange,
      }
    : {
        ...registerProps,
        id: field.name,
        type: field.type || 'text',
        placeholder: field.placeholder,
        autoComplete: field.autoComplete || 'off',
        readOnly: field.readOnly || false,
        disabled: field.disabled || false,
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
        {...inputProps}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
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
