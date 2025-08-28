// src/shared/context/AuthProvider.jsx

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { cleanupAuthListener, setupAuthListener } from "../../features/auth/authSlice";
import { useLoadingState } from "../hooks/useLoadingState";
import Loader from "../components/ui/Loader";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthLoading } = useLoadingState();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Always setup auth listener for all routes to ensure consistent auth state
    // This prevents issues where auth state is not available on public routes
    setupAuthListener(dispatch);
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      cleanupAuthListener();
    };
  }, [dispatch]);

  // Always render children, but show loading overlay when needed
  return (
    <>
      {(!isInitialized || isAuthLoading) && (
        <Loader 
          size="xl" 
          text="Initializing..." 
          variant="spinner" 
          fullScreen={true}
        />
      )}
      {children}
    </>
  );
};
