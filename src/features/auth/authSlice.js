import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
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

// --- Configuration & Constants ---
const VALID_ROLES = AUTH.VALID_ROLES;

// --- Internal State Management ---
let authUnsubscribe = null;

// Session management to ensure only one auth per user per browser
const SESSION_KEY = 'task_tracker_auth_session';
// Session timeout removed - sessions persist until explicit logout
let isSessionActive = false;

/**
 * Session management utilities
 */
const SessionManager = {
  /**
   * Get current session data
   * @returns {Object|null} - Session data or null
   */
  getSession: () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Failed to get session data:', error);
      return null;
    }
  },

  /**
   * Set session data
   * @param {Object} sessionData - Session data to store
   */
  setSession: (sessionData) => {
    try {
      const session = {
        ...sessionData,
        timestamp: Date.now(),
        sessionId: sessionData.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      isSessionActive = true;
      logger.log('Session data stored', { sessionId: session.sessionId });
    } catch (error) {
      logger.error('Failed to set session data:', error);
    }
  },

  /**
   * Clear session data
   */
  clearSession: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      isSessionActive = false;
      // Session timeout removed - no cleanup needed
      logger.log('Session data cleared');
    } catch (error) {
      logger.error('Failed to clear session data:', error);
    }
  },

  /**
   * Check if session is valid (no timeout - sessions persist until logout)
   * @returns {boolean} - True if session exists
   */
  isSessionValid: () => {
    const session = SessionManager.getSession();
    return !!session; // Session is valid if it exists (no timeout check)
  },

  /**
   * Session timeout removed - sessions persist until explicit logout
   */

  /**
   * Check for session conflicts (passive - just log, don't force logout)
   * @returns {boolean} - True if session conflict detected
   */
  checkSessionConflict: () => {
    const session = SessionManager.getSession();
    if (!session) return false;
    
    // Check if another tab has a different session (passive check)
    const currentUser = auth.currentUser;
    if (currentUser && session.uid !== currentUser.uid) {
      logger.log('Session conflict detected - different user in different tab (passive)');
      return true;
    }
    
    return false;
  },


  /**
   * Initialize browser tab synchronization
   */
  initTabSync: () => {
    // Simple tab synchronization without activity tracking
    // 2-hour fixed session is sufficient for most use cases
    logger.log('Tab synchronization initialized - using 2-hour fixed session');

    // Listen for storage changes (other tabs) - passive sync only
    window.addEventListener('storage', (e) => {
      if (e.key === SESSION_KEY) {
        if (e.newValue === null) {
          // Session was cleared in another tab - just log, don't force logout
          logger.log('Session cleared in another tab (passive sync)');
        } else if (e.newValue) {
          // New session in another tab - just log, don't force logout
          try {
            const newSession = JSON.parse(e.newValue);
            const currentUser = auth.currentUser;
            
            if (currentUser && newSession.uid !== currentUser.uid) {
              logger.log('Different user logged in another tab (passive sync)');
            }
          } catch (error) {
            logger.error('Error parsing session data from storage:', error);
          }
        }
      }
    });

    // Page visibility changes - removed aggressive session checking
    // Firebase auth persistence handles session management automatically

    logger.log('Tab synchronization initialized');
  }
};

/**
 * Get current user info from Firebase Auth (basic info only)
 * @param {Object} authState - Authentication state (optional)
 * @returns {Object|null} - Current user info or null
 */
export const getCurrentUserInfo = (authState) => {
  if (!auth.currentUser) {
    logger.warn('[getCurrentUserInfo] No current user found');
    return null;
  }
  
  const userInfo = {
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    name: auth.currentUser.displayName || auth.currentUser.email
  };
  
  // Session-based logging to avoid spam
  if (!window._loggedUser || window._loggedUser !== userInfo.uid) {
    window._loggedUser = userInfo.uid;
  }
  
  return userInfo;
};

/**
 * Validates user data for API operations
 * @param {Object} userData - User data to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.requireUID - Whether UID is required
 * @param {boolean} options.requireEmail - Whether email is required
 * @param {boolean} options.requireName - Whether name is required
 * @param {boolean} options.requireRole - Whether role is required
 * @param {boolean} options.logWarnings - Whether to log warnings
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validateUserForAPI = (userData, options = {}) => {
  const { 
    requireUID = true, 
    requireEmail = false, 
    requireName = false, 
    requireRole = false,
    logWarnings = true 
  } = options;

  if (!userData) {
    const error = "User data not provided";
    if (logWarnings) {
      logger.warn(`[validateUserForAPI] ${error}`);
    }
    return { isValid: false, errors: [error] };
  }

  const errors = [];
  
  if (requireUID && !userData.userUID && !userData.uid) {
    errors.push("User data missing userUID");
  }
  
  if (requireEmail && !userData.email) {
    errors.push("User data missing email");
  }
  
  if (requireName && !userData.name) {
    errors.push("User data missing name");
  }
  
  if (requireRole && !userData.role) {
    errors.push("User data missing role");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Normalizes user data from Firebase Auth and Firestore
 * @param {Object} firebaseUser - Firebase Auth user object
 * @param {Object} firestoreData - Firestore user data
 * @returns {Object} - Normalized user object
 * @throws {Error} - If user role is invalid
 */
