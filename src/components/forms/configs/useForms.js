import { FIELD_TYPES } from './fieldTypes';
// import { 
//   marketOptions, 
//   productOptions, 
//   departamentsOptions, 
//   aiModelOptions,
//   deliverables 
// } from '@/features/tasks/components/TaskOption/TaskOptions';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES, extractTaskNumber } from '../utils/validation';
import { sanitizeText, sanitizeEmail, sanitizeUrl, sanitizeNumber, sanitizeBoolean, sanitizeArray } from '../utils/sanitization';
import { showInfo } from '@/utils/toast';

// Helper function to check if field should be visible based on conditional logic
export const shouldShowField = (field, formValues) => {
  if (!field.conditional) return true;
  
  const { field: conditionalField, value: conditionalValue, and } = field.conditional;
  const conditionalFieldValue = formValues[conditionalField];
  
  let shouldShow = typeof conditionalValue === 'function' 
    ? conditionalValue(conditionalFieldValue, formValues)
    : conditionalValue === conditionalFieldValue;
  
  if (shouldShow && and) {
    const { field: andField, value: andValue } = and;
    const andFieldValue = formValues[andField];
    shouldShow = typeof andValue === 'function' 
      ? andValue(andFieldValue, formValues)
      : andValue === andFieldValue;
  }
  
  return shouldShow;
};

