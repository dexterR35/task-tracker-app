/**
 * Chart Color Mapping System
 * Ensures consistent colors across all chart types for the same data categories
 * 
 * This system maps specific data values (markets, products, users, etc.) to consistent colors
 * so that RO will always be yellow, COM will always be blue, etc. across all charts.
 */

import { CARD_SYSTEM } from '@/constants';

// Base color palette from CARD_SYSTEM
const BASE_COLORS = Object.values(CARD_SYSTEM.COLOR_HEX_MAP);

// Market-specific color mapping
export const MARKET_COLOR_MAP = {
  'RO': '#ca8a04',    // Yellow-600 - Romania (primary market)
  'COM': '#2563eb',   // Blue-600 - International
  'UK': '#dc2626',    // Red-600 - United Kingdom
  'IE': '#22c55e',    // Green-500 - Ireland
  'FI': '#7c3aed',    // Purple-600 - Finland
  'DK': '#f59e0b',    // Amber-500 - Denmark
  'DE': '#10b981',    // Emerald-500 - Germany
  'AT': '#ef4444',    // Red-500 - Austria
  'IT': '#06b6d4',    // Cyan-500 - Italy
  'GR': '#db2777',    // Pink-600 - Greece
  'FR': '#84cc16',    // Lime-500 - France
};

// Product-specific color mapping
export const PRODUCT_COLOR_MAP = {
  'marketing casino': '#e11d48',    // Rose-600
  'marketing sport': '#2563eb',     // Blue-600
  'marketing poker': '#7c3aed',     // Purple-600
  'marketing lotto': '#22c55e',     // Green-500
  'acquisition casino': '#f59e0b',  // Amber-500
  'acquisition sport': '#06b6d4',   // Cyan-500
  'acquisition poker': '#db2777',   // Pink-600
  'acquisition lotto': '#84cc16',   // Lime-500
  'product casino': '#dc2626',      // Red-600
  'product sport': '#ca8a04',       // Yellow-600
  'product poker': '#ef4444',       // Red-500
  'product lotto': '#10b981',       // Emerald-500
  'misc': '#6b7280',                // Gray-500
};

// AI Model-specific color mapping
export const AI_MODEL_COLOR_MAP = {
  'Photoshop': '#e11d48',      // Rose-600
  'FireFly': '#2563eb',         // Blue-600
  'ChatGpt': '#7c3aed',        // Purple-600
  'ShutterStock': '#22c55e',    // Green-500
  'Midjourney': '#f59e0b',      // Amber-500
  'NightCafe': '#06b6d4',      // Cyan-500
  'FreePick': '#db2777',        // Pink-600
  'Cursor': '#84cc16',          // Lime-500
  'run diffusion': '#dc2626',   // Red-600
};

// Department-specific color mapping
export const DEPARTMENT_COLOR_MAP = {
  'video': '#e11d48',           // Rose-600
  'design': '#2563eb',          // Blue-600
  'developer': '#7c3aed',       // Purple-600
  'acq': '#22c55e',             // Green-500
  'crm': '#f59e0b',             // Amber-500
  'games team': '#06b6d4',      // Cyan-500
  'other': '#db2777',           // Pink-600
  'product': '#84cc16',         // Lime-500
  'vip': '#dc2626',             // Red-600
  'content': '#ca8a04',         // Yellow-600
  'pml': '#ef4444',             // Red-500
  'misc': '#6b7280',            // Gray-500
  'hr': '#10b981',              // Emerald-500
};

// Reporter-specific color mapping
export const REPORTER_COLOR_MAP = {
  'dexter': '#e11d48',          // Rose-600
  'alex': '#2563eb',            // Blue-600
  'maria': '#7c3aed',           // Purple-600
  'john': '#22c55e',            // Green-500
  'sarah': '#f59e0b',           // Amber-500
  'mike': '#06b6d4',            // Cyan-500
  'lisa': '#db2777',            // Pink-600
  'david': '#84cc16',           // Lime-500
  'anna': '#dc2626',            // Red-600
  'tom': '#ca8a04',             // Yellow-600
  'emma': '#ef4444',            // Red-500
  'chris': '#6b7280',           // Gray-500
  'sophie': '#10b981',          // Emerald-500
  'james': '#8b5cf6',           // Violet-500
  'olivia': '#f97316',          // Orange-500
  'william': '#14b8a6',         // Teal-500
  'ava': '#ec4899',             // Pink-500
  'noah': '#84cc16',            // Lime-500
  'mia': '#f59e0b',             // Amber-500
  'liam': '#06b6d4',            // Cyan-500
};

/**
 * Get color for a specific market
 * @param {string} market - Market code (e.g., 'RO', 'COM', 'UK')
 * @returns {string} - Hex color code
 */
export const getMarketColor = (market) => {
  if (!market) return BASE_COLORS[0];
  const normalizedMarket = market.toUpperCase();
  return MARKET_COLOR_MAP[normalizedMarket] || BASE_COLORS[0];
};

