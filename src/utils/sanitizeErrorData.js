/**
 * Strip sensitive fields from API error response data before logging or rethrowing.
 * Prevents tokens, PII, and credentials from appearing in logs or error reports.
 */

const SENSITIVE_KEYS = new Set([
  'token',
  'accessToken',
  'refreshToken',
  'user',
  'password',
  'email',
  'authorization',
  'cookie',
  'sessionId',
]);

/**
 * Returns a shallow copy of data with sensitive keys removed.
 * Used when attaching error.data or when logging errors.
 * @param {object} data - Raw response or error payload
 * @returns {object} Sanitized copy (safe for logging); never includes token/user/password etc.
 */
export function sanitizeErrorData(data) {
  if (data == null || typeof data !== 'object') {
    return data;
  }
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(keyLower)) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = value;
  }
  return out;
}
