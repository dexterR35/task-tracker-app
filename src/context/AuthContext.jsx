/**
 * Authentication Context (PERN backend)
 * Uses JWT and /api/auth login, me, and client-side logout.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getToken, setToken, clearToken } from '@/app/api';
import { logger } from '@/utils/logger';
import { canAccessRole } from '@/features/utils/authUtils';
import { showLogoutSuccess, showAuthError } from '@/utils/toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [error, setError] = useState(null);

  // On mount: restore session from JWT via /me
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        setIsAuthChecking(true);
        setIsLoading(true);
        setError(null);

        if (!getToken()) {
          if (isMounted) setUser(null);
          return;
        }

        const data = await authApi.me();
        const userData = data?.user;

        if (!isMounted) return;

        if (userData) {
          setUser(userData);
          logger.log('Session restored from token', { userId: userData.id });
        } else {
          setUser(null);
        }
      } catch (err) {
        if (!isMounted) return;
        clearToken();
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
    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const { email, password } = credentials;
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const data = await authApi.login(email, password);

      if (data.token) setToken(data.token);

      const userData = data?.user;
      if (!userData) throw new Error('Login failed - no user returned');

      setUser(userData);
      setIsLoading(false);

      return { success: true };
    } catch (err) {
      logger.error('Login error:', err);
      setError(err.message || 'Login failed');
      setIsLoading(false);
      const msg = err?.data?.error || err?.message || 'Login failed';
      showAuthError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setError(null);
    if (window._loggedUser) delete window._loggedUser;
    showLogoutSuccess();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const canAccess = useCallback((requiredRole) => {
    if (requiredRole === 'authenticated') return !!user;
    return canAccessRole(user, requiredRole);
  }, [user]);

  const isReady = useCallback(() => !isAuthChecking && !isLoading, [isAuthChecking, isLoading]);

  const value = {
    user,
    isLoading,
    isAuthChecking,
    error,
    canAccess,
    login,
    logout,
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
