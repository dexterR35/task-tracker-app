import * as Yup from 'yup';

// Field type constants (only what you need)
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  NETBET_EMAIL: 'netbetEmail',
  URL: 'url',
  NUMBER: 'number',
  SELECT: 'select',
  MULTI_SELECT: 'multiSelect',
  MULTI_VALUE: 'multiValue',
  CHECKBOX: 'checkbox',
  PASSWORD: 'password',
};

// Validation patterns - centralized for reuse across all forms
export const VALIDATION_PATTERNS = {
  // Email validations
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  NETBET_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@netbet\.ro$/,
  
  // URL validations
  URL: /^https?:\/\/.+/,
  JIRA_LINK: /^https:\/\/.*\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
  
  // Task/Project validations
  // Only accepts full Jira URLs with GIMODEAR format: "https://gmrd.atlassian.net/browse/GIMODEAR-124124"
  JIRA_URL_ONLY: /^https:\/\/gmrd\.atlassian\.net\/browse\/GIMODEAR-\d+$/,
  
  // Contact validations
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  
  // Text validations
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  ALPHANUMERIC_WITH_DASHES: /^[a-zA-Z0-9\s\-_]+$/,
  LETTERS_ONLY: /^[a-zA-Z\s]+$/,
  
  // Number validations
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  POSITIVE_NUMBER: /^[1-9]\d*(\.\d+)?$/,
  
  // Common formats
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  NETBET_EMAIL: 'Please enter a valid NetBet email address (@netbet.ro)',
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

// Get field validation type
const getFieldValidationType = (type) => {
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
    case FIELD_TYPES.MULTI_VALUE:
      return 'array';
    default:
      return 'string';
  }
};

// Create base schema based on field type - optimized for React Hook Form
const createBaseSchema = (type) => {
  const validationType = getFieldValidationType(type);
  
  switch (validationType) {
    case 'string':
      return Yup.string().trim().nullable();
    case 'email':
      return Yup.string().trim().nullable();
    case 'url':
      return Yup.string().trim().nullable();
    case 'number':
      return Yup.number()
        .typeError('Must be a valid number')
        .nullable()
        .transform((value, originalValue) => {
          // Handle empty strings and convert to null for RHF
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
          // Ensure arrays are never undefined for RHF
          if (originalValue === undefined || originalValue === null) {
            return [];
          }
          return value;
        });
    default:
      return Yup.string().trim().nullable();
  }
};

// Apply common validations to schema - optimized for React Hook Form
const applyCommonValidations = (schema, field, validation) => {
  // String validations
  if (validation.minLength) {
    schema = schema.min(validation.minLength, VALIDATION_MESSAGES.MIN_LENGTH(validation.minLength));
  }
  if (validation.maxLength) {
    schema = schema.max(validation.maxLength, VALIDATION_MESSAGES.MAX_LENGTH(validation.maxLength));
  }
  
  // Number validations
  if (validation.minValue !== undefined) {
    schema = schema.min(validation.minValue, VALIDATION_MESSAGES.MIN_VALUE(validation.minValue));
  }
  if (validation.maxValue !== undefined) {
    schema = schema.max(validation.maxValue, VALIDATION_MESSAGES.MAX_VALUE(validation.maxValue));
  }
  
  // Pattern validation
  if (validation.pattern) {
    const message = validation.message || VALIDATION_MESSAGES.INVALID_FORMAT;
    schema = schema.matches(validation.pattern, message);
  }
  
  // Custom validation
  if (validation.custom) {
    schema = schema.test('custom', validation.custom.message, validation.custom.test);
  }
  
  // Multi-select specific validations
  if (field.type === FIELD_TYPES.MULTI_SELECT || field.type === FIELD_TYPES.MULTI_VALUE) {
    // Note: minItems validation is handled in buildFieldValidation to prevent duplicates
    if (validation.maxItems) {
      schema = schema.max(validation.maxItems, VALIDATION_MESSAGES.ARRAY_MAX(validation.maxItems));
    }
  }
  
  // Email validation for email fields
  if (field.type === FIELD_TYPES.EMAIL) {
    schema = schema.email(VALIDATION_MESSAGES.EMAIL);
  }
  
  // NetBet email validation
  if (field.type === FIELD_TYPES.NETBET_EMAIL) {
    schema = schema.matches(VALIDATION_PATTERNS.NETBET_EMAIL, VALIDATION_MESSAGES.NETBET_EMAIL);
  }
  
  // URL validation
  if (field.type === FIELD_TYPES.URL) {
    schema = schema.url(VALIDATION_MESSAGES.URL);
  }
  
  return schema;
};

