/**
 * Socket.IO client – JWT auth only (no refresh token).
 * Listens for forceLogout, auth:expired (server says token expired; client can refresh and reconnect), and auth:error.
 */

import { io } from 'socket.io-client';
import { API_CONFIG } from '@/constants';
import { getToken } from './api';

let socketInstance = null;

/**
 * Connect with current JWT. Call when user is logged in.
 * @param {Object} opts
 * @param { ()=>void } opts.onForceLogout - called when server emits forceLogout or auth indicates logout
 * @param { (payload: { userId, email, code })=>void | Promise<void> } [opts.onAuthExpired] - when server emits auth:expired (e.g. refresh token then reconnectSocket()); if omitted, onForceLogout is called
 */
export function connectSocket({ onForceLogout, onAuthExpired } = {}) {
  if (socketInstance?.connected) return socketInstance;
  const token = getToken();
  if (!token) return null;

  socketInstance = io(API_CONFIG.BASE_URL, {
    auth: { token },
    withCredentials: true,
  });

  socketInstance.on('forceLogout', () => {
    onForceLogout?.();
  });

  socketInstance.on('auth:expired', (payload = {}) => {
    if (onAuthExpired) {
      onAuthExpired(payload);
    } else {
      onForceLogout?.();
    }
  });

  socketInstance.on('auth:error', ({ event, error, code } = {}) => {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Socket Auth Error]', event, error, code);
    }
    if (code === 'TOKEN_EXPIRED') {
      onForceLogout?.();
    }
  });

  socketInstance.on('connect_error', (err) => {
    const msg = err?.message || '';
    const code = err?.code;
    if (msg.includes('Token expired') || msg.includes('TOKEN_EXPIRED') || code === 'TOKEN_EXPIRED') {
      onForceLogout?.();
    }
  });

  return socketInstance;
}

/**
 * Reconnect socket with current token. Call after token refresh to re-authenticate with new JWT.
 */
export function reconnectSocket(opts = {}) {
  disconnectSocket();
  return connectSocket(opts);
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function getSocket() {
  return socketInstance;
}
