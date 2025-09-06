import * as Yup from 'yup';
import { FIELD_TYPES, getFieldValidationType } from '../configs/fieldTypes';

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  JIRA_LINK: /^https:\/\/.*\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
  TASK_NUMBER: /^[A-Z]+-\d+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  URL: 'Please enter a valid URL',
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min) => `Must be at least ${min}`,
  MAX_VALUE: (max) => `Must be no more than ${max}`,
  INVALID_FORMAT: 'Invalid format',
  SELECT_ONE: 'Please select at least one option',
  SELECT_REQUIRED: 'Please select an option',
  ARRAY_MIN: (min) => `Please select at least ${min} option${min > 1 ? 's' : ''}`,
  ARRAY_MAX: (max) => `Please select no more than ${max} option${max > 1 ? 's' : ''}`,
  CONDITIONAL_REQUIRED: 'This field is required when the condition is met',
};

// Extract task number from Jira link
export const extractTaskNumber = (jiraLink) => {
  if (!jiraLink || typeof jiraLink !== 'string') return '';
  const jiraPattern = /([A-Z]+-\d+)/i;
  const match = jiraLink.match(jiraPattern);
  return match ? match[1].toUpperCase() : '';
};

// Create base schema based on field type
const createBaseSchema = (type) => {
  const validationType = getFieldValidationType(type);
  
  switch (validationType) {
    case 'string':
      return Yup.string().trim();
    case 'email':
      return Yup.string().email(VALIDATION_MESSAGES.EMAIL).trim();
    case 'url':
      return Yup.string().url(VALIDATION_MESSAGES.URL).trim();
    case 'number':
      return Yup.number().typeError('Must be a number');
    case 'boolean':
      return Yup.boolean();
    case 'date':
      return Yup.date();
    case 'array':
      return Yup.array().of(Yup.string().trim());
    default:
      return Yup.string().trim();
  }
};

// Apply common validations to schema
const applyCommonValidations = (schema, field, validation) => {
  if (validation.minLength) {
    schema = schema.min(validation.minLength, VALIDATION_MESSAGES.MIN_LENGTH(validation.minLength));
  }
  if (validation.maxLength) {
    schema = schema.max(validation.maxLength, VALIDATION_MESSAGES.MAX_LENGTH(validation.maxLength));
  }
  
  if (validation.minValue !== undefined) {
    schema = schema.min(validation.minValue, VALIDATION_MESSAGES.MIN_VALUE(validation.minValue));
  }
  if (validation.maxValue !== undefined) {
    schema = schema.max(validation.maxValue, VALIDATION_MESSAGES.MAX_VALUE(validation.maxValue));
  }
  
  if (validation.pattern) {
    schema = schema.matches(validation.pattern, VALIDATION_MESSAGES.INVALID_FORMAT);
  }
  
  if (validation.custom) {
    schema = schema.test('custom', validation.custom.message, validation.custom.test);
  }
  
  if (field.type === FIELD_TYPES.MULTI_SELECT || field.type === FIELD_TYPES.MULTI_VALUE) {
    if (validation.minItems) {
      schema = schema.min(validation.minItems, VALIDATION_MESSAGES.ARRAY_MIN(validation.minItems));
    }
    if (validation.maxItems) {
      schema = schema.max(validation.maxItems, VALIDATION_MESSAGES.ARRAY_MAX(validation.maxItems));
    }
  }
  
  return schema;
};

// Build field validation schema
export const buildFieldValidation = (fieldConfig) => {
  const { type, required, validation = {}, conditional } = fieldConfig;
  
  let schema = createBaseSchema(type);

  if (required) {
    schema = schema.required(VALIDATION_MESSAGES.REQUIRED);
  }

  if (conditional) {
    schema = schema.when(conditional.field, {
      is: conditional.value,
      then: (schema) => {
        if (conditional.required) {
          schema = schema.required(VALIDATION_MESSAGES.CONDITIONAL_REQUIRED);
        }
        return applyCommonValidations(schema, fieldConfig, validation);
      },
      otherwise: (schema) => {
        return schema.optional().nullable().transform(() => {
          if (type === FIELD_TYPES.MULTI_SELECT || type === FIELD_TYPES.MULTI_VALUE) {
            return [];
          }
          if (type === FIELD_TYPES.NUMBER) {
            return 0;
          }
          if (type === FIELD_TYPES.CHECKBOX) {
            return false;
          }
          return '';
        });
      }
    });
  } else {
    schema = applyCommonValidations(schema, fieldConfig, validation);
  }

  return schema;
};

// Build complete validation schema from field configuration
export const buildFormValidationSchema = (fields) => {
  const schemaObject = fields.reduce((acc, field) => {
    acc[field.name] = buildFieldValidation(field);
    return acc;
  }, {});
  
  return Yup.object().shape(schemaObject);
};
