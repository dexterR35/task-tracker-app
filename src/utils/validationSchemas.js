import * as Yup from 'yup';
import { VALIDATION } from '@/constants';

/**
 * Validation schema builders used by forms (e.g. login).
 */

/**
 * Password field validator
 */
export const passwordField = (minLength = 6) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .min(minLength, VALIDATION.MESSAGES.MIN_LENGTH(minLength));
};

/**
 * Email field with custom pattern (e.g. NETBET email)
 */
export const emailFieldWithPattern = (pattern, patternMessage) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .email(VALIDATION.MESSAGES.INVALID_EMAIL)
    .matches(pattern, patternMessage);
};
