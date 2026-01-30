import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import Badge from '@/components/ui/Badge/Badge';
import { Icons } from '@/components/icons';

const SearchableSelectField = ({ 
  field, 
  register = () => ({}), // Optional - only needed for React Hook Form integration
  errors = {}, 
  setValue, 
  watch, 
  trigger = () => {}, // Optional - for form validation
  clearErrors = () => {}, // Optional - for clearing form errors
  noOptionsMessage = "No options found",
  variant = 'select_badge', // Badge variant/color to use (default: 'select_badge')
  disabled = false, // Disable the field

}) => {
  const fieldError = errors[field.name];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(field.options || []);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  const currentValue = watch(field.name);
  const selectedOption = field.options?.find(option => option.value === currentValue);

  // Trigger validation when value changes
  useEffect(() => {
    if (currentValue) {
      trigger(field.name);
    }
  }, [currentValue, trigger, field.name]);

  // Filter options based on search term
  useEffect(() => {
    if (disabled) {
      setFilteredOptions([]);
      setIsOpen(false);
      return;
    }
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
  }, [searchTerm, field.options, disabled]);

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
    if (disabled) return;
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
      trigger(field.name);
    }
  }, [field.options, field.name, setValue, trigger]);

  const handleOptionSelect = useCallback((option) => {
    if (disabled) return;
    setValue(field.name, option.value);
    setSearchTerm('');
    setIsOpen(false);
    
    // Clear any existing errors and trigger validation
    clearErrors(field.name);
    trigger(field.name);
  }, [field.name, setValue, clearErrors, trigger]);

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
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
    trigger(field.name);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [field.name, setValue, trigger]);

  // Enhanced display logic with fallback
  const getDisplayValue = () => {
    if (isOpen) {
      return searchTerm;
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

  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="relative z-10 searchable-select-wrap" ref={dropdownRef}>
        <input
          ref={inputRef}
          id={field.name}
          name={field.name}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={field.placeholder || `Search ${field.label?.toLowerCase() || '...'}...`}
          disabled={disabled}
          readOnly={disabled}
          className={`form-input w-full pr-9 ${fieldError ? 'error' : ''} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
          autoComplete="off"
        />
        <span className="searchable-select-arrow" aria-hidden>
          <Icons.buttons.chevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
        
        {/* Hidden input for form registration - only needed for React Hook Form */}
        {register && typeof register === 'function' && (
          <input
            {...(register(field.name) || {})}
            type="hidden"
            value={currentValue || ''}
          />
        )}

        {/* Badge only when a value is selected and dropdown is closed (hidden while selecting) */}
        <div className="mt-1 min-h-[2rem] flex items-center">
          {displayValue && !isOpen && (
            <Badge
              variant={variant}
              size="sm"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm"
            >
              <span className='text-inherit'>{displayValue}</span>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="ml-1 hover:opacity-75 transition-opacity text-inherit disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove selection"
              >
                ×
              </button>
            </Badge>
          )}
        </div>

        {isOpen && (
          <div className="absolute card p-0 z-[9999] w-full mt-1 max-h-60 overflow-auto shadow-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  onClick={() => handleOptionSelect(option)}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-900 transition-colors ${
                    option.value === currentValue ? 'bg-blue-900' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-300 dark:text-gray-200 truncate">
                      {option.name || option.label}
                    </span>
                    {option.email && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-400 lowercase truncate">
                        {option.email}
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