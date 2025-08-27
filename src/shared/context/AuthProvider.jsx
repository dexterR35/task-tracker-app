// src/shared/context/AuthProvider.jsx

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { cleanupAuthListener, setupAuthListener, selectIsAuthChecking } from "../../features/auth/authSlice";
import { cleanupTokenRefresh } from "../../app/firebase";
import Loader from "../components/ui/Loader";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Setup persistent auth listener on mount
    setupAuthListener(dispatch);
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      cleanupAuthListener();
      cleanupTokenRefresh();
    };
  }, [dispatch]);

  // Show loading while auth is being checked
  if (!isInitialized || isAuthChecking) {
    return (
      <Loader 
        size="xl" 
        text="Restoring session..." 
        variant="spinner" 
        fullScreen={true}
      />
    );
  }

  return children;
};
