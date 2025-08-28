// src/shared/context/AuthProvider.jsx

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { cleanupAuthListener, setupAuthListener } from "../../features/auth/authSlice";
import { useLoadingState } from "../hooks/useLoadingState";
import Loader from "../components/ui/Loader";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthLoading } = useLoadingState();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if we're on a public route that doesn't need auth
  const isPublicRoute = () => {
    const path = location.pathname;
    return path === '/' || path === '/login' || path === '/unauthorized';
  };

  useEffect(() => {
    // Only setup auth listener if not on a public route
    if (!isPublicRoute()) {
      // Setup persistent auth listener on mount
      setupAuthListener(dispatch);
    }
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      if (!isPublicRoute()) {
        cleanupAuthListener();
      }
    };
  }, [dispatch, location.pathname]);

  // For public routes, don't show loading state and don't initialize auth
  if (isPublicRoute()) {
    return children;
  }

  // Show loading while auth is being initialized or checked
  if (!isInitialized || isAuthLoading) {
    return (
      <Loader 
        size="xl" 
        text="Initializing..." 
        variant="spinner" 
        fullScreen={true}
      />
    );
  }

  return children;
};
