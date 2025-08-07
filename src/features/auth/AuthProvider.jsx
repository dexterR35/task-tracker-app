// src/features/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './authSlice';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, role, isAuthenticated, loading, error } = useSelector(state => state.auth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const promise = dispatch(fetchCurrentUser());

    promise
      .unwrap()
      .catch(() => {}) // Ignore errors here, handled in slice
      .finally(() => setInitialized(true));
  }, [dispatch]);

  const value = useMemo(() => ({
    user,
    role,
    isAuthenticated,
    loading: loading || !initialized,
    error,
    initialized,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    isGuest: role === 'guest',
  }), [user, role, isAuthenticated, loading, error, initialized]);

  if (loading || !initialized) {
    return <div>Loading authentication...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
