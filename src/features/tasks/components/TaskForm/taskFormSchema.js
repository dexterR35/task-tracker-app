import * as Yup from 'yup';

// Validation patterns
const VALIDATION_PATTERNS = {
  JIRA_LINK: /^https:\/\/.*\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
  TASK_NUMBER: /^[A-Z]+-\d+$/,
};

// Extract task number from Jira link
export const extractTaskNumber = (jiraLink) => {
  if (!jiraLink || typeof jiraLink !== 'string') return '';
  const jiraPattern = /([A-Z]+-\d+)/i;
  const match = jiraLink.match(jiraPattern);
  return match ? match[1].toUpperCase() : '';
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
    .required('Required'),

  markets: Yup.array()
    .min(1, 'Select at least one market')
    .required('Required'),

  products: Yup.string()
    .required('Please select a product'),

  departaments: Yup.string()
    .required('Required'),

  timeInHours: Yup.number()
    .min(0.5, 'Minimum 0.5 hours')
    .max(24, 'Maximum 24 hours')
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
  if (initialValues) {
    return {
      jiraLink: initialValues.jiraLink || '',
      taskNumber: initialValues.taskNumber || '',
      markets: initialValues.markets || [],
      products: initialValues.products || '',
      departaments: initialValues.departaments || '',
      timeInHours: initialValues.timeInHours || 0,
      deliverables: initialValues.deliverables || [],
      userAI: initialValues.userAI || [],
      reporters: initialValues.reporters || user?.uid || ''
    };
  }

  return {
    jiraLink: '',
    taskNumber: '',
    markets: [],
    products: '',
    departaments: '',
    timeInHours: 0,
    deliverables: [],
    userAI: [],
    reporters: user?.uid || ''
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
  departaments: [
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
