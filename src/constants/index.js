/**
 * Application Constants
 * Centralized constants file for the Task Tracker application
 * All application-wide constants should be defined here
 */

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  NAME: 'Task Tracker App',
  VERSION: '1.0.0',
  DESCRIPTION: 'Task tracking and analytics application for NetBet',
  COMPANY: 'NetBet',
  SUPPORT_EMAIL: 'support@netbet.ro',
  DEFAULT_LOCALE: 'en-US', // US language
  DEFAULT_TIMEZONE: 'Europe/Bucharest', // Romanian timezone
  CALENDAR_WEEK_START: 1, // Monday (Romanian calendar behavior)
};

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

export const FIREBASE_CONFIG = {
  REQUIRED_FIELDS: ['apiKey', 'authDomain', 'projectId'],
  PERSISTENCE_RETRIES: 3,
  PERSISTENCE_RETRY_DELAY: 1000, // milliseconds
};

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export const AUTH = {
  VALID_ROLES: ['admin', 'user'],
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  },
  PERMISSIONS: {
    CREATE_TASKS: 'create_tasks',
    UPDATE_TASKS: 'update_tasks',
    DELETE_TASKS: 'delete_tasks',
    VIEW_TASKS: 'view_tasks',
    CREATE_BOARDS: 'create_boards',
    SUBMIT_FORMS: 'submit_forms',
    DELETE_DATA: 'delete_data',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_USERS: 'manage_users',
    MANAGE_REPORTERS: 'manage_reporters',
    MANAGE_DELIVERABLES: 'manage_deliverables',
  },
  EMAIL_DOMAIN: 'netbet.ro',
};

// ============================================================================
// VALIDATION PATTERNS & MESSAGES
// ============================================================================

