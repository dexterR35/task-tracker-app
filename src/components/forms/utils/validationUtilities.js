import * as Yup from 'yup';
import { FIELD_TYPES, VALIDATION_MESSAGES, VALIDATION_PATTERNS } from './formConstants';

/**
 * Validation Utilities - Eliminates duplication in validation logic
 * Centralized validation patterns and transformations
 */

/**
 * Get field validation type - centralized type mapping
 */
export const getFieldValidationType = (type) => {
  switch (type) {
    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.PASSWORD:
    case FIELD_TYPES.SELECT:
      return 'string';
    case FIELD_TYPES.EMAIL:
    case FIELD_TYPES.NETBET_EMAIL:
      return 'email';
    case FIELD_TYPES.URL:
      return 'url';
    case FIELD_TYPES.NUMBER:
      return 'number';
    case FIELD_TYPES.CHECKBOX:
      return 'boolean';
    case FIELD_TYPES.MULTI_SELECT:
      return 'array';
    default:
      return 'string';
  }
};

/**
 * Get default value for field type
 */
export const getDefaultValue = (type) => {
  switch (type) {
    case FIELD_TYPES.MULTI_SELECT:
      return [];
    case FIELD_TYPES.NUMBER:
      return null;
    case FIELD_TYPES.CHECKBOX:
      return false;
    case FIELD_TYPES.DATE:
      return null;
    default:
      return null;
  }
};

/**
 * Get appropriate required validation based on field type
 */
export const getRequiredValidation = (type, message = VALIDATION_MESSAGES.REQUIRED) => {
  if (type === FIELD_TYPES.MULTI_SELECT) {
    return Yup.array().min(1, message);
  }
  return Yup.string().required(message);
};

/**
 * Get conditional required validation based on field type
 */
export const getConditionalRequiredValidation = (type, message = VALIDATION_MESSAGES.CONDITIONAL_REQUIRED) => {
  if (type === FIELD_TYPES.MULTI_SELECT) {
    return Yup.array().min(1, message);
  }
  return Yup.string().required(message);
};

/**
 * Create transform function for conditional fields
 */
export const createConditionalTransform = (type) => {
  return () => getDefaultValue(type);
};

/**
 * Apply common validations to schema
 */
export const applyCommonValidations = (schema, field, validation) => {
  let updatedSchema = schema;
  
  // String validations
  if (validation.minLength) {
    updatedSchema = updatedSchema.min(validation.minLength, VALIDATION_MESSAGES.MIN_LENGTH(validation.minLength));
  }
  if (validation.maxLength) {
    updatedSchema = updatedSchema.max(validation.maxLength, VALIDATION_MESSAGES.MAX_LENGTH(validation.maxLength));
  }
  
  // Number validations
  if (validation.minValue !== undefined) {
    updatedSchema = updatedSchema.min(validation.minValue, VALIDATION_MESSAGES.MIN_VALUE(validation.minValue));
  }
  if (validation.maxValue !== undefined) {
    updatedSchema = updatedSchema.max(validation.maxValue, VALIDATION_MESSAGES.MAX_VALUE(validation.maxValue));
  }
  
  // Pattern validation
  if (validation.pattern) {
    const message = validation.message || VALIDATION_MESSAGES.INVALID_FORMAT;
    updatedSchema = updatedSchema.matches(validation.pattern, message);
  }
  
  // Custom validation
  if (validation.custom) {
    updatedSchema = updatedSchema.test('custom', validation.custom.message, validation.custom.test);
  }
  
  // Multi-select specific validations
  if (field.type === FIELD_TYPES.MULTI_SELECT) {
    if (validation.maxItems) {
      updatedSchema = updatedSchema.max(validation.maxItems, VALIDATION_MESSAGES.MAX_LENGTH(validation.maxItems));
    }
  }
  
  // Email validation for email fields
  if (field.type === FIELD_TYPES.EMAIL) {
    updatedSchema = updatedSchema.email(VALIDATION_MESSAGES.EMAIL);
  }
  
  // NetBet email validation
  if (field.type === FIELD_TYPES.NETBET_EMAIL) {
    updatedSchema = updatedSchema.matches(VALIDATION_PATTERNS.NETBET_EMAIL, VALIDATION_MESSAGES.NETBET_EMAIL);
  }
  
  // URL validation
  if (field.type === FIELD_TYPES.URL) {
    updatedSchema = updatedSchema.url(VALIDATION_MESSAGES.URL);
  }
  
  return updatedSchema;
};

/**
 * Create base schema based on field type
 */
export const createBaseSchema = (type) => {
  switch (type) {
    case 'string':
    case 'email':
    case 'url':
      return Yup.string().trim().nullable();
    case 'number':
      return Yup.number()
        .typeError(VALIDATION_MESSAGES.INVALID_FORMAT)
        .nullable()
        .transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null || originalValue === undefined) {
            return null;
          }
          return value;
        });
    case 'boolean':
      return Yup.boolean().nullable();
    case 'date':
      return Yup.date().nullable();
    case 'array':
      return Yup.array()
        .of(Yup.string().trim())
        .nullable()
        .transform((value, originalValue) => {
          if (originalValue === undefined || originalValue === null) {
            return [];
          }
          return value;
        });
    default:
      return Yup.string().trim().nullable();
  }
};

/**
 * Sanitization Utilities - Eliminates duplication in data sanitization
 */

/**
 * Common sanitization functions to reduce duplication
 */
export const sanitizeText = (value) => value?.toString().trim() || '';
export const sanitizeEmail = (value) => value?.toString().trim().toLowerCase() || '';
export const sanitizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};
export const sanitizeArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'string' && item.trim().length > 0);
};
export const sanitizePassword = (value) => value?.toString() || ''; // Keep as-is for passwords (no trimming)
export const sanitizeCheckbox = (value) => Boolean(value);

/**
 * Get sanitization function for field type
 */
export const getSanitizationFunction = (type) => {
  switch (type) {
    case FIELD_TYPES.EMAIL:
    case FIELD_TYPES.NETBET_EMAIL:
      return sanitizeEmail;
    case FIELD_TYPES.NUMBER:
      return sanitizeNumber;
    case FIELD_TYPES.MULTI_SELECT:
      return sanitizeArray;
    case FIELD_TYPES.PASSWORD:
      return sanitizePassword;
    case FIELD_TYPES.CHECKBOX:
      return sanitizeCheckbox;
    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.URL:
    case FIELD_TYPES.SELECT:
    default:
      return sanitizeText;
  }
};
