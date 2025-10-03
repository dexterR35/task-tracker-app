import * as Yup from 'yup';
// ===== VALIDATION CONSTANTS =====
const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  EMAIL: "Please enter a valid email address",
};
import { TASK_FORM_OPTIONS } from '@/features/tasks/config/useTaskForm';

// ===== REPORTER FORM OPTIONS =====
const REPORTER_DEPARTMENT_OPTIONS = [
  { value: 'acq', label: 'acq' },
  { value: 'crm', label: 'crm' },
  { value: 'games team', label: 'GAMES TEAM' },
  { value: 'other', label: 'other' },
  { value: 'product', label: 'product' },
  { value: 'vip', label: 'vip' },
  { value: 'content', label: 'content' },
  { value: 'pml', label: 'pml' },
  { value: 'misc', label: 'misc' },
  { value: 'hr', label: 'hr' }
];



const REPORTER_CHANNEL_OPTIONS = [
  { value: 'acq', label: 'acq' },
  { value: 'acq social media', label: 'acq social media' },
  { value: 'acq social media paid', label: 'acq social media paid' },
  { value: 'acq social media organic', label: 'acq social media organic' },
  { value: 'games team', label: 'games team' },
  { value: 'product', label: 'product' },
  { value: 'other', label: 'other' },
  { value: 'brand mgmt', label: 'brand mgmt' },
  { value: 'pml', label: 'pml' },
  { value: 'hr', label: 'hr' },
  { value: 'content', label: 'content' },
  { value: 'misc', label: 'misc' },
  { value: 'vip', label: 'vip' },
  { value: 'seo', label: 'seo' },
  { value: 'crm', label: 'crm' }
];


const REPORTER_COUNTRY_OPTIONS = [
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
];

// ===== REPORTER FORM FIELD CONFIGURATION =====
export const REPORTER_FORM_FIELDS = [
  {
    name: 'name',
    type: 'text',
    label: 'Reporter Name',
    required: true,
    validation: {
      required: VALIDATION_MESSAGES.required,
      minLength: {
        value: 2,
        message: "Name must be at least 2 characters"
      },
      maxLength: {
        value: 50,
        message: "Name must be less than 50 characters"
      },
      pattern: {
        value: /^[a-zA-Z0-9\s]+$/,
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
    options: REPORTER_DEPARTMENT_OPTIONS
  },
  {
    name: 'country',
    type: 'select',
    label: 'Country',
    required: true,
    options: TASK_FORM_OPTIONS.markets
  },
  {
    name: 'channelName',
    type: 'select',
    label: 'Channel Name',
    required: true,
    options: REPORTER_CHANNEL_OPTIONS
  }
];

// ===== REPORTER FORM VALIDATION SCHEMA =====
export const reporterFormSchema = Yup.object().shape({
  name: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  email: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL),
  
  departament: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  country: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  channelName: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
});

