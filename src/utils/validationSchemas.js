import * as Yup from 'yup';
import { VALIDATION } from '@/constants';

/**
 * Reusable validation schema builders
 * Use these to create consistent validation across all forms
 */

// ===== COMMON FIELD VALIDATORS =====

/**
 * Required string field validator
 */
export const requiredString = (message = VALIDATION.MESSAGES.REQUIRED) => {
  return Yup.string().required(message);
};

/**
 * Email field validator
 */
export const emailField = (message = VALIDATION.MESSAGES.INVALID_EMAIL) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .email(message);
};

/**
 * Name field validator (with min/max length)
 */
export const nameField = (
  min = VALIDATION.LIMITS.NAME_MIN,
  max = VALIDATION.LIMITS.NAME_MAX
) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .min(min, VALIDATION.MESSAGES.MIN_LENGTH(min))
    .max(max, VALIDATION.MESSAGES.MAX_LENGTH(max))
    .matches(
      VALIDATION.PATTERNS.ALPHANUMERIC_SPACES,
      "Name can only contain letters, numbers, and spaces"
    );
};

/**
 * Required select field validator
 */
export const requiredSelect = (message = VALIDATION.MESSAGES.REQUIRED) => {
  return Yup.string().required(message);
};

/**
 * Number field validator
 */
export const numberField = (min, max, required = true) => {
  let schema = Yup.number().typeError('Please enter a valid number');
  
  if (required) {
    schema = schema.required(VALIDATION.MESSAGES.REQUIRED);
  }
  
  if (min !== undefined) {
    schema = schema.min(min, VALIDATION.MESSAGES.MIN_VALUE(min));
  }
  
  if (max !== undefined) {
    schema = schema.max(max, VALIDATION.MESSAGES.MAX_VALUE(max));
  }
  
  return schema;
};

/**
 * Array field validator (for multi-select)
 */
export const arrayField = (minItems = 1, message = VALIDATION.MESSAGES.SELECT_ONE) => {
  return Yup.array()
    .min(minItems, message)
    .required(VALIDATION.MESSAGES.REQUIRED);
};

/**
 * Date field validator
 */
export const dateField = (required = true) => {
  let schema = Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date format (YYYY-MM-DD)')
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value) return !required;
      const date = new Date(value + 'T00:00:00.000Z');
      return !isNaN(date.getTime());
    });
  
  if (required) {
    schema = schema.required(VALIDATION.MESSAGES.REQUIRED);
  }
  
  return schema;
};

/**
 * URL field validator
 */
export const urlField = (pattern = VALIDATION.PATTERNS.URL, message = VALIDATION.MESSAGES.INVALID_URL) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .matches(pattern, message);
};

/**
 * JIRA URL field validator
 */
export const jiraUrlField = () => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .matches(VALIDATION.PATTERNS.JIRA_URL_ONLY, VALIDATION.MESSAGES.JIRA_URL_FORMAT)
    .max(200, VALIDATION.MESSAGES.MAX_LENGTH(200));
};

/**
 * Password field validator
 */
export const passwordField = (minLength = 6) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .min(minLength, VALIDATION.MESSAGES.MIN_LENGTH(minLength));
};

/**
 * Email field with custom pattern (e.g., NETBET email)
 */
export const emailFieldWithPattern = (pattern, patternMessage) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .email(VALIDATION.MESSAGES.INVALID_EMAIL)
    .matches(pattern, patternMessage);
};

/**
 * Optional string field with max length
 */
export const optionalStringField = (maxLength) => {
  let schema = Yup.string();
  if (maxLength) {
    schema = schema.max(maxLength, VALIDATION.MESSAGES.MAX_LENGTH(maxLength));
  }
  return schema.optional();
};

/**
 * Number field with 0.5 hour increment validation
 */
export const timeInHoursField = (min = 0.5, max = 999) => {
  return numberField(min, max, true)
    .test('valid-increment', 'Time must be in 0.5 hour increments (0, 0.5, 1, 1.5, 2, etc.)', function(value) {
      if (value === undefined || value === null) return true;
      const remainder = value % 0.5;
      if (remainder !== 0) {
        return this.createError({
          message: '❌ Time must be in 0.5 hour increments (0, 0.5, 1, 1.5, 2, etc.)'
        });
      }
      return true;
    });
};

/**
 * Date field with end date validation (must be after start date)
 */
export const endDateField = (startDateFieldName = 'startDate') => {
  return dateField(true)
    .test('after-start', 'End date must be after start date', function(value) {
      const startDate = this.parent[startDateFieldName];
      if (!value || !startDate) return true;
      return new Date(value + 'T00:00:00.000Z') >= new Date(startDate + 'T00:00:00.000Z');
    });
};
