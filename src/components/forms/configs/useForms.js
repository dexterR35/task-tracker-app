import * as Yup from 'yup';
import { 
  FIELD_TYPES, 
  VALIDATION_PATTERNS, 
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../utils/formConstants';
import {
  getDefaultValue,
  getRequiredValidation,
  getConditionalRequiredValidation,
  createConditionalTransform,
  applyCommonValidations,
  createBaseSchema,
  getFieldValidationType,
  getSanitizationFunction,
  sanitizeText
} from '../utils/validationUtilities';

// Use centralized utility function instead of duplicate logic

// Use utility function instead of duplicate logic

// Use utility function instead of duplicate logic

// Build field validation schema - optimized for React Hook Form
export const buildFieldValidation = (fieldConfig) => {
  const { type, required, validation = {}, conditional } = fieldConfig;
  
  // Use centralized utility to get validation type
  const validationType = getFieldValidationType(type);
  let schema = createBaseSchema(validationType);

  // Apply common validations first
  schema = applyCommonValidations(schema, fieldConfig, validation);

  // Handle required validation - prevent duplicates for multi-select fields
  if (required) {
    if (type === FIELD_TYPES.MULTI_SELECT && validation.minItems) {
      // For multi-select fields with minItems, use minItems validation instead of required
      schema = schema.min(validation.minItems, VALIDATION_MESSAGES.SELECT_ONE);
    } else {
      // For all other fields, use standard required validation
      schema = getRequiredValidation(type, VALIDATION_MESSAGES.REQUIRED);
    }
  }

  // Handle conditional validation
  if (conditional) {
    schema = schema.when(conditional.field, {
      is: conditional.value,
      then: (schema) => {
        if (conditional.required) {
          // Use utility function for conditional required validation
          return getConditionalRequiredValidation(type, conditional.message || VALIDATION_MESSAGES.CONDITIONAL_REQUIRED);
        }
        return schema;
      },
      otherwise: (schema) => {
        return schema.optional().nullable().transform(createConditionalTransform(type));
      }
    });
  }

  return schema;
};

// Build complete validation schema from field configuration - optimized for React Hook Form
export const buildFormValidationSchema = (fields) => {
  const schemaObject = {};
  
  // First, collect all nested fields by parent
  const nestedFields = {};
  const regularFields = {};
  
  fields.forEach(field => {
    if (field.name.includes('.')) {
      const parts = field.name.split('.');
      const parentKey = parts[0];
      const childKey = parts[1];
      
      if (!nestedFields[parentKey]) {
        nestedFields[parentKey] = {};
      }
      nestedFields[parentKey][childKey] = buildFieldValidation(field);
    } else {
      regularFields[field.name] = buildFieldValidation(field);
    }
  });
  
  // Build the final schema object
  Object.assign(schemaObject, regularFields);
  
  // Add nested objects
  Object.keys(nestedFields).forEach(parentKey => {
    schemaObject[parentKey] = Yup.object().shape(nestedFields[parentKey]);
  });
  
  return Yup.object().shape(schemaObject).strict(false);
};


// ===== FIELD CREATION FUNCTIONS =====

// Use centralized sanitization utilities instead of duplicate functions

// Base field creation function to reduce redundancy
const createBaseField = (name, label, type, options = {}, customProps = {}) => ({
  name,
  type,
  label,
  required: options.required || false,
  placeholder: options.placeholder || `Enter ${label.toLowerCase()}`,
  helpText: options.helpText,
  ...customProps,
  ...options,
  validation: options.validation
});

export const createTextField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.TEXT, options),
  sanitize: getSanitizationFunction(FIELD_TYPES.TEXT)
});

export const createEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.EMAIL, options, { autoComplete: 'email' }),
  sanitize: getSanitizationFunction(FIELD_TYPES.EMAIL)
});

export const createNetBetEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.NETBET_EMAIL, options, { autoComplete: 'email' }),
  sanitize: getSanitizationFunction(FIELD_TYPES.NETBET_EMAIL)
});

export const createPasswordField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.PASSWORD, options, { autoComplete: 'current-password' }),
  sanitize: getSanitizationFunction(FIELD_TYPES.PASSWORD)
});

