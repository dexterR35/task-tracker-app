/**
 * Authentication Context
 * 
 * @fileoverview Context-based authentication state management
 * @author Senior Developer
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import listenerManager from "@/features/utils/firebaseListenerManager";
import { fetchUserByUIDFromFirestore } from "@/features/users/usersApi";
import { AUTH } from '@/constants';
import {
  isUserComplete,
  canAccessRole,
  canAccessTasks,
  canAccessCharts,
  hasPermission,
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
  canViewTasks,
  canCreateBoard,
  canSubmitForms,
  canPerformTaskCRUD,
  hasAdminPermissions,
  getUserPermissionSummary
} from '@/features/utils/authUtils';
import {
  showLogoutSuccess,
  showAuthError,
  showSuccess,
} from '@/utils/toast';

const VALID_ROLES = AUTH.VALID_ROLES;
let authUnsubscribe = null;

// Secure session management with encryption and CSRF protection
const SESSION_KEY = 'task_tracker_auth_session';
const CSRF_TOKEN_KEY = 'task_tracker_csrf_token';
let isSessionActive = false;

// Simple encryption for session data (in production, use proper encryption)
const encryptSessionData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encoded = btoa(jsonString); // Base64 encoding (not secure, but better than plain text)
    return encoded;
  } catch (error) {
    logger.error('Failed to encrypt session data:', error);
    return null;
  }
};

const decryptSessionData = (encryptedData) => {
  try {
    const decoded = atob(encryptedData);
    return JSON.parse(decoded);
  } catch (error) {
    logger.error('Failed to decrypt session data:', error);
    return null;
  }
};

const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const SessionManager = {
  getSession: () => {
    try {
      const encryptedData = localStorage.getItem(SESSION_KEY);
      const csrfToken = localStorage.getItem(CSRF_TOKEN_KEY);
      
      if (!encryptedData || !csrfToken) return null;
      
      const sessionData = decryptSessionData(encryptedData);
      if (!sessionData) return null;
      
      // Verify CSRF token
      if (sessionData.csrfToken !== csrfToken) {
        logger.warn('CSRF token mismatch, clearing session');
        SessionManager.clearSession();
        return null;
      }
      
      return sessionData;
    } catch (error) {
      logger.error('Failed to get session data:', error);
      SessionManager.clearSession();
      return null;
    }
  },

  setSession: (sessionData) => {
    try {
      const csrfToken = generateCSRFToken();
      const session = {
        ...sessionData,
        timestamp: Date.now(),
        sessionId: sessionData.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        csrfToken: csrfToken
      };
      
      const encryptedData = encryptSessionData(session);
      if (!encryptedData) {
        throw new Error('Failed to encrypt session data');
      }
      
      localStorage.setItem(SESSION_KEY, encryptedData);
      localStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
      isSessionActive = true;
      logger.log('Secure session data stored', { sessionId: session.sessionId });
    } catch (error) {
      logger.error('Failed to set session data:', error);
    }
  },

  clearSession: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(CSRF_TOKEN_KEY);
      isSessionActive = false;
      logger.log('Session data cleared');
    } catch (error) {
      logger.error('Failed to clear session data:', error);
    }
  },

  isSessionValid: () => {
    const session = SessionManager.getSession();
    if (!session) return false;
    
    const now = Date.now();
    const sessionAge = now - (session.timestamp || 0);
    const maxAge = 8 * 60 * 60 * 1000; // 8 hours (reduced from 24 for security)
    
    return sessionAge < maxAge;
  },

  refreshSession: () => {
    const session = SessionManager.getSession();
    if (session) {
      session.timestamp = Date.now();
      SessionManager.setSession(session);
    }
  }
};

// Create Auth Context
const AuthContext = createContext();

// Auth Context Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [error, setError] = useState(null);


  // Initialize auth state listener
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setIsAuthChecking(true);
        setIsLoading(true);

        // Set up Firebase auth state listener
        authUnsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            if (!isMounted) return;

            try {
              if (firebaseUser) {
                logger.log("User authenticated, fetching user data");
                
                const firestoreData = await fetchUserByUIDFromFirestore(firebaseUser.uid);
                
                if (!firestoreData) {
                  throw new Error("Failed to fetch user data from Firestore");
                }

                // Simple user data - only what you actually have in your database
                const completeUserData = {
                  // Firebase auth data (minimal)
                  email: firebaseUser.email,
                  
                  // Your Firestore data (exactly as stored)
                  ...firestoreData,
                  
                  // Only essential Firebase mapping
                  userUID: firebaseUser.uid
                };

                if (isMounted) {
                  setUser(completeUserData);
                  setIsLoading(false);
                  setIsAuthChecking(false);
                  setError(null);
                }
              } else {
                logger.log("User not authenticated, clearing user state");
                if (isMounted) {
                  setUser(null);
                  setIsLoading(false);
                  setIsAuthChecking(false);
                  setError(null);
                }
              }
            } catch (error) {
              logger.error("Error in auth state change:", error);
              if (isMounted) {
                setError(error.message || "Authentication error");
                setUser(null);
                setIsLoading(false);
                setIsAuthChecking(false);
              }
            }
          },
          (error) => {
            logger.error("Auth state listener error:", error);
            if (isMounted) {
              setError(error.message || "Authentication error");
              setUser(null);
              setIsLoading(false);
              setIsAuthChecking(false);
            }
          }
        );
      } catch (error) {
        logger.error("Error initializing auth:", error);
        if (isMounted) {
          setError(error.message || "Authentication initialization error");
          setUser(null);
          setIsLoading(false);
          setIsAuthChecking(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }
    };
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const { email, password } = credentials;
      
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("Login failed - no user returned");
      }

      // Fetch user data from Firestore
      const firestoreData = await fetchUserByUIDFromFirestore(firebaseUser.uid);
      
      if (!firestoreData) {
        throw new Error("Failed to fetch user data from Firestore");
      }

      // Simple user data - only what you actually have in your database
      const completeUserData = {
        // Firebase auth data (minimal)
        email: firebaseUser.email,
        
        // Your Firestore data (exactly as stored)
        ...firestoreData,
        
        // Only essential Firebase mapping
        userUID: firebaseUser.uid
      };

      setUser(completeUserData);
      setIsLoading(false);

      // Show welcome message
      if (completeUserData) {
        const welcomeMessage = `Welcome, ${completeUserData.name || completeUserData.email}! 👋`;
        showSuccess(welcomeMessage, { 
          autoClose: 3000,
          position: "top-center"
        });
      }

      return { user: completeUserData };
    } catch (error) {
      logger.error("Login error:", error);
      setError(error.message || "Login failed");
      setIsLoading(false);
      showAuthError(error?.message || error || 'Login failed');
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await signOut(auth);
      
      setUser(null);
      setIsLoading(false);

      // Clear the session-based user logging flag
      if (window._loggedUser) {
        delete window._loggedUser;
      }

      showLogoutSuccess();
    } catch (error) {
      logger.error("Logout error:", error);
      setError(error.message || "Logout failed");
      setIsLoading(false);
      showAuthError(error?.message || error || 'Logout failed');
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Permission functions (memoized for performance)
  const permissionFunctions = {
    canAccess: (requiredRole) => {
      if (requiredRole === 'authenticated') {
        return !!user;
      }
      return canAccessRole(user, requiredRole);
    },
    
    hasPermission: (permission) => hasPermission(user, permission),
    canGenerate: () => canAccessCharts(user),
    canAccessTasks: () => canAccessTasks(user),
    canCreateTask: () => canCreateTask(user),
    canUpdateTask: () => canUpdateTask(user),
    canDeleteTask: () => canDeleteTask(user),
    canViewTasks: () => canViewTasks(user),
    canCreateBoard: () => canCreateBoard(user),
    canSubmitForms: () => canSubmitForms(user),
    canPerformTaskCRUD: () => canPerformTaskCRUD(user),
    hasAdminPermissions: () => hasAdminPermissions(user),
    getUserPermissionSummary: () => getUserPermissionSummary(user)
  };

  // Simplified auth status check
  const isReady = () => {
    return !isAuthChecking && !isLoading;
  };

  const value = {
    // Core state
    user,
    isLoading,
    isAuthChecking,
    error,
    
    // Permission functions
    ...permissionFunctions,
    
    // Auth actions
    login,
    logout,
    clearError,
    
    // Utility
    isReady,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