export const VALIDATION = {
  PATTERNS: {
    ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,
    NETBET_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@netbet\.ro$/,
    JIRA_URL_ONLY: /^https:\/\/gmrd\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
    URL: /^https?:\/\/.+/,
    PHONE: /^\+?[\d\s\-\(\)]+$/,
  },
  MESSAGES: {
    REQUIRED: 'This field is required',
    NETBET_EMAIL: 'Please enter a valid NetBet email address (@netbet.ro)',
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
    { value: 'marketing casino', label: 'marketing casino' },
    { value: 'marketing sport', label: 'marketing sport' },
    { value: 'marketing poker', label: 'marketing poker' },
    { value: 'marketing lotto', label: 'marketing lotto' },
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
    { value: 'at', label: 'at' },
    { value: 'it', label: 'it' },
    { value: 'gr', label: 'gr' },
    { value: 'fr', label: 'fr' },
  ],
  DEPARTMENTS: [
    { value: 'video', label: 'Video Production' },
    { value: 'design', label: 'Design' },
    { value: 'developer', label: 'Development' },
  ],
  AI_MODELS: [
    { value: 'Photoshop', label: 'Photoshop' },
    { value: 'FireFly', label: 'FireFly' },
    { value: 'ChatGpt', label: 'ChatGpt' },
    { value: 'ShutterStock', label: 'ShutterStock' },
    { value: 'Midjourney', label: 'Midjourney' },
    { value: 'NightCafe', label: 'NightCafe' },
    { value: 'FreePick', label: 'FreePick' },
    { value: 'Cursor', label: 'Cursor' },
    { value: 'run diffusion', label: 'run diffusion' },
  ],
  TIME_UNITS: [
    { value: 'min', label: 'Minutes' },
    { value: 'hr', label: 'Hours' },
    { value: 'days', label: 'Days' },
  ],
  REPORTER_DEPARTMENTS: [
    { value: 'video', label: 'Video Production' },
    { value: 'design', label: 'Design' },
    { value: 'developer', label: 'Development' },
  ],
  REPORTER_CHANNELS: [
    { value: 'slack', label: 'Slack' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'teams', label: 'Microsoft Teams' },
  ],
  REPORTER_COUNTRIES: [
    { value: 'ro', label: 'Romania' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ie', label: 'Ireland' },
    { value: 'fi', label: 'Finland' },
    { value: 'dk', label: 'Denmark' },
    { value: 'de', label: 'Germany' },
    { value: 'at', label: 'Austria' },
    { value: 'it', label: 'Italy' },
    { value: 'gr', label: 'Greece' },
    { value: 'fr', label: 'France' },
  ],
  // Note: Reporter departments, channels, and countries are now loaded dynamically from the database
  // This ensures the form options are always up-to-date with actual data
};

// ============================================================================
// CARD SYSTEM CONSTANTS
// ============================================================================

export const CARD_SYSTEM = {
  COLORS: {
    // Role-based colors
    ADMIN: 'crimson',
    USER: 'purple',
    REPORTER: 'blue',

    // Status-based colors
    ACTIVE: 'green',
    INACTIVE: 'gray',
    WARNING: 'amber',

    // Feature-based colors
    FILTER: 'blue',
    ACTIONS: 'amber',
    PROFILE: 'purple',
    MONTH: 'crimson',

    // Default fallback
    DEFAULT: 'gray',
  },
  COLOR_HEX_MAP: {
    green: '#22c55e',      // Green-500 - Fresh, growth
    blue: '#2563eb',       // Blue-600 - Professional, trust
    purple: '#7c3aed',     // Purple-600 - Premium, personal
    crimson: '#e11d48',    // Rose-600 - Authority, admin
    amber: '#f5c451',      // Amber-600 - Energy, action
    pink: '#db2777',       // Pink-600 - Calendar, time
    red: '#dc2626',        // Red-600 - Error
    yellow: '#ca8a04',     // Yellow-600 - Warning
    gray: '#6b7280',       // Gray-500 - Disabled
  },
  SMALL_CARD_TYPES: {
    MONTH_SELECTION: 'month-selection',
    WEEK_SELECTOR: 'week-selector',
    USER_FILTER: 'user-filter',
    REPORTER_FILTER: 'reporter-filter',
    USER_PROFILE: 'user-profile',
    ACTIONS: 'actions',
    // Analytics card types
    ANALYTICS_TASK_OVERVIEW: 'analytics-task-overview',
    ANALYTICS_DELIVERABLES: 'analytics-deliverables',
    ANALYTICS_MARKETING: 'analytics-marketing',
    ANALYTICS_ACQUISITION: 'analytics-acquisition',
    ANALYTICS_EFFICIENCY: 'analytics-efficiency',
    ANALYTICS_PRODUCT: 'analytics-product',
    ANALYTICS_MISC: 'analytics-misc',
    // Daily card types
    ANALYTICS_DAILY_MONDAY: 'analytics-daily-monday',
    ANALYTICS_DAILY_TUESDAY: 'analytics-daily-tuesday',
    ANALYTICS_DAILY_WEDNESDAY: 'analytics-daily-wednesday',
    ANALYTICS_DAILY_THURSDAY: 'analytics-daily-thursday',
    ANALYTICS_DAILY_FRIDAY: 'analytics-daily-friday',
  },
  ANALYTICS_CARD_TYPES: {
    USER_ANALYTICS: 'user-analytics',
    REPORTER_ANALYTICS: 'reporter-analytics',
    MARKET_ANALYTICS: 'market-analytics',
    PRODUCT_ANALYTICS: 'product-analytics',
    DEPARTMENT_ANALYTICS: 'department-analytics',
    AI_MODEL_ANALYTICS: 'ai-model-analytics',
    TIME_ANALYTICS: 'time-analytics',
    MARKETING_ANALYTICS: 'marketing-analytics',
  },
};

// ============================================================================
// BUTTON SYSTEM CONSTANTS
// ============================================================================

export const BUTTON_SYSTEM = {
  BASE_CLASSES: 'px-3 py-2 inline-flex rounded-md font-medium shadow-sm !focus:outline-none transition-all duration-200',
  VARIANTS: {
    PRIMARY: 'bg-btn-primary text-gray-200 hover:bg-btn-secondary',
    SECONDARY: 'bg-secondary text-white hover:bg-btn-primary',
    SUCCESS: 'bg-green-success text-white hover:bg-green-400',
    DANGER: 'bg-red-error text-white hover:bg-red-500',
    WARNING: 'bg-warning text-white hover:bg-btn-warning',
    OUTLINE: 'border border-gray-200 text-gray-800 dark:text-white bg-white dark:bg-primary',
    EDIT: 'bg-blue-default text-white shadow-sm hover:bg-btn-info',
  },
  SIZES: {
    XS: 'px-2 py-1 text-xs',
    SM: 'px-2.5 py-1 text-xs',
    MD: 'px-3 py-1.5 text-sm',
    LG: 'px-2 py-3 text-lg',
    XL: 'px-6 py-3 text-2xl',
  },
  STATES: {
    DISABLED: 'opacity-50 cursor-not-allowed',
    LOADING: 'cursor-wait',
  },
  ICON_CLASSES: 'w-4 h-4',
  LOADING_SPINNER_CLASSES: 'w-4 h-4 rounded-full border-2 border-transparent border-t-white animate-spin',
  CONTENT_CLASSES: {
    HORIZONTAL: 'flex items-center justify-center gap-2 w-full',
    VERTICAL: 'flex flex-col items-center justify-center w-full',
  },
  DEFAULTS: {
    VARIANT: 'primary',
    SIZE: 'sm',
    ICON_POSITION: 'left',
    ICON_CATEGORY: 'buttons',
    TYPE: 'button',
    LOADING_TEXT: 'Loading...',
  },
  // Additional mappings for backward compatibility
  VARIANT_MAP: {
    primary: 'bg-btn-primary text-gray-200 hover:bg-btn-secondary',
    secondary: 'bg-secondary text-white hover:bg-btn-primary',
    success: 'bg-green-success text-white hover:bg-green-400',
    danger: 'bg-red-error text-white hover:bg-red-500',
    warning: 'bg-warning text-white hover:bg-btn-warning',
    outline: 'border border-gray-200 text-gray-800 dark:text-white bg-white dark:bg-primary',
    edit: 'bg-blue-default text-white shadow-sm hover:bg-btn-info',
  },
  SIZE_MAP: {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-2 py-3 text-lg',
    xl: 'px-6 py-3 text-2xl',
  },
  ICON_POSITION_MAP: {
    left: 'flex items-center justify-center gap-2 w-full',
    right: 'flex items-center justify-center gap-2 w-full',
    center: 'flex flex-col items-center justify-center w-full',
  },
};

// ============================================================================
// TABLE SYSTEM CONSTANTS
// ============================================================================

export const TABLE_SYSTEM = {
  PAGE_SIZE_OPTIONS: [5, 10, 20, 30, 40, 50],
  DEFAULT_PAGE_SIZE: 10,
  SORT_ICONS: {
    ASC: '↑',
    DESC: '↓',
    NONE: '↕',
  },
  COLUMN_TYPES: {
    TEXT: 'text',
    NUMBER: 'number',
    DATE: 'date',
    BOOLEAN: 'boolean',
    BADGE: 'badge',
    AVATAR: 'avatar',
    BUTTON: 'button',
    SELECTION: 'selection',
    CUSTOM: 'custom',
  },
  DATE_FORMATS: {
    SHORT: 'MM/dd/yyyy',
    LONG: 'MMMM dd, yyyy',
    DATETIME: 'MM/dd/yyyy HH:mm',
    DATETIME_LONG: 'MMM dd, yyyy HH:mm',
    TIME: 'HH:mm',
    ISO: 'yyyy-MM-dd',
  },
};

// ============================================================================
// ERROR HANDLING CONSTANTS
// ============================================================================

export const ERROR_SYSTEM = {
  TYPES: {
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    VALIDATION: 'VALIDATION',
    NETWORK: 'NETWORK',
    NOT_FOUND: 'NOT_FOUND',
    SERVER: 'SERVER',
    UNKNOWN: 'UNKNOWN',
  },
  SEVERITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  MESSAGES: {
    GENERIC_ERROR: 'An unexpected error occurred',
    NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
    AUTH_ERROR: 'Authentication failed. Please log in again.',
    PERMISSION_ERROR: 'You do not have permission to perform this action.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    NOT_FOUND_ERROR: 'The requested resource was not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
  },
};

// Cache configuration removed for simplicity

// ============================================================================
// ROUTING CONSTANTS
// ============================================================================

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',

  // Protected routes
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  LANDING_PAGES: '/landing-pages',
  USERS: '/users',
  VIEW_MY_DATA: '/view-my-data',
  TASK_DETAIL: '/task/:taskId',
  PREVIEW_MONTH: '/preview/:monthId',
};

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 100,
  MAX_CONCURRENT_REQUESTS: 5,
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 100,        // Reduced from 500 to 100
    TASKS_PER_QUERY: 50,          // New: Limit per query
    USERS_PER_QUERY: 20,          // New: Limit users query
    REPORTERS_PER_QUERY: 30,      // New: Limit reporters query
    DELIVERABLES_PER_QUERY: 50,   // New: Limit deliverables query
    SETTINGS_PER_QUERY: 10,        // New: Limit settings query
    USER_QUERY_LIMIT: 1,
    ANALYTICS_LIMIT: 200,         // New: Limit for analytics queries
    TOP_3_LIMIT: 10,              // New: Limit for top 3 calculations
  },
};

