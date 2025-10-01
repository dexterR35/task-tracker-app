// Comprehensive Color System for Dark Theme
// This system provides consistent colors throughout the app

export const COLOR_SYSTEM = {
  // Primary Colors - Main brand colors
  PRIMARY: {
    blue: '#3b82f6',      // Blue-500
    purple: '#8b5cf6',    // Purple-500
    crimson: '#dc2626',   // Red-600
    amber: '#f59e0b',     // Amber-500
    pink: '#ec4899',      // Pink-500
    green: '#10b981',     // Emerald-500
  },

  // Dark Theme Backgrounds
  BACKGROUND: {
    primary: '#0f172a',     // Slate-900 - Main background
    secondary: '#1e293b',   // Slate-800 - Card backgrounds
    tertiary: '#334155',    // Slate-700 - Hover states
    elevated: '#475569',    // Slate-600 - Elevated elements
  },

  // Text Colors
  TEXT: {
    primary: '#f8fafc',     // Slate-50 - Main text
    secondary: '#cbd5e1',   // Slate-300 - Secondary text
    muted: '#94a3b8',       // Slate-400 - Muted text
    disabled: '#64748b',    // Slate-500 - Disabled text
  },

  // Border Colors
  BORDER: {
    primary: '#334155',     // Slate-700 - Main borders
    secondary: '#475569',   // Slate-600 - Secondary borders
    accent: '#64748b',      // Slate-500 - Accent borders
  },

  // Status Colors
  STATUS: {
    success: '#10b981',     // Emerald-500
    warning: '#f59e0b',     // Amber-500
    error: '#ef4444',       // Red-500
    info: '#3b82f6',        // Blue-500
  },

  // Interactive States
  INTERACTIVE: {
    hover: {
      blue: '#2563eb',      // Blue-600
      purple: '#7c3aed',    // Purple-600
      crimson: '#b91c1c',  // Red-700
      amber: '#d97706',     // Amber-600
      pink: '#db2777',      // Pink-600
      green: '#059669',     // Emerald-600
    },
    active: {
      blue: '#1d4ed8',      // Blue-700
      purple: '#6d28d9',    // Purple-700
      crimson: '#991b1b',  // Red-800
      amber: '#b45309',     // Amber-700
      pink: '#be185d',      // Pink-700
      green: '#047857',     // Emerald-700
    }
  },

  // Card Colors - For small cards
  CARD: {
    month: '#ec4899',       // Pink-500
    userFilter: '#3b82f6', // Blue-500
    reporterFilter: '#dc2626', // Red-600
    userProfile: '#8b5cf6', // Purple-500
    actions: '#f59e0b',    // Amber-500
  },

  // Badge Colors
  BADGE: {
    success: '#10b981',     // Emerald-500
    warning: '#f59e0b',     // Amber-500
    error: '#ef4444',       // Red-500
    info: '#3b82f6',        // Blue-500
    secondary: '#64748b',   // Slate-500
  }
};

// CSS Variables for easy theming
export const CSS_VARIABLES = {
  '--color-primary': COLOR_SYSTEM.PRIMARY.blue,
  '--color-secondary': COLOR_SYSTEM.PRIMARY.purple,
  '--color-accent': COLOR_SYSTEM.PRIMARY.amber,
  '--color-success': COLOR_SYSTEM.STATUS.success,
  '--color-warning': COLOR_SYSTEM.STATUS.warning,
  '--color-error': COLOR_SYSTEM.STATUS.error,
  '--color-info': COLOR_SYSTEM.STATUS.info,
  
  '--bg-primary': COLOR_SYSTEM.BACKGROUND.primary,
  '--bg-secondary': COLOR_SYSTEM.BACKGROUND.secondary,
  '--bg-tertiary': COLOR_SYSTEM.BACKGROUND.tertiary,
  
  '--text-primary': COLOR_SYSTEM.TEXT.primary,
  '--text-secondary': COLOR_SYSTEM.TEXT.secondary,
  '--text-muted': COLOR_SYSTEM.TEXT.muted,
  
  '--border-primary': COLOR_SYSTEM.BORDER.primary,
  '--border-secondary': COLOR_SYSTEM.BORDER.secondary,
};

// Utility functions
export const getCardColor = (cardType) => {
  return COLOR_SYSTEM.CARD[cardType] || COLOR_SYSTEM.PRIMARY.blue;
};

export const getHoverColor = (color) => {
  const colorMap = {
    [COLOR_SYSTEM.PRIMARY.blue]: COLOR_SYSTEM.INTERACTIVE.hover.blue,
    [COLOR_SYSTEM.PRIMARY.purple]: COLOR_SYSTEM.INTERACTIVE.hover.purple,
    [COLOR_SYSTEM.PRIMARY.crimson]: COLOR_SYSTEM.INTERACTIVE.hover.crimson,
    [COLOR_SYSTEM.PRIMARY.amber]: COLOR_SYSTEM.INTERACTIVE.hover.amber,
    [COLOR_SYSTEM.PRIMARY.pink]: COLOR_SYSTEM.INTERACTIVE.hover.pink,
    [COLOR_SYSTEM.PRIMARY.green]: COLOR_SYSTEM.INTERACTIVE.hover.green,
  };
  return colorMap[color] || COLOR_SYSTEM.INTERACTIVE.hover.blue;
};

export const getActiveColor = (color) => {
  const colorMap = {
    [COLOR_SYSTEM.PRIMARY.blue]: COLOR_SYSTEM.INTERACTIVE.active.blue,
    [COLOR_SYSTEM.PRIMARY.purple]: COLOR_SYSTEM.INTERACTIVE.active.purple,
    [COLOR_SYSTEM.PRIMARY.crimson]: COLOR_SYSTEM.INTERACTIVE.active.crimson,
    [COLOR_SYSTEM.PRIMARY.amber]: COLOR_SYSTEM.INTERACTIVE.active.amber,
    [COLOR_SYSTEM.PRIMARY.pink]: COLOR_SYSTEM.INTERACTIVE.active.pink,
    [COLOR_SYSTEM.PRIMARY.green]: COLOR_SYSTEM.INTERACTIVE.active.green,
  };
  return colorMap[color] || COLOR_SYSTEM.INTERACTIVE.active.blue;
};

// Tailwind classes for easy use
export const TAILWIND_CLASSES = {
  background: {
    primary: 'bg-slate-900',
    secondary: 'bg-slate-800',
    tertiary: 'bg-slate-700',
  },
  text: {
    primary: 'text-slate-50',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
  },
  border: {
    primary: 'border-slate-700',
    secondary: 'border-slate-600',
  }
};

export default COLOR_SYSTEM;
