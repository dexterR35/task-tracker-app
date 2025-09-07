import * as Yup from 'yup';

// Task Form Configuration Constants
export const TASK_FORM_CONFIG = {
  // Time input constraints
  TIME_INPUT: {
    MIN_HOURS: 0.5,
    MAX_HOURS: 24,
    STEP_SIZE: 0.5
  },
  
  // Validation limits
  VALIDATION: {
    MAX_STRING_LENGTH: 255,
    MIN_STRING_LENGTH: 1,
    MAX_ARRAY_LENGTH: 50
  },
  
  // Form reset values
  DEFAULT_VALUES: {
    TIME_IN_HOURS: 0,
    AI_TIME_SPENT: 0.5,
    DELIVERABLES_COUNT: 0
  }
};

// Task Validation Configuration
const TASK_VALIDATION_CONFIG = {
  // Email validation
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254
  },
  
  // URL validation
  URL: {
    PATTERN: /^https?:\/\/.+/,
    MAX_LENGTH: 2048
  },
  
  // Name validation
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s\-'\.]+$/
  },
  
  // Task number validation
  TASK_NUMBER: {
    PATTERN: /^[A-Z]+-\d+$/,
    MAX_LENGTH: 20
  }
};

// Task Configuration
const TASK_CONFIG = {
  // Task statuses
  STATUSES: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  // Task priorities
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  
  // Default task values
  DEFAULTS: {
    STATUS: 'pending',
    PRIORITY: 'medium',
    TIME_IN_HOURS: 0,
    TIME_SPENT_ON_AI: 0
  }
};

// Validation patterns
const VALIDATION_PATTERNS = {
  JIRA_LINK: /^https:\/\/.*\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
  TASK_NUMBER: TASK_VALIDATION_CONFIG.TASK_NUMBER.PATTERN,
  EMAIL: TASK_VALIDATION_CONFIG.EMAIL.PATTERN,
  URL: TASK_VALIDATION_CONFIG.URL.PATTERN,
  NAME: TASK_VALIDATION_CONFIG.NAME.PATTERN,
};

// Extract task number from Jira link
export const extractTaskNumber = (jiraLink) => {
  if (!jiraLink || typeof jiraLink !== 'string') return '';
  const jiraPattern = /([A-Z]+-\d+)/i;
  const match = jiraLink.match(jiraPattern);
  return match ? match[1].toUpperCase() : '';
};

// Utility functions for form validation and processing
export const validateTaskNumber = (taskNumber) => {
  if (!taskNumber) return false;
  return VALIDATION_PATTERNS.TASK_NUMBER.test(taskNumber);
};

export const normalizeTaskNumber = (taskNumber) => {
  if (!taskNumber) return '';
  return taskNumber.toUpperCase().trim();
};

export const validateJiraUrl = (url) => {
  if (!url) return false;
  return VALIDATION_PATTERNS.JIRA_LINK.test(url);
};

export const formatTaskNumber = (taskNumber) => {
  if (!taskNumber) return '';
  const normalized = normalizeTaskNumber(taskNumber);
  return validateTaskNumber(normalized) ? normalized : '';
};

export const validateTimeInput = (timeInHours) => {
  const num = parseFloat(timeInHours);
  return !isNaN(num) && 
         num >= TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS && 
         num <= TASK_FORM_CONFIG.TIME_INPUT.MAX_HOURS;
};

export const formatTimeInput = (timeInHours) => {
  const num = parseFloat(timeInHours);
  if (isNaN(num)) return TASK_FORM_CONFIG.DEFAULT_VALUES.TIME_IN_HOURS;
  return Math.max(TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS, 
                  Math.min(TASK_FORM_CONFIG.TIME_INPUT.MAX_HOURS, num));
};

export const validateArrayLength = (array, maxLength = TASK_FORM_CONFIG.VALIDATION.MAX_ARRAY_LENGTH) => {
  return Array.isArray(array) && array.length <= maxLength;
};

export const sanitizeStringInput = (input, maxLength = TASK_VALIDATION_CONFIG.NAME.MAX_LENGTH) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().substring(0, maxLength);
};

