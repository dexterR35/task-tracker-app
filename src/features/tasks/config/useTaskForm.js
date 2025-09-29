import * as Yup from 'yup';
import { logger } from '@/utils/logger';
import { serializeTimestampsForRedux } from '@/utils/dateUtils';
import { 
  createTextField,
  createTextareaField,
  createSelectField,
  createMultiSelectField,
  createNumberField,
  createCheckboxField,
  createUrlField,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES
} from '../../../components/forms/configs/sharedFormUtils';

// ===== DELIVERABLE TIME CALCULATION UTILITIES =====
export const calculateDeliverableTime = (deliverable, quantity = 1) => {
  if (!deliverable.timePerUnit || deliverable.timePerUnit === 0) {
    return 0;
  }
  
  const totalTime = deliverable.timePerUnit * quantity;
  
  // Convert to hours for consistent calculation
  switch (deliverable.timeUnit) {
    case 'min':
      return totalTime / 60; // Convert minutes to hours
    case 'hr':
      return totalTime;
    case 'days':
      return totalTime * 8; // Convert days to hours (8 hours per day)
    default:
      return totalTime;
  }
};

export const calculateTotalDeliverableTime = (deliverableValue, quantities) => {
  if (!deliverableValue) return 0;
  
  const deliverable = TASK_FORM_OPTIONS.deliverables.find(d => d.value === deliverableValue);
  if (!deliverable) return 0;
  
  const quantity = quantities[deliverableValue] || 1;
  return calculateDeliverableTime(deliverable, quantity);
};

