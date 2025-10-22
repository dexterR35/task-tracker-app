import * as Yup from 'yup';
import { serializeTimestampsForContext } from '@/utils/dateUtils';
import { prepareFormData } from '@/utils/formUtils';
import { VALIDATION, FORM_OPTIONS } from '@/constants';

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
  products: FORM_OPTIONS.PRODUCTS,
  markets: FORM_OPTIONS.MARKETS,
  departments: FORM_OPTIONS.DEPARTMENTS,
  // deliverables will be loaded dynamically from database
  aiModels: FORM_OPTIONS.AI_MODELS,
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
  // Hidden fields for deliverable quantities and variations
  {
    name: 'deliverableQuantities',
    type: 'hidden',
    label: 'Deliverable Quantities',
    required: false,
    conditional: false
  },
  {
    name: 'variationsQuantities',
    type: 'hidden',
    label: 'variations Quantities',
    required: false,
    conditional: false
  },
  {
    name: 'variationsDeliverables',
    type: 'hidden',
    label: 'variations Deliverables',
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
    .required(VALIDATION.MESSAGES.REQUIRED)
    .matches(VALIDATION.PATTERNS.JIRA_URL_ONLY, VALIDATION.MESSAGES.JIRA_URL_FORMAT)
    .max(200, VALIDATION.MESSAGES.MAX_LENGTH(200)),

  products: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED),

  departments: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED),

  markets: Yup.array()
    .min(1, VALIDATION.MESSAGES.SELECT_ONE)
    .required(VALIDATION.MESSAGES.REQUIRED),

  timeInHours: Yup.number()
    .typeError('Please enter a valid number')
    .required(VALIDATION.MESSAGES.REQUIRED)
    .min(0.5, VALIDATION.MESSAGES.MIN_VALUE(0.5))
    .max(999, VALIDATION.MESSAGES.MAX_VALUE(999))
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
    .required(VALIDATION.MESSAGES.REQUIRED)
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date format (YYYY-MM-DD)')
    .test('valid-date', 'Please enter a valid start date', function(value) {
      if (!value) return false;
      const date = new Date(value + 'T00:00:00.000Z');
      return !isNaN(date.getTime());
    }),

  endDate: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
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
    }).test('custom-deliverables', 'Please add at least one custom deliverable when "Others" is selected', function(value) {
      // Validate custom deliverables when "others" is selected
      if (value === 'others') {
        const customDeliverables = this.parent.customDeliverables;
        return customDeliverables && customDeliverables.length > 0;
      }
      return true;
    }),
    otherwise: (schema) => schema.notRequired()
  }),

  // Validate deliverable quantities when required
  deliverableQuantities: Yup.object().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.test('quantity-validation', 'Please enter a valid quantity', function(value) {
      const deliverables = this.parent.deliverables;
      if (deliverables && deliverables !== '' && deliverables !== 'others') {
        const quantity = value?.[deliverables];
        if (quantity !== undefined && quantity !== null) {
          return quantity >= 1;
        }
      }
      return true;
    }),
    otherwise: (schema) => schema.notRequired()
  }),

  _usedAIEnabled: Yup.boolean(),
  isVip: Yup.boolean(),
  reworked: Yup.boolean(),
  aiModels: Yup.array().when('_usedAIEnabled', {
    is: true,
    then: (schema) => schema.min(1, 'Please select at least one AI model when "AI Tools Used" is checked'),
    otherwise: (schema) => schema.notRequired()
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
    otherwise: (schema) => schema.notRequired()
  }),

  reporters: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED),

  observations: Yup.string()
    .optional()
    .max(300, VALIDATION.MESSAGES.MAX_LENGTH(300))
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

/**
 * Extract task name from Jira URL
 * @param {string} jiraLink - The Jira URL
 * @returns {string} - Extracted task name
 */
const extractTaskNameFromJira = (jiraLink) => {
  if (!jiraLink) {
    throw new Error('Jira link is required');
  }

  const jiraMatch = jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
  if (jiraMatch) {
    return jiraMatch[1].toUpperCase(); // e.g., "GIMODEAR-124124" - ensure uppercase
  } else {
    throw new Error('Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/{PROJECT}-{number}');
  }
};

/**
 * Process conditional fields based on checkbox states
 * @param {Object} formData - The form data
 * @returns {Object} - Processed form data
 */
const processConditionalFields = (formData) => {
  const processedData = { ...formData };

  // Handle deliverables conditional logic
  if (!processedData._hasDeliverables) {
    processedData.deliverables = [];
    processedData.customDeliverables = [];
  } else if (processedData.deliverables !== 'others') {
    processedData.customDeliverables = [];
  }

  // Handle AI tools conditional logic
  if (!processedData._usedAIEnabled) {
    processedData.aiModels = [];
    processedData.aiTime = 0;
  }

  return processedData;
};

/**
 * Create the data_task structure for database storage
 * @param {Object} formData - Processed form data
 * @returns {Object} - Data task structure
 */
const createDataTaskStructure = (formData) => {
  return {
    aiUsed: formData._usedAIEnabled ? [{
      aiModels: formData.aiModels || [],
      aiTime: formData.aiTime || 0
    }] : [],
    deliverablesUsed: formData._hasDeliverables ? [{
      name: formData.deliverables || '',
      count: formData.deliverableQuantities?.[formData.deliverables] || 1,
      variationsEnabled: formData.variationsDeliverables?.[formData.deliverables] || false,
      variationsCount: formData.variationsQuantities?.[formData.deliverables] || 0
    }] : [],
    departments: formData.departments ? [formData.departments] : [],
    markets: formData.markets || [],
    endDate: formData.endDate,
    isVip: formData.isVip || false,
    observations: formData.observations || '',
    products: formData.products || '',
    reporterName: formData.reporterName || '',
    reporters: formData.reporters || '',
    reworked: formData.reworked || false,
    startDate: formData.startDate,
    taskName: formData.taskName,
    timeInHours: formData.timeInHours,
    ...(formData.monthId !== undefined && { monthId: formData.monthId })
  };
};

/**
 * Main function to prepare task form data for database storage
 * @param {Object} formData - Raw form data
 * @returns {Object} - Processed and serialized data for database
 */
export const prepareTaskFormData = (formData) => {
  if (!formData) {
    return formData;
  }

  // Step 1: Extract task name from Jira URL
  const taskName = extractTaskNameFromJira(formData.jiraLink);
  const processedData = { ...formData, taskName };
  delete processedData.jiraLink; // Remove original URL

  // Step 2: Process conditional fields
  const conditionalProcessedData = processConditionalFields(processedData);

  // Step 3: Apply sanitization
  sanitizeTaskFormData(conditionalProcessedData);

  // Step 4: Create data task structure
  const dataTask = createDataTaskStructure(conditionalProcessedData);

  // Step 5: Remove UI-only fields
  delete conditionalProcessedData._hasDeliverables;
  delete conditionalProcessedData._usedAIEnabled;

  // Step 6: Apply lowercase transformation
  const fieldsToLowercase = ['products', 'observations', 'reporterName', 'departments', 'markets'];
  const fieldsToKeepUppercase = ['taskName', 'reporters', 'userUID', 'reporterUID'];
  const lowercasedDataTask = prepareFormData(dataTask, {
    fieldsToLowercase,
    fieldsToKeepUppercase,
    removeEmptyFields: false,
    convertTypes: false
  });

  // Step 7: Serialize for Context compatibility
  return serializeTimestampsForContext(lowercasedDataTask);
};

// Default export for backward compatibility
export default createTaskFormSchema;
