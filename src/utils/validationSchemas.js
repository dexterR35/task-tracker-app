import * as Yup from 'yup';
import { VALIDATION } from '@/components/forms/configs/formConstants';

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

/**
 * Build a minimal Yup schema from department form field config (for dynamic forms).
 * Supports: required, type (string/number/array for multiSelect), min/max for number.
 */
export function buildSchemaFromFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return Yup.object().shape({});
  }
  const shape = {};
  for (const f of fields) {
    let schema;
    if (f.type === 'number') {
      schema = Yup.number().transform((v) => (v === '' || v == null ? undefined : Number(v)));
      if (f.min != null) schema = schema.min(f.min, VALIDATION.MESSAGES.MIN_VALUE(f.min));
      if (f.max != null) schema = schema.max(f.max, VALIDATION.MESSAGES.MAX_VALUE(f.max));
    } else if (f.type === 'multiSelect') {
      schema = Yup.array().of(Yup.string());
    } else if (f.type === 'checkbox') {
      schema = Yup.boolean();
    } else {
      schema = Yup.string().trim();
    }
    if (f.required) schema = schema.required(VALIDATION.MESSAGES.REQUIRED);
    else schema = schema.optional().nullable();
    shape[f.name] = schema;
  }
  return Yup.object().shape(shape);
}
