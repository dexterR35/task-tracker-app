import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const AuthProvider = ({ children }) => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return children;
};
