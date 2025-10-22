import { useCallback } from 'react';
import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { DATE_TIME } from '@/constants';


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
    // Firestore Timestamp - check for toDate method
    if (value && typeof value.toDate === 'function') {
      const d = value.toDate();
      return isValid(d) ? d.getTime() : null;
    }

    // Firestore Timestamp - check for seconds/nanoseconds structure
    if (value && typeof value === 'object' && 'seconds' in value) {
      const milliseconds = value.seconds * 1000 + (value.nanoseconds || 0) / 1000000;
      return Number.isFinite(milliseconds) ? milliseconds : null;
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
  } catch (error) {
    // toMs conversion error
  }
  return null;
};

/**
 * Format date using a pattern with US language
 */
export const formatDate = (value, pattern = 'yyyy-MM-dd HH:mm', useRomanianTimezone = true) => {
  const ms = toMs(value);
  if (!ms) return 'N/A';
  try {
    const date = new Date(ms);
    // Keep original functionality but remove Romanian locale
    return format(date, pattern);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date as "time ago" with US language
 */
export const fromNow = (value, useRomanianTimezone = true) => {
  const ms = toMs(value);
  if (!ms) return 'N/A';
  try {
    const date = new Date(ms);
    const options = { addSuffix: true };
    // Keep US language for time ago display
    return formatDistanceToNow(date, options);
  } catch {
    return 'N/A';
  }
};

/**
 * Format month ID to readable format with US language
 */
export const formatMonth = (monthId, useRomanianTimezone = true) => {
  if (!monthId) return 'N/A';
  try {
    const date = parseISO(monthId + '-01');
    // Keep US language for month display
    return format(date, 'MMMM yyyy');
  } catch {
    return 'Invalid Month';
  }
};

/**
 * Get current year using proper timezone
 */
export const getCurrentYear = () => {
  const now = new Date();
  // Use the timezone from constants if needed
  return now.getFullYear().toString();
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
 * Serialize timestamps for JSON serialization
 * Converts all timestamp fields to ISO strings for API responses
 */
export const serializeTimestamps = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const serialized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      // Recursively serialize nested objects
      serialized[key] = serializeTimestamps(value);
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

// Backward compatibility alias
export const serializeTimestampsForContext = serializeTimestamps;

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
    serializeTimestampsForContext
  };
};

export default useFormat;

