import { FIELD_TYPES } from './fieldTypes';
import { 
  marketOptions, 
  productOptions, 
  taskNameOptions, 
  aiModelOptions,
  deliverables 
} from '@/features/tasks/components/TaskOption/TaskOptions';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from '../utils/validation/validationRules';


// User form field configuration
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
    helpText: 'Enter the user\'s full name'
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
    helpText: 'Enter the user\'s email address'
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
    helpText: 'Select the user\'s role in the system'
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
    helpText: 'Select the user\'s occupation'
  },
  {
    name: 'isActive',
    type: FIELD_TYPES.CHECKBOX,
    label: 'Active User',
    required: false,
    defaultValue: true,
    helpText: 'Check if the user should be active in the system'
  }
];



// Task form field configuration
export const TASK_FORM_FIELDS = [
  {
    name: 'jiraLink',
    type: FIELD_TYPES.URL,
    label: 'Jira Link',
    required: true,
    validation: {
      pattern: VALIDATION_PATTERNS.JIRA_LINK,
      message: 'Invalid Jira link format. Must be a valid Atlassian Jira URL'
    },
    placeholder: 'https://jira.company.com/browse/TASK-123',
    helpText: 'Enter the complete Jira ticket URL. Task number will be auto-extracted.',
    props: {
      autoComplete: 'url'
    }
  },
  {
    name: 'taskNumber',
    type: FIELD_TYPES.TEXT,
    label: 'Task Number',
    required: true,
    validation: {
      pattern: VALIDATION_PATTERNS.TASK_NUMBER,
      message: 'Task number must be in format TASK-123'
    },
    placeholder: 'TASK-123',
    helpText: 'Task number (auto-extracted from Jira link, cannot be manually edited)',
    props: {
      autoComplete: 'off',
      readOnly: true, // Disable manual editing
      disabled: true // Disable the field
    }
  },
  {
    name: 'markets',
    type: FIELD_TYPES.MULTI_SELECT,
    label: 'Markets',
    required: true,
    options: marketOptions,  // Add options
    placeholder: 'Select markets',
    validation: {
      required: true,
      minItems: 1
    },
    helpText: 'Select all markets where this task applies',
    props: {
      maxItems: 10 // Limit to prevent UI issues
    }
  },
  {
    name: 'product',
    type: FIELD_TYPES.SELECT,
    label: 'Product',
    required: true,
    options: productOptions,  // Add options
    placeholder: 'Select product',
    validation: {
      required: true
    },
    helpText: 'Select the primary product this task relates to'
  },
  {
    name: 'taskName',
    type: FIELD_TYPES.SELECT,
    label: 'Task Name',
    required: true,
    options: taskNameOptions,  // Add options
    placeholder: 'Select task type',
    validation: {
      required: true
    },
    helpText: 'Select the type of task being performed'
  },
  {
    name: 'timeInHours',
    type: FIELD_TYPES.NUMBER,
    label: 'Total Time (Hours)',
    required: true,
    defaultValue: 1,
    validation: {
      minValue: 0.5,
      maxValue: 24,
      message: 'Time must be between 0.5 and 24 hours'
    },
    placeholder: '2.5',
    helpText: 'Total time spent on this task (0.5 - 24 hours)',
    props: {
      step: 0.5,
      min: 0.5,
      max: 24
    }
  },
  {
    name: 'aiUsed',
    type: FIELD_TYPES.CHECKBOX,
    label: 'AI Tools Used',
    required: false,
    defaultValue: false,
    helpText: 'Check if AI tools were used in this task',
    props: {
      className: 'mt-2'
    }
  },
  {
    name: 'timeSpentOnAI',
    type: FIELD_TYPES.NUMBER,
    label: 'Time Spent on AI (Hours)',
    required: false,
    validation: {
      minValue: 0.5,
      maxValue: 24,
      message: 'AI time must be between 0.5 and 24 hours'
    },
    conditional: {
      field: 'aiUsed',
      value: true,
      required: true
    },
    placeholder: '1.0',
    helpText: 'Hours spent specifically using AI tools (required when AI is used)',
    props: {
      step: 0.5,
      min: 0.5,
      max: 24
    }
  },
  {
    name: 'aiModels',
    type: FIELD_TYPES.MULTI_SELECT,
    label: 'AI Models Used',
    required: false,
    options: aiModelOptions,  // Add options
    placeholder: 'Select AI models',
    conditional: {
      field: 'aiUsed',
      value: true,
      required: true
    },
    validation: {
      minItems: 1
    },
    helpText: 'Select all AI models used in this task (required when AI is used)',
    props: {
      maxItems: 5
    }
  },
  {
    name: 'reworked',
    type: FIELD_TYPES.CHECKBOX,
    label: 'Task Required Rework',
    required: false,
    defaultValue: false,
    helpText: 'Check if this task required rework or revisions (will be submitted as true/false)',
    props: {
      className: 'mt-2'
    }
  },
  {
    name: 'hasDeliverables',
    type: FIELD_TYPES.CHECKBOX,
    label: 'Has Deliverables',
    required: false,
    defaultValue: false,
    helpText: 'Check if this task produces deliverables',
    props: {
      className: 'mt-2'
    }
  },
  {
    name: 'deliverables',
    type: FIELD_TYPES.MULTI_SELECT,
    label: 'Deliverables',
    required: true,
    options: deliverables,  // Add options
    placeholder: 'Select deliverables',
    validation: {
      required: true,
      minItems: 1
    },
    conditional: {
      field: 'hasDeliverables',
      value: true,
      required: true
    },
    helpText: 'Select all deliverables produced by this task (count will be auto-calculated)',
    props: {
      maxItems: 8
    }
  },
  {
    name: 'deliverablesCount',
    type: FIELD_TYPES.NUMBER,
    label: 'Number of Deliverables',
    required: false,
    defaultValue: 1,
    validation: {
      minValue: 1,
      maxValue: 100,
      message: 'Deliverables count must be at least 1 when deliverables are enabled'
    },
    conditional: {
      field: 'hasDeliverables',
      value: true,
      required: true
    },
    placeholder: '1',
    helpText: 'Total number of deliverables produced (auto-calculated from selection)',
    props: {
      step: 1,
      min: 1,
      max: 100
    }
  },
  {
    name: 'deliverablesOther',
    type: FIELD_TYPES.MULTI_VALUE,
    label: 'Other Deliverables',
    required: false,
    validation: {
      minItems: 1,
      message: 'Please specify other deliverables when "Others" is selected'
    },
    conditional: {
      field: 'hasDeliverables',
      value: true,
      and: {
        field: 'deliverables',
        value: (deliverables) => deliverables && deliverables.includes('others')
      },
      required: true
    },
    placeholder: 'Enter deliverable name',
    helpText: 'Specify other deliverables not listed in the main options',
    props: {
      maxValues: 5,
      addButtonText: 'Add Deliverable',
      removeButtonText: 'Remove'
    }
  },
  {
    name: 'reporters',
    type: FIELD_TYPES.SELECT,
    label: 'Reporter',
    required: true,
    validation: {
      message: 'Please select a reporter'
    },
    helpText: 'Select the person responsible for this task (defaults to current user)',
    props: {
      autoComplete: 'off'
    }
  }
];


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
    helpText: 'Enter the reporter\'s full name'
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
    helpText: 'Enter the reporter\'s email address'
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
    }
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
    helpText: 'Enter the reporter\'s department'
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
    }
  }
];

// Export the complete form configuration
export const reporterFormConfig = {
  fields: REPORTER_FORM_FIELDS,
  options: {
    // Add any form-level options here
  }
};



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
    props: {
      autoComplete: 'email'
    }
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
    props: {
      autoComplete: 'current-password'
    }
  },
  {
    name: 'rememberMe',
    type: FIELD_TYPES.CHECKBOX,
    label: 'Remember Me',
    required: false,
    defaultValue: false
  }
];