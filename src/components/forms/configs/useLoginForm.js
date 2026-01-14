

import * as Yup from "yup";
import { VALIDATION } from '@/constants';
import { emailFieldWithPattern, passwordField } from '@/utils/validationSchemas';

// ============================================================================
// LOGIN FORM FIELD CONFIGURATION
// ============================================================================

export const LOGIN_FORM_FIELDS = [
  {
    name: "email",
    type: "email",
    label: "Email Address",
    required: true,
    placeholder: "Enter your email (@netbet.* or @gimo.co.uk)",
    autoComplete: "email"
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    required: true,
    placeholder: "Enter your password",
    autoComplete: "current-password"
  }
];

// ============================================================================
// LOGIN FORM VALIDATION SCHEMA
// ============================================================================

export const loginSchema = Yup.object().shape({
  email: emailFieldWithPattern(
    VALIDATION.PATTERNS.NETBET_EMAIL,
    VALIDATION.MESSAGES.NETBET_EMAIL
  ),
  password: passwordField(6)
});