/**
 * Get color for a specific product
 * @param {string} product - Product name (e.g., 'marketing casino', 'product sport')
 * @returns {string} - Hex color code
 */
export const getProductColor = (product) => {
  if (!product) return BASE_COLORS[0];
  const normalizedProduct = product.toLowerCase().trim();
  return PRODUCT_COLOR_MAP[normalizedProduct] || BASE_COLORS[0];
};

/**
 * Get color for a specific AI model
 * @param {string} model - AI model name (e.g., 'Photoshop', 'ChatGpt')
 * @returns {string} - Hex color code
 */
export const getAIModelColor = (model) => {
  if (!model) return BASE_COLORS[0];
  return AI_MODEL_COLOR_MAP[model] || BASE_COLORS[0];
};

/**
 * Get color for a specific department
 * @param {string} department - Department name (e.g., 'video', 'design')
 * @returns {string} - Hex color code
 */
export const getDepartmentColor = (department) => {
  if (!department) return BASE_COLORS[0];
  const normalizedDept = department.toLowerCase().trim();
  return DEPARTMENT_COLOR_MAP[normalizedDept] || BASE_COLORS[0];
};

/**
 * Get color for a specific reporter
 * @param {string} reporter - Reporter name
 * @returns {string} - Hex color code
 */
export const getReporterColor = (reporter) => {
  if (!reporter) return BASE_COLORS[0];
  const normalizedReporter = reporter.toLowerCase().trim();
  return REPORTER_COLOR_MAP[normalizedReporter] || getUserColor(reporter);
};

/**
 * Get color for a user (based on user ID or name)
 * Uses a hash function to ensure consistent colors for the same user
 * @param {string} userIdentifier - User ID, name, or email
 * @returns {string} - Hex color code
 */
export const getUserColor = (userIdentifier) => {
  if (!userIdentifier) return BASE_COLORS[0];
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < userIdentifier.length; i++) {
    const char = userIdentifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % BASE_COLORS.length;
  return BASE_COLORS[index];
};

/**
 * Get colors for an array of data items
 * @param {Array} data - Array of data items with name/value properties
 * @param {string} type - Type of data ('market', 'product', 'aiModel', 'department', 'user')
 * @returns {Array} - Array of color codes
 */
export const getColorsForData = (data, type = 'market') => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => {
    const name = item.name || item.label || item.value || '';
    
    switch (type.toLowerCase()) {
      case 'market':
        return getMarketColor(name);
      case 'product':
        return getProductColor(name);
      case 'aimodel':
      case 'ai_model':
        return getAIModelColor(name);
      case 'department':
        return getDepartmentColor(name);
      case 'reporter':
        return getReporterColor(name);
      case 'user':
        return getUserColor(name);
      default:
        return BASE_COLORS[0];
    }
  });
};

/**
 * Create a color mapping object for a dataset
 * @param {Array} data - Array of data items
 * @param {string} type - Type of data
 * @returns {Object} - Object mapping names to colors
 */
export const createColorMapping = (data, type = 'market') => {
  if (!data || !Array.isArray(data)) return {};
  
  const mapping = {};
  data.forEach(item => {
    const name = item.name || item.label || item.value || '';
    switch (type.toLowerCase()) {
      case 'market':
        mapping[name] = getMarketColor(name);
        break;
      case 'product':
        mapping[name] = getProductColor(name);
        break;
      case 'aimodel':
      case 'ai_model':
        mapping[name] = getAIModelColor(name);
        break;
      case 'department':
        mapping[name] = getDepartmentColor(name);
        break;
      case 'reporter':
        mapping[name] = getReporterColor(name);
        break;
      case 'user':
        mapping[name] = getUserColor(name);
        break;
      default:
        mapping[name] = BASE_COLORS[0];
    }
  });
  
  return mapping;
};

/**
 * Enhanced data processing that adds consistent colors to chart data
 * @param {Array} data - Raw chart data
 * @param {string} type - Type of data
 * @param {string} nameKey - Key for the name property (default: 'name')
 * @returns {Array} - Data with consistent colors added
 */
export const addConsistentColors = (data, type = 'market', nameKey = 'name') => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => {
    const name = item[nameKey] || item.name || item.label || '';
    let color;
    
    switch (type.toLowerCase()) {
      case 'market':
        color = getMarketColor(name);
        break;
      case 'product':
        color = getProductColor(name);
        break;
      case 'aimodel':
      case 'ai_model':
        color = getAIModelColor(name);
        break;
      case 'department':
        color = getDepartmentColor(name);
        break;
      case 'reporter':
        color = getReporterColor(name);
        break;
      case 'user':
        color = getUserColor(name);
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
  REPORTER: REPORTER_COLOR_MAP,
};

// Export base colors for fallback
export const BASE_COLOR_PALETTE = BASE_COLORS;
