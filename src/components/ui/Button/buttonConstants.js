// ===== BUTTON CONSTANTS =====
// Centralized button styling and configuration

// ===== BASE CLASSES =====
export const BUTTON_BASE_CLASSES = "px-4 py-2 inline-flex rounded-lg font-medium shadow-sm !focus:outline-none focus:ring-gray-200 focus:ring-1 focus:ring-offset-0";

// ===== VARIANT CLASSES =====
export const BUTTON_VARIANTS = {
  PRIMARY: "bg-btn-primary text-gray-200 hover:bg-blue-700 text-white",
  SECONDARY: "bg-gray-200 text-gray-900",
  SUCCESS: "bg-green-600 text-gray-200",
  DANGER: "bg-red-error text-gray-200",
  WARNING: "bg-yellow-600 text-gray-200",
  OUTLINE: "border-2 border-gray-300 text-white-dark",
  EDIT: "bg-blue-600 text-gray-200 shadow-sm",
};

// ===== SIZE CLASSES =====
export const BUTTON_SIZES = {
  XS: "px-2 py-1 text-xs",
  SM: "px-3 py-1.5 text-sm",
  MD: "px-4 py-2.5 text-sm",
  LG: "px-6 py-3 text-lg !font-medium",
  XL: "px-8 py-4 text-lg",
};

// ===== STATE CLASSES =====
export const BUTTON_STATES = {
  DISABLED: "opacity-50 cursor-not-allowed",
  LOADING: "cursor-wait",
};

// ===== ICON CLASSES =====
export const BUTTON_ICON_CLASSES = "w-4 h-4";

// ===== LOADING SPINNER CLASSES =====
export const LOADING_SPINNER_CLASSES = "w-4 h-4 rounded-full border-2 border-transparent border-t-white animate-spin";

// ===== CONTENT WRAPPER CLASSES =====
export const BUTTON_CONTENT_CLASSES = {
  HORIZONTAL: "flex items-center justify-center gap-2 w-full",
  VERTICAL: "flex flex-col items-center justify-center w-full",
};

// ===== DEFAULT VALUES =====
export const BUTTON_DEFAULTS = {
  VARIANT: "primary",
  SIZE: "md",
  ICON_POSITION: "left",
  ICON_CATEGORY: "buttons",
  TYPE: "button",
  LOADING_TEXT: "Loading...",
};

// ===== VARIANT MAPPING =====
export const VARIANT_MAP = {
  primary: BUTTON_VARIANTS.PRIMARY,
  secondary: BUTTON_VARIANTS.SECONDARY,
  success: BUTTON_VARIANTS.SUCCESS,
  danger: BUTTON_VARIANTS.DANGER,
  warning: BUTTON_VARIANTS.WARNING,
  outline: BUTTON_VARIANTS.OUTLINE,
  edit: BUTTON_VARIANTS.EDIT,
};

// ===== SIZE MAPPING =====
export const SIZE_MAP = {
  xs: BUTTON_SIZES.XS,
  sm: BUTTON_SIZES.SM,
  md: BUTTON_SIZES.MD,
  lg: BUTTON_SIZES.LG,
  xl: BUTTON_SIZES.XL,
};

// ===== ICON POSITION MAPPING =====
export const ICON_POSITION_MAP = {
  left: BUTTON_CONTENT_CLASSES.HORIZONTAL,
  right: BUTTON_CONTENT_CLASSES.HORIZONTAL,
  center: BUTTON_CONTENT_CLASSES.VERTICAL,
};
