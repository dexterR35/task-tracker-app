/**
 * Login Form Configuration
 *
 * @fileoverview Form field configuration and validation schema for login form
 * @author Senior Developer
 * @version 2.0.0
 */

import * as Yup from "yup";
import { VALIDATION } from '@/constants';

// ============================================================================
// LOGIN FORM FIELD CONFIGURATION
// ============================================================================

/**
 * Login form field definitions
 * @type {Array} - Array of field configuration objects
 */
export const LOGIN_FORM_FIELDS = [
  {
    name: "email",
    type: "email",
    label: "Email Address",
    required: true,
    placeholder: "Enter your NetBet email",
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

/**
 * Login form validation schema using Yup
 * @type {Object} - Yup validation schema object
 */
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .email(VALIDATION.MESSAGES.INVALID_EMAIL)
    .matches(
      VALIDATION.PATTERNS.NETBET_EMAIL,
      VALIDATION.MESSAGES.NETBET_EMAIL
    ),

  password: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .min(6, VALIDATION.MESSAGES.MIN_LENGTH(6)),
});