const normalizeUser = (firebaseUser, firestoreData) => {
  if (!firestoreData?.role || !VALID_ROLES.includes(firestoreData.role)) {
    throw new Error("Invalid or undefined user role");
  }
  
  // Convert Firestore timestamp to milliseconds for consistent comparison
  const createdAtMs = firestoreData.createdAt
    ? typeof firestoreData.createdAt.toDate === "function"
      ? firestoreData.createdAt.toDate().getTime()
      : typeof firestoreData.createdAt === "number"
        ? firestoreData.createdAt
        : new Date(firestoreData.createdAt).getTime()
    : null;
  
  // Create a stable user object with consistent property order
  return {
    uid: firebaseUser.uid,
    userUID: firebaseUser.uid, // Add userUID for consistency
    email: firebaseUser.email,
    name: firestoreData.name || "",
    role: firestoreData.role,
    occupation: firestoreData.occupation || "user",
    permissions: firestoreData.permissions || [], // Include permissions array
    createdAt: createdAtMs,
    isActive: firestoreData.isActive !== false, // Default to true if not specified
  };
};

/**
 * Cleans up the auth state listener and session
 * @returns {void}
 */
export const cleanupAuthListener = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
    logger.log("Auth listener cleaned up");
  }
  
  // Clear session data on cleanup
  SessionManager.clearSession();
};

/**
 * Sets up persistent auth state listener with session management
 * @param {Function} dispatch - Redux dispatch function
 * @returns {void}
 */
export const setupAuthListener = (dispatch) => {
  if (authUnsubscribe) {
    logger.log("Auth listener already set up");
    return;
  }

  // Initialize tab synchronization
  SessionManager.initTabSync();

  // Check for existing session conflicts
  if (SessionManager.checkSessionConflict()) {
    logger.warn("Session conflict detected, clearing existing session");
    SessionManager.clearSession();
  }

  // Set initial auth checking state only if needed
  // dispatch(authSlice.actions.startAuthInit()); // Commented out to prevent initial loader

  // Use the listener manager to preserve auth listener during app suspension
  authUnsubscribe = listenerManager.addListener(
    'auth-state-listener',
    () => onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          try {
            // Check if user is already authenticated to prevent duplicate fetching
            const existingSession = SessionManager.getSession();
            if (existingSession && existingSession.uid === user.uid) {
              logger.log("User already authenticated, skipping duplicate fetch");
              return;
            }

            // Check for session conflicts before proceeding
            if (SessionManager.checkSessionConflict()) {
              logger.warn("Session conflict detected during auth, signing out");
              await signOut(auth);
              return;
            }

            logger.log("User authenticated, fetching user data");
            
            // Get user data from Firestore (has all the data we need)
            const firestoreData = await fetchUserByUIDFromFirestore(user.uid);
            
            if (!firestoreData) {
              throw new Error("Failed to fetch user data from Firestore");
            }

            // Check if user is active
            if (firestoreData.isActive === false) {
              throw new Error(
                "Account is deactivated. Please contact administrator."
              );
            }

            const normalizedUser = normalizeUser(user, firestoreData);

            // Store session data (only if not already stored)
            const currentSession = SessionManager.getSession();
            if (!currentSession || currentSession.uid !== normalizedUser.uid) {
              SessionManager.setSession({
                uid: normalizedUser.uid,
                email: normalizedUser.email,
                role: normalizedUser.role,
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              });
            }

            // Session timeout removed - sessions persist until explicit logout

            // Dispatch auth success action
            dispatch(
              authSlice.actions.authStateChanged({ user: normalizedUser })
            );
            
            logger.log("User authentication successful", {
              uid: normalizedUser.uid,
              role: normalizedUser.role,
              isActive: normalizedUser.isActive
            });
          } catch (error) {
            logger.error("Error fetching user data:", error);
            SessionManager.clearSession();
            dispatch(
              authSlice.actions.authStateChanged({
                user: null,
                error: error.message,
              })
            );
          }
        } else {
          // User signed out - clean up listeners and clear user
          logger.log("User signed out, cleaning up listeners");
          SessionManager.clearSession();
          listenerManager.removeAllListeners();
          dispatch(authSlice.actions.authStateChanged({ user: null }));
        }
      },
      (error) => {
        logger.error("Auth state change error:", error);
        SessionManager.clearSession();
        dispatch(
          authSlice.actions.authStateChanged({ user: null, error: error.message })
        );
      }
    ),
    true // Preserve this listener during app suspension
  );
  
  logger.log("Auth listener set up successfully");
};