export const createUrlField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.URL, options, { autoComplete: 'url' }),
  sanitize: getSanitizationFunction(FIELD_TYPES.URL)
});

export const createNumberField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.NUMBER, options, { step: 1 }),
  sanitize: getSanitizationFunction(FIELD_TYPES.NUMBER)
});

export const createCheckboxField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.CHECKBOX, options),
  sanitize: getSanitizationFunction(FIELD_TYPES.CHECKBOX)
});

export const createSelectField = (name, label, options, selectOptions = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || []
  }),
  sanitize: getSanitizationFunction(FIELD_TYPES.SELECT)
});

export const createMultiSelectField = (name, label, options, selectOptions = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.MULTI_SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || []
  }),
  sanitize: getSanitizationFunction(FIELD_TYPES.MULTI_SELECT)
});



// ===== AUTOMATIC SANITIZATION UTILITY =====
// Sanitizes form data based on field definitions
export const sanitizeFormData = (formData, fieldConfigs) => {
  const sanitizedData = {};
  
  fieldConfigs.forEach(field => {
    const value = getNestedValue(formData, field.name);
    if (field.sanitize && value !== undefined) {
      setNestedValue(sanitizedData, field.name, field.sanitize(value));
    } else {
      setNestedValue(sanitizedData, field.name, value);
    }
  });
  
  return sanitizedData;
};

// Helper function to get nested values (e.g., 'usedAI.enabled')
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Helper function to set nested values (e.g., 'usedAI.enabled')
const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
};

// Helper function to check if field should be visible based on conditional logic
export const shouldShowField = (field, formValues) => {
  if (!field.conditional) return true;
  
  const { field: conditionalField, value: conditionalValue, and } = field.conditional;
  const conditionalFieldValue = getNestedValue(formValues, conditionalField);
  
  let shouldShow = typeof conditionalValue === 'function' 
    ? conditionalValue(conditionalFieldValue, formValues)
    : conditionalValue === conditionalFieldValue;
  
  if (shouldShow && and) {
    const { field: andField, value: andValue } = and;
    const andFieldValue = getNestedValue(formValues, andField);
    shouldShow = typeof andValue === 'function' 
      ? andValue(andFieldValue, formValues)
      : andValue === andFieldValue;
  }
  
  return shouldShow;
};


// Task form field options
export const TASK_FORM_OPTIONS = {
  products: [
    { value: "marketing casino", label: "marketing casino" },
    { value: "marketing sport", label: "marketing sport" },
    { value: "marketing poker", label: "marketing poker" },
    { value: "marketing lotto", label: "marketing lotto" },
    { value: "acquisition casino", label: "acquisition casino" },
    { value: "acquisition sport", label: "acquisition sport" },
    { value: "acquisition poker", label: "acquisition poker" },
    { value: "acquisition lotto", label: "acquisition lotto" },
    { value: "product casino", label: "product casino" },
    { value: "product sport", label: "product sport" },
    { value: "product poker", label: "product poker" },
    { value: "product lotto", label: "product lotto" },
    { value: "misc", label: "misc" },
  ],
  markets: [
    { value: 'ro', label: 'ro' },
    { value: 'com', label: 'com' },
    { value: 'uk', label: 'uk' },
    { value: 'ie', label: 'ie' },
    { value: 'fi', label: 'fi' },
    { value: 'dk', label: 'dk' },
    { value: 'de', label: 'de' },
    { value: 'at', label: 'at' },
    { value: 'it', label: 'it' },
    { value: 'gr', label: 'gr' },
    { value: 'fr', label: 'fr' }
  ],
  departments: [
    { value: "video", label: "Video Production" },
    { value: "design", label: "Design" },
    { value: "developer", label: "Development" },
  ],
  deliverables: [
    { value: "design", label: "Design" },
    { value: "development", label: "Development" },
    { value: "testing", label: "Testing" },
    { value: "documentation", label: "Documentation" },
    { value: "deployment", label: "Deployment" },
    { value: "training", label: "Training" },
    { value: "support", label: "Support" },
    { value: "maintenance", label: "Maintenance" },
    { value: "optimization", label: "Optimization" },
    { value: "integration", label: "Integration" },
    { value: "others", label: "Others" },
  ],
  aiModels: [
    { value: "DALL-E", label: "DAll" },
    { value: "Photoshop", label: "Photoshop" },
    { value: "FireFly", label: "FireFly" },
    { value: "ChatGpt", label: "ChatGpt" },
    { value: "PicLumen", label: "PicLumen" },
    { value: "LeonardoAi", label: "LeonardoAi" },
    { value: "ShutterStock", label: "ShutterStock" },
    { value: "Midjourney", label: "Midjourney" },
    { value: "NightCafe", label: "NightCafe" },
    { value: "FreePick", label: "FreePick" },
    { value: "Cursor", label: "Cursor" },
  ],
};


