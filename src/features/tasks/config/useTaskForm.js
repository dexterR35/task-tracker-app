import * as Yup from 'yup';
import { logger } from '@/utils/logger';
import { serializeTimestampsForRedux } from '@/utils/dateUtils';
import { 
  createTextField,
  createSelectField,
  createMultiSelectField,
  createNumberField,
  createCheckboxField,
  createUrlField,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES
} from '../../../components/forms/configs/sharedFormUtils';

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

// ===== TASK FORM FIELD CONFIGURATION =====
export const TASK_FORM_FIELDS = [
  createUrlField('jiraLink', 'Jira Link', {
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
  // Date range fields for task duration
  {
    name: 'startDate',
    type: 'date',
    label: 'Start Date',
    helpText: 'When did this task start?',
    required: true,
    conditional: false
  },
  {
    name: 'endDate', 
    type: 'date',
    label: 'End Date',
    helpText: 'When did this task end?',
    required: true,
    conditional: false
  },
  createCheckboxField('_hasDeliverables', 'Has Deliverables', {
    helpText: 'Check if this task produces deliverables'
  }),
  {
    ...createMultiSelectField('deliverables', 'Deliverables', {
      helpText: 'Select all deliverables produced by this task'
    }, {
      options: TASK_FORM_OPTIONS.deliverables
    }),
    conditional: {
      field: '_hasDeliverables',
      value: true
    }
  },
  createCheckboxField('_usedAIEnabled', 'AI Tools Used', {
    helpText: 'Check if AI tools were used in this task'
  }),
  createCheckboxField('isVip', 'VIP Task', {
    helpText: 'Mark this task as VIP (high priority)',
    required: false
  }),
  createCheckboxField('reworked', 'Reworked', {
    helpText: 'Check if this task was reworked',
    required: false
  }),
  {
    ...createMultiSelectField('aiModels', 'AI Models Used', {
      helpText: 'Select all AI models used in this task'
    }, {
      options: TASK_FORM_OPTIONS.aiModels
    }),
    conditional: {
      field: '_usedAIEnabled',
      value: true
    }
  },
  {
    ...createNumberField('aiTime', 'Time Spent on AI (Hours)', {
      step: 0.5,
      helpText: 'Hours spent specifically using AI tools'
    }),
    conditional: {
      field: '_usedAIEnabled',
      value: true
    }
  },
  createSelectField('reporters', 'Reporter', {
    helpText: 'Select the person responsible for this task'
  }, {
    options: [] // Will be populated dynamically
  })
];

// ===== TASK FORM VALIDATION SCHEMA =====
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
  
  startDate: Yup.date()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .typeError('Please enter a valid start date'),
  
  endDate: Yup.date()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .typeError('Please enter a valid end date')
    .min(Yup.ref('startDate'), 'End date must be after start date'),
  
  _hasDeliverables: Yup.boolean(),
  
  deliverables: Yup.array().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.min(1, 'Please select at least one deliverable when "Has Deliverables" is checked'),
    otherwise: (schema) => schema.notRequired().default([])
  }),
  
  customDeliverables: Yup.array().when(['_hasDeliverables', 'deliverables'], {
    is: (hasDeliverables, deliverables) => hasDeliverables && deliverables?.includes('others'),
    then: (schema) => schema.min(1, 'Please add at least one custom deliverable when "Others" is selected'),
    otherwise: (schema) => schema.notRequired().default([])
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
      .max(999, 'AI time cannot exceed 999 hours'),
    otherwise: (schema) => schema.notRequired().default(0)
  }),
  
  reporters: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
});

// ===== TASK FORM DATA PROCESSING =====
export const prepareTaskFormData = (formData) => {
  if (!formData) {
    return formData;
  }

  logger.log('🔍 Raw form data before processing:', formData);

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
  
  // Handle conditional fields based on checkbox state
  // When checkboxes are NOT checked: set empty arrays/zero values
  // When checkboxes ARE checked: keep the user's input (validation should have ensured they're filled)
  
  if (!formData._hasDeliverables) {
    formData.deliverables = []; // Empty array when checkbox is not checked
    formData.customDeliverables = []; // Empty array when checkbox is not checked
  } else {
    // If "others" is not selected, clear custom deliverables
    if (!formData.deliverables?.includes('others')) {
      formData.customDeliverables = [];
    }
  }
  // If checkbox is checked, keep the deliverables array as-is (validation ensures they're filled)
  
  if (!formData._usedAIEnabled) {
    formData.aiModels = []; // Empty array when checkbox is not checked
    formData.aiTime = 0; // Zero when checkbox is not checked
  }
  // If checkbox is checked, keep aiModels and aiTime as-is (validation ensures they're filled)
  
  // Remove UI-only fields after processing (these should never be saved to DB)
  delete formData._hasDeliverables;
  delete formData._usedAIEnabled;
  
  // Convert Date objects to ISO strings for proper storage
  if (formData.startDate instanceof Date) {
    formData.startDate = formData.startDate.toISOString();
    logger.log('🔍 Converted startDate Date object to ISO:', formData.startDate);
  }
  if (formData.endDate instanceof Date) {
    formData.endDate = formData.endDate.toISOString();
    logger.log('🔍 Converted endDate Date object to ISO:', formData.endDate);
  }
  
  logger.log('🔍 Date fields after processing:', { 
    startDate: formData.startDate, 
    endDate: formData.endDate,
    startDateType: typeof formData.startDate,
    endDateType: typeof formData.endDate
  });
  
  // Serialize any Date objects to ISO strings for Redux compatibility
  const serializedData = serializeTimestampsForRedux(formData);
  
  logger.log('🔍 Final processed data for database:', serializedData);
  
  return serializedData;
};
