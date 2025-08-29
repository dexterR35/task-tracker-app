import { FIELD_TYPES } from '../validation/fieldTypes';
import { VALIDATION_MESSAGES } from '../validation/validationRules';

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
    validation: {
      custom: {
        test: (value) => {
          if (!value) return false;
          return ['reporter', 'admin'].includes(value);
        },
        message: 'Please select a valid role'
      }
    },
    helpText: 'Select the reporter\'s role'
  },
  {
    name: 'occupation',
    type: FIELD_TYPES.SELECT,
    label: 'Occupation',
    required: false,
    helpText: 'Select the reporter\'s occupation'
  },
  {
    name: 'isActive',
    type: FIELD_TYPES.CHECKBOX,
    label: 'Active Reporter',
    required: false,
    defaultValue: true,
    helpText: 'Check if the reporter should be active'
  }
];