// Prepare and sanitize form data before submission
export const prepareTaskFormData = (formData) => {
  if (!formData) {
    return formData;
  }

  // Sanitize all form data using the field definitions
  const sanitizedData = sanitizeFormData(formData, TASK_FORM_FIELDS);
  
  // Remove UI-only checkbox fields (prefixed with _)
  Object.keys(sanitizedData).forEach(key => {
    if (key.startsWith('_')) {
      delete sanitizedData[key];
    }
  });
  
  // Extract taskName from Jira link and remove jiraLink from database
  if (sanitizedData.jiraLink) {
    // Extract task ID from Jira URL (e.g., GIMODEAR-124124 from https://gmrd.atlassian.net/browse/GIMODEAR-124124)
    const jiraMatch = sanitizedData.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
    if (jiraMatch) {
      sanitizedData.taskName = jiraMatch[1]; // e.g., "GIMODEAR-124124"
    } else {
      // Fallback: use the last part of the URL
      const urlParts = sanitizedData.jiraLink.split('/');
      sanitizedData.taskName = urlParts[urlParts.length - 1] || 'Unknown Task';
    }
    // Remove jiraLink from database - we only need the task number
    delete sanitizedData.jiraLink;
  }
  
  // Ensure usedAI object structure is properly initialized (without enabled field)
  if (!sanitizedData.usedAI) {
    sanitizedData.usedAI = {
      aiModels: [],
      aiTime: 0.5
    };
  }
  
  return sanitizedData;
};

// Task form field configuration
export const TASK_FORM_FIELDS = [
  createTextField('jiraLink', 'Jira Link', {
    required: true,
    helpText: 'Enter full Jira URL (https://gmrd.atlassian.net/browse/GIMODEAR-124124)',
    placeholder: 'https://gmrd.atlassian.net/browse/GIMODEAR-124124',
    validation: {
      pattern: VALIDATION_PATTERNS.JIRA_URL_ONLY,
      message: VALIDATION_MESSAGES.JIRA_URL_FORMAT,
      maxLength: 200
    }
  }),
  createTextField('taskName', 'Task Name', {
    required: false, // Not required since it's auto-generated
    helpText: 'Task name will be auto-generated from Jira link in real-time',
    placeholder: 'Auto-generated from Jira link',
    readOnly: true,
    validation: {
      maxLength: 200
    }
  }),
  createSelectField('products', 'Products', {
    required: true,
    helpText: 'Select the primary product this task relates to'
  }, {
    options: TASK_FORM_OPTIONS.products
  }),
  createSelectField('departments', 'Department', {
    required: true,
    helpText: 'Select the department responsible for this task'
  }, {
    options: TASK_FORM_OPTIONS.departments
  }),
  createMultiSelectField('markets', 'Markets', {
    required: true,
    helpText: 'Select all target markets for this task',
    validation: {
      minItems: 1
    }
  }, {
    options: TASK_FORM_OPTIONS.markets
  }),
  createNumberField('timeInHours', 'Total Time (Hours)', {
    required: true,
    min: 0.5,
    max: 999,
    step: 0.5,
    helpText: 'Total time spent on this task (0.5 - 999 hours)'
  }),
  createCheckboxField('_hasDeliverables', 'Has Deliverables', {
    helpText: 'Check if this task produces deliverables'
  }),
  createMultiSelectField('deliverables', 'Deliverables', {
    required: false,
    helpText: 'Select all deliverables produced by this task',
    conditional: {
      field: '_hasDeliverables',
      value: true,
      required: true,
      message: VALIDATION_MESSAGES.DELIVERABLE_REQUIRED
    },
    validation: {
      minItems: 1
    }
  }, {
    options: TASK_FORM_OPTIONS.deliverables
  }),
  createCheckboxField('_usedAIEnabled', 'AI Tools Used', {
    helpText: 'Check if AI tools were used in this task'
  }),
  createMultiSelectField('usedAI.aiModels', 'AI Models Used', {
    required: false,
    helpText: 'Select all AI models used in this task',
    conditional: {
      field: '_usedAIEnabled',
      value: true,
      required: true,
      message: VALIDATION_MESSAGES.AI_MODEL_REQUIRED
    },
    validation: {
      minItems: 1
    }
  }, {
    options: TASK_FORM_OPTIONS.aiModels
  }),
  createNumberField('usedAI.aiTime', 'Time Spent on AI (Hours)', {
    required: false,
    min: 0.5,
    max: 999,
    step: 0.5,
    helpText: 'Hours spent specifically using AI tools',
    conditional: {
      field: '_usedAIEnabled',
      value: true,
      required: false
    }
  }),
  createSelectField('reporters', 'Reporter', {
    required: true,
    helpText: 'Select the person responsible for this task'
  }, {
    options: []
  })
];