// ============================================================================
// UI/UX CONSTANTS
// ============================================================================

export const UI_CONFIG = {
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 300,     // milliseconds
  TOAST_DURATION: 3000,    // milliseconds
  MODAL_ANIMATION: 'easeOut',
  PAGE_TRANSITION: 'easeOut',
  SIDEBAR_WIDTH: 256,      // pixels
  HEADER_HEIGHT: 64,       // pixels
  REQUIRED_INDICATOR: "*", // Required field indicator
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
};

// ============================================================================
// DATE & TIME CONSTANTS
// ============================================================================

export const DATE_TIME = {
  FORMATS: {
    DISPLAY: 'MMM dd, yyyy',
    INPUT: 'yyyy-MM-dd',
    DATETIME: 'MMM dd, yyyy HH:mm',
    TIME: 'HH:mm',
    ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
  },
  LOCALE: 'en-US', // US language for display
  TIMEZONE: 'Europe/Bucharest', // Romanian timezone
  WEEK_START: 1, // Monday (Romanian calendar behavior)
  WORKING_HOURS: {
    START: 9,
    END: 17,
  },
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  MONTHS: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
};

// ============================================================================
// EXPORT CONSTANTS
// ============================================================================

export const EXPORT_CONFIG = {
  CSV_DELIMITER: ',',
  CSV_ENCODING: 'utf-8',
  MAX_EXPORT_ROWS: 10000,
};

