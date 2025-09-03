// Validation system exports
export { FIELD_TYPES } from '../../configs/fieldTypes';
export { 
  VALIDATION_PATTERNS, 
  VALIDATION_MESSAGES,
  extractTaskNumber,
  validateJiraLink
} from './validationRules';

// Re-export the main validation functions from the moved file
export {
  buildFieldValidation,
  buildFormValidationSchema
} from './formValidation';
