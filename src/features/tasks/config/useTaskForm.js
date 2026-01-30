import * as Yup from 'yup';
import { serializeTimestampsForContext } from '@/utils/dateUtils';
import { prepareFormData } from '@/utils/formUtils';
import { VALIDATION, FORM_OPTIONS } from '@/constants';
import { 
  jiraUrlField, 
  requiredSelect, 
  arrayField, 
  timeInHoursField, 
  dateField, 
  endDateField,
  optionalStringField,
  numberField
} from '@/utils/validationSchemas';

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
// Task form department field: only Design, Video, Development
const TASK_FORM_DEPARTMENTS = [
  { value: 'design', label: 'Design' },
  { value: 'video', label: 'Video' },
  { value: 'developer', label: 'Development' },
];

export const TASK_FORM_OPTIONS = {
  products: FORM_OPTIONS.PRODUCTS,
  markets: FORM_OPTIONS.MARKETS,
  departments: TASK_FORM_DEPARTMENTS,
  // deliverables will be loaded dynamically from database
  aiModels: FORM_OPTIONS.AI_MODELS,
};

// ===== TASK FORM FIELD CONFIGURATION =====
export const createTaskFormFields = (deliverablesOptions = []) => [
  {
    name: 'jiraLink',
    type: 'url',
    required: true,
    placeholder: 'https://gmrd.atlassian.net/browse/GIMODEAR-124124'
  },
  {
    name: 'products',
    type: 'select',
    required: true,
    placeholder: 'Select products...',
    options: TASK_FORM_OPTIONS.products
  },
  {
    name: 'departments',
    type: 'select',
    required: true,
    placeholder: 'Select department...',
    options: TASK_FORM_OPTIONS.departments
  },
  {
    name: 'markets',
    type: 'multiSelect',
    required: true,
    placeholder: 'Select markets...',
    options: TASK_FORM_OPTIONS.markets
  },
  // Date range fields for task duration
  {
    name: 'startDate',
    type: 'date',
    required: true,
    placeholder: 'Start Date',
    conditional: false
  },
  {
    name: 'endDate',
    type: 'date',
    required: true,
    placeholder: 'End Date',
    conditional: false
  },
  {
    name: 'timeInHours',
    type: 'number',
    required: true,
    placeholder: 'Total time (hrs)',
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
    name: 'useShutterstock',
    type: 'checkbox',
    label: 'Shutterstock',
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
    required: true,
    placeholder: 'Select reporter...',
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
  jiraLink: jiraUrlField(),
  products: requiredSelect(),
  departments: requiredSelect(),
  markets: arrayField(1),
  timeInHours: timeInHoursField(0.5, 999),
  startDate: dateField(true),
  endDate: endDateField('startDate'),

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
  useShutterstock: Yup.boolean(),
  aiModels: Yup.array().when('_usedAIEnabled', {
    is: true,
    then: (schema) => schema.min(1, 'Please select at least one AI model when "AI Tools Used" is checked'),
    otherwise: (schema) => schema.notRequired()
  }),

  aiTime: Yup.number().when('_usedAIEnabled', {
    is: true,
    then: (schema) => timeInHoursField(0.5, 999)
      .required('AI time is required when "AI Tools Used" is checked'),
    otherwise: (schema) => schema.notRequired()
  }),

  reporters: requiredSelect(),
  observations: optionalStringField(300)
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


const processConditionalFields = (formData) => {
  const processedData = { ...formData };

  // Handle deliverables conditional logic
  if (!processedData._hasDeliverables) {
    processedData.deliverables = [];
  }

  // Handle AI tools conditional logic
  if (!processedData._usedAIEnabled) {
    processedData.aiModels = [];
    processedData.aiTime = 0;
  }

  return processedData;
};


const createDataTaskStructure = (formData) => {
  const deliverablesUsed = formData._hasDeliverables ? [{
    name: formData.deliverables || '',
    count: formData.deliverableQuantities?.[formData.deliverables] || 1,
    variationsEnabled: formData.variationsDeliverables?.[formData.deliverables] || false,
    variationsCount: formData.variationsQuantities?.[formData.deliverables] || 0
  }] : [];
  
  const aiUsed = formData._usedAIEnabled ? [{
    aiModels: formData.aiModels || [],
    aiTime: formData.aiTime || 0
  }] : [];
  
  // Extract deliverable names for DB-level filtering
  const deliverableNames = deliverablesUsed
    .map(d => d.name)
    .filter(name => name && name.trim() !== '');
  
  // Calculate hasAiUsed for DB-level filtering
  const hasAiUsed = aiUsed.length > 0 && aiUsed[0]?.aiModels?.length > 0;
  
  return {
    aiUsed,
    deliverablesUsed,
    deliverableNames, // Array of deliverable names for DB-level filtering
    hasAiUsed, // Boolean flag for DB-level filtering
    departments: formData.departments ? [formData.departments] : [],
    markets: formData.markets || [],
    endDate: formData.endDate,
    isVip: formData.isVip || false,
    observations: formData.observations || '',
    products: formData.products || '',
    reporterName: formData.reporterName || '',
    reporters: formData.reporters || '',
    reporterUID: formData.reporters || '', // Set reporterUID to match reporters ID for data consistency
    reworked: formData.reworked || false,
    useShutterstock: formData.useShutterstock || false,
    startDate: formData.startDate,
    taskName: formData.taskName,
    timeInHours: formData.timeInHours,
    ...(formData.monthId !== undefined && { monthId: formData.monthId })
  };
};


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
