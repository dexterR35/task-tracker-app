import { FIELD_TYPES } from '../validation/fieldTypes';
import { VALIDATION_PATTERNS } from '../validation/validationRules';

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
    validation: {
      minItems: 1,
      message: 'Please select at least one market'
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
    validation: {
      message: 'Please select a product'
    },
    helpText: 'Select the primary product this task relates to'
  },
  {
    name: 'taskName',
    type: FIELD_TYPES.SELECT,
    label: 'Task Name',
    required: true,
    validation: {
      message: 'Please select a task type'
    },
    helpText: 'Select the type of task being performed'
  },
  {
    name: 'timeInHours',
    type: FIELD_TYPES.NUMBER,
    label: 'Total Time (Hours)',
    required: true,
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
    validation: {
      minItems: 1,
      message: 'Please select at least one AI model when AI is used'
    },
    conditional: {
      field: 'aiUsed',
      value: true,
      required: true
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
    helpText: 'Check if this task required rework or revisions (will be submitted as true/false)',
    props: {
      className: 'mt-2'
    }
  },
  {
    name: 'deliverables',
    type: FIELD_TYPES.MULTI_SELECT,
    label: 'Deliverables',
    required: true,
    validation: {
      minItems: 1,
      message: 'Please select at least one deliverable'
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
    required: true,
    validation: {
      minValue: 1,
      maxValue: 100,
      message: 'Deliverables count must be at least 1'
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
      field: 'deliverables',
      value: (deliverables) => deliverables && deliverables.includes('others'),
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
