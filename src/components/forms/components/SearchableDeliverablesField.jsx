import React, { useState, useEffect } from 'react';
import BaseField from '@/components/forms/components/BaseField';
import SearchableSelectField from '@/components/forms/components/SearchableSelectField';

const SearchableDeliverablesField = ({ 
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
  const [quantities, setQuantities] = useState({});
  const [declinariQuantities, setDeclinariQuantities] = useState({});
  const [declinariEnabled, setDeclinariEnabled] = useState({});
  
  const selectedDeliverable = watch('deliverables') || '';
  const selectedOption = field.options?.find(option => option.value === selectedDeliverable);
  
  // Initialize quantities and declinari from form data if editing
  useEffect(() => {
    if (formValues?.deliverableQuantities) {
      setQuantities(formValues.deliverableQuantities);
    }
    if (formValues?.declinariQuantities) {
      setDeclinariQuantities(formValues.declinariQuantities);
    }
    if (formValues?.declinariDeliverables) {
      setDeclinariEnabled(formValues.declinariDeliverables);
    }
  }, [formValues?.deliverableQuantities, formValues?.declinariQuantities, formValues?.declinariDeliverables]);

  // Handle deliverable selection
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
    setValue('declinariDeliverables', newDeclinariEnabled);
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
    setValue('declinariDeliverables', newDeclinariEnabled);
    
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
    trigger('declinariDeliverables');
  };

  const handleDeclinariQuantityChange = (deliverableValue, quantity) => {
    const newDeclinariQuantities = { ...declinariQuantities, [deliverableValue]: parseInt(quantity) || 1 };
    setDeclinariQuantities(newDeclinariQuantities);
    setValue('declinariQuantities', newDeclinariQuantities);
    trigger('declinariQuantities');
  };

  // Custom field props for SearchableSelectField
  const searchableFieldProps = {
    field: {
      ...field,
      onChange: handleDeliverableChange
    },
    register,
    errors,
    setValue,
    watch,
    trigger,
    clearErrors,
    formValues,
    hideLabel
  };

  return (
    <div className="space-y-3">
      {/* Searchable Select Field */}
      <SearchableSelectField {...searchableFieldProps} />
      
      {/* Configuration for Selected Deliverable */}
      {selectedDeliverable && selectedOption && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          
          {/* Quantity Field (if required) */}
          {selectedOption.requiresQuantity && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantities[selectedDeliverable] || 1}
                onChange={(e) => handleQuantityChange(selectedDeliverable, e.target.value)}
                className="form-input text-sm py-2 px-3 h-10 w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter quantity"
              />
            </div>
          )}
          
          {/* Declinari Toggle */}
          <div className="flex items-center space-x-2 min-w-[200px]">
            <input
              type="checkbox"
              id={`declinari-${selectedDeliverable}`}
              checked={declinariEnabled[selectedDeliverable] || false}
              onChange={(e) => handleDeclinariToggle(selectedDeliverable, e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <label htmlFor={`declinari-${selectedDeliverable}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Declinari
            </label>
          </div>
          
          {/* Declinari Quantity (if enabled) */}
          {declinariEnabled[selectedDeliverable] && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Declinari Quantity
              </label>
              <input
                type="number"
                min="1"
                value={declinariQuantities[selectedDeliverable] || 1}
                onChange={(e) => handleDeclinariQuantityChange(selectedDeliverable, e.target.value)}
                className="form-input text-sm py-2 px-3 h-10 w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter declinari quantity"
              />
            </div>
          )}
          
          {/* Time Information */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Information</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div>Time per unit: {selectedOption.timePerUnit} {selectedOption.timeUnit}</div>
              {selectedOption.declinariTime && (
                <div>Declinari time: {selectedOption.declinariTime} {selectedOption.declinariTimeUnit || 'min'}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDeliverablesField;
