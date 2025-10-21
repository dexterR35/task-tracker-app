/**
 * Authentication Provider Component
 * Manages authentication state and listeners for the entire application
 * 
 * @fileoverview Provides authentication context and state management
 * @author Senior Developer
 * @version 2.0.0
 */

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { cleanupAuthListener, setupAuthListener, setAuthTimeout } from "@/features/auth/authSlice";
import { logger } from "@/utils/logger";

/**
 * AuthProvider component that manages authentication state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} - AuthProvider component
 */
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let timeoutId;
    
    try {
      logger.log("Initializing authentication provider");
      
      // Setup auth listener
      setupAuthListener(dispatch);
      setIsInitialized(true);
      
      // Set a timeout to prevent infinite loading (10 seconds)
      timeoutId = setTimeout(() => {
        logger.warn("Authentication check timed out after 10 seconds");
        dispatch(setAuthTimeout());
      }, 10000);
      
      logger.log("Authentication provider initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize authentication provider:", error);
      dispatch(setAuthTimeout());
    }

    // Cleanup on unmount
    return () => {
      try {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        logger.log("Cleaning up authentication provider");
        cleanupAuthListener();
      } catch (error) {
        logger.error("Error during auth cleanup:", error);
      }
    };
  }, [dispatch]);

  return <>{children}</>;
};
