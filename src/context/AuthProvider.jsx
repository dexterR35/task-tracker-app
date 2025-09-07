// src/shared/context/AuthProvider.jsx

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { cleanupAuthListener, setupAuthListener } from "@/features/auth";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Setup auth listener
    setupAuthListener(dispatch);
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      cleanupAuthListener();
    };
  }, [dispatch]);

  return <>{children}</>;
};
