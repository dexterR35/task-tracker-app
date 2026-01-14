import * as Yup from 'yup';
import { VALIDATION, FORM_OPTIONS } from '@/constants';
import { nameField, emailField, requiredSelect } from '@/utils/validationSchemas';


export const getReporterDepartmentOptions = () => {
  return FORM_OPTIONS.REPORTER_DEPARTMENTS;
};

export const getReporterChannelOptions = () => {
  return FORM_OPTIONS.REPORTER_CHANNELS;
};

export const getReporterCountryOptions = () => {
  return FORM_OPTIONS.REPORTER_COUNTRIES;
};

// This function creates form fields with static options from constants
export const createReporterFormFields = () => [
  {
    name: 'name',
    type: 'text',
    label: 'Reporter Name',
    required: true,
    validation: {
      required: VALIDATION.MESSAGES.REQUIRED,
      minLength: {
        value: VALIDATION.LIMITS.NAME_MIN,
        message: VALIDATION.MESSAGES.MIN_LENGTH(VALIDATION.LIMITS.NAME_MIN)
      },
      maxLength: {
        value: VALIDATION.LIMITS.NAME_MAX,
        message: VALIDATION.MESSAGES.MAX_LENGTH(VALIDATION.LIMITS.NAME_MAX)
      },
      pattern: {
        value: VALIDATION.PATTERNS.ALPHANUMERIC_SPACES,
        message: "Name can only contain letters, numbers, and spaces"
      }
    }
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    autoComplete: 'email'
  },
  {
    name: 'departament',
    type: 'select',
    label: 'Department',
    required: true,
    options: getReporterDepartmentOptions(),
    allowCustom: true,
    placeholder: 'Select or type department name'
  },
  {
    name: 'country',
    type: 'select',
    label: 'Country',
    required: true,
    options: getReporterCountryOptions(),
    allowCustom: true,
    placeholder: 'Select or type country name'
  },
  {
    name: 'channelName',
    type: 'select',
    label: 'Channel Name',
    required: true,
    options: getReporterChannelOptions(),
    allowCustom: true,
    placeholder: 'Select or type channel name'
  }
];

// ===== REPORTER FORM VALIDATION SCHEMA =====
export const reporterFormSchema = Yup.object().shape({
  name: nameField(),
  email: emailField(),
  departament: requiredSelect(),
  country: requiredSelect(),
  channelName: requiredSelect()
});

