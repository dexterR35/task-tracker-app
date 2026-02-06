/**
 * Authentication Context (PERN backend)
 * React state and side effects only: who's logged in, login/logout, refresh, Socket.IO.
 * Access token: in memory (JWT). Refresh: httpOnly cookie. Session restore via POST /auth/refresh.
 * RBAC: use authUtils (isAdmin, canAccess, canManageUsers) with user from useAuth().
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi, setToken, clearAuth, connectSocket, disconnectSocket, reconnectSocket, clearSilentRefreshTimer, refreshAccessToken } from '@/app/api';
import { logger } from '@/utils/logger';
import { showLogoutSuccess, showAuthError } from '@/utils/toast';
import { canAccess as canAccessUser } from '@/utils/authUtils';
import { API_CONFIG } from '@/constants';
import { checkApiHealth, getApiDiagnostics } from '@/utils/apiHealthCheck';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(async () => {
    clearSilentRefreshTimer();
    disconnectSocket(); // disconnect before API call so we don't receive server's forceLogout and show toast twice
    try {
      await authApi.logout();
    } catch (_) { /* ignore */ }
    clearAuth();
    setUser(null);
    setError(null);
    showLogoutSuccess();
  }, []);

  const logoutAll = useCallback(async () => {
    clearSilentRefreshTimer();
    disconnectSocket(); // disconnect before API call so we don't receive server's forceLogout and show toast twice
    try {
      await authApi.logoutAll();
    } catch (_) { /* ignore */ }
    clearAuth();
    setUser(null);
    setError(null);
    showLogoutSuccess();
  }, []);

  // On mount: restore session via POST /auth/refresh (cookie sent automatically)
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        setIsAuthChecking(true);
        setIsLoading(true);
        setError(null);

        const data = await authApi.refresh();
        const userData = data?.user;

        if (!isMounted) return;

        if (userData && data?.token) {
          setToken(data.token);
          setUser(userData);
          logger.debug('Session restored from refresh token', { userId: userData.id });
        } else {
          setUser(null);
        }
      } catch (err) {
        if (!isMounted) return;
        clearAuth();
        setUser(null);
        setError(null);
        logger.log('No valid session');
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthChecking(false);
        }
      }
    };

    checkSession();
    return () => {
      isMounted = false;
      clearSilentRefreshTimer();
    };
  }, []);

  // Socket.IO: connect with JWT when user is set; listen for forceLogout and auth:expired (refresh + reconnect)
  // useRef avoids circular dependency (handleAuthExpired passing itself to reconnectSocket)
  const onAuthExpiredRef = useRef(null);
  onAuthExpiredRef.current = async () => {
    try {
      const token = await refreshAccessToken();
      if (token) reconnectSocket({ onForceLogout: logout, onAuthExpired: () => onAuthExpiredRef.current?.() });
      else logout();
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }
    connectSocket({ onForceLogout: logout, onAuthExpired: () => onAuthExpiredRef.current?.() });
    return () => disconnectSocket();
  }, [user, logout]);

  const login = useCallback(async (credentials) => {
    let userData = null;
    try {
      setIsLoading(true);
      setError(null);

      const { email, password } = credentials;
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      try {
        const data = await authApi.login(email, password);

        if (data.token) setToken(data.token);

        userData = data?.user;
        if (!userData) throw new Error('Login failed - no user returned');

        setUser(userData);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        // Provide better error messages for network issues
        if (error.name === 'NetworkError' || error.message?.includes('Failed to fetch')) {
          const diagnostics = getApiDiagnostics();
          logger.error('[Auth] Network error during login', {
            error: error.message,
            url: error.url,
            diagnostics,
          });

          // Try to check server health for better diagnostics
          const healthCheck = await checkApiHealth().catch(() => ({ ok: false, message: 'Health check failed' }));
          
          const errorMessage = healthCheck.ok
            ? `Network error: ${error.message}. Server is reachable but login request failed.`
            : `Cannot connect to server at ${API_CONFIG.BASE_URL}.\n\n` +
              `Diagnostics:\n` +
              `- Server URL: ${diagnostics.baseUrl}\n` +
              `- Environment: ${diagnostics.envVar}\n` +
              `- Health check: ${healthCheck.message}\n\n` +
              `Please check:\n` +
              `1. Server is running (cd server && npm run dev)\n` +
              `2. Server is listening on port 5000\n` +
              `3. CORS is configured correctly\n` +
              `4. Network connectivity`;

          throw new Error(errorMessage);
        }
        throw error;
      }

      return { success: true, user: userData };
    } catch (err) {
      logger.error('Login error:', err);
      setError(err.message || 'Login failed');
      setIsLoading(false);
      const msg = err?.data?.error || err?.message || 'Login failed';
      showAuthError(msg);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const canAccess = useCallback((requiredRole) => canAccessUser(user, requiredRole), [user]);

  const isReady = !isAuthChecking && !isLoading;

  const value = {
    user,
    isLoading,
    isAuthChecking,
    error,
    canAccess,
    login,
    logout,
    logoutAll,
    clearError,
    isReady,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
