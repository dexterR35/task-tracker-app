/**
 * Login form field config. Validation (loginSchema) is in validationSchemas.js.
 * Import from: @/components/forms/configs/useLoginForm
 */

export { loginSchema } from '@/components/forms/configs/validationSchemas';

export const LOGIN_FORM_FIELDS = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    placeholder: 'Enter your email',
    autoComplete: 'email',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    placeholder: 'Enter your password',
    autoComplete: 'current-password',
  },
];
