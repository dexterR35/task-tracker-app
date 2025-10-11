import * as Yup from 'yup';
import { VALIDATION, FORM_OPTIONS } from '@/constants';

// ===== DYNAMIC REPORTER FORM OPTIONS =====
// These functions generate options from actual database data
export const getReporterDepartmentOptions = (reporters = []) => {
  const departments = [...new Set(reporters.map(r => r.departament).filter(Boolean))];
  return departments.map(dept => ({ value: dept, label: dept }));
};

export const getReporterChannelOptions = (reporters = []) => {
  const channels = [...new Set(reporters.map(r => r.channelName).filter(Boolean))];
  return channels.map(channel => ({ value: channel, label: channel }));
};

export const getReporterCountryOptions = (reporters = []) => {
  const countries = [...new Set(reporters.map(r => r.country).filter(Boolean))];
  return countries.map(country => ({ value: country, label: country }));
};

// ===== REPORTER FORM FIELD CONFIGURATION =====
// This function creates form fields with dynamic options based on existing data
export const createReporterFormFields = (reporters = []) => [
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
    options: getReporterDepartmentOptions(reporters)
  },
  {
    name: 'country',
    type: 'select',
    label: 'Country',
    required: true,
    options: getReporterCountryOptions(reporters)
  },
  {
    name: 'channelName',
    type: 'select',
    label: 'Channel Name',
    required: true,
    options: getReporterChannelOptions(reporters)
  }
];

// ===== BACKWARD COMPATIBILITY =====
// For components that still expect the old static form fields
export const REPORTER_FORM_FIELDS = createReporterFormFields([]);

// ===== REPORTER FORM VALIDATION SCHEMA =====
export const reporterFormSchema = Yup.object().shape({
  name: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED),
  
  email: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .email(VALIDATION.MESSAGES.EMAIL),
  
  departament: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED),
  
  country: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED),
  
  channelName: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
});

// ===== REPORTER FORM UTILITIES =====
// Note: Data preparation is now handled by the centralized prepareFormData function in formUtils.js

