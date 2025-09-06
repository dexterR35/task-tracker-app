/**
 * Form Sanitization Utilities - Only What You Need
 * 
 * 8 Core Sanitization Functions:
 * - sanitizeText: Removes HTML tags, control chars, normalizes whitespace
 * - sanitizeEmail: Trims and lowercases
 * - sanitizeUrl: Validates and normalizes URLs
 * - sanitizeNumber: Converts to number with fallback
 * - sanitizeBoolean: Converts to boolean
 * - sanitizeArray: Sanitizes array items and filters empty
 * - sanitizePassword: Trims only (preserves special chars)
 * - sanitizeDate: Normalizes date formats
 * 
 * Usage: Each field in useForms.js has its own sanitize function that calls these core functions.
 */

// Core sanitization functions
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  try {
    const urlObj = new URL(trimmed);
    return urlObj.toString();
  } catch {
    return '';
  }
};

export const sanitizeNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const sanitizeBoolean = (value) => {
  return Boolean(value);
};

export const sanitizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeText(item)).filter(Boolean);
  }
  return [];
};

// Password sanitization (preserve special characters, only trim)
export const sanitizePassword = (password) => {
  if (typeof password !== 'string') return '';
  return password.trim();
};

// Date sanitization
export const sanitizeDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    return date.trim();
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }
  return '';
};

