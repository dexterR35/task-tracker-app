// src/shared/context/AuthProvider.jsx

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { cleanupAuthListener, setupAuthListener } from "../../features/auth/authSlice";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {

    setupAuthListener(dispatch);
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      cleanupAuthListener();
    };
  }, [dispatch]);

  // Always render children - loading is handled by individual components
  return <>{children}</>;
};