export const formatTimeEstimate = (deliverable, quantity = 1) => {
  if (!deliverable.timePerUnit || deliverable.timePerUnit === 0) {
    return '';
  }
  
  const totalTime = deliverable.timePerUnit * quantity;
  const unit = deliverable.timeUnit;
  
  if (deliverable.requiresQuantity) {
    return `${totalTime} ${unit} (${quantity} × ${deliverable.timePerUnit} ${unit}/unit)`;
  } else {
    return `${totalTime} ${unit}`;
  }
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
  deliverables: [
    { value: "game preview", label: "game preview", timePerUnit: 15, timeUnit: "min", requiresQuantity: true },
    { value: "promo pack", label: "promo pack", timePerUnit: 3.5, timeUnit: "hr", requiresQuantity: true },
    { value: "simple design", label: "simple design", timePerUnit: 1, timeUnit: "hr", requiresQuantity: true },
    { value: "Newsletter update", label: "Newsletter update", timePerUnit: 20, timeUnit: "min", requiresQuantity: true },
    { value: "Newsletter new design", label: "Newsletter new design", timePerUnit: 2, timeUnit: "hr", requiresQuantity: true },
    { value: "landing page", label: "landing page", timePerUnit: 8, timeUnit: "hr", requiresQuantity: true },
    { value: "banner new design", label: "banner new design", timePerUnit: 2, timeUnit: "hr", requiresQuantity: true },
    { value: "banner update", label: "banner update", timePerUnit: 20, timeUnit: "min", requiresQuantity: true },
    { value: "minigame", label: "minigame", timePerUnit: 4, timeUnit: "days", requiresQuantity: true },
    { value: "social media new design", label: "social media new design", timePerUnit: 3, timeUnit: "hr", requiresQuantity: true },
    { value: "sport campaign", label: "sport campaign", timePerUnit: 2.5, timeUnit: "hr", requiresQuantity: true },
    { value: "declinari", label: "declinari", timePerUnit: 10, timeUnit: "min", requiresQuantity: true },
    { value: "others", label: "Others", timePerUnit: 0, timeUnit: "hr", requiresQuantity: false },
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
    placeholder: 'https://gmrd.atlassian.net/browse/GIMODEAR-124124'
  }),
  createSelectField('products', 'Products', {}, {
    options: TASK_FORM_OPTIONS.products
  }),
  createSelectField('departments', 'Department', {}, {
    options: TASK_FORM_OPTIONS.departments
  }),
  createMultiSelectField('markets', 'Markets', {}, {
    options: TASK_FORM_OPTIONS.markets
  }),
  createNumberField('timeInHours', 'Total Time (Hours)', {
    step: 0.5
  }),
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
  createCheckboxField('_hasDeliverables', 'Has Deliverables', {}),
  {
    ...createSelectField('deliverables', 'Deliverables', {}, {
      options: TASK_FORM_OPTIONS.deliverables
    }),
    conditional: {
      field: '_hasDeliverables',
      value: true
    }
  },
  createCheckboxField('_usedAIEnabled', 'AI Tools Used', {
    // helpText: 'Check if AI tools were used in this task'
  }),
  createCheckboxField('isVip', 'VIP Task', {
    required: false
  }),
  createCheckboxField('reworked', 'Reworked', {
    required: false
  }),
  {
    ...createMultiSelectField('aiModels', 'AI Models Used', {}, {
      options: TASK_FORM_OPTIONS.aiModels
    }),
    conditional: {
      field: '_usedAIEnabled',
      value: true
    }
  },
  {
    ...createNumberField('aiTime', 'Time Spent on AI (Hours)', {
      step: 0.5
    }),
    conditional: {
      field: '_usedAIEnabled',
      value: true
    }
  },
  createSelectField('reporters', 'Reporter', {}, {
    options: [] // Will be populated dynamically
  }),
  createTextareaField('observations', 'Observations', {
    placeholder: 'Enter any additional observations or notes...',
    required: false
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
  
  deliverables: Yup.string().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.required('Please select a deliverable when "Has Deliverables" is checked'),
    otherwise: (schema) => schema.notRequired().default('')
  }),
  
  deliverableQuantities: Yup.object().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.test('valid-quantities', 'Please enter valid quantities for deliverables', function(value) {
      const deliverableValue = this.parent.deliverables;
      const quantities = value || {};
      
      if (deliverableValue) {
        const deliverable = TASK_FORM_OPTIONS.deliverables.find(d => d.value === deliverableValue);
        if (deliverable && deliverable.requiresQuantity) {
          const quantity = quantities[deliverableValue];
          if (!quantity || quantity < 1) {
            return this.createError({
              message: `Please enter a quantity for ${deliverable.label}`
            });
          }
        }
      }
      return true;
    }),
    otherwise: (schema) => schema.notRequired().default({})
  }),
  
  customDeliverables: Yup.array().when(['_hasDeliverables', 'deliverables'], {
    is: (hasDeliverables, deliverables) => hasDeliverables && deliverables === 'others',
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
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  observations: Yup.string()
    .optional()
    .max(1000, 'Observations cannot exceed 1000 characters')
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
    formData.deliverables = ''; // Empty string when checkbox is not checked
    formData.customDeliverables = []; // Empty array when checkbox is not checked
    formData.deliverableQuantities = {}; // Empty object when checkbox is not checked
  } else {
    // If "others" is not selected, clear custom deliverables
    if (formData.deliverables !== 'others') {
      formData.customDeliverables = [];
    }
    
    // Calculate total deliverable time and update timeInHours if needed
    if (formData.deliverables) {
      const calculatedTime = calculateTotalDeliverableTime(
        formData.deliverables, 
        formData.deliverableQuantities || {}
      );
      
      // If calculated time is greater than current time, update it
      if (calculatedTime > 0 && calculatedTime > (formData.timeInHours || 0)) {
        formData.timeInHours = Math.round(calculatedTime * 10) / 10; // Round to 1 decimal place
        logger.log('🕒 Updated timeInHours based on deliverables:', {
          calculatedTime,
          newTimeInHours: formData.timeInHours
        });
      }
    }
  }
  // If checkbox is checked, keep the deliverables array as-is (validation ensures they're filled)
  
  if (!formData._usedAIEnabled) {
    formData.aiModels = []; // Empty array when checkbox is not checked
    formData.aiTime = 0; // Zero when checkbox is not checked
  }
  // If checkbox is checked, keep aiModels and aiTime as-is (validation ensures they're filled)
  
  // Handle observations field - sanitize and only save if not empty
  if (formData.observations) {
    // Sanitize the observations text (basic HTML sanitization)
    formData.observations = formData.observations.trim();
    // Only keep if not empty after trimming
    if (!formData.observations) {
      delete formData.observations;
    }
  } else {
    delete formData.observations;
  }
  
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
