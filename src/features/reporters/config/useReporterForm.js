import * as Yup from 'yup';
import { 
  createTextField,
  createEmailField,
  createSelectField,
  VALIDATION_MESSAGES
} from '../../../components/forms/configs/sharedFormUtils';

// ===== REPORTER FORM OPTIONS =====
const REPORTER_DEPARTMENT_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' }
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
  createTextField('name', 'Reporter Name', {
    helpText: 'Enter the reporter\'s full name'
  }),
  createEmailField('email', 'Email Address', {
    helpText: 'Enter the reporter\'s email address'
  }),
  createSelectField('departament', 'Department', {
    helpText: 'Select the reporter\'s department'
  }, {
    options: REPORTER_DEPARTMENT_OPTIONS
  }),
  createSelectField('country', 'Country', {
    helpText: 'Select the reporter\'s country'
  }, {
    options: REPORTER_COUNTRY_OPTIONS
  })
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
    .required(VALIDATION_MESSAGES.REQUIRED)
});