// ============================================================================
// NOTIFICATION CONSTANTS
// ============================================================================

export const NOTIFICATIONS = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    LOADING: 'loading',
  },
  DURATIONS: {
    SHORT: 2000,
    MEDIUM: 3000,
    LONG: 5000,
  },
  POSITIONS: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
  },
};

// ============================================================================
// THEME CONSTANTS
// ============================================================================

export const THEME = {
  MODES: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  TRANSITION_DURATION: 300,
  COLORS: {
    PRIMARY: 'blue',
    SECONDARY: 'gray',
    SUCCESS: 'green',
    WARNING: 'amber',
    ERROR: 'red',
    INFO: 'blue',
  },
};

// ============================================================================
// DEVELOPMENT CONSTANTS
// ============================================================================

export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_DEVTOOLS: process.env.NODE_ENV === 'development',
  MOCK_API_DELAY: 1000, // milliseconds
  DEBUG_MODE: process.env.NODE_ENV === 'development',
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  APP_CONFIG,
  FIREBASE_CONFIG,
  AUTH,
  VALIDATION,
  FORM_OPTIONS,
  CARD_SYSTEM,
  BUTTON_SYSTEM,
  TABLE_SYSTEM,
  ERROR_SYSTEM,
  ROUTES,
  API_CONFIG,
  UI_CONFIG,
  DATE_TIME,
  EXPORT_CONFIG,
  NOTIFICATIONS,
  THEME,
  DEV_CONFIG,
};
