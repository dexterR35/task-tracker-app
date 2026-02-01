/**
 * Form constants – validation patterns/messages/limits and dropdown options.
 * Single source for forms config (department forms, login, validation schemas).
 * Import from: @/components/forms/configs/formConstants
 */

// ============================================================================
// VALIDATION PATTERNS & MESSAGES
// ============================================================================

export const VALIDATION = {
  PATTERNS: {
    ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,
    /** Office login only: @rei-d-services.com, @netbet.com, @netbet.ro, @gimo.co.uk */
    OFFICE_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(rei-d-services\.com|netbet\.com|netbet\.ro|gimo\.co\.uk)$/,
    NETBET_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(rei-d-services\.com|netbet\.com|netbet\.ro|gimo\.co\.uk)$/,
    JIRA_URL_ONLY: /^https:\/\/gmrd\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
    URL: /^https?:\/\/.+/,
    PHONE: /^\+?[\d\s\-()]+$/,
  },
  MESSAGES: {
    REQUIRED: 'This field is required',
    OFFICE_EMAIL: 'Use an office email: @rei-d-services.com, @netbet.com, @netbet.ro or @gimo.co.uk',
    NETBET_EMAIL: 'Use an office email: @rei-d-services.com, @netbet.com, @netbet.ro or @gimo.co.uk',
    JIRA_URL_FORMAT: 'Invalid Jira URL format. Must be: https://gmrd.atlassian.net/browse/{PROJECT}-{number}',
    MIN_LENGTH: (min) => `Must be at least ${min} characters`,
    MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
    MIN_VALUE: (min) => `Must be at least ${min}`,
    MAX_VALUE: (max) => `Must be no more than ${max}`,
    SELECT_ONE: 'Please select at least one option',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_URL: 'Please enter a valid URL',
    INVALID_PHONE: 'Please enter a valid phone number',
  },
  LIMITS: {
    NAME_MIN: 2,
    NAME_MAX: 50,
    DESCRIPTION_MAX: 500,
    TIME_MIN: 0.1,
    TIME_MAX: 999,
    QUANTITY_MIN: 1,
    QUANTITY_MAX: 999,
  },
};

// ============================================================================
// FORM OPTIONS & DROPDOWN DATA
// ============================================================================

export const FORM_OPTIONS = {
  PRODUCTS: [
    { value: 'crm casino', label: 'crm casino' },
    { value: 'crm sport', label: 'crm sport' },
    { value: 'crm poker', label: 'crm poker' },
    { value: 'crm lotto', label: 'crm lotto' },
    { value: 'acquisition casino', label: 'acquisition casino' },
    { value: 'acquisition sport', label: 'acquisition sport' },
    { value: 'acquisition poker', label: 'acquisition poker' },
    { value: 'acquisition lotto', label: 'acquisition lotto' },
    { value: 'product casino', label: 'product casino' },
    { value: 'product sport', label: 'product sport' },
    { value: 'product poker', label: 'product poker' },
    { value: 'product lotto', label: 'product lotto' },
    { value: 'misc', label: 'misc' },
  ],
  MARKETS: [
    { value: 'ro', label: 'ro' },
    { value: 'com', label: 'com' },
    { value: 'uk', label: 'uk' },
    { value: 'ie', label: 'ie' },
    { value: 'fi', label: 'fi' },
    { value: 'dk', label: 'dk' },
    { value: 'de', label: 'de' },
    { value: 'it', label: 'italy' },
    { value: 'gr', label: 'grece' },
    { value: 'fr', label: 'france' },
    { value: 'ca', label: 'canada' },
  ],
  AI_MODELS: [
    { value: 'Photoshop', label: 'Photoshop' },
    { value: 'ChatGpt', label: 'ChatGpt' },
    { value: 'ShutterStock', label: 'ShutterStock' },
    { value: 'FreePick', label: 'FreePick' },
    { value: 'Cursor', label: 'Cursor' },
    { value: 'run diffusion', label: 'run diffusion' },
  ],
  TIME_UNITS: [
    { value: 'min', label: 'Minutes' },
    { value: 'hr', label: 'Hours' },
  ],
};
