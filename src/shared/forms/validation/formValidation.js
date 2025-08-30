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

  // Apply min/max length validations (only for non-conditional fields)
  if (!conditional) {
    if (validation.minLength) {
      schema = schema.min(validation.minLength, VALIDATION_MESSAGES.MIN_LENGTH(validation.minLength));
    }

    if (validation.maxLength) {
      schema = schema.max(validation.maxLength, VALIDATION_MESSAGES.MAX_LENGTH(validation.maxLength));
    }
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
        
        // Apply custom validation
        if (validation.custom) {
          schema = schema.test('custom', validation.custom.message, validation.custom.test);
        }
        
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
        
        // Apply array validations
        if (type === FIELD_TYPES.MULTI_SELECT || type === FIELD_TYPES.MULTI_VALUE) {
          if (validation.minItems) {
            schema = schema.min(validation.minItems, VALIDATION_MESSAGES.ARRAY_MIN(validation.minItems));
          }
          if (validation.maxItems) {
            schema = schema.max(validation.maxItems, VALIDATION_MESSAGES.ARRAY_MAX(validation.maxItems));
          }
        }
        
        return schema;
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
    if (validation.custom) {
      schema = schema.test('custom', validation.custom.message, validation.custom.test);
    }
    
    // Apply min/max length validations
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
    
    // Apply pattern validation
    if (validation.pattern) {
      schema = schema.matches(validation.pattern, VALIDATION_MESSAGES.INVALID_FORMAT);
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
  }

  return schema;
};



// Build complete form validation schema
export const buildFormValidationSchema = (fields) => {
  const schemaObject = {};
  
  fields.forEach(field => {
    schemaObject[field.name] = buildFieldValidation(field);
  });
  
  return Yup.object().shape(schemaObject);
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
        ? conditionalValue(fieldValue, values)
        : fieldValue === conditionalValue;
      

      
      // Only validate if the field should be required AND visible
      if (shouldBeRequired && required) {
        const currentValue = values[field.name];
        if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
          errors[field.name] = VALIDATION_MESSAGES.CONDITIONAL_REQUIRED;
        }
      } else if (!shouldBeRequired) {
        // If field should not be visible, clear any existing errors
        if (errors[field.name]) {
          delete errors[field.name];
        }
      }
    }
  });
  
  return errors;
};


