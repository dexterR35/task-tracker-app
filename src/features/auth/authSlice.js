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
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import listenerManager from "@/features/utils/firebaseListenerManager";
import { fetchUserByUIDFromFirestore } from "@/features/users/usersApi";

// --- Configuration & Constants ---
const VALID_ROLES = ["admin", "user"];

// --- Internal Utilities ---
let authUnsubscribe = null;

// REMOVED: fetchUserFromFirestore moved to usersApi.js
// Use fetchUserByUIDFromFirestore from @/features/users/usersApi instead

/**
 * Get current user info from Firebase Auth (basic info only)
 * @param {Object} authState - Authentication state (optional)
 * @returns {Object} - Current user info or null
 */
export const getCurrentUserInfo = (authState) => {
  // Check if user is authenticated
  if (!auth.currentUser) {
    logger.warn('[getCurrentUserInfo] No current user found');
    return null;
  }
  
  const userInfo = {
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    name: auth.currentUser.displayName || auth.currentUser.email
  };
  
  // Only log once per session by checking if we've already logged this user
  if (!window._loggedUser || window._loggedUser !== userInfo.uid) {
    window._loggedUser = userInfo.uid;
  }
  
  return userInfo;
};

// REMOVED: getCompleteUserData - not needed
// Just use fetchUserByUIDFromFirestore directly - it has all the data we need

/**
 * Common user validation function
 * @param {Object} userData - User data to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
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
    if (logWarnings) {
      logger.warn("User data not provided");
    }
    return { isValid: false, errors: ["User data not provided"] };
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

// Cleanup function for auth listener
export const cleanupAuthListener = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
};

// Setup persistent auth listener
export const setupAuthListener = (dispatch) => {
  if (authUnsubscribe) {
    // Already set up
    return;
  }

  // Set initial auth checking state
  dispatch(authSlice.actions.startAuthInit());

  authUnsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      if (user) {
        try {
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

          // Dispatch auth success action
          dispatch(
            authSlice.actions.authStateChanged({ user: normalizedUser })
          );
        } catch (error) {
          logger.error("Error fetching user data:", error);
          dispatch(
            authSlice.actions.authStateChanged({
              user: null,
              error: error.message,
            })
          );
        }
      } else {
        // User signed out - clean up listeners and clear user
        listenerManager.removeAllListeners();
        dispatch(authSlice.actions.authStateChanged({ user: null }));
      }
    },
    (error) => {
      logger.error("Auth state change error:", error);
      dispatch(
        authSlice.actions.authStateChanged({ user: null, error: error.message })
      );
    }
  );
};

// --- Async Thunks ---
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Authenticate with Firebase - onAuthStateChanged will handle user state
      // This makes onAuthStateChanged the single source of truth for user state
      await signInWithEmailAndPassword(auth, email, password);
      
      // Return success - onAuthStateChanged listener will update user state
      return { success: true };
    } catch (error) {
      logger.error("Login error:", error);

      // Handle specific Firebase auth errors
      if (error.code === "auth/user-not-found") {
        return rejectWithValue("No account found with this email address.");
      } else if (error.code === "auth/wrong-password") {
        return rejectWithValue("Incorrect password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        return rejectWithValue(
          "Too many failed attempts. Please try again later."
        );
      } else if (error.code === "auth/user-disabled") {
        return rejectWithValue("This account has been disabled.");
      } else if (error.code === "auth/invalid-email") {
        return rejectWithValue("Invalid email address format.");
      } else if (error.code === "auth/missing-email") {
        return rejectWithValue("Email address is required.");
      }

      return rejectWithValue(
        error.message || "Login failed. Please try again."
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      // Clean up all Firebase listeners before logout
      listenerManager.removeAllListeners();
      
      // Sign out from Firebase
      await signOut(auth);
      return null;
    } catch (error) {
      logger.error("Logout error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// --- Slice ---
const initialState = {
  user: null,
  isLoading: false, // Only true during login/logout attempts
  isAuthChecking: true, // Start as true to indicate we're checking auth on app load
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
