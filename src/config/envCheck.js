/**
 * Runtime environment checks. Call once at app bootstrap (e.g. main.jsx).
 * In production, VITE_API_URL must be set; HTTPS is recommended.
 */
const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production';

export function assertProductionEnv() {
  if (!isProduction) return;
  const baseUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
  if (!baseUrl || baseUrl.trim() === '') {
    // eslint-disable-next-line no-console
    console.error(
      '[env] In production, VITE_API_URL must be set. Current value is missing or empty.'
    );
  } else if (!baseUrl.startsWith('https://') && baseUrl.startsWith('http://')) {
    // eslint-disable-next-line no-console
    console.warn('[env] VITE_API_URL should use HTTPS in production.');
  }
}
