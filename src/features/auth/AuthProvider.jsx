// src/features/auth/AuthProvider.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initAuthListener, unsubscribeAuthListener } from './authSlice';

// A soft skeleton to prevent flicker
const SimpleLoader = () => (
  <div className="min-h-screen p-8">
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-56 skeleton rounded" />
      <div className="h-5 w-72 skeleton rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="h-24 skeleton rounded" />
        <div className="h-24 skeleton rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-32 skeleton rounded" />
        <div className="h-32 skeleton rounded" />
        <div className="h-32 skeleton rounded" />
      </div>
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