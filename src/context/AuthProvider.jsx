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

  // Show loading while initializing auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex-center bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