// Task form field configuration
// export const TASK_FORM_FIELDS = [
//   {
//     name: 'jiraLink',
//     type: FIELD_TYPES.URL,
//     label: 'Jira Link',
//     required: true,
//     validation: {
//       required: true,
//       pattern: VALIDATION_PATTERNS.JIRA_LINK,
//       message: 'Invalid Jira link format. Must be a valid Atlassian Jira URL',
//       custom: {
//         test: (value) => {
//           if (!value) return true; // Let required handle empty values
//           return VALIDATION_PATTERNS.JIRA_LINK.test(value);
//         },
//         message: 'Must be a valid Atlassian Jira URL (e.g., https://company.atlassian.net/browse/TASK-123)'
//       }
//     },
//     placeholder: 'https://jira.company.com/browse/TASK-123',
//     helpText: 'Enter the complete Jira ticket URL. Task number will be auto-extracted.',
//     onBlur: (e, form) => {
//       // Auto-extract task number from Jira link
//       if (e.target.value) {
//         const taskNumber = extractTaskNumber(e.target.value);
//         if (taskNumber) {
//           form.setFieldValue('taskNumber', taskNumber);
//           showInfo(`Task number "${taskNumber}" auto-extracted from Jira link`);
//         }
//       }
//     },
//     onChange: (e, form) => {
//       // Auto-extract task number on change
//       if (e.target.value) {
//         const taskNumber = extractTaskNumber(e.target.value);
//         if (taskNumber) {
//           form.setFieldValue('taskNumber', taskNumber);
//         }
//       }
//     },
//     sanitize: (value) => sanitizeUrl(value),
//     autoComplete: 'url',
//     type: 'url'
//   },
//   {
//     name: 'taskNumber',
//     type: FIELD_TYPES.TEXT,
//     label: 'Task Number',
//     required: true,
//     validation: {
//       required: true,
//       pattern: VALIDATION_PATTERNS.TASK_NUMBER,
//       message: 'Task number must be in format TASK-123',
//       custom: {
//         test: (value) => {
//           if (!value) return true; // Let required handle empty values
//           return VALIDATION_PATTERNS.TASK_NUMBER.test(value);
//         },
//         message: 'Task number must be in format TASK-123 (e.g., PROJ-456)'
//       }
//     },
//     placeholder: 'TASK-123',
//     helpText: 'Task number (auto-extracted from Jira link, cannot be manually edited)',
//     autoComplete: 'off',
//     readOnly: true,
//     disabled: true,
//     sanitize: (value) => sanitizeText(value)
//   },
//   {
//     name: 'markets',
//     type: FIELD_TYPES.MULTI_SELECT,
//     label: 'Markets',
//     required: true,
//     placeholder: 'Select markets',
//     validation: {
//       required: true,
//       minItems: 1,
//       custom: {
//         test: (value) => {
//           if (!value || !Array.isArray(value)) return false;
//           return value.length >= 1;
//         },
//         message: 'Please select at least one market'
//       }
//     },
//     helpText: 'Select all markets where this task applies',
//     maxItems: 10,
//     options: marketOptions,
//     sanitize: (value) => sanitizeArray(value)
//   },
//   {
//     name: 'product',
//     type: FIELD_TYPES.SELECT,
//     label: 'Product',
//     required: true,
//     placeholder: 'Select product',
//     validation: {
//       required: true,
//       custom: {
//         test: (value) => {
//           return value && value.trim() !== '';
//         },
//         message: 'Please select a product'
//       }
//     },
//     helpText: 'Select the primary product this task relates to',
//     options: productOptions,
//     sanitize: (value) => sanitizeText(value)
//   },
//   {
//     name: 'departaments',
//     type: FIELD_TYPES.SELECT,
//     label: 'Task Name',
//     required: true,
//     placeholder: 'Select task type',
//     validation: {
//       required: true,
//       custom: {
//         test: (value) => {
//           return value && value.trim() !== '';
//         },
//         message: 'Please select a task type'
//       }
//     },
//     helpText: 'Select the type of task being performed',
//     options: departamentsOptions,
//     sanitize: (value) => sanitizeText(value)
//   },
//   {
//     name: 'timeInHours',
//     type: FIELD_TYPES.NUMBER,
//     label: 'Total Time (Hours)',
//     required: true,
//     defaultValue: 1,
//     validation: {
//       required: true,
//       minValue: 0.5,
//       maxValue: 24,
//       message: 'Time must be between 0.5 and 24 hours',
//       custom: {
//         test: (value) => {
//           const num = parseFloat(value);
//           return !isNaN(num) && num >= 0.5 && num <= 24;
//         },
//         message: 'Time must be between 0.5 and 24 hours'
//       }
//     },
//     placeholder: '2.5',
//     helpText: 'Total time spent on this task (0.5 - 24 hours)',
//     onChange: (e, form) => {
//       const value = parseFloat(e.target.value);
//       if (value && value % 0.5 !== 0) {
//         const rounded = Math.round(value * 2) / 2;
//         form.setFieldValue('timeInHours', rounded);
//       }
//     },
//     sanitize: (value) => {
//       const num = sanitizeNumber(value);
//       return Math.max(0.5, Math.min(24, num));
//     },
//     step: 0.5,
//     min: 0.5,
//     max: 24
//   },
//   {
//     name: 'aiUsed',
//     type: FIELD_TYPES.CHECKBOX,
//     label: 'AI Tools Used',
//     required: false,
//     defaultValue: false,
//     helpText: 'Check if AI tools were used in this task',
//     onChange: (e, form) => {
//       if (!e.target.checked) {
//         form.setFieldValue('timeSpentOnAI', 0);
//         form.setFieldValue('aiModels', []);
//       } else {
//         form.setFieldValue('timeSpentOnAI', 0.5);
//         form.setFieldValue('aiModels', []);
//       }
//     },
//     sanitize: (value) => sanitizeBoolean(value),
//     className: 'mt-2'
//   },
//   {
//     name: 'timeSpentOnAI',
//     type: FIELD_TYPES.NUMBER,
//     label: 'Time Spent on AI (Hours)',
//     required: false,
//     validation: {
//       minValue: 0.5,
//       maxValue: 24,
//       message: 'AI time must be between 0.5 and 24 hours',
//       custom: {
//         test: (value) => {
//           if (!value) return true; // Optional field
//           const num = parseFloat(value);
//           return !isNaN(num) && num >= 0.5 && num <= 24;
//         },
//         message: 'AI time must be between 0.5 and 24 hours'
//       }
//     },
//     conditional: {
//       field: 'aiUsed',
//       value: true,
//       required: true
//     },
//     placeholder: '1.0',
//     helpText: 'Hours spent specifically using AI tools (required when AI is used)',
//     step: 0.5,
//     min: 0.5,
//     max: 24,
//     sanitize: (value) => {
//       const num = sanitizeNumber(value);
//       return Math.max(0.5, Math.min(24, num));
//     }
//   },
//   {
//     name: 'aiModels',
//     type: FIELD_TYPES.MULTI_SELECT,
//     label: 'AI Models Used',
//     required: false,
//     placeholder: 'Select AI models',
//     conditional: {
//       field: 'aiUsed',
//       value: true,
//       required: true
//     },
//     validation: {
//       minItems: 1,
//       custom: {
//         test: (value) => {
//           if (!value || !Array.isArray(value)) return false;
//           return value.length >= 1;
//         },
//         message: 'Please select at least one AI model when AI is used'
//       }
//     },
//     helpText: 'Select all AI models used in this task (required when AI is used)',
//     maxItems: 5,
//     options: aiModelOptions,
//     sanitize: (value) => sanitizeArray(value)
//   },
//   {
//     name: 'reworked',
//     type: FIELD_TYPES.CHECKBOX,
//     label: 'Task Required Rework',
//     required: false,
//     defaultValue: false,
//     helpText: 'Check if this task required rework or revisions (will be submitted as true/false)',
//     className: 'mt-2',
//     sanitize: (value) => sanitizeBoolean(value)
//   },
//   {
//     name: 'hasDeliverables',
//     type: FIELD_TYPES.CHECKBOX,
//     label: 'Has Deliverables',
//     required: false,
//     defaultValue: false,
//     helpText: 'Check if this task produces deliverables',
//     className: 'mt-2',
//     sanitize: (value) => sanitizeBoolean(value)
//   },
//   {
//     name: 'deliverables',
//     type: FIELD_TYPES.MULTI_SELECT,
//     label: 'Deliverables',
//     required: true,
//     placeholder: 'Select deliverables',
//     validation: {
//       required: true,
//       minItems: 1,
//       custom: {
//         test: (value) => {
//           if (!value || !Array.isArray(value)) return false;
//           return value.length >= 1;
//         },
//         message: 'Please select at least one deliverable when deliverables are enabled'
//       }
//     },
//     conditional: {
//       field: 'hasDeliverables',
//       value: true,
//       required: true
//     },
//     helpText: 'Select all deliverables produced by this task (count will be auto-calculated)',
//     maxItems: 8,
//     options: deliverables,
//     sanitize: (value) => sanitizeArray(value)
//   },
//   {
//     name: 'deliverablesCount',
//     type: FIELD_TYPES.NUMBER,
//     label: 'Number of Deliverables',
//     required: false,
//     defaultValue: 1,
//     validation: {
//       minValue: 1,
//       maxValue: 100,
//       message: 'Deliverables count must be at least 1 when deliverables are enabled',
//       custom: {
//         test: (value) => {
//           if (!value) return true; // Optional field
//           const num = parseInt(value);
//           return !isNaN(num) && num >= 1 && num <= 100;
//         },
//         message: 'Deliverables count must be between 1 and 100'
//       }
//     },
//     conditional: {
//       field: 'hasDeliverables',
//       value: true,
//       required: true
//     },
//     placeholder: '1',
//     helpText: 'Total number of deliverables produced (auto-calculated from selection)',
//     step: 1,
//     min: 1,
//     max: 100,
//     sanitize: (value) => {
//       const num = sanitizeNumber(value);
//       return Math.max(1, Math.min(100, num));
//     }
//   },
//   {
//     name: 'deliverablesOther',
//     type: FIELD_TYPES.MULTI_VALUE,
//     label: 'Other Deliverables',
//     required: false,
//     validation: {
//       minItems: 1,
//       message: 'Please specify other deliverables when "Others" is selected',
//       custom: {
//         test: (value) => {
//           if (!value || !Array.isArray(value)) return false;
//           return value.length >= 1;
//         },
//         message: 'Please specify at least one other deliverable when "Others" is selected'
//       }
//     },
//     conditional: {
//       field: 'hasDeliverables',
//       value: true,
//       and: {
//         field: 'deliverables',
//         value: (deliverables) => deliverables && deliverables.includes('others')
//       },
//       required: true
//     },
//     placeholder: 'Enter deliverable name',
//     helpText: 'Specify other deliverables not listed in the main options',
//     maxValues: 5,
//     addButtonText: 'Add Deliverable',
//     removeButtonText: 'Remove',
//     sanitize: (value) => sanitizeArray(value)
//   },
//   {
//     name: 'reporters',
//     type: FIELD_TYPES.SELECT,
//     label: 'Reporter',
//     required: true,
//     validation: {
//       required: true,
//       custom: {
//         test: (value) => {
//           return value && value.trim() !== '';
//         },
//         message: 'Please select a reporter'
//       }
//     },
//     helpText: 'Select the person responsible for this task (defaults to current user)',
//     autoComplete: 'off',
//     sanitize: (value) => sanitizeText(value)
//   }
// ];


