/**
 * Analytics Card Configuration - Main Export File
 *
 * This file re-exports all analytics card configurations from individual config files.
 * This maintains backward compatibility with existing imports while organizing
 * the code into smaller, more manageable modules.
 */

// Re-export shared config (colors, utilities, and color mapping)
export {
  MARKETS_BY_USERS_CARD_TYPES,
  CHART_COLORS,
  CHART_DATA_TYPE,
  calculateTotal,
  calculateUserDataTotals,
  calculatePercentage,
  calculateCountWithPercentage,
  addGrandTotalRow,
  // Chart color mapping functions
  MARKET_COLOR_MAP,
  PRODUCT_COLOR_MAP,
  AI_MODEL_COLOR_MAP,
  DEPARTMENT_COLOR_MAP,
  // Constants for color mapping keys
  PRODUCT_NAMES,
  MARKET_CODES,
  AI_MODEL_NAMES,
  DEPARTMENT_NAMES,
  getMarketColor,
  getProductColor,
  getAIModelColor,
  getDepartmentColor,
  getUserColor,
  addConsistentColors,
  COLOR_MAPS,
  BASE_COLOR_PALETTE,
} from "./configs/analyticsSharedConfig";

// Re-export Marketing Analytics
export {
  calculateMarketingAnalyticsData,
  getMarketingAnalyticsCardProps,
  getCachedMarketingAnalyticsCardProps,
} from "./configs/MarketingAnalyticsConfig";

// Re-export Acquisition Analytics
export {
  calculateAcquisitionAnalyticsData,
  getAcquisitionAnalyticsCardProps,
  getCachedAcquisitionAnalyticsCardProps,
} from "./configs/AcquisitionAnalyticsConfig";

// Re-export Product Analytics
export {
  calculateProductAnalyticsData,
  getProductAnalyticsCardProps,
  getCachedProductAnalyticsCardProps,
} from "./configs/ProductAnalyticsConfig";

// Re-export AI Analytics
export {
  calculateAIAnalyticsData,
  getAIAnalyticsCardProps,
  getCachedAIAnalyticsCardProps,
} from "./configs/AIAnalyticsConfig";

// Re-export Reporter Analytics
export {
  calculateReporterAnalyticsData,
  getReporterAnalyticsCardProps,
  getCachedReporterAnalyticsCardProps,
} from "./configs/ReporterAnalyticsConfig";

// Re-export Misc Analytics
export {
  calculateMiscAnalyticsData,
  getMiscAnalyticsCardProps,
  getCachedMiscAnalyticsCardProps,
} from "./configs/MiscAnalyticsConfig.jsx";
