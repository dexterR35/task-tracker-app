import * as Yup from 'yup';
import { FIELD_TYPES } from './fieldTypes';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from './validationRules';

// Dynamic field validation builder
export const buildFieldValidation = (fieldConfig) => {
  const { type, required, validation = {}, conditional } = fieldConfig;
  
  let schema = null;

  // Base schema based on field type
  switch (type) {
    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.TEXTAREA:
      schema = Yup.string().trim();
      break;
      
    case FIELD_TYPES.EMAIL:
      schema = Yup.string().email(VALIDATION_MESSAGES.EMAIL).trim();
      break;
      
    case FIELD_TYPES.URL:
      schema = Yup.string().url(VALIDATION_MESSAGES.URL).trim();
      break;
      
    case FIELD_TYPES.NUMBER:
      schema = Yup.number().typeError('Must be a number');
      break;
      
    case FIELD_TYPES.SELECT:
      schema = Yup.string().trim();
      break;
      
    case FIELD_TYPES.MULTI_SELECT:
      schema = Yup.array().of(Yup.string().trim());
      break;
      
    case FIELD_TYPES.CHECKBOX:
      schema = Yup.boolean();
      break;
      
    case FIELD_TYPES.DATE:
      schema = Yup.date();
      break;
      
    case FIELD_TYPES.PASSWORD:
      schema = Yup.string().trim();
      break;
      
    case FIELD_TYPES.MULTI_VALUE:
      schema = Yup.array().of(Yup.string().trim());
      break;
      
    default:
      schema = Yup.string().trim();
  }

  // Apply required validation
  if (required) {
    schema = schema.required(VALIDATION_MESSAGES.REQUIRED);
  }

  // Apply custom validation rules
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

  // Apply conditional validation
  if (conditional) {
    schema = schema.when(conditional.field, {
      is: conditional.value,
      then: (schema) => {
        if (conditional.required) {
          return schema.required(VALIDATION_MESSAGES.CONDITIONAL_REQUIRED);
        }
        if (conditional.validation) {
          return buildFieldValidation({
            ...fieldConfig,
            validation: conditional.validation
          });
        }
        return schema;
      },
      otherwise: (schema) => schema.optional()
    });
  }

  // Special validations for specific field types
  if (type === FIELD_TYPES.MULTI_SELECT || type === FIELD_TYPES.MULTI_VALUE) {
    if (validation.minItems) {
      schema = schema.min(validation.minItems, VALIDATION_MESSAGES.ARRAY_MIN(validation.minItems));
    }
    if (validation.maxItems) {
      schema = schema.max(validation.maxItems, VALIDATION_MESSAGES.ARRAY_MAX(validation.maxItems));
    }
  }

  return schema;
};

// Sanitize field value
export const sanitizeFieldValue = (value, fieldConfig) => {
  const { type, sanitization = {} } = fieldConfig;
  
  if (value === null || value === undefined) {
    return value;
  }

  let sanitizedValue = value;

  // Apply type-specific sanitization
  switch (type) {
    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.TEXTAREA:
      sanitizedValue = typeof value === 'string' ? value.trim() : String(value).trim();
      break;
      
    case FIELD_TYPES.EMAIL:
      sanitizedValue = typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
      break;
      
    case FIELD_TYPES.URL:
      sanitizedValue = typeof value === 'string' ? value.trim() : String(value).trim();
      break;
      
    case FIELD_TYPES.NUMBER:
      sanitizedValue = Number(value) || 0;
      break;
      
    case FIELD_TYPES.CHECKBOX:
      sanitizedValue = Boolean(value);
      break;
      
    case FIELD_TYPES.MULTI_SELECT:
    case FIELD_TYPES.MULTI_VALUE:
      if (Array.isArray(value)) {
        sanitizedValue = value.map(item => typeof item === 'string' ? item.trim() : String(item).trim()).filter(Boolean);
      }
      break;
      
    case FIELD_TYPES.SELECT:
      sanitizedValue = typeof value === 'string' ? value.trim() : String(value).trim();
      break;
      
    default:
      sanitizedValue = typeof value === 'string' ? value.trim() : String(value).trim();
  }

  // Apply custom sanitization
  if (sanitization.custom) {
    sanitizedValue = sanitization.custom(sanitizedValue);
  }

  return sanitizedValue;
};

// Build complete form validation schema
export const buildFormValidationSchema = (fields) => {
  const schemaObject = {};
  
  fields.forEach(field => {
    schemaObject[field.name] = buildFieldValidation(field);
  });
  
  return Yup.object().shape(schemaObject);
};

// Sanitize complete form data
export const sanitizeFormData = (data, fields) => {
  const sanitizedData = {};
  
  fields.forEach(field => {
    const value = data[field.name];
    sanitizedData[field.name] = sanitizeFieldValue(value, field);
  });
  
  return sanitizedData;
};

// Validate form data
export const validateFormData = (data, fields) => {
  const schema = buildFormValidationSchema(fields);
  
  try {
    schema.validateSync(data, { abortEarly: false });
    return { isValid: true, errors: [] };
  } catch (error) {
    const errors = error.inner.map(err => ({
      field: err.path,
      message: err.message
    }));
    return { isValid: false, errors };
  }
};

// Helper function to get field configuration by name
export const getFieldConfig = (fieldName, fields) => {
  return fields.find(field => field.name === fieldName);
};

// Helper function to add new field to existing configuration
export const addFieldToConfig = (fields, newField) => {
  return [...fields, newField];
};

// Helper function to remove field from configuration
export const removeFieldFromConfig = (fields, fieldName) => {
  return fields.filter(field => field.name !== fieldName);
};

// Helper function to update field in configuration
export const updateFieldInConfig = (fields, fieldName, updates) => {
  return fields.map(field => 
    field.name === fieldName ? { ...field, ...updates } : field
  );
};

// Validate conditional fields based on form values
export const validateConditionalFields = (values, fields) => {
  const errors = {};
  
  fields.forEach(field => {
    if (field.conditional) {
      const { field: conditionalField, value: conditionalValue, required } = field.conditional;
      
      const fieldValue = values[conditionalField];
      const shouldBeRequired = typeof conditionalValue === 'function' 
        ? conditionalValue(fieldValue)
        : fieldValue === conditionalValue;
      
      if (shouldBeRequired && required) {
        const currentValue = values[field.name];
        if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
          errors[field.name] = VALIDATION_MESSAGES.CONDITIONAL_REQUIRED;
        }
      }
    }
  });
  
  return errors;
};

// Extract task number from Jira link
export const extractTaskNumber = (jiraLink) => {
  if (!jiraLink) return null;
  
  const match = jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
  return match ? match[1] : null;
};

// Validate Jira link format
export const validateJiraLink = (jiraLink) => {
  if (!jiraLink) return false;
  return VALIDATION_PATTERNS.JIRA_LINK.test(jiraLink);
};
