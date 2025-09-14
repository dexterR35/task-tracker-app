import * as Yup from 'yup';
import { 
  FIELD_TYPES, 
  VALIDATION_PATTERNS, 
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../utils/formConstants';
// Note: Removed unused validation utility imports - using explicit Yup schemas instead
import { showSuccess, showError } from '@/utils/toast';

// Use centralized utility function instead of duplicate logic

// Use utility function instead of duplicate logic

// Use utility function instead of duplicate logic

// Note: Removed buildFieldValidation - using explicit Yup schemas instead

// Note: Removed buildFormValidationSchema - using explicit Yup schemas instead


// ===== FIELD CREATION FUNCTIONS =====

// Use centralized sanitization utilities instead of duplicate functions

// Base field creation function - UI properties only, no validation
const createBaseField = (name, label, type, options = {}, customProps = {}) => {
  return {
    name,
    type,
    label,
    placeholder: options.placeholder || `Enter ${label.toLowerCase()}`,
    helpText: options.helpText,
    ...customProps,
    ...options
  };
};

export const createTextField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.TEXT, options)
});

export const createEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.EMAIL, options, { autoComplete: 'email' })
});

export const createNetBetEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.NETBET_EMAIL, options, { autoComplete: 'email' })
});

export const createPasswordField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.PASSWORD, options, { autoComplete: 'current-password' })
});

export const createUrlField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.URL, options, { autoComplete: 'url' })
});

export const createNumberField = (name, label, options = {}) => {
  const { step, ...restOptions } = options;
  
  return {
    ...createBaseField(name, label, FIELD_TYPES.NUMBER, restOptions, { step: step || 1 })
  };
};

export const createCheckboxField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.CHECKBOX, options)
});

export const createSelectField = (name, label, options, selectOptions = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || []
  })
});

export const createMultiSelectField = (name, label, options, selectOptions = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.MULTI_SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || []
  })
});



// ===== DATA PROCESSING UTILITY =====
// Note: Removed processFormData - using direct business logic processing instead

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


// Prepare form data for business logic (React Hook Form + Yup handle validation/sanitization)
export const prepareTaskFormData = (formData) => {
  if (!formData) {
    return formData;
  }

  console.log('🔍 Raw form data before processing:', formData);

  // Business logic: Extract task name from Jira URL
  if (formData.jiraLink) {
    const jiraMatch = formData.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
    if (jiraMatch) {
      formData.taskName = jiraMatch[1]; // e.g., "GIMODEAR-124124"
    } else {
      // If URL format is invalid, throw an error (validation should have caught this)
      throw new Error('Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/{PROJECT}-{number}');
    }
    delete formData.jiraLink; // Remove original URL
  } else {
    // If no jiraLink provided, throw an error (validation should have caught this)
    throw new Error('Jira link is required');
  }
  
  // Handle conditional fields - set proper defaults when checkboxes are unchecked
  if (!formData._hasDeliverables) {
    formData.deliverables = [];
  }
  
  if (!formData._usedAIEnabled) {
    formData.aiModels = [];
    formData.aiTime = null;
  }
  
  // Remove UI-only fields after processing
  delete formData._hasDeliverables;
  delete formData._usedAIEnabled;
  
  console.log('🔍 Final processed data for database:', formData);
  
  return formData;
};

