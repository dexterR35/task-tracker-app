import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '@/components/forms/utils/validation';

// Reporter form validation schema
export const reporterFormSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be no more than 50 characters')
    .required('Required'),

  email: Yup.string()
    .email(VALIDATION_MESSAGES.EMAIL)
    .required('Required'),

  role: Yup.string()
    .oneOf(['reporter'], 'Role must be reporter')
    .required('Required'),

  departament: Yup.string()
    .required('Required'),

  occupation: Yup.string()
    .required('Required')
});

// Reporter form initial values
export const getReporterFormInitialValues = (user, initialValues = null) => {
  if (initialValues) {
    return {
      name: initialValues.name || '',
      email: initialValues.email || '',
      role: 'reporter', // Always reporter, never admin
      departament: initialValues.departament || '',
      occupation: initialValues.occupation || ''
    };
  }

  return {
    name: '',
    email: '',
    role: 'reporter', // Always reporter
    departament: '',
    occupation: ''
  };
};

// Reporter form field options
export const REPORTER_FORM_OPTIONS = {
  roles: [
    { value: 'reporter', label: 'Reporter' }
  ],
  departments: [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Product', label: 'Product' },
    { value: 'Design', label: 'Design' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' }
  ],
  occupations: [
    { value: 'Developer', label: 'Developer' },
    { value: 'Designer', label: 'Designer' },
    { value: 'Product Manager', label: 'Product Manager' },
    { value: 'QA Engineer', label: 'QA Engineer' },
    { value: 'DevOps', label: 'DevOps' }
  ]
};