// Role-specific options (only what you need)

// Reporter-specific options
const REPORTER_DEPARTMENT_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' }
];

const REPORTER_COUNTRY_OPTIONS = [
  { value: 'ro', label: 'ro' },
  { value: 'com', label: 'com' },
  { value: 'uk', label: 'uk' },
  { value: 'ie', label: 'ie' },
  { value: 'fi', label: 'fi' },
  { value: 'dk', label: 'dk' },
  { value: 'de', label: 'de' },
  { value: 'at', label: 'at' },
  { value: 'it', label: 'it' },
  { value: 'gr', label: 'gr' },
  { value: 'fr', label: 'fr' }
];


// Reporter form field configuration
export const REPORTER_FORM_FIELDS = [
  createTextField('name', 'Reporter Name', {
    required: true,
    helpText: 'Enter the reporter\'s full name'
  }),
  createEmailField('email', 'Email Address', {
    required: true,
    helpText: 'Enter the reporter\'s email address'
  }),
  createSelectField('departament', 'Department', {
    required: true,
    helpText: 'Select the reporter\'s department'
  }, {
    options: REPORTER_DEPARTMENT_OPTIONS
  }),
  createSelectField('country', 'Country', {
    required: true,
    helpText: 'Select the reporter\'s country'
  }, {
    options: REPORTER_COUNTRY_OPTIONS
  })
];

// Login form field configuration
export const LOGIN_FORM_FIELDS = [
  createNetBetEmailField('email', 'NetBet Email Address', {
    required: true,
    placeholder: 'Enter your NetBet email',
    helpText: 'Only @netbet.ro email addresses are accepted'
  }),
  createPasswordField('password', 'Password', {
    required: true,
    placeholder: 'Enter your password'
  })
];

// ===== READY-TO-USE YUP SCHEMAS FOR REACT HOOK FORM =====

// Login form schema - using centralized validation utilities
export const loginSchema = Yup.object().shape({
  email: (() => {
    let schema = createBaseSchema('email');
    schema = schema.email(VALIDATION_MESSAGES.EMAIL);
    schema = schema.matches(VALIDATION_PATTERNS.NETBET_EMAIL, VALIDATION_MESSAGES.NETBET_EMAIL);
    return schema.required(VALIDATION_MESSAGES.REQUIRED);
  })(),
  password: (() => {
    let schema = createBaseSchema('string');
    schema = schema.min(6, VALIDATION_MESSAGES.MIN_LENGTH(6));
    return schema.required(VALIDATION_MESSAGES.REQUIRED);
  })()
});

