import * as Yup from 'yup';
import { FIELD_TYPES, getFieldValidationType } from '../../configs/fieldTypes';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from './validationRules';

// Create base schema based on field type using handlers
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
  // Apply min/max length validations
  if (validation.minLength) {
    schema = schema.min(validation.minLength, VALIDATION_MESSAGES.MIN_LENGTH(validation.minLength));
  }
  if (validation.maxLength) {
    schema = schema.max(validation.maxLength, VALIDATION_MESSAGES.MAX_LENGTH(validation.maxLength));
  }
  
  // Apply min/max value validations
  if (validation.minValue !== undefined) {
    schema = schema.min(validation.minValue, VALIDATION_MESSAGES.MIN_VALUE(validation.minValue));
  }
  if (validation.maxValue !== undefined) {
    schema = schema.max(validation.maxValue, VALIDATION_MESSAGES.MAX_VALUE(validation.maxValue));
  }
  
  // Apply pattern validation
  if (validation.pattern) {
    schema = schema.matches(validation.pattern, VALIDATION_MESSAGES.INVALID_FORMAT);
  }
  
  // Apply custom validation
  if (validation.custom) {
    schema = schema.test('custom', validation.custom.message, validation.custom.test);
  }
  
  // Apply array validations
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

// Dynamic field validation builder
export const buildFieldValidation = (fieldConfig) => {
  const { type, required, validation = {}, conditional } = fieldConfig;
  
  // Create base schema using handlers
  let schema = createBaseSchema(type);

  // Apply required validation
  if (required) {
    schema = schema.required(VALIDATION_MESSAGES.REQUIRED);
  }

  // Apply conditional validation
  if (conditional) {
    schema = schema.when(conditional.field, {
      is: conditional.value,
      then: (schema) => {
        // Apply all validations when condition is met
        if (conditional.required) {
          schema = schema.required(VALIDATION_MESSAGES.CONDITIONAL_REQUIRED);
        }
        
        // Apply common validations
        return applyCommonValidations(schema, fieldConfig, validation);
      },
      otherwise: (schema) => {
        // When condition is not met, make field completely optional and skip all validation
        return schema.optional().nullable().transform(() => {
          // Return appropriate default values based on field type
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
    // Apply validations only for non-conditional fields
    schema = applyCommonValidations(schema, fieldConfig, validation);
  }

  return schema;
};

// Build complete validation schema from field configuration
export const buildFormValidationSchema = (fields) => {
  const schemaObject = {};
  
  fields.forEach(field => {
    schemaObject[field.name] = buildFieldValidation(field);
  });
  
  return Yup.object().shape(schemaObject);
};