export const validateFormData = (formData) => {
  const errors = {};
  
  // Validate task number
  if (!validateTaskNumber(formData.taskNumber)) {
    errors.taskNumber = 'Invalid task number format';
  }
  
  // Validate Jira URL
  if (formData.jiraLink && !validateJiraUrl(formData.jiraLink)) {
    errors.jiraLink = 'Invalid Jira URL format';
  }
  
  // Validate time input
  if (!validateTimeInput(formData.timeInHours)) {
    errors.timeInHours = `Time must be between ${TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS} and ${TASK_FORM_CONFIG.TIME_INPUT.MAX_HOURS} hours`;
  }
  
  // Validate markets array
  if (!validateArrayLength(formData.markets)) {
    errors.markets = `Maximum ${TASK_FORM_CONFIG.VALIDATION.MAX_ARRAY_LENGTH} markets allowed`;
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};


// Task form validation schema
export const taskFormSchema = Yup.object().shape({
  jiraLink: Yup.string()
    .url('Invalid URL')
    .required('Required')
    .test('jira-link', 'Must be a valid Atlassian Jira URL (e.g., https://company.atlassian.net/browse/TASK-123)', (value) => {
      if (!value) return true; // Let required handle empty values
      return VALIDATION_PATTERNS.JIRA_LINK.test(value);
    }),

  taskNumber: Yup.string()
    .matches(VALIDATION_PATTERNS.TASK_NUMBER, 'Task number must be in format TASK-123 (e.g., PROJ-456)')
    .max(TASK_VALIDATION_CONFIG.TASK_NUMBER.MAX_LENGTH, `Maximum ${TASK_VALIDATION_CONFIG.TASK_NUMBER.MAX_LENGTH} characters`)
    .test('task-number-format', 'Invalid task number format', (value) => validateTaskNumber(value))
    .transform((value) => normalizeTaskNumber(value))
    .required('Required'),

  markets: Yup.array()
    .min(1, 'Select at least one market')
    .test('array-length', `Maximum ${TASK_FORM_CONFIG.VALIDATION.MAX_ARRAY_LENGTH} markets allowed`, (value) => validateArrayLength(value))
    .required('Required'),

  products: Yup.string()
    .required('Please select a product'),

  departments: Yup.string()
    .required('Required'),

  timeInHours: Yup.number()
    .min(TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS, `Minimum ${TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS} hours`)
    .max(TASK_FORM_CONFIG.TIME_INPUT.MAX_HOURS, `Maximum ${TASK_FORM_CONFIG.TIME_INPUT.MAX_HOURS} hours`)
    .test('time-validation', 'Invalid time input', (value) => validateTimeInput(value))
    .transform((value) => formatTimeInput(value))
    .required('Required'),

  deliverables: Yup.array().when('hasDeliverables', {
    is: true,
    then: (schema) => schema.min(1, 'Select at least one deliverable'),
    otherwise: (schema) => schema
  }),

  userAI: Yup.array().when('usedAI', {
    is: true,
    then: (schema) => schema.min(1, 'AI data is required when AI is used'),
    otherwise: (schema) => schema
  }),

  reporters: Yup.string()
    .required('Please select a reporter')
});

// Task form initial values
export const getTaskFormInitialValues = (user, monthId, initialValues = null) => {
  // Default values for new tasks
  const defaults = {
    jiraLink: '',
    taskNumber: '',
    markets: [],
    products: '',
    departments: '',
    timeInHours: TASK_FORM_CONFIG.DEFAULT_VALUES.TIME_IN_HOURS,
    hasDeliverables: false,
    deliverables: [],
    usedAI: false,
    userAI: [],
    reporters: ''
  };

  // If no initial values provided, return defaults
  if (!initialValues) {
    return defaults;
  }

  // Merge and sanitize initial values with defaults
  return {
    jiraLink: sanitizeStringInput(initialValues.jiraLink || '', TASK_VALIDATION_CONFIG.URL.MAX_LENGTH),
    taskNumber: formatTaskNumber(initialValues.taskNumber || ''),
    markets: Array.isArray(initialValues.markets) ? initialValues.markets : defaults.markets,
    products: sanitizeStringInput(initialValues.products || ''),
    departments: sanitizeStringInput(initialValues.departments || ''),
    timeInHours: formatTimeInput(initialValues.timeInHours || defaults.timeInHours),
    // Auto-check hasDeliverables if deliverables array has data
    hasDeliverables: Boolean(initialValues.hasDeliverables || (Array.isArray(initialValues.deliverables) && initialValues.deliverables.length > 0)),
    deliverables: Array.isArray(initialValues.deliverables) ? initialValues.deliverables : defaults.deliverables,
    // Auto-check usedAI if userAI array has data
    usedAI: Boolean(initialValues.usedAI || (Array.isArray(initialValues.userAI) && initialValues.userAI.length > 0)),
    userAI: Array.isArray(initialValues.userAI) ? initialValues.userAI : defaults.userAI,
    reporters: sanitizeStringInput(initialValues.reporters || '')
  };
};

// Task form field options
export const TASK_FORM_OPTIONS = {
  markets: [
    { value: "ro", label: "ro" },
    { value: "com", label: "com" },
    { value: "uk", label: "uk" },
    { value: "ie", label: "ie" },
    { value: "fi", label: "fi" },
    { value: "dk", label: "dk" },
    { value: "de", label: "de" },
    { value: "at", label: "at" },
    { value: "it", label: "it" },
    { value: "gr", label: "gr" },
    { value: "fr", label: "fr" },
    { value: "misc", label: "misc" },
  ],
  products: [
    { value: "mkt casino", label: "mkt casino" },
    { value: "mkt sport", label: "mkt sport" },
    { value: "mkt poker", label: "mkt poker" },
    { value: "mkt lotto", label: "mkt lotto" },

    { value: "acq casino", label: "acq casino" },
    { value: "acq sport", label: "acq sport" },
    { value: "acq poker", label: "acq poker" },
    { value: "acq lotto", label: "acq lotto" },
    
    { value: "prod casino", label: "prod casino" },
    { value: "prod sport", label: "prod sport" },
    { value: "prod poker", label: "prod poker" },
    { value: "prod lotto", label: "prod lotto" },
    { value: "misc", label: "misc " },
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
  ]
};

