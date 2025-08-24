import React, { useState, useRef, useEffect } from "react";

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
    if (!newValue || values.includes(newValue) || values.length >= maxValues)
      return;

    const updatedValues = [...values, newValue.trim()];
    onChange(updatedValues);
    setInputValue("");
  };

  const removeValue = (valueToRemove) => {
    const updatedValues = values.filter((v) => v !== valueToRemove);
    onChange(updatedValues);
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

  return (
    <div className={`relative ${className}`}>
      <div
        className={` rounded-md space-y-2 ${
          isFocused ? "border-focus" : "border-gray-700"
        } ${disabled ? "bg-gray-700 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
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
          className="w-full text-gray-200 "
          {...props}
        />
        {/* Display existing values as tags */}
        <div className="flex flex-col gap-1 text-xs">
          {values.map((val, index) => (
            <span key={`${val}-${index}`} className="rounded-grid-small !w-fit">
              {val}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(val);
                  }}
                  className="ml-2 text-gray-800"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

      
      </div>

      {/* Helper text */}
      {values.length >= maxValues && (
        <p className="text-md font-medium text-red-error mt-1">
          Maximum {maxValues} values reached
        </p>
      )}
    </div>
  );
};

export default MultiValueInput;
