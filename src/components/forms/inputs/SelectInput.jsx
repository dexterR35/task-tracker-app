import React, { forwardRef } from "react";
import { Field } from "formik";

/**
 * Utility function to filter out props that shouldn't be passed to DOM elements
 * This prevents React warnings about unrecognized props
 */
const filterDOMProps = (props) => {
  const {
    // Common custom props that shouldn't go to DOM
    renderLabel,
    label,
    required,
    labelProps,
    showError,
    showLabel,
    showDescription,
    description,
    helpText,
    validation,
    conditional,
    options,
    // Filter out any other custom props
    ...domProps
  } = props;
  
  return domProps;
};

/**
 * SelectInput Component
 * 
 * This component supports two modes:
 * 1. Direct usage with value/onChange props (for DynamicForm)
 * 2. Formik Field usage (for standalone forms)
 * 
 * Props:
 * - name: Field name
 * - value: Field value (for direct usage)
 * - onChange: Change handler (for direct usage)
 * - options: Array of options [{value, label}]
 * - renderLabel: Whether to render label (default: false)
 * - label: Label text
 * - required: Whether field is required
 * - showError: Whether to show validation errors (default: true)
 * - ...other standard select props
 * 
 * Usage:
 * // Direct usage (DynamicForm)
 * <SelectInput
 *   name="country"
 *   value={value}
 *   onChange={onChange}
 *   options={countryOptions}
 * />
 * 
 * // Standalone usage with label
 * <SelectInput
 *   name="country"
 *   renderLabel={true}
 *   label="Country"
 *   required={true}
 *   options={countryOptions}
 * />
 */
const SelectInput = forwardRef(({
  name,
  options = [],
  value,
  onChange,
  onBlur,
  className = "",
  disabled = false,
  showError = true,
  renderLabel = false,
  label,
  required = false,
  labelProps = {},
  placeholder = "Select an option",
  ...props
}, ref) => {
  // Filter out custom props that shouldn't go to DOM
  const domProps = filterDOMProps(props);

  // Validate and normalize options
  const normalizedOptions = Array.isArray(options) ? options.filter(option => 
    option && (typeof option === 'string' || (typeof option === 'object' && (option.value || option.label)))
  ) : [];

  // If value and onChange are provided, use them directly (for DynamicForm usage)
  if (value !== undefined && onChange) {
    const selectClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;
    
    return (
      <div className={`select-input-wrapper ${className}`}>
        {normalizedOptions.length === 0 && (
          <div className="text-yellow-600 text-sm mb-2">
            ⚠️ No options available for {name}
          </div>
        )}
        <select
          name={name}
          id={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
          disabled={disabled || normalizedOptions.length === 0}
          className={selectClasses}
          {...domProps}
        >
          <option value="">{placeholder}</option>
          {normalizedOptions.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Otherwise, use Field component (for standalone usage)
  return (
    <div className={`select-input-wrapper ${className}`}>
      {renderLabel && label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {normalizedOptions.length === 0 && (
        <div className="text-yellow-600 text-sm mb-2">
          ⚠️ No options available for {name}
        </div>
      )}
      
      <Field name={name}>
        {({ field, meta }) => {
          const hasError = meta.touched && meta.error;
          const selectClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            hasError ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;
          
          return (
            <>
              <select
                {...field}
                {...domProps}
                ref={ref}
                disabled={disabled || normalizedOptions.length === 0}
                className={selectClasses}
              >
                <option value="">{placeholder}</option>
                {normalizedOptions.map((option) => (
                  <option key={option.value || option} value={option.value || option}>
                    {option.label || option}
                  </option>
                ))}
              </select>
              
              {/* Only show error if showError is true */}
              {showError && hasError && (
                <div className="text-red-500 text-sm mt-1">{meta.error}</div>
              )}
            </>
          );
        }}
      </Field>
    </div>
  );
});

SelectInput.displayName = 'SelectInput';

export default SelectInput; 