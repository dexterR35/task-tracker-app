import React, { forwardRef, useState, useRef, useEffect } from "react";
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
    maxItems,
    // Filter out any other custom props
    ...domProps
  } = props;
  
  return domProps;
};

/**
 * MultiSelectInput Component
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
 * - maxItems: Maximum number of items that can be selected
 * - renderLabel: Whether to render label (default: false)
 * - label: Label text
 * - required: Whether field is required
 * - showError: Whether to show validation errors (default: true)
 * - ...other standard select props
 * 
 * Usage:
 * // Direct usage (DynamicForm)
 * <MultiSelectInput
 *   name="skills"
 *   value={value}
 *   onChange={onChange}
 *   options={skillOptions}
 *   maxItems={5}
 * />
 * 
 * // Standalone usage with label
 * <MultiSelectInput
 *   name="skills"
 *   renderLabel={true}
 *   label="Skills"
 *   required={true}
 *   options={skillOptions}
 *   maxItems={5}
 * />
 */
const MultiSelectInput = forwardRef(({
  name,
  options = [],
  value = [],
  onChange,
  onBlur,
  className = "",
  disabled = false,
  maxItems = 10,
  showError = true,
  renderLabel = false,
  label,
  required = false,
  labelProps = {},
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter out custom props that shouldn't go to DOM
  const domProps = filterDOMProps(props);

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  const filteredOptions = options.filter(option => 
    !selectedValues.includes(option.value) &&
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm("");
    }
  };

  const handleSelect = (option) => {
    if (selectedValues.length >= maxItems) return;
    
    const newValues = [...selectedValues, option.value];
    if (onChange) {
      onChange(newValues);
    }
    setSearchTerm("");
  };

  const handleRemove = (valueToRemove) => {
    const newValues = selectedValues.filter(v => v !== valueToRemove);
    if (onChange) {
      onChange(newValues);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // If value and onChange are provided, use them directly (for DynamicForm usage)
  if (value !== undefined && onChange) {
    return (
      <div className={`multi-select-input-wrapper ${className}`} ref={dropdownRef}>
        <div className="relative">
          <div
            className={`border rounded-md p-2 min-h-[42px] cursor-pointer ${
              isOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(option.value);
                      }}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {selectedOptions.length === 0 && (
                <span className="text-gray-500 text-sm">Select options...</span>
              )}
            </div>
          </div>

          {isOpen && !disabled && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelect(option)}
                    >
                      {option.label}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    No options found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedValues.length >= maxItems && (
          <p className="text-sm text-red-500 mt-1">
            Maximum {maxItems} items reached
          </p>
        )}
      </div>
    );
  }

  // Otherwise, use Field component (for standalone usage)
  return (
    <div className={`multi-select-input-wrapper ${className}`}>
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
              <div className="relative" ref={dropdownRef}>
                <div
                  className={`border rounded-md p-2 min-h-[42px] cursor-pointer ${
                    isOpen ? "border-blue-500 ring-2 ring-blue-200" : 
                    hasError ? "border-red-500" : "border-gray-300"
                  } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  onClick={handleToggle}
                  onKeyDown={handleKeyDown}
                  tabIndex={0}
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-haspopup="listbox"
                >
                  <div className="flex flex-wrap gap-1">
                    {fieldValue.map((value) => {
                      const option = options.find(opt => opt.value === value);
                      return option ? (
                        <span
                          key={option.value}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {option.label}
                          {!disabled && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newValues = fieldValue.filter(v => v !== option.value);
                                field.onChange(newValues);
                              }}
                              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ) : null;
                    })}
                    {fieldValue.length === 0 && (
                      <span className="text-gray-500 text-sm">Select options...</span>
                    )}
                  </div>
                </div>

                {isOpen && !disabled && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search options..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <div
                            key={option.value}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              if (fieldValue.length < maxItems) {
                                const newValues = [...fieldValue, option.value];
                                field.onChange(newValues);
                              }
                            }}
                          >
                            {option.label}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          No options found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Only show error if showError is true */}
              {showError && hasError && (
                <div className="text-red-500 text-sm mt-1">{meta.error}</div>
              )}

              {fieldValue.length >= maxItems && (
                <p className="text-sm text-red-500 mt-1">
                  Maximum {maxItems} items reached
                </p>
              )}
            </>
          );
        }}
      </Field>
    </div>
  );
});

MultiSelectInput.displayName = 'MultiSelectInput';

export default MultiSelectInput; 