import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { calculateDeliverableTime, formatTimeEstimate, calculateTotalDeliverableTime } from '../../../features/tasks/config/useTaskForm';

const DeliverablesField = ({ 
  field, 
  register, 
  errors, 
  setValue, 
  watch, 
  trigger, 
  clearErrors,
  formValues,
  options = []
}) => {
  const [customDeliverables, setCustomDeliverables] = useState([]);
  const [newCustomValue, setNewCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [declinariQuantities, setDeclinariQuantities] = useState({});
  const [declinariEnabled, setDeclinariEnabled] = useState({});
  
  const selectedDeliverable = watch('deliverables') || '';
  const hasOthers = selectedDeliverable === 'others';
  
  // Initialize custom deliverables and quantities from form data if editing
  useEffect(() => {
    if (formValues?.customDeliverables) {
      setCustomDeliverables(formValues.customDeliverables);
    }
    if (formValues?.deliverableQuantities) {
      setQuantities(formValues.deliverableQuantities);
    }
    if (formValues?.declinariQuantities) {
      setDeclinariQuantities(formValues.declinariQuantities);
    }
    if (formValues?.declinariDeliverables) {
      setDeclinariEnabled(formValues.declinariDeliverables);
    }
  }, [formValues?.customDeliverables, formValues?.deliverableQuantities, formValues?.declinariQuantities, formValues?.declinariDeliverables]);
  
  // Note: setValue is called directly in event handlers to avoid infinite loops
  
  // Show/hide custom input based on "others" selection
  useEffect(() => {
    setShowCustomInput(hasOthers);
    if (!hasOthers) {
      setCustomDeliverables([]);
      setValue('customDeliverables', []);
      clearErrors('customDeliverables');
    }
  }, [hasOthers]);
  
  const handleDeliverableChange = (value) => {
    setValue('deliverables', value);
    
    // Clear previous quantities and declinari
    const newQuantities = {};
    const newDeclinariQuantities = {};
    const newDeclinariEnabled = {};
    
    // Set default quantity to 1 for deliverables that require quantity
    if (value) {
      const deliverable = field.options.find(opt => opt.value === value);
      if (deliverable && deliverable.requiresQuantity) {
        newQuantities[value] = 1;
      }
    }
    
    setQuantities(newQuantities);
    setDeclinariQuantities(newDeclinariQuantities);
    setDeclinariEnabled(newDeclinariEnabled);
    setValue('deliverableQuantities', newQuantities);
    setValue('declinariQuantities', newDeclinariQuantities);
    trigger('deliverables');
  };

  const handleQuantityChange = (deliverableValue, quantity) => {
    const newQuantities = { ...quantities, [deliverableValue]: parseInt(quantity) || 1 };
    setQuantities(newQuantities);
    setValue('deliverableQuantities', newQuantities);
    trigger('deliverableQuantities');
  };

  const handleDeclinariToggle = (deliverableValue, enabled) => {
    const newDeclinariEnabled = { ...declinariEnabled, [deliverableValue]: enabled };
    setDeclinariEnabled(newDeclinariEnabled);
    
    // Update declinariDeliverables field
    const newDeclinariDeliverables = { ...declinariEnabled, [deliverableValue]: enabled };
    setValue('declinariDeliverables', newDeclinariDeliverables);
    
    if (!enabled) {
      // Clear declinari quantity when disabled
      const newDeclinariQuantities = { ...declinariQuantities };
      delete newDeclinariQuantities[deliverableValue];
      setDeclinariQuantities(newDeclinariQuantities);
      setValue('declinariQuantities', newDeclinariQuantities);
    } else {
      // Set default declinari quantity to 1 when enabled
      const newDeclinariQuantities = { ...declinariQuantities, [deliverableValue]: 1 };
      setDeclinariQuantities(newDeclinariQuantities);
      setValue('declinariQuantities', newDeclinariQuantities);
    }
    trigger('declinariQuantities');
    trigger('declinariDeliverables');
  };

  const handleDeclinariQuantityChange = (deliverableValue, quantity) => {
    const newDeclinariQuantities = { ...declinariQuantities, [deliverableValue]: parseInt(quantity) || 0 };
    setDeclinariQuantities(newDeclinariQuantities);
    setValue('declinariQuantities', newDeclinariQuantities);
    trigger('declinariQuantities');
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
  const quantitiesError = errors['deliverableQuantities'];
  
  // Calculate total time for selected deliverable
  const totalCalculatedTime = calculateTotalDeliverableTime(selectedDeliverable, quantities, declinariQuantities, options);
  
  return (
    <div className="form-field">
      <label className="form-label">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      
      {/* Standard Deliverables - Single Select */}
      <div className="space-y-3 mb-4">
        {field.options.map((option) => {
          const isSelected = selectedDeliverable === option.value;
          const quantity = quantities[option.value] || 1;
          const timeEstimate = formatTimeEstimate(option, quantity);
          
          return (
            <div key={option.value} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliverables"
                  checked={isSelected}
                  onChange={() => handleDeliverableChange(option.value)}
                  className="form-radio"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                  {option.timePerUnit > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.requiresQuantity ? 
                        `${option.timePerUnit} ${option.timeUnit}/unit` : 
                        `${option.timePerUnit} ${option.timeUnit}`
                      }
                    </div>
                  )}
                </div>
              </label>
              
              {/* Quantity input for deliverables that require it */}
              {isSelected && option.requiresQuantity && (
                <div className="mt-2 ml-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Quantity:
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(option.value, e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      units
                    </span>
                  </div>
                  
                  {/* Declinari checkbox and quantity */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={declinariEnabled[option.value] || false}
                      onChange={(e) => handleDeclinariToggle(option.value, e.target.checked)}
                      className="form-checkbox"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Declinari ({option.declinariTime || 10} {option.declinariTimeUnit || 'min'}/unit):
                    </label>
                    {declinariEnabled[option.value] && (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={declinariQuantities[option.value] || 0}
                          onChange={(e) => handleDeclinariQuantityChange(option.value, e.target.value)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          units
                        </span>
                      </>
                    )}
                  </div>
                  
                  {timeEstimate && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                      Total: {timeEstimate}
                      {declinariEnabled[option.value] && declinariQuantities[option.value] > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          {' '}(+ {((declinariQuantities[option.value] || 0) * (option.declinariTime || 10))} {option.declinariTimeUnit || 'min'} declinari)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Time estimate for non-quantity deliverables */}
              {isSelected && !option.requiresQuantity && timeEstimate && (
                <div className="mt-2 ml-6">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Estimated time: {timeEstimate}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
      
      {/* Total calculated time display */}
      {selectedDeliverable && totalCalculatedTime > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Total Estimated Time: {totalCalculatedTime.toFixed(1)} hours
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            This will be used to calculate the task duration
          </div>
        </div>
      )}
      
      {/* Validation errors */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
      {quantitiesError && (
        <p className="text-red-500 text-sm mt-1">{quantitiesError.message}</p>
      )}
    </div>
  );
};

export default DeliverablesField;
