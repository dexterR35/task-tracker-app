
export const APP_CONFIG = {
  NAME: 'SYNC', // App name - change this to sync across all titles and meta tags
  FULL_NAME: 'SYNC Task Management', // Full app name for titles
  VERSION: '1.0.0',
  DESCRIPTION: 'A modern task tracking application with team collaboration and performance monitoring.',
  COMPANY: 'REI',
  SUPPORT_EMAIL: 'support@REI.ro',
  DEFAULT_LOCALE: 'en-US', // US language
  DEFAULT_TIMEZONE: 'Europe/Bucharest', // Romanian timezone
  CALENDAR_WEEK_START: 1, // Monday (Romanian calendar behavior)
};


// ============================================================================
// API CONFIGURATION (PERN backend + request limits)
// ============================================================================

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  AUTH_PREFIX: '/api/auth',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  BATCH_SIZE: 100,
  MAX_CONCURRENT_REQUESTS: 5,
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 100,
    TASKS_PER_QUERY: 50,
    USERS_PER_QUERY: 20,
    REPORTERS_PER_QUERY: 30,
    DELIVERABLES_PER_QUERY: 50,
    SETTINGS_PER_QUERY: 10,
    USER_QUERY_LIMIT: 1,
    TOP_3_LIMIT: 10,
  },
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
    MANAGE_USERS: 'manage_users',
    MANAGE_REPORTERS: 'manage_reporters',
    MANAGE_DELIVERABLES: 'manage_deliverables',
  },
  EMAIL_DOMAIN: 'netbet.ro',
  EMAIL_DOMAIN2: 'rei.com',
  EMAIL_DOMAIN3: 'gimo.co.uk',
};

// ============================================================================
// VALIDATION PATTERNS & MESSAGES
// ============================================================================

export const VALIDATION = {
  PATTERNS: {
    ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,
    NETBET_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(netbet\.[a-zA-Z0-9.-]+|gimo\.co\.uk)$/,
    JIRA_URL_ONLY: /^https:\/\/gmrd\.atlassian\.net\/browse\/[A-Z]+-\d+$/,
    URL: /^https?:\/\/.+/,
    PHONE: /^\+?[\d\s\-()]+$/,
  },
  MESSAGES: {
    REQUIRED: 'This field is required',
    NETBET_EMAIL: 'Please enter a valid email address (@netbet.* or @gimo.co.uk)',
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
  DEPARTMENTS: [
    { value: 'acquisition', label: 'Acquisition' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'customer_relationship_management', label: 'CRM' },
    { value: 'games_team', label: 'Games Team' },
    { value: 'other', label: 'Other' },
    { value: 'product', label: 'Product' },
    { value: 'vip', label: 'VIP' },
    { value: 'content', label: 'Content' },
    { value: 'performance_marketing_local', label: 'Performance Marketing Local' },
    { value: 'miscellaneous', label: 'Miscellaneous' },
    { value: 'human_resources', label: 'Human Resources' },
    { value: 'video', label: 'Video Production' },
    { value: 'design', label: 'Design' },
    { value: 'developer', label: 'Development' },
    { value: 'acquisition_social_media', label: 'Acquisition Social Media' },
    { value: 'brand_management', label: 'Brand Management' },
    { value: 'search_engine_optimization', label: 'SEO' },
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

// Backward compatibility aliases (deprecated - use FORM_OPTIONS.DEPARTMENTS instead)
FORM_OPTIONS.REPORTER_DEPARTMENTS = FORM_OPTIONS.DEPARTMENTS;
FORM_OPTIONS.REPORTER_CHANNELS = FORM_OPTIONS.DEPARTMENTS;

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

export const NAVIGATION_CONFIG = {
  /** Main menu: Dashboard + Analytics (collapsible with pages) */
  ITEMS: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "home",
      color: "blue",
      adminOnly: true,
      subItems: [
        { name: "Overview", href: "/dashboard" },
      ],
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: "chart",
      color: "blue",
      subItems: [
        { name: "Marketing", href: "/analytics/marketing" },
        { name: "Acquisition", href: "/analytics/acquisition" },
        { name: "Product", href: "/analytics/product" },
        { name: "Analytics by users", href: "/analytics/by-users" },
      ],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: "settings",
      color: "gray",
      adminOnly: true,
      subItems: [
        { name: "Users", href: "/users" },
        { name: "UI Showcase", href: "/ui-showcase" },
      ],
    },
  ],
  /** Bottom account section (e.g. Account settings collapsible) - empty; admin pages are under Dashboard */
  ACCOUNT_ITEMS: [],
  DEPARTMENT: {
    name: "Design",
    subtitle: "Department",
    icon: "settings",
    color: "color_default",
  },
};

// ============================================================================
// CARD SYSTEM – badges, charts, inline styles (JS-only color usage)
// ============================================================================
// COLOR_HEX_MAP: Use only when the app needs the actual color value in code
// (e.g. charts, inline style={{ }}, SVG, canvas). For all other styling,
// use CSS theme variables in index.css @theme and Tailwind classes.
// Keep this map in sync with the CSS theme where the same tokens exist.
// 70% → B3, 73% → BA, 75% → BF, 80% → CC, 85% → D9
export const CARD_SYSTEM = {
  COLOR_HEX_MAP: {
    green: '#00d54d',      // Emerald-500 - Fresh, growth, success
    blue: '#1177ff',      // Blue-600 - Professional, trust, primary
    purple: '#0fc9ce',    // Violet-600 - Royal, premium, creative
    crimson: '#DC143C',   // Red-600 - Authority, admin, critical
    amber: '#ff9e08',     // Amber-500 - Warning, attention, caution
    pink: '#E50046',      // Pink-600 - AI models, feminine, creative
    red: '#EF4444',       // Red-500 - Error, danger, delete
    yellow: '#d3c300',    // Yellow-400 - Bright, optimistic, highlight
    gray: '#64748B',      // Slate-500 - Neutral, disabled, subtle
    orange: '#F25912',
    soft_purple:"#ff9e08",    // Orange-500 - Product, warning, energy
    color_default: '#E50046',
    select_badge: '#00d8de', // C2E2FA- Selected badges in cards and forms
    filter_color: '#00418d', // Blue-600 - Primary blue - Default color for UI elements
    dark_gray: '#252a3c', // Slate-600 - Darker gray for better contrast
    indigo: '#312e81',
  },
  SMALL_CARD_TYPES: {
    MONTH_SELECTION: 'month-selection',
    USER_FILTER: 'user-filter',
    REPORTER_FILTER: 'reporter-filter',
    USER_PROFILE: 'user-profile',
    ACTIONS: 'actions',
    PERFORMANCE: 'performance',
    EFFICIENCY: 'efficiency',
  },
  // Chart data types for color mapping
  CHART_DATA_TYPE: {
    MARKET: 'market',
    PRODUCT: 'product',
    AI_MODEL: 'aiModel',
    DEPARTMENT: 'department',
    USER: 'user',
    REPORTER: 'reporter',
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
  DEFAULT_PAGE_SIZE: 20,
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
  USERS: '/users',
  PREVIEW_MONTH: '/preview/:monthId',
  PROFILE: '/profile',
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
  AUTH,
  VALIDATION,
  FORM_OPTIONS,
  NAVIGATION_CONFIG,
  CARD_SYSTEM,
  BUTTON_SYSTEM,
  TABLE_SYSTEM,
  ERROR_SYSTEM,
  ROUTES,
  API_CONFIG,
  UI_CONFIG,
  DATE_TIME,
  NOTIFICATIONS,
  THEME,
  DEV_CONFIG,
};
