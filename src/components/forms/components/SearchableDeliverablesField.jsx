import React, { useState, useEffect, useMemo } from 'react';
import SearchableSelectField from '@/components/forms/components/SearchableSelectField';
import NumberField from './NumberField';
import Badge from '@/components/ui/Badge/Badge';

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
  const [variationsQuantities, setvariationsQuantities] = useState({});
  const [variationsEnabled, setvariationsEnabled] = useState({});
  
  const selectedDeliverable = watch('deliverables') || '';
  const selectedDepartment = watch('departments') || '';
  const hasDeliverables = watch('_hasDeliverables') || false;
  const selectedOption = field.options?.find(option => option.value === selectedDeliverable);
  
  // Debug logging for deliverables field (removed for production)

  // Handle initial value when form is reset
  useEffect(() => {
    if (selectedDeliverable && field.options && field.options.length > 0) {
      const option = field.options.find(opt => opt.value === selectedDeliverable);
      if (option) {
        // Option found and matched successfully
      } else {
        // No matching option found - this is expected for custom deliverables
      }
    }
  }, [selectedDeliverable, field.options]);
  
  // Handle case where deliverable value is set after component mounts
  useEffect(() => {
    if (formValues?.deliverables && !selectedDeliverable && field.options?.length > 0) {
      setValue('deliverables', formValues.deliverables);
    }
  }, [formValues?.deliverables, selectedDeliverable, field.options, setValue]);
  
  // Ensure default quantity is set when deliverable is selected (only for new selections)
  useEffect(() => {
    if (selectedDeliverable && selectedOption && selectedOption.requiresQuantity) {
      const currentQuantity = quantities[selectedDeliverable];
      
      // Only set default if no quantity exists and we're not in edit mode with existing data
      if (!currentQuantity || currentQuantity < 1) {
        // Check if we have form values (edit mode) - if so, don't override with defaults
        const hasExistingQuantities = formValues?.deliverableQuantities && 
          Object.keys(formValues.deliverableQuantities).length > 0;
        
        if (!hasExistingQuantities) {
          const newQuantities = { ...quantities, [selectedDeliverable]: 1 };
          setQuantities(newQuantities);
          setValue('deliverableQuantities', newQuantities);
        }
      }
    }
  }, [selectedDeliverable, selectedOption, quantities, setValue, formValues?.deliverableQuantities]);
  
  // Initialize quantities and variations from form data if editing
  useEffect(() => {
    if (formValues?.deliverableQuantities) {
      setQuantities(formValues.deliverableQuantities);
    }
    if (formValues?.variationsQuantities) {
      setvariationsQuantities(formValues.variationsQuantities);
    }
    if (formValues?.variationsDeliverables) {
      setvariationsEnabled(formValues.variationsDeliverables);
    }
  }, [formValues?.deliverableQuantities, formValues?.variationsQuantities, formValues?.variationsDeliverables]);

  // Handle deliverable selection
  const handleDeliverableChange = (value) => {
    setValue('deliverables', value);
    
    // Only clear quantities if the deliverable actually changed
    if (value !== selectedDeliverable) {
      // Clear previous quantities and variations for different deliverable
      const newQuantities = {};
      const newvariationsQuantities = {};
      const newvariationsEnabled = {};
      
      // Set default quantity to 1 for deliverables that require quantity
      if (value) {
        const deliverable = field.options.find(opt => opt.value === value);
        if (deliverable && deliverable.requiresQuantity) {
          newQuantities[value] = 1;
        }
      }
      
      // Update all states and form values
      updateStateAndForm(setQuantities, 'deliverableQuantities', newQuantities);
      updateStateAndForm(setvariationsQuantities, 'variationsQuantities', newvariationsQuantities);
      updateStateAndForm(setvariationsEnabled, 'variationsDeliverables', newvariationsEnabled);
    } else {
      // If same deliverable, ensure quantities are preserved from form data
      if (formValues?.deliverableQuantities && formValues.deliverableQuantities[value]) {
        const preservedQuantities = { ...quantities, [value]: formValues.deliverableQuantities[value] };
        setQuantities(preservedQuantities);
        setValue('deliverableQuantities', preservedQuantities);
      }
    }
    
    // Trigger validation immediately
    trigger('deliverables');
    trigger('deliverableQuantities');
  };

  const handleQuantityChange = (deliverableValue, quantity) => {
    const numQuantity = parseInt(quantity) || 1;
    const newQuantities = { ...quantities, [deliverableValue]: numQuantity };
    updateStateAndForm(setQuantities, 'deliverableQuantities', newQuantities);
    
    // Clear any quantity-related errors
    clearErrors('deliverableQuantities');
    
    // Trigger validation immediately
    trigger('deliverableQuantities');
    trigger('deliverables');
  };

  // Helper function to update state and form values
  const updateStateAndForm = (stateSetter, formField, newValue) => {
    stateSetter(newValue);
    setValue(formField, newValue);
  };

  const handlevariationsToggle = (deliverableValue, enabled) => {
    const newvariationsEnabled = { ...variationsEnabled, [deliverableValue]: enabled };
    updateStateAndForm(setvariationsEnabled, 'variationsDeliverables', newvariationsEnabled);
    
    if (!enabled) {
      // Clear variations quantity when disabled
      const newvariationsQuantities = { ...variationsQuantities };
      delete newvariationsQuantities[deliverableValue];
      updateStateAndForm(setvariationsQuantities, 'variationsQuantities', newvariationsQuantities);
    } else {
      // Set default variations quantity to 1 when enabled
      const newvariationsQuantities = { ...variationsQuantities, [deliverableValue]: 1 };
      updateStateAndForm(setvariationsQuantities, 'variationsQuantities', newvariationsQuantities);
    }
    trigger('variationsDeliverables');
  };

  const handlevariationsQuantityChange = (deliverableValue, quantity) => {
    const newvariationsQuantities = { ...variationsQuantities, [deliverableValue]: parseInt(quantity) || 1 };
    updateStateAndForm(setvariationsQuantities, 'variationsQuantities', newvariationsQuantities);
    trigger('variationsQuantities');
  };

  // Filter out variations deliverables from search options
  const filteredOptions = useMemo(() => {
    // If has deliverables is checked but no department is selected, show empty options
    if (hasDeliverables && !selectedDepartment) {
      return [];
    }
    
    if (!field.options || field.options.length === 0) {
      return [];
    }
    
    // Filter out deliverables that contain "variations" in the name (case insensitive)
    return field.options.filter(option => {
      const name = option.name || option.label || option.value || '';
      return !name.toLowerCase().includes('variations');
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
          
          {/* Debug info */}
          <div className="w-full text-xs text-gray-500 mb-2">
            Debug: Selected: {selectedDeliverable} | Requires Quantity: {selectedOption.requiresQuantity ? 'Yes' : 'No'} | Department: {selectedOption.department}
          </div>
          
          {/* Quantity Field (if required) */}
          {selectedOption.requiresQuantity && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <NumberField
                field={{
                  name: `quantity_${selectedDeliverable}`,
                  type: "number",
                  label: "",
                  required: true,
                  min: 1,
                  step: 1,
                  placeholder: "Enter quantity",
                  validation: {
                    required: "Quantity is required",
                    min: { value: 1, message: "Quantity must be at least 1" }
                  }
                }}
                register={() => {}}
                errors={errors}
                setValue={(fieldName, value) => handleQuantityChange(selectedDeliverable, value)}
                trigger={() => {}}
                formValues={{ [`quantity_${selectedDeliverable}`]: quantities[selectedDeliverable] || 1 }}
              />
            </div>
          )}
          
          {/* variations Toggle */}
          <div className="flex items-center space-x-2 min-w-[200px]">
            <input
              type="checkbox"
              id={`variations-${selectedDeliverable}`}
              checked={variationsEnabled[selectedDeliverable] || false}
              onChange={(e) => handlevariationsToggle(selectedDeliverable, e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <label htmlFor={`variations-${selectedDeliverable}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable variations
            </label>
          </div>
          
          {/* variations Quantity (if enabled) */}
          {variationsEnabled[selectedDeliverable] && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                variations Quantity
              </label>
              <NumberField
                field={{
                  name: `variations_quantity_${selectedDeliverable}`,
                  type: "number",
                  label: "",
                  required: false,
                  min: 1,
                  step: 1,
                  placeholder: "Enter variations quantity",
                  validation: {
                    min: { value: 1, message: "Variations quantity must be at least 1" }
                  }
                }}
                register={() => {}}
                errors={errors}
                setValue={(fieldName, value) => handlevariationsQuantityChange(selectedDeliverable, value)}
                trigger={() => {}}
                formValues={{ [`variations_quantity_${selectedDeliverable}`]: variationsQuantities[selectedDeliverable] || 1 }}
              />
            </div>
          )}
          
          {/* Time Information */}
          {!hideTimeInfo && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Information</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>Time per unit: {selectedOption.timePerUnit} {selectedOption.timeUnit}</div>
                {selectedOption.variationsTime && (
                  <div>variations time: {selectedOption.variationsTime} {selectedOption.variationsTimeUnit || 'min'}</div>
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
