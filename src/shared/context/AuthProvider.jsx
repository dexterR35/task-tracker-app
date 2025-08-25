// src/features/auth/AuthProvider.jsx

import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { cleanupAuthListener, setupAuthListener } from "../../features/auth/authSlice";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Setup persistent auth listener on mount
    setupAuthListener(dispatch);

    // Cleanup on unmount
    return () => {
      cleanupAuthListener();
    };
  }, [dispatch]);

  // GlobalLoader handles all loading states
  return children;
};
