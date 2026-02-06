/**
 * API client for PERN backend
 * Access token: in memory only (JWT, 5–10 min). No localStorage for token.
 * Refresh token: httpOnly secure cookie; sent automatically with credentials: 'include'.
 * Silent refresh: scheduled 1 min before access token expiry.
 */

import { API_CONFIG } from '@/constants';
import { sanitizeErrorData } from '@/utils/sanitizeErrorData';

let accessToken = null;
let silentRefreshTimerId = null;

export const getToken = () => accessToken;
export const setToken = (token) => {
  accessToken = token || null;
  if (token) scheduleSilentRefresh();
  else clearSilentRefreshTimer();
};
export const clearToken = () => {
  accessToken = null;
  clearSilentRefreshTimer();
};

/** Clear auth state (in-memory access token only; cookie cleared by server on logout) */
export const clearAuth = () => {
  clearToken();
};

export { connectSocket, disconnectSocket, getSocket, reconnectSocket } from './socket.js';

/**
 * Decode JWT payload client-side without verification. Use ONLY for:
 * - exp (scheduling silent refresh) and optional UI (e.g. "session expires in X").
 * Never use for authorization; server validates tokens on every request.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return null;
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Single in-flight refresh promise so concurrent callers (e.g. Strict Mode double-invoke) share one request and avoid 429. */
let pendingRefreshPromise = null;

/**
 * Internal: POST /auth/refresh (cookie sent). Dedupes concurrent calls. Returns { token, user } or throws.
 */
async function internalRefresh() {
  if (pendingRefreshPromise) return pendingRefreshPromise;
  pendingRefreshPromise = (async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || data.message || res.statusText);
        err.status = res.status;
        err.data = sanitizeErrorData(data);
        throw err;
      }
      if (data.token) setToken(data.token);
      return data;
    } finally {
      pendingRefreshPromise = null;
    }
  })();
  return pendingRefreshPromise;
}

/**
 * Call POST /auth/refresh (cookie sent automatically). Returns new access token or null.
 */
export async function refreshAccessToken() {
  try {
    const data = await internalRefresh();
    return data?.token ?? null;
  } catch {
    return null;
  }
}

const SILENT_REFRESH_BEFORE_MS = 60 * 1000;

/** Schedule a silent refresh 1 min before access token expires; reschedule on new token. */
export function scheduleSilentRefresh() {
  clearSilentRefreshTimer();
  const token = getToken();
  if (!token) return;
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (!exp) return;
  const expiresAtMs = exp * 1000;
  const now = Date.now();
  const delay = Math.max(0, expiresAtMs - now - SILENT_REFRESH_BEFORE_MS);
  silentRefreshTimerId = setTimeout(() => {
    silentRefreshTimerId = null;
    refreshAccessToken();
  }, delay);
}

export function clearSilentRefreshTimer() {
  if (silentRefreshTimerId) {
    clearTimeout(silentRefreshTimerId);
    silentRefreshTimerId = null;
  }
}

/**
 * Fetch with base URL and Bearer token (from memory). credentials: 'include' for cookies.
 * On 401, retries once after refresh; if refresh succeeds, re-issues the request with new token.
 * Enforces API_CONFIG.TIMEOUT via AbortController. Pass options.signal (AbortSignal) for cancellation (e.g. on unmount).
 */
export async function apiRequest(path, options = {}, retried = false) {
  const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeoutMs = options.timeout ?? API_CONFIG.TIMEOUT;
  const controller = options.signal ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const signal = options.signal ?? controller?.signal ?? undefined;

  try {
    const res = await fetch(url, { ...options, headers, credentials: 'include', signal });
    if (timeoutId) clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !retried) {
      const newToken = await refreshAccessToken();
      if (newToken) return apiRequest(path, options, true);
    }

    if (!res.ok) {
      const err = new Error(data.error || data.message || res.statusText);
      err.status = res.status;
      err.data = sanitizeErrorData(data);
      throw err;
    }
    return data;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    
    // Handle network errors with better messages
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      const networkErr = new Error(
        `Network error: Unable to connect to server at ${API_CONFIG.BASE_URL}. ` +
        `Please check if the server is running and CORS is configured correctly.`
      );
      networkErr.name = 'NetworkError';
      networkErr.status = 0;
      networkErr.originalError = err;
      networkErr.url = url;
      throw networkErr;
    }
    
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timeout');
      timeoutErr.status = 408;
      timeoutErr.name = 'AbortError';
      throw timeoutErr;
    }
    
    throw err;
  }
}

/** Auth API */
export const authApi = {
  login: (email, password) =>
    apiRequest(`${API_CONFIG.AUTH_PREFIX}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiRequest(`${API_CONFIG.AUTH_PREFIX}/me`),

  /** POST /auth/refresh – no body; cookie sent automatically. Uses deduped internalRefresh to avoid 429 on mount. */
  refresh: () => internalRefresh(),

  /** POST /auth/logout – no body; cookie sent; server clears cookie and deletes session */
  logout: () =>
    apiRequest(`${API_CONFIG.AUTH_PREFIX}/logout`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  /** POST /auth/logout-all – Bearer required; revokes all sessions, forceLogout to all devices */
  logoutAll: () =>
    apiRequest(`${API_CONFIG.AUTH_PREFIX}/logout-all`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
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

/** Departments API */
export const departmentsApi = {
  list: () => apiRequest('/api/departments'),
};

/** Task boards API – Design and other non-Food departments */
export const taskBoardsApi = {
  list: (params) => {
    const q = new URLSearchParams(params ?? {}).toString();
    return apiRequest(`/api/task-boards${q ? `?${q}` : ''}`);
  },
  getById: (id) => apiRequest(`/api/task-boards/${id}`),
  getOrCreate: (body) =>
    apiRequest('/api/task-boards', { method: 'POST', body: JSON.stringify(body) }),
};

/** Tasks API – Design and other non-Food departments */
export const tasksApi = {
  list: (boardId) => apiRequest(`/api/tasks?boardId=${encodeURIComponent(boardId)}`),
  getById: (id) => apiRequest(`/api/tasks/${id}`),
  create: (body) => apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    apiRequest(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => apiRequest(`/api/tasks/${id}`, { method: 'DELETE' }),
};

/** Order boards API – Food department only (monthly boards, same pattern as task-boards) */
export const orderBoardsApi = {
  list: (params) => {
    const q = new URLSearchParams(params ?? {}).toString();
    return apiRequest(`/api/order-boards${q ? `?${q}` : ''}`);
  },
  getById: (id) => apiRequest(`/api/order-boards/${id}`),
  getOrCreate: (body) =>
    apiRequest('/api/order-boards', { method: 'POST', body: JSON.stringify(body) }),
};

/** Orders API – Food department only */
export const ordersApi = {
  list: (boardId) => apiRequest(`/api/orders?boardId=${encodeURIComponent(boardId)}`),
  getById: (id) => apiRequest(`/api/orders/${id}`),
  create: (body) => apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    apiRequest(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => apiRequest(`/api/orders/${id}`, { method: 'DELETE' }),
};
