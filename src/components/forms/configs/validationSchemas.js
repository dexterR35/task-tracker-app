import * as Yup from 'yup';

/**
 * Form validation – patterns, messages, schema builders, login schema.
 * Single file for all form validation. Import from: @/components/forms/configs/validationSchemas
 */

// -----------------------------------------------------------------------------
// Patterns & messages (used by schema builders below)
// -----------------------------------------------------------------------------

export const VALIDATION = {
  PATTERNS: {
    /** Office login: @rei-d-services.com, @netbet.com, @netbet.ro, @gimo.co.uk */
    OFFICE_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(rei-d-services\.com|netbet\.com|netbet\.ro|gimo\.co\.uk)$/,
  },
  MESSAGES: {
    REQUIRED: 'This field is required',
    OFFICE_EMAIL: 'Use an office email: @rei-d-services.com, @netbet.com, @netbet.ro or @gimo.co.uk',
    MIN_LENGTH: (min) => `Must be at least ${min} characters`,
    MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
    MIN_VALUE: (min) => `Must be at least ${min}`,
    MAX_VALUE: (max) => `Must be no more than ${max}`,
    INVALID_EMAIL: 'Please enter a valid email address',
  },
};

/** Field limits – min/max/step for numbers, rows/maxLength for textarea. Used by DynamicDepartmentForm; buildSchemaFromFields reads from field config. */
export const FORM_FIELD_LIMITS = {
  ESTIMATED_TIME: { min: 0.1, max: 999, step: 0.5 },
  QUANTITY: { min: 1, max: 99, step: 1 },
  DESCRIPTION: { rows: 4, maxLength: 500 },
  NOTES: { rows: 3 },
};

// -----------------------------------------------------------------------------
// Schema builders
// -----------------------------------------------------------------------------

export const passwordField = (minLength = 6) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .min(minLength, VALIDATION.MESSAGES.MIN_LENGTH(minLength));
};

export const emailFieldWithPattern = (pattern, patternMessage) => {
  return Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .email(VALIDATION.MESSAGES.INVALID_EMAIL)
    .matches(pattern, patternMessage);
};

/**
 * Resolve field limits from FORM_FIELD_LIMITS when field has limitsKey (so department config only references the key).
 */
function getFieldLimits(f) {
  if (f.limitsKey && FORM_FIELD_LIMITS[f.limitsKey]) {
    return FORM_FIELD_LIMITS[f.limitsKey];
  }
  return {};
}

/**
 * Build Yup schema from department form field config.
 * Uses f.limitsKey → FORM_FIELD_LIMITS for min/max (so department config only needs limitsKey, not spread).
 */
export function buildSchemaFromFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return Yup.object().shape({});
  }
  const shape = {};
  for (const f of fields) {
    const limits = getFieldLimits(f);
    const min = f.min ?? limits.min;
    const max = f.max ?? limits.max;
    const maxLength = f.maxLength ?? limits.maxLength;
    let schema;
    if (f.type === 'number') {
      schema = Yup.number().transform((v) => (v === '' || v == null ? undefined : Number(v)));
      if (min != null) schema = schema.min(min, VALIDATION.MESSAGES.MIN_VALUE(min));
      if (max != null) schema = schema.max(max, VALIDATION.MESSAGES.MAX_VALUE(max));
    } else if (f.type === 'multiSelect') {
      schema = Yup.array().of(Yup.string());
    } else if (f.type === 'checkbox') {
      schema = Yup.boolean();
    } else {
      schema = Yup.string().trim();
      if (maxLength != null) schema = schema.max(maxLength, VALIDATION.MESSAGES.MAX_LENGTH(maxLength));
    }
    if (f.required) schema = schema.required(VALIDATION.MESSAGES.REQUIRED);
    else schema = schema.optional().nullable();
    shape[f.name] = schema;
  }
  return Yup.object().shape(shape);
}

// -----------------------------------------------------------------------------
// Login schema
// -----------------------------------------------------------------------------

export const loginSchema = Yup.object().shape({
  email: emailFieldWithPattern(
    VALIDATION.PATTERNS.OFFICE_EMAIL,
    VALIDATION.MESSAGES.OFFICE_EMAIL
  ),
  password: passwordField(6),
});

// -----------------------------------------------------------------------------
// Profile schema (ProfilePage)
// -----------------------------------------------------------------------------

export const profileSchema = Yup.object().shape({
  name: Yup.string().trim().required(VALIDATION.MESSAGES.REQUIRED),
  username: Yup.string().trim().nullable().max(100),
  office: Yup.string().trim().nullable().max(100),
  jobPosition: Yup.string().trim().nullable().max(100),
  phone: Yup.string().trim().nullable().max(50),
  avatarUrl: Yup.string().trim().url('Valid URL required').nullable().max(500),
  gender: Yup.string().trim().nullable().oneOf(['male', 'female', null]),
  colorSet: Yup.string().trim().nullable().max(20),
});
