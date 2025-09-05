import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Field } from "formik";

/**
 * Utility function to filter out props that shouldn't be passed to DOM elements
 */
const filterDOMProps = (props) => {
  const {
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
    maxValues,
    addButtonText,
    removeButtonText,
    ...domProps
  } = props;
  
  return domProps;
};

const MultiValueInput = forwardRef(({
  name, // Add name prop
  value = [],
  onChange,
  onBlur,
  placeholder = "Enter values...",
  separator = /[,\s]+/, // Split by comma or whitespace
  className = "",
  disabled = false,
  maxValues = 10,
  addButtonText = "Add",
  removeButtonText = "Remove",
  showError = true,
  renderLabel = false,
  label,
  required = false,
  labelProps = {},
  // Filter out custom props that shouldn't go to DOM
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Filter out custom props that shouldn't be passed to DOM elements
  const domProps = filterDOMProps(props);

  const values = Array.isArray(value) ? value : [];

  const addValue = (newValue, onChangeHandler = onChange) => {
    if (!newValue || values.includes(newValue) || values.length >= maxValues)
      return;

    const updatedValues = [...values, newValue.trim()];
    if (onChangeHandler && typeof onChangeHandler === 'function') {
      onChangeHandler(updatedValues);
    }
    setInputValue("");
  };

  const removeValue = (valueToRemove, onChangeHandler = onChange) => {
    const updatedValues = values.filter((v) => v !== valueToRemove);
    if (onChangeHandler && typeof onChangeHandler === 'function') {
      onChangeHandler(updatedValues);
    }
  };

  const handleInputChange = (e) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addValue(inputValue.trim());
      }
    } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
      // Remove last value on backspace when input is empty
      removeValue(values[values.length - 1]);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      addValue(inputValue.trim());
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const newValues = pastedText
      .split(separator)
      .map((v) => v.trim())
      .filter((v) => v);

    newValues.forEach((val) => {
      if (!values.includes(val) && values.length < maxValues) {
        addValue(val);
      }
    });
  };

  // Render the input component
  const renderInput = (onChangeHandler = onChange, onBlurHandler = onBlur, hasError = false) => (
    <div className={`relative ${className}`}>
      <div
        className={`border rounded-md p-2 space-y-2 ${
          isFocused ? "border-blue-500 ring-2 ring-blue-200" : 
          hasError ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Input field */}
        <input
          ref={inputRef}
          name={name}
          id={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={values.length === 0 ? placeholder : "Add more values..."}
          disabled={disabled || values.length >= maxValues}
          className="w-full px-3 py-2 border-0 outline-none text-sm bg-transparent"
          {...domProps}
        />
        
        {/* Display existing values as tags */}
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {values.map((val, index) => (
              <span
                key={`${val}-${index}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                title={`${removeButtonText} ${val}`}
              >
                {val}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(val, onChangeHandler);
                    }}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                    aria-label={`${removeButtonText} ${val}`}
                    title={`${removeButtonText} ${val}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      {values.length >= maxValues && (
        <p className="text-sm text-red-500 mt-1">
          Maximum {maxValues} values reached
        </p>
      )}
      
      {/* Add button for better UX */}
      {inputValue.trim() && values.length < maxValues && (
        <button
          type="button"
          onClick={() => addValue(inputValue.trim(), onChangeHandler)}
          className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          disabled={disabled}
        >
          {addButtonText}
        </button>
      )}
    </div>
  );

  // If value and onChange are provided, use them directly (for DynamicForm usage)
  if (value !== undefined && onChange) {
    return renderInput();
  }

  // Otherwise, use Field component (for standalone usage)
  return (
    <div className={`multi-value-input-wrapper ${className}`}>
      {renderLabel && label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Field name={name}>
        {({ field, meta }) => {
          const hasError = meta.touched && meta.error;
          const fieldValue = Array.isArray(field.value) ? field.value : [];
          
          return (
            <>
              {renderInput(
                (newValues) => field.onChange(newValues),
                field.onBlur,
                hasError
              )}
              
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

MultiValueInput.displayName = 'MultiValueInput';

export default MultiValueInput;
