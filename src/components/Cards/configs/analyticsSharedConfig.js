import { CARD_SYSTEM, FORM_OPTIONS } from "@/constants";

/**
 * Shared Analytics Configuration
 * Contains colors, utilities, and common settings used across all analytics cards
 */

export const MARKETS_BY_USERS_CARD_TYPES = CARD_SYSTEM.ANALYTICS_CARD_TYPES;

// Chart data type constants (from CARD_SYSTEM)
export const CHART_DATA_TYPE = CARD_SYSTEM.CHART_DATA_TYPE;

// Extract product, market, AI model, and department names from FORM_OPTIONS
export const PRODUCT_NAMES = Object.fromEntries(
  FORM_OPTIONS.PRODUCTS.map((p) => [
    p.value.toUpperCase().replace(/\s+/g, '_'),
    p.value,
  ])
);
export const MARKET_CODES = Object.fromEntries(
  FORM_OPTIONS.MARKETS.map((m) => [m.value.toUpperCase(), m.value.toUpperCase()])
);
export const AI_MODEL_NAMES = Object.fromEntries(
  FORM_OPTIONS.AI_MODELS.map((a) => [
    a.value.toUpperCase().replace(/\s+/g, '_'),
    a.value,
  ])
);
export const DEPARTMENT_NAMES = Object.fromEntries(
  FORM_OPTIONS.REPORTER_DEPARTMENTS.map((d) => [
    d.value.toUpperCase().replace(/\s+/g, '_'),
    d.value,
  ])
);

export const CHART_COLORS = {
  DEFAULT: Object.values(CARD_SYSTEM.COLOR_HEX_MAP),
  USER_BY_TASK: Object.values(CARD_SYSTEM.COLOR_HEX_MAP).slice(0, 10),
};

// ============================================================================
// CHART COLOR MAPPING SYSTEM
// ============================================================================

// Base color palette from CARD_SYSTEM
const BASE_COLORS = Object.values(CARD_SYSTEM.COLOR_HEX_MAP);

// User-specific color palette - distinct vibrant colors for users
export const USER_COLORS = [
  '#2563eb', // Blue-500
  '#10b981', // Emerald-500
  '#84cc16', // lime-500
  '#f59e0b', // amber-500
  '#8b5cf6', // Violet-500
  '#db2777', // Pink-500
  '#06b6d4', // Cyan-500
  '#f97316', // Orange-500
  '#10b981', // green-500
  '#e11d48', // rose-500
];

// Market-specific color mapping (using constants from FORM_OPTIONS)
export const MARKET_COLOR_MAP = {
  [MARKET_CODES.RO]: '#e11d48',    // Yellow-600 - Romania (primary market)
  [MARKET_CODES.COM]: '#2563eb',   // Blue-600 - International
  [MARKET_CODES.UK]: '#f97316',    // orange-600 - United Kingdom
  [MARKET_CODES.IE]: '#22c55e',    // Green-500 - Ireland
  [MARKET_CODES.FI]: '#7c3aed',    // Purple-600 - Finland
  [MARKET_CODES.DK]: '#f59e0b',    // Amber-500 - Denmark
  [MARKET_CODES.DE]: '#10b981',    // Emerald-500 - Germany
  [MARKET_CODES.AT]: '#ef4444',    // red-500 - Austria
  [MARKET_CODES.IT]: '#06b6d4',    // Cyan-500 - Italy
  [MARKET_CODES.GR]: '#db2777',    // Pink-600 - Greece
  [MARKET_CODES.FR]: '#84cc16',    // Lime-500 - France
};

// Product-specific color mapping (using constants from FORM_OPTIONS)
export const PRODUCT_COLOR_MAP = {
  [PRODUCT_NAMES.MARKETING_CASINO]: '#e11d48',    // Rose-600
  [PRODUCT_NAMES.MARKETING_SPORT]: '#2563eb',     // Blue-600
  [PRODUCT_NAMES.MARKETING_POKER]: '#7c3aed',     // Purple-600
  [PRODUCT_NAMES.MARKETING_LOTTO]: '#22c55e',     // Green-500
  [PRODUCT_NAMES.ACQUISITION_CASINO]: '#f59e0b',  // Amber-500
  [PRODUCT_NAMES.ACQUISITION_SPORT]: '#06b6d4',   // Cyan-500
  [PRODUCT_NAMES.ACQUISITION_POKER]: '#db2777',   // Pink-600
  [PRODUCT_NAMES.ACQUISITION_LOTTO]: '#84cc16',   // Lime-500
  [PRODUCT_NAMES.PRODUCT_CASINO]: '#f59e0b',      // amber-600
  [PRODUCT_NAMES.PRODUCT_SPORT]: '#22c55e',       // green-600
  [PRODUCT_NAMES.PRODUCT_POKER]: '#ef4444',       // Red-500
  [PRODUCT_NAMES.PRODUCT_LOTTO]: '#10b981',       // Emerald-500
  [PRODUCT_NAMES.MISC]: '#8C00FF',                // purple-500
};

