import React, { useState, useEffect } from 'react';
import NumberField from './NumberField';

const DeliverablesField = ({ 
  field, 
  errors, 
  setValue, 
  watch, 
  trigger, 
  clearErrors,
  formValues,
}) => {
  const [quantities, setQuantities] = useState({});
  const [variationsQuantities, setvariationsQuantities] = useState({});
  const [variationsEnabled, setvariationsEnabled] = useState({});
  
  const selectedDeliverable = watch('deliverables') || '';
  
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
  
  const handleDeliverableChange = (value) => {
    setValue('deliverables', value);
    
    // Clear previous quantities and variations
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
    
    setQuantities(newQuantities);
    setvariationsQuantities(newvariationsQuantities);
    setvariationsEnabled(newvariationsEnabled);
    setValue('deliverableQuantities', newQuantities);
    setValue('variationsQuantities', newvariationsQuantities);
    trigger('deliverables');
  };

  const handleQuantityChange = (deliverableValue, quantity) => {
    const numQuantity = parseInt(quantity) || 1;
    const newQuantities = { ...quantities, [deliverableValue]: numQuantity };
    setQuantities(newQuantities);
    setValue('deliverableQuantities', newQuantities);
    trigger('deliverableQuantities');
    
    // Clear any quantity-related errors
    clearErrors('deliverableQuantities');
  };

  const handlevariationsToggle = (deliverableValue, enabled) => {
    const newvariationsEnabled = { ...variationsEnabled, [deliverableValue]: enabled };
    setvariationsEnabled(newvariationsEnabled);
    
    // Update variationsDeliverables field
    const newvariationsDeliverables = { ...variationsEnabled, [deliverableValue]: enabled };
    setValue('variationsDeliverables', newvariationsDeliverables);
    
    if (!enabled) {
      // Clear variations quantity when disabled
      const newvariationsQuantities = { ...variationsQuantities };
      delete newvariationsQuantities[deliverableValue];
      setvariationsQuantities(newvariationsQuantities);
      setValue('variationsQuantities', newvariationsQuantities);
    } else {
      // Set default variations quantity to 1 when enabled
      const newvariationsQuantities = { ...variationsQuantities, [deliverableValue]: 1 };
      setvariationsQuantities(newvariationsQuantities);
      setValue('variationsQuantities', newvariationsQuantities);
    }
    trigger('variationsQuantities');
    trigger('variationsDeliverables');
  };

  const handlevariationsQuantityChange = (deliverableValue, quantity) => {
    const newvariationsQuantities = { ...variationsQuantities, [deliverableValue]: parseInt(quantity) || 0 };
    setvariationsQuantities(newvariationsQuantities);
    setValue('variationsQuantities', newvariationsQuantities);
    trigger('variationsQuantities');
  };
  
  
  const error = errors[field.name];
  const quantitiesError = errors['deliverableQuantities'];
  
  // Note: Total time calculation is handled in the task table and detail page
  
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
                </div>
              </label>
              
              {/* Quantity input for deliverables that require it */}
              {isSelected && option.requiresQuantity && (
                <div className="mt-2 ml-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Quantity:
                    </label>
                    <div className="w-20">
                      <NumberField
                        field={{
                          name: `quantity_${option.value}`,
                          type: "number",
                          label: "",
                          required: true,
                          min: 1,
                          step: 1,
                          placeholder: "1",
                          validation: {
                            required: "Quantity is required",
                            min: { value: 1, message: "Quantity must be at least 1" }
                          }
                        }}
                        register={() => {}}
                        errors={errors}
                        setValue={(fieldName, value) => handleQuantityChange(option.value, value)}
                        trigger={() => {}}
                        formValues={{ [`quantity_${option.value}`]: quantity }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      units
                    </span>
                  </div>
                  
                  {/* variations checkbox and quantity */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={variationsEnabled[option.value] || false}
                      onChange={(e) => handlevariationsToggle(option.value, e.target.checked)}
                      className="form-checkbox"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      variations (per unit):
                    </label>
                    {variationsEnabled[option.value] && (
                      <>
                        <div className="w-16">
                          <NumberField
                            field={{
                              name: `variations_quantity_${option.value}`,
                              type: "number",
                              label: "",
                              required: false,
                              min: 0,
                              step: 1,
                              placeholder: "0",
                              validation: {
                                min: { value: 0, message: "Variations quantity must be at least 0" }
                              }
                            }}
                            register={() => {}}
                            errors={errors}
                            setValue={(fieldName, value) => handlevariationsQuantityChange(option.value, value)}
                            trigger={() => {}}
                            formValues={{ [`variations_quantity_${option.value}`]: variationsQuantities[option.value] || 0 }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          units
                        </span>
                      </>
                    )}
                  </div>
                  
                </div>
              )}
              
            </div>
          );
        })}
      </div>
      
      
      {/* Note: Total time calculation is displayed in the task table and detail page */}
      
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
