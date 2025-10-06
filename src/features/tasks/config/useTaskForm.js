import * as Yup from 'yup';
import { serializeTimestampsForRedux } from '@/utils/dateUtils';
import { transformNestedDataToLowercase } from '@/utils/formUtils';




const VALIDATION_PATTERNS = {
  JIRA_URL_ONLY: /^https:\/\/gmrd\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
};

const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  JIRA_URL_FORMAT: "Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/{PROJECT}-{number}",
  MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min) => `Must be at least ${min}`,
  MAX_VALUE: (max) => `Must be no more than ${max}`,
  SELECT_ONE: "Please select at least one option",
};

// ===== CONDITIONAL FIELD LOGIC =====
export const shouldShowField = (field, formValues) => {
  if (!field.conditional) return true;
  
  const { field: conditionalField, value: conditionalValue } = field.conditional;
  const conditionalFieldValue = formValues[conditionalField];
  
  return conditionalFieldValue === conditionalValue;
};

export const isConditionallyRequired = (field, formValues) => {
  if (!field.required) {
    return false;
  }
  
  if (field.conditional) {
    return shouldShowField(field, formValues);
  }
  
  return field.required;
};

// ===== TASK FORM OPTIONS =====
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
  // deliverables will be loaded dynamically from database
  aiModels: [
    { value: "Photoshop", label: "Photoshop" },
    { value: "FireFly", label: "FireFly" },
    { value: "ChatGpt", label: "ChatGpt" },
    { value: "ShutterStock", label: "ShutterStock" },
    { value: "Midjourney", label: "Midjourney" },
    { value: "NightCafe", label: "NightCafe" },
    { value: "FreePick", label: "FreePick" },
    { value: "Cursor", label: "Cursor" },
    { value: "run diffusion", label: "run diffusion" },

  ],
};

// ===== TASK FORM FIELD CONFIGURATION =====
export const createTaskFormFields = (deliverablesOptions = []) => [
  {
    name: 'jiraLink',
    type: 'url',
    label: 'Jira Link',
    required: true,
    placeholder: 'https://gmrd.atlassian.net/browse/GIMODEAR-124124'
  },
  {
    name: 'products',
    type: 'select',
    label: 'Products',
    required: true,
    options: TASK_FORM_OPTIONS.products
  },
  {
    name: 'departments',
    type: 'select',
    label: 'Department',
    required: true,
    options: TASK_FORM_OPTIONS.departments
  },
  {
    name: 'markets',
    type: 'multiSelect',
    label: 'Markets',
    required: true,
    options: TASK_FORM_OPTIONS.markets
  },
  // Date range fields for task duration
  {
    name: 'startDate',
    type: 'date',
    label: 'Start Date',
    required: true,
    conditional: false
  },
  {
    name: 'endDate', 
    type: 'date',
    label: 'End Date',
    required: true,
    conditional: false
  },
  {
    name: 'timeInHours',
    type: 'number',
    label: 'Total Time (Hours)',
    required: true,
    step: 0.5,
    defaultValue: 0,
    min: 0
  },
  {
    name: '_hasDeliverables',
    type: 'checkbox',
    label: 'Has Deliverables',
    required: false
  },
  {
    name: 'deliverables',
    type: 'select',
    label: 'Deliverables',
    required: true, // Will be conditionally required based on _hasDeliverables
    options: deliverablesOptions,
    conditional: {
      field: '_hasDeliverables',
      value: true
    }
  },
  // Hidden fields for deliverable quantities and declinari
  {
    name: 'deliverableQuantities',
    type: 'hidden',
    label: 'Deliverable Quantities',
    required: false,
    conditional: false
  },
  {
    name: 'declinariQuantities',
    type: 'hidden',
    label: 'Declinari Quantities',
    required: false,
    conditional: false
  },
  {
    name: 'declinariDeliverables',
    type: 'hidden',
    label: 'Declinari Deliverables',
    required: false,
    conditional: false
  },
  {
    name: '_usedAIEnabled',
    type: 'checkbox',
    label: 'AI Tools Used',
    required: false
  },
  {
    name: 'isVip',
    type: 'checkbox',
    label: 'VIP Task',
    required: false
  },
  {
    name: 'reworked',
    type: 'checkbox',
    label: 'Reworked',
    required: false
  },
  {
    name: 'aiModels',
    type: 'multiSelect',
    label: 'AI Models Used',
    required: false,
    options: TASK_FORM_OPTIONS.aiModels,
    conditional: {
      field: '_usedAIEnabled',
      value: true
    }
  },
  {
    name: 'aiTime',
    type: 'number',
    label: 'Time Spent on AI (Hours)',
    required: false,
    step: 0.5,
    defaultValue: 0,
    min: 0,
    conditional: {
      field: '_usedAIEnabled',
      value: true
    }
  },
  {
    name: 'reporters',
    type: 'select',
    label: 'Reporter',
    required: true,
    options: [] // Will be populated dynamically
  },
  {
    name: 'observations',
    type: 'textarea',
    label: 'Observations',
    required: false,
    placeholder: 'Enter any additional observations or notes... (max 300 characters)',
    maxLength: 300
  }
];


