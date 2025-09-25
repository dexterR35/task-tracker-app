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

const REPORTER_CHANNEL_OPTIONS = [
  { value: 'web', label: 'Web' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'api', label: 'API' },
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'database', label: 'Database' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'security', label: 'Security' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Support' }
];

// ===== REPORTER FORM FIELD CONFIGURATION =====
export const REPORTER_FORM_FIELDS = [
  createTextField('name', 'Reporter Name', {}),
  createEmailField('email', 'Email Address', {}),
  createSelectField('departament', 'Department', {}, {
    options: REPORTER_DEPARTMENT_OPTIONS
  }),
  createSelectField('country', 'Country', {}, {
    options: REPORTER_COUNTRY_OPTIONS
  }),
  createSelectField('channelName', 'Channel Name', {}, {
    options: REPORTER_CHANNEL_OPTIONS
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
    .required(VALIDATION_MESSAGES.REQUIRED),
  
  channelName: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
});

