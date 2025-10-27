import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import Badge from '@/components/ui/Badge/Badge';
import { CARD_SYSTEM } from '@/constants';

// Function to get badge color - use select_badge for all selected badges
const getFieldBadgeColor = (fieldName) => {
  return 'select_badge';
};

const SearchableSelectField = ({ 
  field, 
  register, 
  errors, 
  setValue, 
  watch, 
  trigger,
  clearErrors,
  formValues,
  noOptionsMessage = "No options found",
  hideTimeInfo = false
}) => {
  const fieldError = errors[field.name];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(field.options || []);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  const currentValue = watch(field.name);
  const selectedOption = field.options?.find(option => option.value === currentValue);
  

  // Handle initial value when form is reset - fixed infinite loop
  useEffect(() => {
    if (currentValue && field.options && field.options.length > 0) {
      const option = field.options.find(opt => opt.value === currentValue);
      if (option && searchTerm === '') {
        // Only update if we need to show the selected option
        return; // No state update needed
      }
    }
  }, [currentValue, field.options, searchTerm]);


  // Trigger validation when value changes
  useEffect(() => {
    if (trigger && currentValue) {
      trigger(field.name);
    }
  }, [currentValue, trigger, field.name]);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(field.options || []);
    } else {
      const filtered = (field.options || []).filter(option => {
        const searchLower = searchTerm.toLowerCase();
        return (
          option.label.toLowerCase().includes(searchLower) ||
          option.name?.toLowerCase().includes(searchLower) ||
          option.email?.toLowerCase().includes(searchLower) ||
          option.timePerUnit?.toString().includes(searchLower) ||
          option.timeUnit?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredOptions(filtered);
    }
  }, [searchTerm, field.options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    
    // If user is typing and it doesn't match any option, clear the selection
    if (value && !field.options?.some(option => 
      option.label.toLowerCase().includes(value.toLowerCase()) ||
      option.name?.toLowerCase().includes(value.toLowerCase()) ||
      option.email?.toLowerCase().includes(value.toLowerCase())
    )) {
      setValue(field.name, '');
      // Trigger validation when clearing
      if (trigger) {
        trigger(field.name);
      }
    }
  }, [field.options, field.name, setValue, trigger]);

  const handleOptionSelect = useCallback((option) => {
    setValue(field.name, option.value);
    setSearchTerm('');
    setIsOpen(false);
    
    // Clear any existing errors and trigger validation
    if (clearErrors) {
      clearErrors(field.name);
    }
    if (trigger) {
      trigger(field.name);
    }
  }, [field.name, setValue, clearErrors, trigger]);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
    if (e.key === 'Backspace' && !searchTerm && currentValue) {
      // Clear selection when backspace is pressed on empty search
      setValue(field.name, '');
    }
  };

  const handleClear = useCallback(() => {
    setValue(field.name, '');
    setSearchTerm('');
    setIsOpen(false);
    
    // Trigger validation after clearing
    if (trigger) {
      trigger(field.name);
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [field.name, setValue, trigger]);

  // Enhanced display logic with fallback
  const getDisplayValue = () => {
    if (isOpen) {
      return searchTerm;
    }
    
    // Special case for empty value - show "All Weeks" for week field
    if (!currentValue && field.name === "selectedWeek") {
      return "All Weeks";
    }
    
    // First try to use selectedOption if it exists
    if (selectedOption) {
      return selectedOption.name || selectedOption.label || '';
    }
    
    // Fallback: if we have a currentValue but no selectedOption (options not loaded yet)
    // try to find the option again
    if (currentValue && field.options && field.options.length > 0) {
      const fallbackOption = field.options.find(opt => opt.value === currentValue);
      if (fallbackOption) {
        return fallbackOption.name || fallbackOption.label || '';
      }
    }
    
    // If we have a currentValue but no matching option found,
    // it might be a timing issue - try to preserve the display value
    if (currentValue) {
      // Don't return empty - this causes the selection to disappear
      // Instead, try to find the option one more time with a more flexible search
      const flexibleOption = field.options?.find(opt => 
        opt.value === currentValue || 
        opt.label === currentValue || 
        opt.name === currentValue
      );
      if (flexibleOption) {
        return flexibleOption.name || flexibleOption.label || '';
      }
      // If still no match, return empty to avoid showing the UID
      return '';
    }
    
    return '';
  };
  
  const displayValue = getDisplayValue();
  
  // Debug display value
  if (field.name === 'reporters') {
    
    // Additional debugging for edit mode
    if (currentValue && !selectedOption && field.options?.length > 0) {
    }
    
    // Debug the getDisplayValue function step by step
    if (currentValue) {
    }
  }

  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
            className={`form-input w-full pr-10 ${fieldError ? 'error' : ''}`}
            autoComplete="off"
          />
          
          {/* Clear button */}
          {(currentValue || searchTerm) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Hidden input for form registration */}
        <input
          {...register(field.name)}
          type="hidden"
          value={currentValue || ''}
        />

        {/* Badge display for selected value */}
        {displayValue && (
          <div className="mt-2">
            <Badge
              color={getFieldBadgeColor(field.name)}
              colorHex={CARD_SYSTEM.COLOR_HEX_MAP[getFieldBadgeColor(field.name)]}
              size="sm"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm"
            >
              <span className='text-inherit'>{displayValue}</span>
              <button
                type="button"
                onClick={handleClear}
                className="ml-1 hover:opacity-75 transition-opacity text-inherit"
                title="Remove selection"
              >
                ×
              </button>
            </Badge>
          </div>
        )}

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  onClick={() => handleOptionSelect(option)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    option.value === currentValue ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.name || option.label}
                    </span>
                    {option.email && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {option.email}
                      </span>
                    )}
                    {!hideTimeInfo && option.timePerUnit && option.timeUnit && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {option.timePerUnit} {option.timeUnit}/unit
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                {noOptionsMessage}
              </div>
            )}
          </div>
        )}
      </div>
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(SearchableSelectField, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.field.name === nextProps.field.name &&
    prevProps.field.options === nextProps.field.options &&
    prevProps.watch(prevProps.field.name) === nextProps.watch(nextProps.field.name) &&
    prevProps.errors === nextProps.errors
  );
});