// ===== TASK FORM VALIDATION SCHEMA =====
export const createTaskFormSchema = () => Yup.object().shape({
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
    .max(999, VALIDATION_MESSAGES.MAX_VALUE(999))
    .test('valid-increment', 'Time must be in 0.5 hour increments (0, 0.5, 1, 1.5, 2, etc.)', function(value) {
      if (value === undefined || value === null) return true;
      // Check if the value is a valid 0.5 increment
      const remainder = value % 0.5;
      if (remainder !== 0) {
        return this.createError({
          message: '❌ Time must be in 0.5 hour increments (0, 0.5, 1, 1.5, 2, etc.)'
        });
      }
      return true;
    }),
  
  startDate: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date format (YYYY-MM-DD)')
    .test('valid-date', 'Please enter a valid start date', function(value) {
      if (!value) return false;
      const date = new Date(value + 'T00:00:00.000Z');
      return !isNaN(date.getTime());
    }),
  
  endDate: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date format (YYYY-MM-DD)')
    .test('valid-date', 'Please enter a valid end date', function(value) {
      if (!value) return false;
      const date = new Date(value + 'T00:00:00.000Z');
      return !isNaN(date.getTime());
    })
    .test('after-start', 'End date must be after start date', function(value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return true;
      return new Date(value + 'T00:00:00.000Z') >= new Date(startDate + 'T00:00:00.000Z');
    }),
  
  _hasDeliverables: Yup.boolean(),
  
  deliverables: Yup.mixed().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.test('deliverable-required', 'Please select an option', function(value) {
      // Handle both string and object formats
      if (typeof value === 'string') {
        return value && value.trim() !== '';
      }
      if (typeof value === 'object' && value !== null) {
        return value.name && value.name.trim() !== '';
      }
      return false;
    }),
    otherwise: (schema) => schema.notRequired().default('')
  }),
  
  _usedAIEnabled: Yup.boolean(),
  isVip: Yup.boolean(),
  reworked: Yup.boolean(),
  aiModels: Yup.array().when('_usedAIEnabled', {
    is: true,
    then: (schema) => schema.min(1, 'Please select at least one AI model when "AI Tools Used" is checked'),
    otherwise: (schema) => schema.notRequired().default([])
  }),
  
  aiTime: Yup.number().when('_usedAIEnabled', {
    is: true,
    then: (schema) => schema
      .typeError('Please enter a valid number')
      .required('AI time is required when "AI Tools Used" is checked')
      .min(0.5, 'AI time must be at least 0.5 hours')
      .max(999, 'AI time cannot exceed 999 hours')
      .test('valid-increment', 'AI time must be in 0.5 hour increments ', function(value) {
        if (value === undefined || value === null) return true;
        // Check if the value is a valid 0.5 increment
        const remainder = value % 0.5;
        if (remainder !== 0) {
          return this.createError({
            message: '❌ AI time must be in 0.5 hour increments '
          });
        }
        return true;
      }),
    otherwise: (schema) => schema.notRequired().default(0)
  }),
  
  reporters: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  observations: Yup.string()
    .optional()
    .max(300, 'Observations cannot exceed 300 characters')
});


// ===== TASK FORM SANITIZATION UTILITIES =====
const sanitizeTaskFormData = (formData) => {
  // Handle observations field - sanitize and only save if not empty
  if (formData.observations) {
    formData.observations = formData.observations.trim();
    if (!formData.observations) {
      delete formData.observations;
    }
  } else {
    delete formData.observations;
  }
  
  // Sanitize and convert date strings to ISO strings for proper storage
  if (formData.startDate && typeof formData.startDate === 'string') {
    const sanitizedStartDate = formData.startDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(sanitizedStartDate)) {
      formData.startDate = new Date(sanitizedStartDate + 'T00:00:00.000Z').toISOString();
    } else {
      throw new Error('Invalid start date format');
    }
  }
  if (formData.endDate && typeof formData.endDate === 'string') {
    const sanitizedEndDate = formData.endDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(sanitizedEndDate)) {
      formData.endDate = new Date(sanitizedEndDate + 'T00:00:00.000Z').toISOString();
    } else {
      throw new Error('Invalid end date format');
    }
  }
  
  return formData;
};

