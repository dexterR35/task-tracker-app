import React from 'react';
import { 
  REQUIRED_INDICATOR 
} from '../configs/sharedFormUtils';
import { shouldShowField } from '../configs/sharedFormUtils';



// Helper function to check if field should be conditionally required
const isConditionallyRequired = (field, formValues) => {
  // Always required fields (based on Yup schema)
  const alwaysRequiredFields = [
    'jiraLink', 'products', 'departments', 'markets', 'timeInHours', 'reporters',
    'name', 'email', 'departament', 'country'
  ];
  
  if (alwaysRequiredFields.includes(field.name)) {
    return true;
  }
  
  // Conditionally required fields
  if (field.name === 'deliverables') {
    return formValues._hasDeliverables === true;
  }
  if (field.name === 'aiModels' || field.name === 'aiTime') {
    return formValues._usedAIEnabled === true;
  }
  
  return false;
};

/**
 * BaseField - Eliminates duplication across all form field components
 * Handles common patterns: labels, errors, help text, required indicators
 */
const BaseField = ({ 
  field, 
  error, 
  children, 
  className = "field-wrapper",
  hideLabel = false, // For special cases like checkboxes where label is handled differently
  formValues = {} // Add formValues to check conditional requirements
}) => {
  // Check if field should be required based on conditional logic
  const isFieldRequired = isConditionallyRequired(field, formValues);
  
  return (
    <div className={className}>
      {/* Label with required indicator - skip for checkbox fields */}
      {field.label && !hideLabel && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {isFieldRequired && ` ${REQUIRED_INDICATOR}`}
        </label>
      )}
      
      {/* Field content (input, select, etc.) */}
      {children}
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
      
      {/* Help text */}
      {field.helpText && (
        <p className="help-text">{field.helpText}</p>
      )}
    </div>
  );
};

export default BaseField;
