// Validation system exports
export { FIELD_TYPES } from './fieldTypes';
export { 
  VALIDATION_PATTERNS, 
  VALIDATION_MESSAGES,
  extractTaskNumber,
  validateJiraLink
} from './validationRules';

// Re-export the main validation functions from the moved file
export {
  buildFieldValidation,
  buildFormValidationSchema,
  validateFormData,
  validateConditionalFields,
  getFieldConfig,
  addFieldToConfig,
  removeFieldFromConfig,
  updateFieldInConfig
} from './formValidation';