// ===== TASK FORM DATA PROCESSING =====
export const prepareTaskFormData = (formData) => {
  if (!formData) {
    return formData;
  }


  // Business logic: Extract task name from Jira URL
  if (formData.jiraLink) {
    const jiraMatch = formData.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
    if (jiraMatch) {
      formData.taskName = jiraMatch[1].toUpperCase(); // e.g., "GIMODEAR-124124" - ensure uppercase
    } else {
      // If URL format is invalid, throw an error (validation should have caught this)
      throw new Error('Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/{PROJECT}-{number}');
    }
    delete formData.jiraLink; // Remove original URL
  } else {
    // If no jiraLink provided, throw an error (validation should have caught this)
    throw new Error('Jira link is required');
  }
  
  // Handle conditional fields based on checkbox state
  // When checkboxes are NOT checked: set empty arrays/zero values
  // When checkboxes ARE checked: keep the user's input (validation should have ensured they're filled)
  
  if (!formData._hasDeliverables) {
    formData.deliverables = []; // Empty array when checkbox is not checked
    formData.customDeliverables = []; // Empty array when checkbox is not checked
  } else {
    // If "others" is not selected, clear custom deliverables
    if (formData.deliverables !== 'others') {
      formData.customDeliverables = [];
    }
    
    // Note: Deliverable time calculations are handled in the task table and detail page
  }
  
  if (!formData._usedAIEnabled) {
    formData.aiModels = []; // Empty array when checkbox is not checked
    formData.aiTime = 0; // Zero when checkbox is not checked
  }
  // If checkbox is checked, keep aiModels and aiTime as-is (validation ensures they're filled)
  
  // Apply sanitization using utility function
  sanitizeTaskFormData(formData);
  
  
  // Create the new data structure with data_task wrapper BEFORE deleting UI fields
  const dataTask = {
    // Include all fields with their values (empty if not provided)
    aiUsed: formData._usedAIEnabled ? [{
      aiModels: formData.aiModels || [],
      aiTime: formData.aiTime || 0
    }] : [],
    deliverablesUsed: formData._hasDeliverables ? [{
      name: formData.deliverables || '',
      count: formData.deliverableQuantities?.[formData.deliverables] || 1,
      declinariEnabled: formData.declinariDeliverables?.[formData.deliverables] || false,
      declinariCount: formData.declinariQuantities?.[formData.deliverables] || 0
    }] : [],
    departments: formData.departments ? [formData.departments] : [],
    markets: formData.markets || [], // Required field - validation ensures it's not empty
    endDate: formData.endDate, // Required field - validation ensures it's not empty
    isVip: formData.isVip || false,
    observations: formData.observations || '',
    products: formData.products || '', // Required field - validation ensures it's not empty
    reporterName: formData.reporterName || '', // Required field - validation ensures it's not empty
    reporters: formData.reporters || '', // Required field - validation ensures it's not empty
    reworked: formData.reworked || false,
    startDate: formData.startDate, // Required field - validation ensures it's not empty
    taskName: formData.taskName,
    timeInHours: formData.timeInHours
  };

  // Only include monthId if it's provided and not undefined
  if (formData.monthId !== undefined) {
    dataTask.monthId = formData.monthId;
  }

  // Remove UI-only fields after creating data structure (these should never be saved to DB)
  delete formData._hasDeliverables;
  delete formData._usedAIEnabled;
  
  // Apply lowercase transformation to string fields, but keep taskName uppercase
  const fieldsToLowercase = ['products', 'observations', 'reporterName', 'departments', 'markets', 'reporters'];
  const lowercasedDataTask = transformNestedDataToLowercase(dataTask, fieldsToLowercase);
  
  // Serialize any Date objects to ISO strings for Redux compatibility using utility
  const serializedDataTask = serializeTimestampsForRedux(lowercasedDataTask);
  
  return serializedDataTask;
};

// Default export for backward compatibility
export default createTaskFormSchema;
