import React, { useEffect, useState, useContext, createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, role, isAuthenticated, loading } = useSelector((state) => state.auth);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentUser()).finally(() => setInitialized(true));
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
