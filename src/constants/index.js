
export const APP_CONFIG = {
  NAME: 'Xync', // App name – task tracker CRM dashboard
  FULL_NAME: 'Xync – Task Tracker CRM ', // Full app name for titles
  VERSION: '1.0.0',
  DESCRIPTION: 'Task tracker CRM dashboard for reporting and analytics. Stay in sync.',
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

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================
// Same sidebar for everyone. Data inside differs by role/department:
// - Main Menu (Dashboard, Analytics, Tasks, Kanban): data is department-scoped when user has a department (e.g. Design user sees Design tasks/analytics).
// - Departments: table of departments; admin only.
// - Settings: global for all departments → Users (global list), UI Showcase.

export const NAVIGATION_CONFIG = {
  /** Main menu: same sidebar; data inside (dashboard, analytics, tasks, kanban) is department-scoped by user's department */
  MAIN_MENU_ITEMS: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "home",
      color: "blue",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: "chart",
      color: "blue",
      subItems: [
        { name: "Overview", href: "/analytics" },
        { name: "Acquisition", href: "/analytics/acquisition" },
        { name: "Marketing", href: "/analytics/marketing" },
        { name: "Product", href: "/analytics/product" },
        { name: "User overview", href: "/analytics/by-users" },
        { name: "Reporter overview", href: "/analytics/reporter-overview" },
        { name: "Month comparison", href: "/analytics/month-comparison" },
        { name: "Misc", href: "/analytics/misc" },
      ],
    },
  ],
  /** Departments: table of departments (admin only) */
  DEPARTMENTS_ITEM: {
    name: "Departments",
    href: "/settings/departments",
    icon: "chart",
    color: "gray",
    adminOnly: true,
  },
  /** Settings: global (not department-scoped). Users = global list; UI Showcase = settings. */
  SETTINGS_ITEMS: [
    {
      name: "Settings",
      href: "/settings",
      icon: "settings",
      color: "gray",
      adminOnly: true,
      subItems: [
        { name: "Users", href: "/settings/users" },
        { name: "UI Showcase", href: "/settings/ui-showcase" },
      ],
    },
  ],
  /** Food app only: Dashboard, Orders, History (used when user.departmentSlug === 'food') */
  FOOD_MENU_ITEMS: [
    { name: "Dashboard", href: "/food/dashboard", icon: "home", color: "blue" },
    { name: "Orders", href: "/food/orders", icon: "chart", color: "blue" },
    { name: "History", href: "/food/history", icon: "chart", color: "gray" },
  ],
};

/** Data scope: what is department-scoped vs global. Use when fetching dashboard, analytics, tasks, kanban. */
export const DATA_SCOPE = {
  /** Main menu content (dashboard, analytics, tasks, kanban): filter by user's department when user has departmentId */
  DEPARTMENT_SCOPED: ['dashboard', 'analytics', 'tasks', 'kanban'],
  /** Settings: Users list and UI Showcase are global (all departments) */
  GLOBAL: ['users', 'ui-showcase'],
};

// ============================================================================
// DEPARTMENT APP – single department table; each department = different dashboard + menu
// Same auth, same user data; only users.department_id (set when user created) differs.
// ============================================================================
/** Slugs that map to which dashboard/menu. Food = orders app; others = Design (tasks) app. */
export const DEPARTMENT_APP = {
  FOOD_SLUG: 'food',
  DESIGN_SLUG: 'design',
  DESIGN_BASE: '/design',
  FOOD_BASE: '/food',
  SETTINGS_BASE: '/settings',
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
    amber: '#f68700',     // Amber-500 - Warning, attention, caution
    pink: '#E50046',      // Pink-600 - AI models, feminine, creative
    red: '#EF4444',       // Red-500 - Error, danger, delete
    yellow: '#d3c300',    // Yellow-400 - Bright, optimistic, highlight
    gray: '#64748B',      // Slate-500 - Neutral, disabled, subtle
    orange: '#F25912',
    soft_purple:"#ff9e08",    // Orange-500 - Product, warning, energy
    color_default: '#312e81',
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
    FOOD_ORDER_BOARD: 'food-order-board',
    FOOD_ORDERS: 'food-orders',
    FOOD_HISTORY: 'food-history',
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

  // Department-prefixed (2-apps-in-1) – same path /dashboard and /profile, different content for dashboard
  DESIGN_DASHBOARD: '/design/dashboard',
  FOOD_DASHBOARD: '/food/dashboard',
  FOOD_ORDER_BOARD: '/food/order-board',
  FOOD_ORDERS: '/food/orders',
  FOOD_HISTORY: '/food/history',

  // Shared (no department prefix)
  USERS: '/settings/users',
  UI_SHOWCASE: '/settings/ui-showcase',
  DEPARTMENTS: '/settings/departments',
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
  NAVIGATION_CONFIG,
  DATA_SCOPE,
  CARD_SYSTEM,
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
