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
import { cleanupAuthListener, setupAuthListener } from "@/features/auth/authSlice";
import { logger } from "@/utils/logger";
import firestoreUsageTracker from "@/utils/firestoreUsageTracker";

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
    try {
      logger.log("Initializing authentication provider");
      
      // Start Firestore usage tracking (with error handling)
      try {
        firestoreUsageTracker.startTracking();
      } catch (error) {
        logger.error('Failed to start Firestore usage tracker:', error);
      }
      
      // Clear any stale session data that might cause conflicts
      const sessionKey = 'task_tracker_auth_session';
      const staleSession = localStorage.getItem(sessionKey);
      if (staleSession) {
        try {
          const sessionData = JSON.parse(staleSession);
          // If session is older than 24 hours, clear it
          if (sessionData.timestamp && Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(sessionKey);
            logger.log("Cleared stale session data");
          }
        } catch (error) {
          // If session data is corrupted, clear it
          localStorage.removeItem(sessionKey);
          logger.log("Cleared corrupted session data");
        }
      }
      
      // Setup auth listener
      setupAuthListener(dispatch);
      setIsInitialized(true);
      
      logger.log("Authentication provider initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize authentication provider:", error);
    }

    // Cleanup on unmount
    return () => {
      try {
        logger.log("Cleaning up authentication provider");
        cleanupAuthListener();
      } catch (error) {
        logger.error("Error during auth cleanup:", error);
      }
    };
  }, [dispatch]);

  return <>{children}</>;
};
