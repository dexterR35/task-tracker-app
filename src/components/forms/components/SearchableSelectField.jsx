import React, { useState, useRef, useEffect } from 'react';
import BaseField from '@/components/forms/components/BaseField';

const SearchableSelectField = ({ 
  field, 
  register, 
  errors, 
  setValue, 
  watch, 
  trigger,
  clearErrors,
  formValues, 
  hideLabel = false 
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

  const handleInputChange = (e) => {
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
  };

  const handleOptionSelect = (option) => {
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
  };

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

  const handleClear = () => {
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
  };

  const displayValue = isOpen ? searchTerm : (selectedOption?.name || selectedOption?.label || '');

  return (
    <BaseField field={field} error={fieldError} formValues={formValues} hideLabel={hideLabel}>
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

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
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
                    {option.timePerUnit && option.timeUnit && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {option.timePerUnit} {option.timeUnit}/unit
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        )}
      </div>
    </BaseField>
  );
};

export default SearchableSelectField;