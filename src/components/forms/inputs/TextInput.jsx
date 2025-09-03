import React, { forwardRef } from "react";
import { Field } from "formik";
import { sanitizeText } from "@/components/forms/utils/sanitization";

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
 * TextInput Component
 * 
 * This component supports two modes:
 * 1. Direct usage with value/onChange props (for DynamicForm)
 * 2. Formik Field usage (for standalone forms)
 * 
 * Props:
 * - name: Field name
 * - value: Field value (for direct usage)
 * - onChange: Change handler (for direct usage)
 * - renderLabel: Whether to render label (default: false)
 * - label: Label text
 * - required: Whether field is required
 * - showError: Whether to show validation errors (default: true)
 * - ...other standard input props
 * 
 * Usage:
 * // Direct usage (DynamicForm)
 * <TextInput
 *   name="email"
 *   value={value}
 *   onChange={onChange}
 *   placeholder="Enter email"
 * />
 * 
 * // Standalone usage with label
 * <TextInput
 *   name="email"
 *   renderLabel={true}
 *   label="Email Address"
 *   required={true}
 *   placeholder="Enter email"
 * />
 */
const TextInput = forwardRef(({
  name,
  placeholder,
  type = "text",
  disabled = false,
  readOnly = false,
  className = "",
  showError = true, // New prop to control error display
  value,
  onChange,
  onBlur,
  renderLabel = false, // New prop to control label rendering
  label, // Label text
  required = false, // Required state
  labelProps = {}, // Custom label props
  ...props
}, ref) => {
  // Filter out custom props that shouldn't go to DOM
  const domProps = filterDOMProps(props);

  // If value and onChange are provided, use them directly (for DynamicForm usage)
  if (value !== undefined && onChange) {
    const inputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;
    
    return (
      <div className={`text-input-wrapper ${className}`}>
        <input
          name={name}
          id={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={inputClasses}
          {...domProps}
        />
      </div>
    );
  }

  // Otherwise, use Field component (for standalone usage)
  return (
    <div className={`text-input-wrapper ${className}`}>
      {renderLabel && label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Field name={name}>
        {({ field, meta }) => {
          const hasError = meta.touched && meta.error;
          const inputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            hasError ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;
          
          return (
            <>
              <input
                {...field}
                {...domProps}
                ref={ref}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                className={inputClasses}
                onChange={(e) => {
                  // Sanitize input if it's a string
                  if (type === 'text' || type === 'email' || type === 'url') {
                    const sanitizedValue = sanitizeText(e.target.value);
                    field.onChange({
                      ...e,
                      target: { ...e.target, value: sanitizedValue }
                    });
                  } else {
                    field.onChange(e);
                  }
                }}
              />
              
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

TextInput.displayName = 'TextInput';

export default TextInput; 