// ===== COMPLETE FORM CONFIGURATIONS =====

// Task Form Complete Configuration
export const TASK_FORM_CONFIG = {
  fields: TASK_FORM_FIELDS,
  validationSchema: null, // Will be auto-generated
  initialValues: {
    jiraLink: '',  // UI field only - not stored in DB
    taskName: '',  // Extracted from jiraLink - stored in DB
    products: '',
    departments: '',
    markets: [],
    timeInHours: 0.5,
    deliverables: [],
    usedAI: {
      aiModels: [],
      aiTime: 0.5
    },
    reporters: ''
  },
  successMessages: {
    create: SUCCESS_MESSAGES.TASK_CREATED,
    update: SUCCESS_MESSAGES.TASK_UPDATED
  },
  errorMessages: {
    default: ERROR_MESSAGES.TASK_SAVE_FAILED
  },
  getInitialValues: (customValues = null) => {
    return customValues || TASK_FORM_CONFIG.initialValues;
  },
  getFieldsWithOptions: (reporters = []) => {
    return TASK_FORM_FIELDS.map(field => {
      if (field.name === 'reporters') {
        const reporterOptions = reporters?.map(reporter => ({
          value: reporter.id,
          label: `${reporter.name} (${reporter.email})`
        })) || [];
        
        return {
          ...field,
          options: reporterOptions
        };
      }
      return field;
    });
  }
};

// Reporter Form Complete Configuration
export const REPORTER_FORM_CONFIG = {
  fields: REPORTER_FORM_FIELDS,
  validationSchema: null, // Will be auto-generated
  initialValues: {
    name: '',
    email: '',
    departament: '',
    country: ''
  },
  successMessages: {
    create: SUCCESS_MESSAGES.REPORTER_CREATED,
    update: SUCCESS_MESSAGES.REPORTER_UPDATED
  },
  errorMessages: {
    default: ERROR_MESSAGES.REPORTER_SAVE_FAILED
  },
  getInitialValues: (user, customValues = null) => {
    if (customValues) {
      return {
        name: customValues.name || '',
        email: customValues.email || '',
        departament: customValues.departament || '',
        country: customValues.country || ''
      };
    }
    return REPORTER_FORM_CONFIG.initialValues;
  }
};

// Login Form Configuration (used only by LoginPage, not UniversalFormRHF)
export const LOGIN_FORM_CONFIG = {
  fields: LOGIN_FORM_FIELDS,
  validationSchema: null, // Will be auto-generated
  initialValues: {
    email: '',
    password: ''
  },
  successMessages: {
    create: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    update: SUCCESS_MESSAGES.LOGIN_SUCCESS
  },
  errorMessages: {
    default: ERROR_MESSAGES.LOGIN_FAILED
  },
  getInitialValues: () => LOGIN_FORM_CONFIG.initialValues
};

// ===== READY-TO-USE SCHEMAS FOR TASK AND REPORTER FORMS =====

// Task form schema - ready for React Hook Form
export const taskFormSchema = buildFormValidationSchema(TASK_FORM_CONFIG.fields);

// Reporter form schema - ready for React Hook Form  
export const reporterFormSchema = buildFormValidationSchema(REPORTER_FORM_CONFIG.fields);

// ===== COMPLETE EXPORTS FOR TASK AND REPORTER FORMS =====

// Task Form - Everything you need
export const taskForm = {
  schema: taskFormSchema,
  fields: TASK_FORM_FIELDS,
  config: TASK_FORM_CONFIG,
  options: TASK_FORM_OPTIONS,
  sanitize: (data) => sanitizeFormData(data, TASK_FORM_FIELDS),
  shouldShow: (field, values) => shouldShowField(field, values),
  prepareTaskFormData
};

// Reporter Form - Everything you need
export const reporterForm = {
  schema: reporterFormSchema,
  fields: REPORTER_FORM_FIELDS,
  config: REPORTER_FORM_CONFIG,
  sanitize: (data) => sanitizeFormData(data, REPORTER_FORM_FIELDS),
  shouldShow: (field, values) => shouldShowField(field, values)
};