// Task form field configuration - UI properties only, validation handled by Yup
export const TASK_FORM_FIELDS = [
  createTextField('jiraLink', 'Jira Link', {
    helpText: 'Enter full Jira URL (https://gmrd.atlassian.net/browse/{PROJECT}-{number})',
    placeholder: 'https://gmrd.atlassian.net/browse/GIMODEAR-124124'
  }),
  createSelectField('products', 'Products', {
    helpText: 'Select the primary product this task relates to'
  }, {
    options: TASK_FORM_OPTIONS.products
  }),
  createSelectField('departments', 'Department', {
    helpText: 'Select the department responsible for this task'
  }, {
    options: TASK_FORM_OPTIONS.departments
  }),
  createMultiSelectField('markets', 'Markets', {
    helpText: 'Select all target markets for this task'
  }, {
    options: TASK_FORM_OPTIONS.markets
  }),
  createNumberField('timeInHours', 'Total Time (Hours)', {
    step: 0.5,
    helpText: 'Total time spent on this task (0.5 - 999 hours)'
  }),
  createCheckboxField('_hasDeliverables', 'Has Deliverables', {
    helpText: 'Check if this task produces deliverables'
  }),
  createMultiSelectField('deliverables', 'Deliverables', {
    helpText: 'Select all deliverables produced by this task'
  }, {
    options: TASK_FORM_OPTIONS.deliverables
  }),
  createCheckboxField('_usedAIEnabled', 'AI Tools Used', {
    helpText: 'Check if AI tools were used in this task'
  }),
  createMultiSelectField('aiModels', 'AI Models Used', {
    helpText: 'Select all AI models used in this task'
  }, {
    options: TASK_FORM_OPTIONS.aiModels
  }),
  createNumberField('aiTime', 'Time Spent on AI (Hours)', {
    step: 0.5,
    helpText: 'Hours spent specifically using AI tools'
  }),
  createSelectField('reporters', 'Reporter', {
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


// Reporter form field configuration - UI properties only, validation handled by Yup
export const REPORTER_FORM_FIELDS = [
  createTextField('name', 'Reporter Name', {
    helpText: 'Enter the reporter\'s full name'
  }),
  createEmailField('email', 'Email Address', {
    helpText: 'Enter the reporter\'s email address'
  }),
  createSelectField('departament', 'Department', {
    helpText: 'Select the reporter\'s department'
  }, {
    options: REPORTER_DEPARTMENT_OPTIONS
  }),
  createSelectField('country', 'Country', {
    helpText: 'Select the reporter\'s country'
  }, {
    options: REPORTER_COUNTRY_OPTIONS
  })
];

// Login form field configuration - UI properties only, validation handled by Yup
export const LOGIN_FORM_FIELDS = [
  createNetBetEmailField('email', 'NetBet Email Address', {
    placeholder: 'Enter your NetBet email',
    helpText: 'Only @netbet.ro email addresses are accepted'
  }),
  createPasswordField('password', 'Password', {
    placeholder: 'Enter your password'
  })
];

// ===== READY-TO-USE YUP SCHEMAS FOR REACT HOOK FORM =====

// Login form schema - all validation logic here
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL)
    .matches(VALIDATION_PATTERNS.NETBET_EMAIL, VALIDATION_MESSAGES.NETBET_EMAIL),
  
  password: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(6, VALIDATION_MESSAGES.MIN_LENGTH(6))
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      VALIDATION_MESSAGES.PASSWORD_STRENGTH
    )
});

// Task form schema - all validation logic here
export const taskFormSchema = Yup.object().shape({
  jiraLink: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .matches(VALIDATION_PATTERNS.JIRA_URL_ONLY, VALIDATION_MESSAGES.JIRA_URL_FORMAT)
    .max(200, VALIDATION_MESSAGES.MAX_LENGTH(200)),
  
  products: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  departments: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  markets: Yup.array()
    .min(1, VALIDATION_MESSAGES.SELECT_ONE)
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  timeInHours: Yup.number()
    .typeError('Please enter a valid number')
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(0.5, VALIDATION_MESSAGES.MIN_VALUE(0.5))
    .max(999, VALIDATION_MESSAGES.MAX_VALUE(999)),
  
  _hasDeliverables: Yup.boolean(),
  
  deliverables: Yup.array().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.min(1, VALIDATION_MESSAGES.DELIVERABLE_REQUIRED),
    otherwise: (schema) => schema
  }),
  
  _usedAIEnabled: Yup.boolean(),
  
  aiModels: Yup.array().when('_usedAIEnabled', {
    is: true,
    then: (schema) => schema.min(1, VALIDATION_MESSAGES.AI_MODEL_REQUIRED),
    otherwise: (schema) => schema
  }),
  
  aiTime: Yup.number().when('_usedAIEnabled', {
    is: true,
    then: (schema) => schema
      .typeError('Please enter a valid number')
      .required(VALIDATION_MESSAGES.REQUIRED)
      .min(0.5, VALIDATION_MESSAGES.MIN_VALUE(0.5))
      .max(999, VALIDATION_MESSAGES.MAX_VALUE(999)),
    otherwise: (schema) => schema.nullable()
  }),
  
  reporters: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
});

