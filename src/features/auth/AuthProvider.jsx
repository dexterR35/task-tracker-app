// src/features/auth/AuthProvider.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initAuthListener, unsubscribeAuthListener } from './authSlice';

// A simple full-screen loader to prevent flicker
const SimpleLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-16 w-16 relative">
      <div className="absolute inset-0 rounded-full border-8 border-blue-200" />
      <div className="absolute inset-0 rounded-full border-8 border-blue-600 border-t-transparent animate-spin" />
    </div>
  </div>
);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  // Get the single source of truth for the app's ready state
  const { initialAuthResolved } = useSelector((state) => state.auth);

  useEffect(() => {
    // Start the persistent auth listener on mount
    dispatch(initAuthListener());
    
    // Clean up the listener on unmount to prevent memory leaks
    return () => {
      unsubscribeAuthListener();
    };
  }, [dispatch]);

  // If auth state hasn't been resolved, show the loader
  if (!initialAuthResolved) {
    return <SimpleLoader />;
  }

  // Once resolved, render the rest of the app
  return children;
};