/**
 * API client for PERN backend
 * Handles auth token and base URL for fetch requests.
 */

import { API_CONFIG } from '@/constants';

const TOKEN_KEY = 'task_tracker_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Fetch with base URL and optional Bearer token
 */
export async function apiRequest(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Auth API */
export const authApi = {
  login: (email, password) =>
    apiRequest(`${API_CONFIG.AUTH_PREFIX}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (body) =>
    apiRequest(`${API_CONFIG.AUTH_PREFIX}/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => apiRequest(`${API_CONFIG.AUTH_PREFIX}/me`),
};

/** Users API */
export const usersApi = {
  list: () => apiRequest('/api/users'),
  getById: (id) => apiRequest(`/api/users/${id}`),
  update: (id, body) =>
    apiRequest(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
