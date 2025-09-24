import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

const DeliverablesField = ({ 
  field, 
  register, 
  errors, 
  setValue, 
  watch, 
  trigger, 
  clearErrors,
  formValues 
}) => {
  const [customDeliverables, setCustomDeliverables] = useState([]);
  const [newCustomValue, setNewCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const selectedDeliverables = watch('deliverables') || [];
  const hasOthers = selectedDeliverables.includes('others');
  
  // Initialize custom deliverables from form data if editing
  useEffect(() => {
    if (formValues?.customDeliverables) {
      setCustomDeliverables(formValues.customDeliverables);
    }
  }, [formValues?.customDeliverables]);
  
  // Update form value when custom deliverables change (only when not in the middle of an operation)
  useEffect(() => {
    setValue('customDeliverables', customDeliverables);
  }, [customDeliverables, setValue]);
  
  // Show/hide custom input based on "others" selection
  useEffect(() => {
    setShowCustomInput(hasOthers);
    if (!hasOthers) {
      setCustomDeliverables([]);
      setValue('customDeliverables', []);
      clearErrors('customDeliverables');
    }
  }, [hasOthers, setValue, clearErrors]);
  
  const handleDeliverableChange = (value) => {
    const currentDeliverables = selectedDeliverables || [];
    let newDeliverables;
    
    if (currentDeliverables.includes(value)) {
      // Remove if already selected
      newDeliverables = currentDeliverables.filter(item => item !== value);
    } else {
      // Add if not selected
      newDeliverables = [...currentDeliverables, value];
    }
    
    setValue('deliverables', newDeliverables);
    trigger('deliverables');
  };
  
  const addCustomDeliverable = () => {
    const trimmedValue = newCustomValue.trim();
    if (trimmedValue && !customDeliverables.includes(trimmedValue)) {
      const newCustom = [...customDeliverables, trimmedValue];
      setCustomDeliverables(newCustom);
      setNewCustomValue('');
      // Update form value immediately
      setValue('customDeliverables', newCustom);
      // Trigger validation after a short delay
      setTimeout(() => {
        trigger('customDeliverables');
      }, 0);
    }
  };
  
  const removeCustomDeliverable = (index) => {
    const newCustom = customDeliverables.filter((_, i) => i !== index);
    setCustomDeliverables(newCustom);
    // Update form value immediately
    setValue('customDeliverables', newCustom);
    // Trigger validation after a short delay to prevent conflicts
    setTimeout(() => {
      trigger('customDeliverables');
    }, 0);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomDeliverable();
    }
  };
  
  const error = errors[field.name];
  const customError = errors['customDeliverables'];
  
  return (
    <div className="form-field">
      <label className="form-label">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.helpText && (
        <p className="form-help-text">{field.helpText}</p>
      )}
      
      {/* Standard Deliverables */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {field.options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedDeliverables.includes(option.value)}
              onChange={() => handleDeliverableChange(option.value)}
              className="form-checkbox"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      
      {/* Custom Deliverables Input */}
      {showCustomInput && (
        <div className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Deliverables
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          {/* Input for new custom deliverable */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCustomValue}
              onChange={(e) => setNewCustomValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter custom deliverable..."
              className="form-input flex-1"
            />
            <button
              type="button"
              onClick={addCustomDeliverable}
              disabled={!newCustomValue.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          
          {/* Display custom deliverables as badges */}
          {customDeliverables.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customDeliverables.map((item, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomDeliverable(index)}
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Validation message for custom deliverables */}
          {customError && (
            <p className="text-red-500 text-sm mt-1">{customError.message}</p>
          )}
        </div>
      )}
      
      {/* Standard validation error */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
};

export default DeliverablesField;
