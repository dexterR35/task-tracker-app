import React, { useState, useRef, useEffect } from 'react';

const MultiValueInput = ({
  value = [],
  onChange,
  placeholder = "Enter values...",
  separator = /[,\s]+/, // Split by comma or whitespace
  className = "",
  disabled = false,
  maxValues = 10,
  ...props
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const values = Array.isArray(value) ? value : [];

  const addValue = (newValue) => {
    if (!newValue || values.includes(newValue) || values.length >= maxValues) return;
    
    const updatedValues = [...values, newValue.trim()];
    onChange(updatedValues);
    setInputValue("");
  };

  const removeValue = (valueToRemove) => {
    const updatedValues = values.filter(v => v !== valueToRemove);
    onChange(updatedValues);
  };

  const handleInputChange = (e) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addValue(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
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
    const pastedText = e.clipboardData.getData('text');
    const newValues = pastedText.split(separator).map(v => v.trim()).filter(v => v);
    
    newValues.forEach(val => {
      if (!values.includes(val) && values.length < maxValues) {
        addValue(val);
      }
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`min-h-[42px] p-2 border rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors ${
          isFocused ? 'border-blue-500' : 'border-gray-600'
        } ${disabled ? 'bg-gray-700 cursor-not-allowed' : 'bg-primary'}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Display existing values as tags */}
        <div className="flex flex-wrap gap-1 mb-1">
          {values.map((val, index) => (
            <span
              key={`${val}-${index}`}
              className="inline-flex items-center px-2 py-1 rounded-md bg-blue-600 text-gray-200 text-sm"
            >
              {val}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(val);
                  }}
                  className="ml-1 text-gray-300 hover:text-white"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={values.length === 0 ? placeholder : "Add more values..."}
          disabled={disabled || values.length >= maxValues}
          className="w-full outline-none bg-transparent text-gray-200 placeholder-gray-500"
          {...props}
        />
      </div>
      
      {/* Helper text */}
      {values.length >= maxValues && (
        <p className="text-xs text-gray-500 mt-1">
          Maximum {maxValues} values reached
        </p>
      )}
    </div>
  );
};

export default MultiValueInput; 