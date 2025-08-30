import { format } from 'date-fns';

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

/**
 * Normalize timestamps in an object recursively
 */
export const normalizeObjectTimestamps = (input) => {
  if (!input || typeof input !== 'object') {
    return input;
  }
  
  const normalized = Array.isArray(input) ? [] : {};
  
  for (const [key, value] of Object.entries(input)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively normalize nested objects
      normalized[key] = normalizeObjectTimestamps(value);
    } else {
      // Normalize timestamp fields
      normalized[key] = normalizeTimestamp(value);
    }
  }
  
  return normalized;
};
