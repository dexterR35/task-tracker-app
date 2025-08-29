// Validation system exports
export { FIELD_TYPES } from './fieldTypes';
export { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from './validationRules';

// Re-export the main validation functions from the moved file
export {
  buildFieldValidation,
  buildFormValidationSchema,
  sanitizeFieldValue,
  sanitizeFormData,
  validateFormData,
  validateConditionalFields,
  getFieldConfig,
  addFieldToConfig,
  removeFieldFromConfig,
  updateFieldInConfig,
  extractTaskNumber,
  validateJiraLink
} from './formValidation';