// AI Model-specific color mapping (using constants from FORM_OPTIONS)
export const AI_MODEL_COLOR_MAP = {
  [AI_MODEL_NAMES.PHOTOSHOP]: '#e11d48',      // Rose-600
  [AI_MODEL_NAMES.FIREFLY]: '#2563eb',         // Blue-600
  [AI_MODEL_NAMES.CHATGPT]: '#7c3aed',        // Purple-600
  [AI_MODEL_NAMES.SHUTTERSTOCK]: '#22c55e',    // Green-500
  [AI_MODEL_NAMES.MIDJOURNEY]: '#f59e0b',      // Amber-500
  [AI_MODEL_NAMES.NIGHTCAFE]: '#06b6d4',      // Cyan-500
  [AI_MODEL_NAMES.FREEPICK]: '#db2777',        // Pink-600
  [AI_MODEL_NAMES.CURSOR]: '#84cc16',          // Lime-500
  [AI_MODEL_NAMES.RUN_DIFFUSION]: '#22c55e',   // Red-600
};

// Department-specific color mapping (using constants from FORM_OPTIONS)
export const DEPARTMENT_COLOR_MAP = {
  [DEPARTMENT_NAMES.VIDEO]: '#e11d48',           // Rose-600
  [DEPARTMENT_NAMES.DESIGN]: '#2563eb',          // Blue-600
  [DEPARTMENT_NAMES.DEVELOPER]: '#7c3aed',       // Purple-600
  [DEPARTMENT_NAMES.ACQ]: '#22c55e',             // Green-500
  [DEPARTMENT_NAMES.CRM]: '#f59e0b',             // Amber-500
  [DEPARTMENT_NAMES.GAMES_TEAM]: '#06b6d4',      // Cyan-500
  [DEPARTMENT_NAMES.OTHER]: '#db2777',           // Pink-600
  [DEPARTMENT_NAMES.PRODUCT]: '#84cc16',         // Lime-500
  [DEPARTMENT_NAMES.VIP]: '#dc2626',             // Red-600
  [DEPARTMENT_NAMES.CONTENT]: '#ca8a04',         // Yellow-600
  [DEPARTMENT_NAMES.PML]: '#ef4444',             // Red-500
  [DEPARTMENT_NAMES.MISC]: '#8C00FF',            // purple-500
  [DEPARTMENT_NAMES.HR]: '#10b981',              // Emerald-500
};

export const getMarketColor = (market) => {
  if (!market) return BASE_COLORS[0];
  const normalizedMarket = market.toUpperCase();
  return MARKET_COLOR_MAP[normalizedMarket] || BASE_COLORS[0];
};


export const getProductColor = (product) => {
  if (!product) return BASE_COLORS[0];
  const normalizedProduct = product.toLowerCase().trim();
  return PRODUCT_COLOR_MAP[normalizedProduct] || BASE_COLORS[0];
};


export const getAIModelColor = (model) => {
  if (!model) return BASE_COLORS[0];
  return AI_MODEL_COLOR_MAP[model] || BASE_COLORS[0];
};


export const getDepartmentColor = (department) => {
  if (!department) return BASE_COLORS[0];
  const normalizedDept = department.toLowerCase().trim();
  return DEPARTMENT_COLOR_MAP[normalizedDept] || BASE_COLORS[0];
};


export const getUserColor = (userIdentifier) => {
  if (!userIdentifier) return USER_COLORS[0];

  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userIdentifier.length; i++) {
    const char = userIdentifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index from USER_COLORS palette
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};


