import { useCallback } from 'react';
import { 
  format, 
  formatDistanceToNow, 
  parseISO, 
  isValid,
  startOfMonth,
  endOfMonth,
} from 'date-fns';


// Standalone date utility functions (can be used outside React components)

/**
 * Normalize timestamp to consistent format
 * Handles both Firestore timestamps and regular Date objects
 */
export const normalizeTimestamp = (value) => {
  if (!value) return null;
  
  // If it's already a Date object
  if (value instanceof Date) {
    return value;
  }
  
  // If it's a Firestore timestamp
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // If it's a number (milliseconds)
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // If it's an object with seconds/nanoseconds (Firestore timestamp)
  if (value && typeof value === 'object' && 'seconds' in value) {
    const milliseconds = value.seconds * 1000 + (value.nanoseconds || 0) / 1000000;
    return new Date(milliseconds);
  }
  
  return null;
};

/**
 * Convert any timestamp value to milliseconds
 */
export const toMs = (value) => {
  if (!value) return null;
  try {
    // Firestore Timestamp
    if (value?.toDate) {
      const d = value.toDate();
      return isValid(d) ? d.getTime() : null;
    }
    // JS Date
    if (value instanceof Date) {
      return isValid(value) ? value.getTime() : null;
    }
    // Number (assumed ms)
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    // ISO or date-like string
    if (typeof value === 'string') {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed.getTime() : null;
    }
  } catch (_) {}
  return null;
};

/**
 * Format date using a pattern
 */
export const formatDate = (value, pattern = 'yyyy-MM-dd HH:mm') => {
  const ms = toMs(value);
  if (!ms) return 'N/A';
  try {
    const date = new Date(ms);
    return format(date, pattern);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date as "time ago"
 */
export const fromNow = (value) => {
  const ms = toMs(value);
  if (!ms) return 'N/A';
  try {
    const date = new Date(ms);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'N/A';
  }
};

/**
 * Format month ID to readable format
 */
export const formatMonth = (monthId) => {
  if (!monthId) return 'N/A';
  try {
    const date = parseISO(monthId + '-01');
    return format(date, 'MMMM yyyy');
  } catch {
    return 'Invalid Month';
  }
};

/**
 * Get current month ID
 */
export const getCurrentMonthId = () => {
  return format(new Date(), 'yyyy-MM');
};

/**
 * Parse month ID to Date object
 */
export const parseMonthId = (monthId) => {
  if (!monthId) return null;
  try {
    return parseISO(monthId + '-01');
  } catch {
    return null;
  }
};

/**
 * Get start of month for a given date
 */
export const getStartOfMonth = (date = new Date()) => {
  return startOfMonth(date);
};

/**
 * Get end of month for a given date
 */
export const getEndOfMonth = (date = new Date()) => {
  return endOfMonth(date);
};

/**
 * Format date with custom pattern
 */
export const formatDateWithPattern = (date, pattern = 'yyyy-MM-dd') => {
  return format(date, pattern);
};

/**
 * Serialize timestamps for Redux store
 * Converts all timestamp fields to ISO strings for serialization
 */
export const serializeTimestampsForRedux = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const serialized = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      // Recursively serialize nested objects
      serialized[key] = serializeTimestampsForRedux(value);
    } else if (value && typeof value.toDate === 'function') {
      // Convert Firestore timestamp to ISO string
      serialized[key] = value.toDate().toISOString();
    } else if (value instanceof Date) {
      // Convert Date object to ISO string
      serialized[key] = value.toISOString();
    } else {
      // Keep other values as is
      serialized[key] = value;
    }
  }
  
  return serialized;
};

// React hook for date formatting (combines all the above utilities)
export const useFormat = () => {
  return { 
    toMs, 
    format: formatDate, 
    fromNow, 
    formatMonth,
    getCurrentMonthId,
    parseMonthId,
    normalizeTimestamp,
    serializeTimestampsForRedux
  };
};

export default useFormat;

// ============================================================================
// DATA NORMALIZATION UTILITIES
// ============================================================================




/**
 * Normalize and serialize data for Redux store
 * @param {Object|Array} data - Data to normalize and serialize
 * @param {Function} normalizer - Optional normalizer function
 * @returns {Object|Array} - Normalized and serialized data
 */
export const normalizeForRedux = (data, normalizer = null) => {
  if (!data) {
    return data;
  }

  let normalizedData = data;
  
  // Apply custom normalizer if provided
  if (normalizer && typeof normalizer === 'function') {
    normalizedData = normalizer(data);
  }

  // Serialize timestamps for Redux
  return serializeTimestampsForRedux(normalizedData);
};
