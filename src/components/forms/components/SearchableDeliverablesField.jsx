import React, { useState, useEffect } from 'react';
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
  hideTimeInfo = false
}) => {
  const [quantities, setQuantities] = useState({});
  const [declinariQuantities, setDeclinariQuantities] = useState({});
  const [declinariEnabled, setDeclinariEnabled] = useState({});
  
  const selectedDeliverable = watch('deliverables') || '';
  const selectedDepartment = watch('departments') || '';
  const hasDeliverables = watch('_hasDeliverables') || false;
  const selectedOption = field.options?.find(option => option.value === selectedDeliverable);
  
  // Ensure default quantity is set when deliverable is selected
  useEffect(() => {
    if (selectedDeliverable && selectedOption && selectedOption.requiresQuantity) {
      const currentQuantity = quantities[selectedDeliverable];
      
      if (!currentQuantity || currentQuantity < 1) {
        const newQuantities = { ...quantities, [selectedDeliverable]: 1 };
        setQuantities(newQuantities);
        setValue('deliverableQuantities', newQuantities);
      }
    }
  }, [selectedDeliverable, selectedOption, quantities, setValue]);
  
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
    
    // Update all states and form values
    updateStateAndForm(setQuantities, 'deliverableQuantities', newQuantities);
    updateStateAndForm(setDeclinariQuantities, 'declinariQuantities', newDeclinariQuantities);
    updateStateAndForm(setDeclinariEnabled, 'declinariDeliverables', newDeclinariEnabled);
    
    // Trigger validation
    setTimeout(() => {
      trigger('deliverables');
      trigger('deliverableQuantities');
    }, 0);
  };

  const handleQuantityChange = (deliverableValue, quantity) => {
    const newQuantities = { ...quantities, [deliverableValue]: parseInt(quantity) || 1 };
    updateStateAndForm(setQuantities, 'deliverableQuantities', newQuantities);
    
    // Trigger validation
    setTimeout(() => {
      trigger('deliverableQuantities');
      trigger('deliverables');
    }, 0);
  };

  // Helper function to update state and form values
  const updateStateAndForm = (stateSetter, formField, newValue) => {
    stateSetter(newValue);
    setValue(formField, newValue);
  };

  const handleDeclinariToggle = (deliverableValue, enabled) => {
    const newDeclinariEnabled = { ...declinariEnabled, [deliverableValue]: enabled };
    updateStateAndForm(setDeclinariEnabled, 'declinariDeliverables', newDeclinariEnabled);
    
    if (!enabled) {
      // Clear declinari quantity when disabled
      const newDeclinariQuantities = { ...declinariQuantities };
      delete newDeclinariQuantities[deliverableValue];
      updateStateAndForm(setDeclinariQuantities, 'declinariQuantities', newDeclinariQuantities);
    } else {
      // Set default declinari quantity to 1 when enabled
      const newDeclinariQuantities = { ...declinariQuantities, [deliverableValue]: 1 };
      updateStateAndForm(setDeclinariQuantities, 'declinariQuantities', newDeclinariQuantities);
    }
    trigger('declinariDeliverables');
  };

  const handleDeclinariQuantityChange = (deliverableValue, quantity) => {
    const newDeclinariQuantities = { ...declinariQuantities, [deliverableValue]: parseInt(quantity) || 1 };
    updateStateAndForm(setDeclinariQuantities, 'declinariQuantities', newDeclinariQuantities);
    trigger('declinariQuantities');
  };

  // Filter out declinari deliverables from search options
  const filteredOptions = React.useMemo(() => {
    // If has deliverables is checked but no department is selected, show empty options
    if (hasDeliverables && !selectedDepartment) {
      return [];
    }
    
    if (!field.options || field.options.length === 0) {
      return [];
    }
    
    // Filter out deliverables that contain "declinari" in the name (case insensitive)
    return field.options.filter(option => {
      const name = option.name || option.label || option.value || '';
      return !name.toLowerCase().includes('declinari');
    });
  }, [field.options, hasDeliverables, selectedDepartment]);

  // Custom field props for SearchableSelectField
  const searchableFieldProps = {
    field: {
      ...field,
      options: filteredOptions, // Use filtered options
      onChange: handleDeliverableChange,
      required: hasDeliverables // Make required when hasDeliverables is checked
    },
    register,
    errors,
    setValue,
    watch,
    trigger,
    clearErrors,
    formValues,
    noOptionsMessage: hasDeliverables && !selectedDepartment 
      ? "Select a department, it's required to select a department for deliverables"
      : "No options found",
    hideTimeInfo
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
          {!hideTimeInfo && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Information</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>Time per unit: {selectedOption.timePerUnit} {selectedOption.timeUnit}</div>
                {selectedOption.declinariTime && (
                  <div>Declinari time: {selectedOption.declinariTime} {selectedOption.declinariTimeUnit || 'min'}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDeliverablesField;
