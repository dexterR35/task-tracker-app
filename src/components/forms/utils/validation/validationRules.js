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
  
  // Match Jira ticket patterns like JIRA-123, PROJ-456, etc.
  const jiraPattern = /([A-Z]+-\d+)/i;
  const match = jiraLink.match(jiraPattern);
  
  return match ? match[1].toUpperCase() : '';
};

// Validate Jira link format
export const validateJiraLink = (jiraLink) => {
  if (!jiraLink) return false;
  return VALIDATION_PATTERNS.JIRA_LINK.test(jiraLink);
};