// Build field validation schema - optimized for React Hook Form
export const buildFieldValidation = (fieldConfig) => {
  const { type, required, validation = {}, conditional } = fieldConfig;
  
  let schema = createBaseSchema(type);

  // Apply common validations first
  schema = applyCommonValidations(schema, fieldConfig, validation);

  // Handle required validation - prevent duplicates for multi-select fields
  if (required) {
    if (type === FIELD_TYPES.MULTI_SELECT && validation.minItems) {
      // For multi-select fields with minItems, use minItems validation instead of required
      schema = schema.min(validation.minItems, VALIDATION_MESSAGES.SELECT_ONE);
    } else {
      // For all other fields, use standard required validation
      schema = schema.required(VALIDATION_MESSAGES.REQUIRED);
    }
  }

  // Handle conditional validation
  if (conditional) {
    schema = schema.when(conditional.field, {
      is: conditional.value,
      then: (schema) => {
        if (conditional.required) {
          schema = schema.required(VALIDATION_MESSAGES.CONDITIONAL_REQUIRED);
        }
        return schema;
      },
      otherwise: (schema) => {
        return schema.optional().nullable().transform(() => {
          // Transform to appropriate default values for RHF
          if (type === FIELD_TYPES.MULTI_SELECT || type === FIELD_TYPES.MULTI_VALUE) {
            return [];
          }
          if (type === FIELD_TYPES.NUMBER) {
            return null;
          }
          if (type === FIELD_TYPES.CHECKBOX) {
            return false;
          }
          return null;
        });
      }
    });
  }

  return schema;
};

// Build complete validation schema from field configuration - optimized for React Hook Form
export const buildFormValidationSchema = (fields) => {
  const schemaObject = fields.reduce((acc, field) => {
    acc[field.name] = buildFieldValidation(field);
    return acc;
  }, {});
  
  return Yup.object().shape(schemaObject).strict(false);
};

// Create a Yup resolver for React Hook Form
export const createYupResolver = (fields) => {
  const schema = buildFormValidationSchema(fields);
  
  return {
    schema,
    resolver: async (values) => {
      try {
        const validValues = await schema.validate(values, { 
          abortEarly: false,
          stripUnknown: true 
        });
        return { values: validValues, errors: {} };
      } catch (error) {
        const errors = {};
        
        if (error.inner) {
          error.inner.forEach((err) => {
            if (err.path) {
              errors[err.path] = {
                type: 'validation',
                message: err.message
              };
            }
          });
        }
        
        return { values: {}, errors };
      }
    }
  };
};

// ===== FIELD CREATION FUNCTIONS =====

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
  sanitize: (value) => value?.toString().trim() || ''
});

export const createEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.EMAIL, options, { autoComplete: 'email' }),
  sanitize: (value) => value?.toString().trim().toLowerCase() || ''
});

export const createNetBetEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.NETBET_EMAIL, options, { autoComplete: 'email' }),
  sanitize: (value) => value?.toString().trim().toLowerCase() || ''
});

export const createPasswordField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.PASSWORD, options, { autoComplete: 'current-password' }),
  sanitize: (value) => value?.toString() || ''
});

export const createUrlField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.URL, options, { autoComplete: 'url' }),
  sanitize: (value) => value?.toString().trim() || ''
});

export const createNumberField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.NUMBER, options, { step: 1 }),
  sanitize: (value) => parseFloat(value) || 0
});


export const createCheckboxField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.CHECKBOX, options),
  sanitize: (value) => Boolean(value)
});

