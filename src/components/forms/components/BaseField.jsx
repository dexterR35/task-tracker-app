import React from 'react';
import { 
  FIELD_LABEL_CLASSES, 
  ERROR_MESSAGE_CLASSES, 
  HELP_TEXT_CLASSES, 
  REQUIRED_INDICATOR 
} from '../utils/formConstants';

/**
 * BaseField - Eliminates duplication across all form field components
 * Handles common patterns: labels, errors, help text, required indicators
 */
const BaseField = ({ 
  field, 
  error, 
  children, 
  className = "field-wrapper" 
}) => {
  const isFieldRequired = field.required;
  
  return (
    <div className={className}>
      {/* Label with required indicator */}
      {field.label && (
        <label htmlFor={field.name} className={FIELD_LABEL_CLASSES}>
          {field.label}
          {isFieldRequired && ` ${REQUIRED_INDICATOR}`}
        </label>
      )}
      
      {/* Field content (input, select, etc.) */}
      {children}
      
      {/* Error message */}
      {error && (
        <div className={ERROR_MESSAGE_CLASSES}>
          {error.message}
        </div>
      )}
      
      {/* Help text */}
      {field.helpText && (
        <p className={HELP_TEXT_CLASSES}>{field.helpText}</p>
      )}
    </div>
  );
};

export default BaseField;
