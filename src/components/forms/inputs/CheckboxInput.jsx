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
 * CheckboxInput Component
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
 * - description: Description text
 * - required: Whether field is required
 * - showError: Whether to show validation errors (default: true)
 * - ...other standard checkbox props
 * 
 * Usage:
 * // Direct usage (DynamicForm)
 * <CheckboxInput
 *   name="agree"
 *   value={value}
 *   onChange={onChange}
 * />
 * 
 * // Standalone usage with label
 * <CheckboxInput
 *   name="agree"
 *   renderLabel={true}
 *   label="I agree to terms"
 *   description="Please read the terms and conditions"
 * />
 */
const CheckboxInput = forwardRef(({
  name,
  value,
  onChange,
  onBlur,
  className = "",
  disabled = false,
  showError = true,
  renderLabel = false,
  label,
  description,
  required = false,
  labelProps = {},
  ...props
}, ref) => {
  // Filter out custom props that shouldn't go to DOM
  const domProps = filterDOMProps(props);

  // If value and onChange are provided, use them directly (for DynamicForm usage)
  if (value !== undefined && onChange) {
    return (
      <div className={`checkbox-input-wrapper ${className}`}>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            name={name}
            id={name}
            type="checkbox"
            checked={value || false}
            onChange={onChange}
            onBlur={onBlur}
            ref={ref}
            disabled={disabled}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...domProps}
          />
          {(renderLabel && (label || description)) && (
            <div className="flex flex-col">
              {label && (
                <span className="text-sm font-medium text-gray-700">
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </span>
              )}
              {description && (
                <span className="text-sm text-gray-500">{description}</span>
              )}
            </div>
          )}
        </label>
      </div>
    );
  }

  // Otherwise, use Field component (for standalone usage)
  return (
    <div className={`checkbox-input-wrapper ${className}`}>
      <Field name={name}>
        {({ field, meta }) => {
          const hasError = meta.touched && meta.error;
          
          return (
            <>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  {...field}
                  {...domProps}
                  ref={ref}
                  type="checkbox"
                  disabled={disabled}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                {(renderLabel && (label || description)) && (
                  <div className="flex flex-col">
                    {label && (
                      <span className="text-sm font-medium text-gray-700">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    )}
                    {description && (
                      <span className="text-sm text-gray-500">{description}</span>
                    )}
                  </div>
                )}
              </label>
              
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

CheckboxInput.displayName = 'CheckboxInput';

export default CheckboxInput; 