export const createSelectField = (name, label, options, selectOptions = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || []
  }),
  sanitize: (value) => value?.toString().trim() || ''
});

export const createMultiSelectField = (name, label, options, selectOptions = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.MULTI_SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || []
  }),
  sanitize: (value) => Array.isArray(value) ? value : []
});

export const createMultiValueField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.MULTI_VALUE, options, {
    maxValues: 10
  }),
  sanitize: (value) => Array.isArray(value) ? value : []
});


// ===== AUTOMATIC SANITIZATION UTILITY =====
// Sanitizes form data based on field definitions
export const sanitizeFormData = (formData, fieldConfigs) => {
  const sanitizedData = {};
  
  fieldConfigs.forEach(field => {
    const value = formData[field.name];
    if (field.sanitize && value !== undefined) {
      sanitizedData[field.name] = field.sanitize(value);
    } else {
      sanitizedData[field.name] = value;
    }
  });
  
  return sanitizedData;
};

// Helper function to check if field should be visible based on conditional logic
export const shouldShowField = (field, formValues) => {
  if (!field.conditional) return true;
  
  const { field: conditionalField, value: conditionalValue, and } = field.conditional;
  const conditionalFieldValue = formValues[conditionalField];
  
  let shouldShow = typeof conditionalValue === 'function' 
    ? conditionalValue(conditionalFieldValue, formValues)
    : conditionalValue === conditionalFieldValue;
  
  if (shouldShow && and) {
    const { field: andField, value: andValue } = and;
    const andFieldValue = formValues[andField];
    shouldShow = typeof andValue === 'function' 
      ? andValue(andFieldValue, formValues)
      : andValue === andFieldValue;
  }
  
  return shouldShow;
};

// Task Form Configuration Constants
export const TASK_FORM_CONSTANTS = {
  // Time input constraints
  TIME_INPUT: {
    MIN_HOURS: 0.5,
    MAX_HOURS: 999,
    STEP_SIZE: 0.5,
  },
  // Validation limits
  VALIDATION: {
    MAX_STRING_LENGTH: 255,
    MIN_STRING_LENGTH: 1,
    MAX_ARRAY_LENGTH: 50,
  },
  // Form reset values
  DEFAULT_VALUES: {
    TIME_IN_HOURS: 0.5,
    AI_TIME_SPENT: 0.5,
    DELIVERABLES_COUNT: 0,
  },
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
  
  // Generate taskName from Jira link if not provided
  if (sanitizedData.jiraLink && !sanitizedData.taskName) {
    // Extract task ID from Jira URL (e.g., GIMODEAR-124124 from https://gmrd.atlassian.net/browse/GIMODEAR-124124)
    const jiraMatch = sanitizedData.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
    if (jiraMatch) {
      sanitizedData.taskName = jiraMatch[1]; // e.g., "GIMODEAR-124124"
    } else {
      // Fallback: use the last part of the URL
      const urlParts = sanitizedData.jiraLink.split('/');
      sanitizedData.taskName = urlParts[urlParts.length - 1] || 'Unknown Task';
    }
  }
  
  return sanitizedData;
};