// Reporter form field configuration
export const REPORTER_FORM_FIELDS = [
  {
    name: 'name',
    type: FIELD_TYPES.TEXT,
    label: 'Reporter Name',
    required: true,
    validation: {
      minLength: 2,
      maxLength: 50,
      custom: {
        test: (value) => {
          if (!value) return false;
          return value.length >= 2 && value.length <= 50;
        },
        message: 'Name must be between 2 and 50 characters'
      }
    },
    placeholder: 'Enter reporter name',
    helpText: 'Enter the reporter\'s full name',
    sanitize: (value) => sanitizeText(value)
  },
  {
    name: 'email',
    type: FIELD_TYPES.EMAIL,
    label: 'Email Address',
    required: true,
    validation: {
      custom: {
        test: (value) => {
          if (!value) return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: VALIDATION_MESSAGES.EMAIL
      }
    },
    placeholder: 'Enter email address',
    helpText: 'Enter the reporter\'s email address',
    sanitize: (value) => sanitizeEmail(value)
  },
  {
    name: 'role',
    type: FIELD_TYPES.SELECT,
    label: 'Role',
    required: true,
    options: [
      { value: 'developer', label: 'Developer' },
      { value: 'designer', label: 'Designer' },
      { value: 'manager', label: 'Manager' },
      { value: 'analyst', label: 'Analyst' },
      { value: 'tester', label: 'Tester' }
    ],
    placeholder: 'Select your role',
    validation: {
      required: true
    },
    sanitize: (value) => sanitizeText(value)
  },
  {
    name: 'departament',
    type: FIELD_TYPES.TEXT,
    label: 'Department',
    required: true,
    validation: {
      minLength: 1,
      maxLength: 50,
      custom: {
        test: (value) => {
          if (!value) return false;
          return value.length >= 1 && value.length <= 50;
        },
        message: 'Department must be between 1 and 50 characters'
      }
    },
    placeholder: 'Enter department',
    helpText: 'Enter the reporter\'s department',
    sanitize: (value) => sanitizeText(value)
  },
  {
    name: 'occupation',
    type: FIELD_TYPES.SELECT,
    label: 'Occupation',
    required: true,
    options: [
      { value: 'full-time', label: 'Full Time' },
      { value: 'part-time', label: 'Part Time' },
      { value: 'contractor', label: 'Contractor' },
      { value: 'freelancer', label: 'Freelancer' }
    ],
    placeholder: 'Select your occupation',
    validation: {
      required: true
    },
    sanitize: (value) => sanitizeText(value)
  }
];


export const USER_FORM_FIELDS = [
  {
    name: 'name',
    type: FIELD_TYPES.TEXT,
    label: 'Full Name',
    required: true,
    validation: {
      minLength: 2,
      maxLength: 50,
      custom: {
        test: (value) => {
          if (!value) return false;
          return value.length >= 2 && value.length <= 50;
        },
        message: 'Name must be between 2 and 50 characters'
      }
    },
    placeholder: 'Enter full name',
    helpText: 'Enter the user\'s full name',
    sanitize: (value) => sanitizeText(value)
  },
  {
    name: 'email',
    type: FIELD_TYPES.EMAIL,
    label: 'Email Address',
    required: true,
    validation: {
      custom: {
        test: (value) => {
          if (!value) return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: VALIDATION_MESSAGES.EMAIL
      }
    },
    placeholder: 'Enter email address',
    helpText: 'Enter the user\'s email address',
    sanitize: (value) => sanitizeEmail(value)
  },
  {
    name: 'role',
    type: FIELD_TYPES.SELECT,
    label: 'Role',
    required: true,
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'user', label: 'User' },
      { value: 'reporter', label: 'Reporter' }
    ],
    placeholder: 'Select user role',
    validation: {
      required: true
    },
    helpText: 'Select the user\'s role in the system',
    sanitize: (value) => sanitizeText(value)
  },
  {
    name: 'occupation',
    type: FIELD_TYPES.SELECT,
    label: 'Occupation',
    required: false,
    options: [
      { value: 'full-time', label: 'Full Time' },
      { value: 'part-time', label: 'Part Time' },
      { value: 'contractor', label: 'Contractor' },
      { value: 'freelancer', label: 'Freelancer' }
    ],
    placeholder: 'Select occupation',
    helpText: 'Select the user\'s occupation',
    sanitize: (value) => sanitizeText(value)
  },
  {
    name: 'isActive',
    type: FIELD_TYPES.CHECKBOX,
    label: 'Active User',
    required: false,
    defaultValue: true,
    helpText: 'Check if the user should be active in the system',
    sanitize: (value) => sanitizeBoolean(value)
  }
];


// To remove helper text from any field, simply don't include the 'helpText' property
export const LOGIN_FORM_FIELDS = [
  {
    name: 'email',
    type: FIELD_TYPES.EMAIL,
    label: 'Email Address',
    required: true,
    placeholder: 'Enter your email',
    validation: {
      custom: {
        test: (value) => {
          if (!value) return false;
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: VALIDATION_MESSAGES.EMAIL
      }
    },
    autoComplete: 'email',
    sanitize: (value) => sanitizeEmail(value)
  },
  {
    name: 'password',
    type: FIELD_TYPES.PASSWORD,
    label: 'Password',
    required: true,
    validation: {
      minLength: 6,
      custom: {
        test: (value) => {
          if (!value) return false;
          return value.length >= 6;
        },
        message: 'Password must be at least 6 characters long'
      }
    },
    placeholder: 'Enter your password',
    autoComplete: 'current-password',
    sanitize: (value) => sanitizeText(value)
  },
  {
    name: 'rememberMe',
    type: FIELD_TYPES.CHECKBOX,
    label: 'Remember Me',
    required: false,
    defaultValue: false,
    sanitize: (value) => sanitizeBoolean(value)
  }
];