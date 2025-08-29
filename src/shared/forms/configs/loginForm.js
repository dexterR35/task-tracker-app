import { FIELD_TYPES } from '../validation/fieldTypes';
import { VALIDATION_MESSAGES } from '../validation/validationRules';

// Login form field configuration
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
