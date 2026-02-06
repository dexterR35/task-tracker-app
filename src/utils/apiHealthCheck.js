/**
 * API Health Check Utility
 * Checks if the API server is reachable before making requests
 */

import { API_CONFIG } from '@/constants';

/**
 * Check if API server is reachable
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function checkApiHealth() {
  try {
    const healthUrl = `${API_CONFIG.BASE_URL}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const res = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'include',
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        message: 'Server is reachable',
        data,
      };
    }

    return {
      ok: false,
      message: `Server responded with status ${res.status}`,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        ok: false,
        message: `Server timeout - unable to reach ${API_CONFIG.BASE_URL}`,
      };
    }

    if (error.message?.includes('Failed to fetch')) {
      return {
        ok: false,
        message: `Cannot connect to server at ${API_CONFIG.BASE_URL}. ` +
          'Please ensure the server is running.',
      };
    }

    return {
      ok: false,
      message: `Connection error: ${error.message}`,
    };
  }
}

/**
 * Get diagnostic information about API connectivity
 * @returns {object}
 */
export function getApiDiagnostics() {
  return {
    baseUrl: API_CONFIG.BASE_URL,
    authPrefix: API_CONFIG.AUTH_PREFIX,
    fullAuthUrl: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}`,
    envVar: import.meta.env.VITE_API_URL || 'not set (using default)',
    isLocalhost: API_CONFIG.BASE_URL.includes('localhost'),
  };
}