// Task form field configuration
export const TASK_FORM_FIELDS = [
  createTextField('jiraLink', 'Jira Link', {
    required: true,
    helpText: 'Enter full Jira URL (https://gmrd.atlassian.net/browse/GIMODEAR-124124)',
    placeholder: 'https://gmrd.atlassian.net/browse/GIMODEAR-124124',
    sanitize: (value) => value?.toString().trim() || '', // Keep the full URL as-is
    validation: {
      pattern: VALIDATION_PATTERNS.JIRA_URL_ONLY,
      message: 'Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/GIMODEAR-{number}',
      maxLength: 200
    }
  }),
  createTextField('taskName', 'Task Name', {
    required: false, // Not required since it's auto-generated
    helpText: 'Task name will be auto-generated from Jira link',
    placeholder: 'Auto-generated from Jira link',
    readOnly: true,
    sanitize: (value) => value?.toString().trim() || '',
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
  createNumberField('timeInHours', 'Total Time (Hours)', {
    required: true,
    min: 0.5,
    max: 999,
    step: 0.5,
    helpText: 'Total time spent on this task (0.5 - 999 hours)'
  }),
  createCheckboxField('hasDeliverables', 'Has Deliverables', {
    helpText: 'Check if this task produces deliverables'
  }),
  createMultiSelectField('deliverables', 'Deliverables', {
    required: false,
    helpText: 'Select all deliverables produced by this task',
    conditional: {
      field: 'hasDeliverables',
      value: true,
      required: true
    },
    validation: {
      minItems: 1
    }
  }, {
    options: TASK_FORM_OPTIONS.deliverables
  }),
  createCheckboxField('usedAI', 'AI Tools Used', {
    helpText: 'Check if AI tools were used in this task'
  }),
  createMultiSelectField('aiModels', 'AI Models Used', {
    required: false,
    helpText: 'Select all AI models used in this task',
    conditional: {
      field: 'usedAI',
      value: true,
      required: true
    },
    validation: {
      minItems: 1
    }
  }, {
    options: TASK_FORM_OPTIONS.aiModels
  }),
  createNumberField('aiTime', 'Time Spent on AI (Hours)', {
    required: false,
    min: 0.5,
    max: 999,
    step: 0.5,
    helpText: 'Hours spent specifically using AI tools',
    conditional: {
      field: 'usedAI',
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

// Login form schema
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .matches(VALIDATION_PATTERNS.NETBET_EMAIL, 'Only @netbet.ro email addresses are accepted')
    .required('Email is required'),
  password: Yup.string()
    .trim()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

// ===== COMPLETE FORM CONFIGURATIONS =====

// Task Form Complete Configuration
export const TASK_FORM_CONFIG = {
  fields: TASK_FORM_FIELDS,
  validationSchema: null, // Will be auto-generated
  initialValues: {
    jiraLink: '',
    taskName: '',
    products: '',
    departments: '',
    timeInHours: 0.5,
    hasDeliverables: false,
    deliverables: [],
    usedAI: false,
    aiModels: [],
    aiTime: 0.5,
    reporters: ''
  },
  successMessages: {
    create: 'Task created successfully!',
    update: 'Task updated successfully!'
  },
  errorMessages: {
    default: 'Failed to save task. Please try again.'
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
    create: 'Reporter created successfully!',
    update: 'Reporter updated successfully!'
  },
  errorMessages: {
    default: 'Failed to save reporter. Please try again.'
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
    create: 'Login successful!',
    update: 'Login successful!'
  },
  errorMessages: {
    default: 'Login failed. Please check your credentials.'
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
  constants: TASK_FORM_CONSTANTS,
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

// ===== REPORTER FORM SCHEMA AND LOGIC =====
// (Backward compatibility functions removed - use REPORTER_FORM_CONFIG directly)

// ===== GENERIC FORM CREATOR =====
// (Removed unused generic form creator functions - use UniversalFormRHF instead)

// ===== COMPLETE EXPORT SUMMARY =====
// Everything you need for forms is exported above:
// 
// For Task Forms:
// - taskForm.schema (Yup schema)
// - taskForm.fields (field definitions)
// - taskForm.config (complete config)
// - taskForm.options (select options)
// - taskForm.constants (form constants)
// - taskForm.sanitize(data) (sanitization function)
// - taskForm.shouldShow(field, values) (conditional logic)
// - taskForm.prepareTaskFormData(formData) (prepare data before submission)
//
// For Reporter Forms:
// - reporterForm.schema (Yup schema)
// - reporterForm.fields (field definitions)
// - reporterForm.config (complete config)
// - reporterForm.sanitize(data) (sanitization function)
// - reporterForm.shouldShow(field, values) (conditional logic)
//
// For Login Forms:
// - loginSchema (Yup schema)
// - LOGIN_FORM_CONFIG (complete config)
//
// Core Utilities:
// - buildFormValidationSchema(fields)
// - buildFieldValidation(field)
// - sanitizeFormData(data, fields)
// - shouldShowField(field, values)
// - All field creation functions (createTextField, etc.)
// - All validation patterns and messages