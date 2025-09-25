// ===== FIELD TYPE CONSTANTS =====
export const FIELD_TYPES = {
  TEXT: "text",
  EMAIL: "email",
  NETBET_EMAIL: "netbetEmail",
  URL: "url",
  NUMBER: "number",
  SELECT: "select",
  MULTI_SELECT: "multiSelect",
  CHECKBOX: "checkbox",
  PASSWORD: "password",
};

// ===== VALIDATION PATTERNS =====
export const VALIDATION_PATTERNS = {
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  NETBET_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@netbet\.ro$/,
  JIRA_URL_ONLY: /^https:\/\/gmrd\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
};

// ===== VALIDATION MESSAGES =====
export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  EMAIL: "Please enter a valid email address",
  NETBET_EMAIL: "Please enter a valid NetBet email address (@netbet.ro)",
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min) => `Must be at least ${min}`,
  MAX_VALUE: (max) => `Must be no more than ${max}`,
  SELECT_ONE: "Please select at least one option",
  JIRA_URL_FORMAT:
    "Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/{PROJECT}-{number}",
  DELIVERABLE_REQUIRED:
    'Please select at least one deliverable when "Has Deliverables" is checked',
  AI_MODEL_REQUIRED:
    'Please select at least one AI model when "AI Tools Used" is checked',

  // Additional validation messages for better UX
  PASSWORD_STRENGTH:
    "Password must be at least 6 characters long",
};

// ===== FORM CONSTANTS =====
export const REQUIRED_INDICATOR = "*";

// ===== SHARED FORM UTILITY FUNCTIONS =====

// Map field types to HTML input types
export const getInputType = (fieldType) => {
  const typeMap = {
    text: "text",
    email: "email",
    netbetEmail: "email", // NetBet email is still an email input
    url: "url",
    password: "password",
    number: "number",
    // Non-input field types (handled by other components)
    select: "text", // Not used, but fallback
    multiSelect: "text", // Not used, but fallback
    checkbox: "checkbox", // Not used, but fallback
  };

  return typeMap[fieldType] || "text";
};

// ===== FIELD CREATION FUNCTIONS =====

// Base field creation function - UI properties only, no validation
const createBaseField = (name, label, type, options = {}, customProps = {}) => {
  return {
    name,
    type,
    label,
    placeholder: options.placeholder || `Enter ${label.toLowerCase()}`,
    ...customProps,
    ...options,
  };
};

export const createTextField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.TEXT, options),
});

export const createEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.EMAIL, options, {
    autoComplete: "email",
  }),
});

export const createNetBetEmailField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.NETBET_EMAIL, options, {
    autoComplete: "email",
  }),
});

export const createPasswordField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.PASSWORD, options, {
    autoComplete: "current-password",
  }),
});

export const createUrlField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.URL, options, {
    autoComplete: "url",
  }),
});

export const createNumberField = (name, label, options = {}) => {
  const { step, ...restOptions } = options;

  return {
    ...createBaseField(name, label, FIELD_TYPES.NUMBER, restOptions, {
      step: step || 1,
    }),
  };
};

export const createCheckboxField = (name, label, options = {}) => ({
  ...createBaseField(name, label, FIELD_TYPES.CHECKBOX, options),
});

export const createSelectField = (
  name,
  label,
  options,
  selectOptions = {}
) => ({
  ...createBaseField(name, label, FIELD_TYPES.SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || [],
  }),
});

export const createMultiSelectField = (
  name,
  label,
  options,
  selectOptions = {}
) => ({
  ...createBaseField(name, label, FIELD_TYPES.MULTI_SELECT, options, {
    placeholder: options.placeholder || `Select ${label.toLowerCase()}`,
    ...selectOptions,
    options: selectOptions.options || [],
  }),
});

export const createTextareaField = (name, label, options = {}) => ({
  ...createBaseField(name, label, 'textarea', options),
});

// ===== CONDITIONAL FIELD LOGIC =====

// Helper function to get nested values (e.g., 'usedAI.enabled')
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Helper function to check if field should be visible based on conditional logic
export const shouldShowField = (field, formValues) => {
  if (!field.conditional) return true;

  const {
    field: conditionalField,
    value: conditionalValue,
    and,
  } = field.conditional;
  const conditionalFieldValue = getNestedValue(formValues, conditionalField);

  let shouldShow =
    typeof conditionalValue === "function"
      ? conditionalValue(conditionalFieldValue, formValues)
      : conditionalValue === conditionalFieldValue;

  if (shouldShow && and) {
    const { field: andField, value: andValue } = and;
    const andFieldValue = getNestedValue(formValues, andField);
    shouldShow =
      typeof andValue === "function"
        ? andValue(andFieldValue, formValues)
        : andValue === andFieldValue;
  }

  return shouldShow;
};
