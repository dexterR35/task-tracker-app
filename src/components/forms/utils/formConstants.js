// ===== FIELD TYPE CONSTANTS =====
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  NETBET_EMAIL: 'netbetEmail',
  URL: 'url',
  NUMBER: 'number',
  SELECT: 'select',
  MULTI_SELECT: 'multiSelect',
  CHECKBOX: 'checkbox',
  PASSWORD: 'password',
};

// ===== VALIDATION PATTERNS =====
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  NETBET_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@netbet\.ro$/,
  URL: /^https?:\/\/.+/,
  JIRA_URL_ONLY: /^https:\/\/gmrd\.atlassian\.net\/browse\/GIMODEAR-\d+$/,
};

// ===== VALIDATION MESSAGES =====
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
  CONDITIONAL_REQUIRED: 'This field is required when the condition is met',
  JIRA_URL_FORMAT: 'Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/GIMODEAR-{number}',
  DELIVERABLE_REQUIRED: 'Please select at least one deliverable when "Has Deliverables" is checked',
  AI_MODEL_REQUIRED: 'Please select at least one AI model when "AI Tools Used" is checked',
};

// ===== SUCCESS MESSAGES =====
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  REPORTER_CREATED: 'Reporter created successfully!',
  REPORTER_UPDATED: 'Reporter updated successfully!',
  LOGIN_SUCCESS: 'Login successful!',
};

// ===== ERROR MESSAGES =====
export const ERROR_MESSAGES = {
  TASK_SAVE_FAILED: 'Failed to save task. Please try again.',
  REPORTER_SAVE_FAILED: 'Failed to save reporter. Please try again.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
};

// ===== CSS CLASSES =====
export const INPUT_CLASSES = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white";

export const READONLY_CLASSES = "bg-gray-100 dark:bg-gray-600 cursor-not-allowed";

export const FIELD_LABEL_CLASSES = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export const ERROR_MESSAGE_CLASSES = "text-red-500 text-sm mt-1";

export const HELP_TEXT_CLASSES = "text-sm text-gray-500 dark:text-gray-400 mt-1";

export const REQUIRED_INDICATOR = '*';

// ===== INPUT TYPE MAPPING =====
export const INPUT_TYPE_MAP = {
  email: 'email',
  netbetEmail: 'email',
  password: 'password',
  text: 'text'
};

// ===== FORM METADATA CONFIGURATION =====
export const FORM_METADATA = {
  task: {
    titles: { create: 'Create New Task', edit: 'Edit Task' },
    buttons: { create: 'Create Task', edit: 'Update Task' }
  },
  reporter: {
    titles: { create: 'Create New Reporter', edit: 'Edit Reporter' },
    buttons: { create: 'Create Reporter', edit: 'Update Reporter' }
  }
};

// ===== PROTECTED FIELDS =====
export const PROTECTED_FIELDS = ['createdAt', 'createdByUID', 'createdByName', 'id'];

// ===== CONDITIONAL FIELD LOGIC CONFIGURATION =====
export const CONDITIONAL_FIELD_LOGIC = {
  hasDeliverables: {
    clearFields: ['deliverables'],
    clearErrors: ['deliverables']
  },
  usedAI: {
    clearFields: ['aiModels', 'aiTime'],
    clearErrors: ['aiModels', 'aiTime'],
    setValues: { aiTime: 0 }
  }
};