// Reporter form schema - all validation logic here
export const reporterFormSchema = Yup.object().shape({
  name: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  email: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL),
  
  departament: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  country: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
});

// ===== COMPLETE FORM CONFIGURATIONS =====

// Task Form Complete Configuration
export const TASK_FORM_CONFIG = {
  fields: TASK_FORM_FIELDS,
  validationSchema: taskFormSchema, // Use explicit schema
  initialValues: {
    jiraLink: '',  // UI field - will be processed to extract taskName
    products: '',
    departments: '',
    markets: [],
    timeInHours: '',
    _hasDeliverables: false,
    deliverables: [],
    _usedAIEnabled: false,
    aiModels: [],
    aiTime: '',
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
  },
  getApiMutations: (appData) => ({
    create: appData?.createTask,
    update: appData?.updateTask
  }),
  getContextData: (user, monthId, initialValues, mode) => {
    const baseContext = {
      user,
      monthId
    };
    
    if (mode === 'edit' && initialValues?.id) {
      return {
        ...baseContext,
        id: initialValues.id,
        taskId: initialValues.id,
        boardId: initialValues.boardId
      };
    }
    
    return baseContext;
  },
  prepareTaskFormData: prepareTaskFormData
};

// Reporter Form Complete Configuration
export const REPORTER_FORM_CONFIG = {
  fields: REPORTER_FORM_FIELDS,
  validationSchema: reporterFormSchema, // Use explicit schema
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
  },
  getApiMutations: (appData, createReporter, updateReporter, login) => ({
    create: createReporter,
    update: updateReporter
  }),
  getContextData: (user, monthId, initialValues, mode) => {
    const baseContext = {
      user
    };
    
    if (mode === 'edit' && initialValues?.id) {
      return {
        ...baseContext,
        id: initialValues.id
      };
    }
    
    return baseContext;
  }
};

// Login Form Configuration (used only by LoginPage, not UniversalFormRHF)
export const LOGIN_FORM_CONFIG = {
  fields: LOGIN_FORM_FIELDS,
  validationSchema: loginSchema, // Use explicit schema
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
  getInitialValues: () => LOGIN_FORM_CONFIG.initialValues,
  getApiMutations: (appData, createReporter, updateReporter, login) => ({
    create: login,
    update: null
  }),
  getContextData: (user, monthId, initialValues, mode) => ({
    user: null
  })
};

// Note: Schema definitions moved to the top of the file to avoid circular dependencies

// ===== COMPLETE EXPORTS FOR TASK AND REPORTER FORMS =====

// Task Form - Everything you need
export const taskForm = {
  schema: taskFormSchema,
  fields: TASK_FORM_FIELDS,
  config: TASK_FORM_CONFIG,
  options: TASK_FORM_OPTIONS,
  shouldShow: (field, values) => shouldShowField(field, values),
  prepareTaskFormData
};

// Reporter Form - Everything you need
export const reporterForm = {
  schema: reporterFormSchema,
  fields: REPORTER_FORM_FIELDS,
  config: REPORTER_FORM_CONFIG,
  shouldShow: (field, values) => shouldShowField(field, values)
};
