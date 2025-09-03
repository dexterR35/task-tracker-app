import { useMemo } from "react";
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

// --- Configuration & Constants ---
const VALID_ROLES = ["admin", "user"];

// --- Internal Utilities ---
let authUnsubscribe = null;

const fetchUserFromFirestore = async (uid) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error("User not found in Firestore");
  }
  return userSnap.data();
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
    email: firebaseUser.email,
    name: firestoreData.name || "",
    role: firestoreData.role,
    occupation: firestoreData.occupation || "user",
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
          // Fetch user data from Firestore
          const firestoreData = await fetchUserFromFirestore(user.uid);

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
        // User signed out - set auth checking to false and clear user
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
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 3: Fetch user data from Firestore
      const firestoreData = await fetchUserFromFirestore(
        userCredential.user.uid
      );
      logger.error("firestoreData:", firestoreData);
      // Step 4: Validate user status and role
      if (firestoreData.isActive === false) {
        // Sign out the user if account is deactivated
        await signOut(auth);
        throw new Error(
          "Account is deactivated. Please contact administrator."
        );
      }

      if (!firestoreData.role || !VALID_ROLES.includes(firestoreData.role)) {
        // Sign out the user if role is invalid
        await signOut(auth);
        throw new Error("Invalid user role. Please contact administrator.");
      }

      // Return normalized user data
      const normalizedUser = normalizeUser(userCredential.user, firestoreData);
      logger.error("normalizedUseraaaaaaaaaaaaaaa:", normalizedUser);
      return { user: normalizedUser };
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
      // Just sign out from Firebase - everything else is automatic!
      await signOut(auth);
      logger.log("User signed out successfully");
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
      
      // Only update if user data has actually changed
      const userChanged = !state.user || !user || 
        state.user.uid !== user.uid ||
        state.user.email !== user.email ||
        state.user.role !== user.role ||
        state.user.name !== user.name ||
        state.user.occupation !== user.occupation ||
        state.user.isActive !== user.isActive;
      
      if (userChanged) {
        state.user = user;
        // Remove isAuthenticated - derive it in selector instead
      }
      
      state.isLoading = false; // Always set loading to false when auth state changes
      state.isAuthChecking = false; // Stop auth checking - this is crucial for preventing login page flash
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
        state.isAuthChecking = true; // Mark that we're checking auth during login
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        // Set user data immediately from the thunk result
        const { user } = action.payload;
        state.user = user;
        // Remove isAuthenticated - derive it in selector instead
        state.isLoading = false;
        state.isAuthChecking = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthChecking = false; // Stop checking on error
        state.error = action.payload;
        // Remove isAuthenticated - derive it in selector instead
        state.user = null;
      })

      // Logout - simplified since auth listener handles everything
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.isAuthChecking = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Auth listener will handle the state update
        state.isLoading = false;
        state.isAuthChecking = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthChecking = false;
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
