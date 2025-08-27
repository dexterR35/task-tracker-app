// src/shared/context/AuthProvider.jsx

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { cleanupAuthListener, setupAuthListener } from "../../features/auth/authSlice";
import { useLoadingState } from "../hooks/useLoadingState";
import Loader from "../components/ui/Loader";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthLoading } = useLoadingState();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Setup persistent auth listener on mount
    setupAuthListener(dispatch);
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      cleanupAuthListener();
    };
  }, [dispatch]);

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
