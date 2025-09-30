import * as Yup from 'yup';
import { logger } from '@/utils/logger';
import { serializeTimestampsForRedux } from '@/utils/dateUtils';
import { 
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

export const calculateTotalDeliverableTime = (deliverableValue, quantities, declinariQuantities = {}, deliverablesOptions = []) => {
  if (!deliverableValue) return 0;
  
  const deliverable = deliverablesOptions.find(d => d.value === deliverableValue);
  if (!deliverable) return 0;
  
  const quantity = quantities[deliverableValue] || 1;
  const deliverableTime = calculateDeliverableTime(deliverable, quantity);
  
  // Add declinari time if declinari is enabled for this deliverable
  const declinariQuantity = declinariQuantities[deliverableValue] || 0;
  if (declinariQuantity > 0) {
    const declinariTimePerUnit = deliverable.declinariTime || 10;
    const declinariTimeUnit = deliverable.declinariTimeUnit || 'min';
    const totalDeclinariTime = declinariQuantity * declinariTimePerUnit;
    
    // Convert declinari time to hours based on its unit
    let declinariTimeInHours = 0;
    switch (declinariTimeUnit) {
      case 'min':
        declinariTimeInHours = totalDeclinariTime / 60;
        break;
      case 'hr':
        declinariTimeInHours = totalDeclinariTime;
        break;
      case 'days':
        declinariTimeInHours = totalDeclinariTime * 8; // 8 hours per day
        break;
      default:
        declinariTimeInHours = totalDeclinariTime / 60; // Default to minutes
    }
    
    return deliverableTime + declinariTimeInHours;
  }
  
  return deliverableTime;
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
// Static options that don't change
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
  createUrlField('jiraLink', 'Jira Link', {
    placeholder: 'https://gmrd.atlassian.net/browse/GIMODEAR-124124'
  }),
  createSelectField('products', 'Products', {}, {
    options: TASK_FORM_OPTIONS.products
  }),
  createSelectField('departments', 'Department', {}, {
    options: TASK_FORM_OPTIONS.departments
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
      options: deliverablesOptions
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

// Fallback for backward compatibility
export const TASK_FORM_FIELDS = createTaskFormFields();

// ===== TASK FORM VALIDATION SCHEMA =====
export const createTaskFormSchema = (deliverablesOptions = []) => Yup.object().shape({
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
  
  deliverables: Yup.mixed().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.test('valid-deliverables', 'Please select a deliverable when "Has Deliverables" is checked', function(value) {
      // Accept both string (from form) and array (processed) formats
      if (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
        return this.createError({
          message: 'Please select a deliverable when "Has Deliverables" is checked'
        });
      }
      
      // If it's an array (processed format), validate structure
      if (Array.isArray(value)) {
        for (const deliverable of value) {
          if (!deliverable.deliverableName) {
            return this.createError({
              message: 'Each deliverable must have a deliverableName'
            });
          }
        }
      }
      
      return true;
    }),
    otherwise: (schema) => schema.notRequired().default([])
  }),
  
  deliverableQuantities: Yup.object().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.test('valid-quantities', 'Please enter valid quantities for deliverables', function(value) {
      const deliverableValue = this.parent.deliverables;
      const quantities = value || {};
      
      // Handle both string (form input) and array (processed) formats
      let actualDeliverableValue = deliverableValue;
      if (Array.isArray(deliverableValue) && deliverableValue.length > 0) {
        actualDeliverableValue = deliverableValue[0].deliverableName;
      }
      
      if (actualDeliverableValue) {
        const deliverable = deliverablesOptions.find(d => d.value === actualDeliverableValue);
        if (deliverable && deliverable.requiresQuantity) {
          const quantity = quantities[actualDeliverableValue];
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
  
  declinariQuantities: Yup.object().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.test('valid-declinari-quantities', 'Please enter valid declinari quantities', function(value) {
      const declinariQuantities = value || {};
      
      // Validate declinari quantities (must be 0 or positive integer)
      for (const [deliverableValue, quantity] of Object.entries(declinariQuantities)) {
        if (quantity < 0 || !Number.isInteger(Number(quantity))) {
          return this.createError({
            message: `Declinari quantity for ${deliverableValue} must be a non-negative integer`
          });
        }
      }
      return true;
    }),
    otherwise: (schema) => schema.notRequired().default({})
  }),
  
  declinariDeliverables: Yup.object().when('_hasDeliverables', {
    is: true,
    then: (schema) => schema.test('valid-declinari-deliverables', 'Please enter valid declinari deliverables', function(value) {
      const declinariDeliverables = value || {};
      
      // Validate declinari deliverables (must be boolean values)
      for (const [deliverableValue, enabled] of Object.entries(declinariDeliverables)) {
        if (typeof enabled !== 'boolean') {
          return this.createError({
            message: `Declinari deliverable for ${deliverableValue} must be a boolean`
          });
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

// Fallback for backward compatibility (with empty deliverables)
export const taskFormSchema = createTaskFormSchema([]);

// ===== TASK FORM DATA PROCESSING =====
export const prepareTaskFormData = (formData, deliverablesOptions = []) => {
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
    if (formData.deliverables !== 'others') {
      formData.customDeliverables = [];
    }
    
    // Calculate total deliverable time and update timeInHours if needed
    if (formData.deliverables) {
      const calculatedTime = calculateTotalDeliverableTime(
        formData.deliverables, 
        formData.deliverableQuantities || {},
        formData.declinariQuantities || {},
        deliverablesOptions
      );
      
      // If calculated time is greater than current time, update it
      if (calculatedTime > 0 && calculatedTime > (formData.timeInHours || 0)) {
        formData.timeInHours = Math.round(calculatedTime * 10) / 10; // Round to 1 decimal place
        logger.log('🕒 Updated timeInHours based on deliverables:', {
          calculatedTime,
          newTimeInHours: formData.timeInHours,
          declinariQuantities: formData.declinariQuantities
        });
      }
    }
  }
  
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
  
  // Create the new data structure with data_task wrapper BEFORE deleting UI fields
  const dataTask = {
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
    timeInHours: formData.timeInHours
  };

  // Only include monthId if it's provided and not undefined
  if (formData.monthId !== undefined) {
    dataTask.monthId = formData.monthId;
  }

  // Remove UI-only fields after creating data structure (these should never be saved to DB)
  delete formData._hasDeliverables;
  delete formData._usedAIEnabled;
  
  // Serialize any Date objects to ISO strings for Redux compatibility
  const serializedDataTask = serializeTimestampsForRedux(dataTask);
  
  logger.log('🔍 Final processed data_task for database:', serializedDataTask);
  
  return serializedDataTask;
};

// Default export for backward compatibility
export default taskFormSchema;