export const addConsistentColors = (data, type = CHART_DATA_TYPE.MARKET, nameKey = 'name') => {
  if (!data || !Array.isArray(data)) return [];

  // For USER and REPORTER types, ensure unique colors within the dataset
  if (type === CHART_DATA_TYPE.USER || type === CHART_DATA_TYPE.REPORTER) {
    const usedColors = new Set();
    const nameToColorMap = new Map();

    return data.map(item => {
      const name = item[nameKey] || item.name || item.label || '';

      // Check if we've already assigned a color to this name
      if (nameToColorMap.has(name)) {
        return {
          ...item,
          color: nameToColorMap.get(name)
        };
      }

      // Try to get a unique color using hash, but ensure uniqueness
      // Use USER_COLORS for users, BASE_COLORS for reporters
      const colorPalette = type === CHART_DATA_TYPE.USER ? USER_COLORS : BASE_COLORS;
      let color = type === CHART_DATA_TYPE.USER ? getUserColor(name) : getDepartmentColor(name);
      let attempts = 0;
      const maxAttempts = colorPalette.length * 2;

      // If color is already used, try next colors in sequence
      while (usedColors.has(color) && attempts < maxAttempts) {
        // Get next color index
        const currentIndex = colorPalette.indexOf(color);
        const nextIndex = (currentIndex + 1) % colorPalette.length;
        color = colorPalette[nextIndex];
        attempts++;
      }

      // If still no unique color found (very unlikely), use the hash color anyway
      usedColors.add(color);
      nameToColorMap.set(name, color);

      return {
        ...item,
        color
      };
    });
  }

  // For other types, use the original logic
  return data.map(item => {
    const name = item[nameKey] || item.name || item.label || '';
    let color;

    switch (type) {
      case CHART_DATA_TYPE.MARKET:
        color = getMarketColor(name);
        break;
      case CHART_DATA_TYPE.PRODUCT:
        color = getProductColor(name);
        break;
      case CHART_DATA_TYPE.AI_MODEL:
        color = getAIModelColor(name);
        break;
      case CHART_DATA_TYPE.DEPARTMENT:
        color = getDepartmentColor(name);
        break;
      default:
        color = BASE_COLORS[0];
    }

    return {
      ...item,
      color
    };
  });
};

// Export all color maps for reference
export const COLOR_MAPS = {
  MARKET: MARKET_COLOR_MAP,
  PRODUCT: PRODUCT_COLOR_MAP,
  AI_MODEL: AI_MODEL_COLOR_MAP,
  DEPARTMENT: DEPARTMENT_COLOR_MAP,
};

// Export base colors for fallback
export const BASE_COLOR_PALETTE = BASE_COLORS;

export const calculateTotal = (dataObject, defaultValue = 0) => {
  if (!dataObject || typeof dataObject !== "object") {
    return defaultValue;
  }

  return Object.values(dataObject).reduce((sum, value) => {
    const numValue = typeof value === "number" ? value : 0;
    return sum + numValue;
  }, 0);
};

/**
 * Calculate totals for user data (hours and tasks)
 * @param {Object} userData - Object containing userHours and userTotals
 * @returns {Object} - Object with totalHours and totalTasks
 */
export const calculateUserDataTotals = (userData) => {
  const { userHours = {}, userTotals = {} } = userData;

  return {
    totalHours: calculateTotal(userHours),
    totalTasks: calculateTotal(userTotals),
  };
};

export const calculatePercentage = (value, total, decimals = 1) => {
  if (total === 0) return "0.0";

  const percentage = (value / total) * 100;
  return percentage.toFixed(decimals);
};

export const calculateCountWithPercentage = (count, total, _decimals = 1) => {
  if (total === 0) return `${count} (0%)`;

  const percentage = Math.round((count / total) * 100);
  return `${count} (${percentage}%)`;
};

/**
 * Helper functions for extracting data from tasks
 * These reduce code duplication across analytics configs
 */

// Extract markets from task (with normalization)
export const getTaskMarkets = (task) => {
  const markets = task.data_task?.markets || task.markets || [];
  if (!Array.isArray(markets)) return [];
  return markets.map(market => market?.trim().toUpperCase()).filter(Boolean);
};

// Extract products from task
export const getTaskProducts = (task) => {
  return task.data_task?.products || task.products || "";
};

// Extract time in hours from task
export const getTaskHours = (task) => {
  return task.data_task?.timeInHours || task.timeInHours || 0;
};

// Extract reporter name from task
export const getTaskReporterName = (task) => {
  return task.data_task?.reporterName || task.reporterName || "";
};

// Extract reporter UID from task
export const getTaskReporterUID = (task) => {
  return task.data_task?.reporterUID || task.data_task?.reporters || task.reporterUID || task.reporters || "";
};

// Extract user UID from task
export const getTaskUserUID = (task) => {
  return task.userUID || task.createbyUID || "";
};

// Extract AI used from task
export const getTaskAIUsed = (task) => {
  return task.data_task?.aiUsed || task.aiUsed || [];
};