// --- Async Thunks ---

/**
 * Login user with email and password with session management
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {Object} thunkAPI - Redux thunk API
 * @returns {Promise<Object>} - Login result
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Check for existing session conflicts
      if (SessionManager.checkSessionConflict()) {
        logger.warn("Session conflict detected during login attempt");
        return rejectWithValue("Another user is already logged in. Please refresh the page.");
      }

      // Check if session is still valid
      if (SessionManager.isSessionValid()) {
        const session = SessionManager.getSession();
        if (session.email === email) {
          logger.log("Valid session exists for user", { email });
          return { success: true, sessionExists: true };
        } else {
          logger.warn("Session conflict: different user in session");
          SessionManager.clearSession();
        }
      }

      logger.log("Attempting user login", { email });
      
      // Authenticate with Firebase - onAuthStateChanged will handle user state
      // This makes onAuthStateChanged the single source of truth for user state
      await signInWithEmailAndPassword(auth, email, password);
      
      logger.log("Login successful", { email });
      return { success: true };
    } catch (error) {
      logger.error("Login error:", error);

      // Handle specific Firebase auth errors with user-friendly messages
      const errorMessages = {
        "auth/user-not-found": "No account found with this email address.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/too-many-requests": "Too many failed attempts. Please try again later.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/invalid-email": "Invalid email address format.",
        "auth/missing-email": "Email address is required.",
        "auth/invalid-credential": "Invalid credentials. Please check your email and password.",
        "auth/network-request-failed": "Network error. Please check your connection."
      };

      const userMessage = errorMessages[error.code] || 
        error.message || 
        "Login failed. Please try again.";

      return rejectWithValue(userMessage);
    }
  }
);

/**
 * Logout user and clean up resources with session management
 * @param {void} _ - No parameters needed
 * @param {Object} thunkAPI - Redux thunk API
 * @returns {Promise<null>} - Logout result
 */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      logger.log("Attempting user logout");
      
      // Clear session data first
      SessionManager.clearSession();
      
      // Clean up all Firebase listeners before logout
      listenerManager.removeAllListeners();
      
      // Sign out from Firebase
      await signOut(auth);
      
      logger.log("Logout successful");
      return null;
    } catch (error) {
      logger.error("Logout error:", error);
      // Clear session even if logout fails
      SessionManager.clearSession();
      return rejectWithValue(error.message || "Logout failed. Please try again.");
    }
  }
);

// --- Slice ---
const initialState = {
  user: null,
  isLoading: false, // Only true during login/logout attempts
  isAuthChecking: false, // Start as false to prevent initial loader flash
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    authStateChanged: (state, action) => {
      const { user, error } = action.payload;
      
      // onAuthStateChanged only fires when user actually changes
      // Immer handles efficient state updates automatically
      state.user = user;
      state.isLoading = false;
      state.isAuthChecking = false;
      state.error = error || null;
    },
    // Add a new action to start auth initialization
    startAuthInit: (state) => {
      state.isLoading = true;
      state.isAuthChecking = true; // Mark that we're checking auth
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        // Keep loading true until onAuthStateChanged updates the user
        // Don't set isLoading = false here - let authStateChanged handle it
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
      })

      // Logout - simplified since auth listener handles everything
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Auth listener will handle the state update
        state.isLoading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setLoading, authStateChanged, startAuthInit } =
  authSlice.actions;

// Export session management functions
export const getSessionData = () => SessionManager.getSession();
export const isSessionValid = () => SessionManager.isSessionValid();
export const clearSession = () => SessionManager.clearSession();

/**
 * Handle session expiry gracefully
 * @param {Function} dispatch - Redux dispatch function
 */
export const handleSessionExpiry = (dispatch) => {
  logger.warn('Session expired, redirecting to login');
  
  // Clear session data
  SessionManager.clearSession();
  
  // Clear all listeners
  listenerManager.removeAllListeners();
  
  // Dispatch auth state change to clear user
  dispatch(authSlice.actions.authStateChanged({ 
    user: null, 
    error: 'Your session has expired. Please log in again.' 
  }));
  
  // You can add navigation to login page here if needed
  // navigate('/login');
};

// --- Selectors ---
export const selectUser = (state) => state.auth.user;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsAuthChecking = (state) => state.auth.isAuthChecking;
export const selectAuthError = (state) => state.auth.error;

export const selectIsUserActive = (state) =>
  state.auth.user?.isActive !== false;

// Combined selector for the entire auth state
export const selectAuthState = createSelector(
  [
    selectUser,
    selectIsLoading,
    selectIsAuthChecking,
    selectAuthError,
    selectIsUserActive,
  ],
  (
    user,
    isLoading,
    isAuthChecking,
    error,
    isUserActive,
  ) => ({
    user,
    isLoading,
    isAuthChecking,
    error,
    isUserActive,
  })
);

export default authSlice.reducer;
