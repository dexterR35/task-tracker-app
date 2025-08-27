import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../app/firebase";
import { logger } from "../../shared/utils/logger";

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
  const createdAtMs = firestoreData.createdAt
    ? typeof firestoreData.createdAt.toDate === "function"
      ? firestoreData.createdAt.toDate().getTime()
      : typeof firestoreData.createdAt === "number"
        ? firestoreData.createdAt
        : new Date(firestoreData.createdAt).getTime()
    : null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firestoreData.name || "",
    role: firestoreData.role,
    occupation: firestoreData.occupation || "user",
    createdAt: createdAtMs,
    permissions: firestoreData.permissions || [],
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

  authUnsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      if (user) {
        // Only show loading when there's actually a user to authenticate
        dispatch(authSlice.actions.startAuthInit());
        
        try {
          // Fetch user data from Firestore
          const firestoreData = await fetchUserFromFirestore(user.uid);
          
          // Check if user is active
          if (firestoreData.isActive === false) {
            throw new Error("Account is deactivated. Please contact administrator.");
          }
          
          const normalizedUser = normalizeUser(user, firestoreData);
          
          // Dispatch auth success action
          dispatch(authSlice.actions.authStateChanged({ user: normalizedUser }));
        } catch (error) {
          logger.error("Error fetching user data:", error);
          dispatch(authSlice.actions.authStateChanged({ user: null, error: error.message }));
        }
      } else {
        // User signed out - set auth checking to false and clear user
        dispatch(authSlice.actions.authStateChanged({ user: null }));
      }
    },
    (error) => {
      logger.error("Auth state change error:", error);
      dispatch(authSlice.actions.authStateChanged({ user: null, error: error.message }));
    }
  );
};

// --- Async Thunks ---
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Step 2: Fetch user data from Firestore
      const firestoreData = await fetchUserFromFirestore(userCredential.user.uid);
      
      // Step 3: Validate user status and role
      if (firestoreData.isActive === false) {
        // Sign out the user if account is deactivated
        await signOut(auth);
        throw new Error("Account is deactivated. Please contact administrator.");
      }
      
      if (!firestoreData.role || !VALID_ROLES.includes(firestoreData.role)) {
        // Sign out the user if role is invalid
        await signOut(auth);
        throw new Error("Invalid user role. Please contact administrator.");
      }
      
      // Step 4: Return normalized user data
      const normalizedUser = normalizeUser(userCredential.user, firestoreData);
      
      return normalizedUser;
    } catch (error) {
      logger.error("Login error:", error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        return rejectWithValue("No account found with this email address.");
      } else if (error.code === 'auth/wrong-password') {
        return rejectWithValue("Incorrect password. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        return rejectWithValue("Too many failed attempts. Please try again later.");
      } else if (error.code === 'auth/user-disabled') {
        return rejectWithValue("This account has been disabled.");
      } else if (error.code === 'auth/invalid-email') {
        return rejectWithValue("Invalid email address format.");
      }
      
      return rejectWithValue(error.message || "Login failed. Please try again.");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      // The auth listener will handle the state update automatically
      return null;
    } catch (error) {
      logger.error("Logout error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const requireReauth = createAsyncThunk(
  "auth/requireReauth",
  async ({ message = "Please sign in again" }, { rejectWithValue }) => {
    try {
      return { message };
    } catch (error) {
      logger.error("Reauth error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// --- Slice ---
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false, // Only true during login/logout attempts
  isAuthChecking: true, // Start as true to prevent flash of login page on refresh
  error: null,
  reauthRequired: false,
  reauthMessage: null,
  lastLoginAttempt: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearReauth: (state) => {
      state.reauthRequired = false;
      state.reauthMessage = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    authStateChanged: (state, action) => {
      const { user, error } = action.payload;
      state.isLoading = false; // Always set loading to false when auth state changes
      state.isAuthChecking = false; // Stop auth checking - this is crucial for preventing login page flash
      state.user = user;
      state.isAuthenticated = !!user;
      state.error = error || null;
      state.reauthRequired = false;
      state.reauthMessage = null;
    },
    // Add a new action to start auth initialization
    startAuthInit: (state) => {
      state.isLoading = true;
      state.isAuthChecking = true; // Mark that we're checking auth
      state.error = null;
    },
    // Track login attempts for rate limiting
    setLoginAttempt: (state) => {
      state.lastLoginAttempt = Date.now();
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
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.isAuthChecking = false;
        state.error = null;
        state.lastLoginAttempt = Date.now();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthChecking = false; // Stop checking on error
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.lastLoginAttempt = Date.now();
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.isAuthChecking = true; // Mark that we're checking auth during logout
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Auth listener will handle the actual state update
        state.isLoading = false;
        state.isAuthChecking = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthChecking = false;
        state.error = action.payload;
      })
      
      // Reauth
      .addCase(requireReauth.fulfilled, (state, action) => {
        state.reauthRequired = true;
        state.reauthMessage = action.payload.message;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError, clearReauth, setLoading, authStateChanged, startAuthInit, setLoginAttempt } = authSlice.actions;

// --- Selectors ---
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsAuthChecking = (state) => state.auth.isAuthChecking;
export const selectAuthError = (state) => state.auth.error;
export const selectReauthRequired = (state) => state.auth.reauthRequired;
export const selectReauthMessage = (state) => state.auth.reauthMessage;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";
export const selectIsUser = (state) => state.auth.user?.role === "user";
// Memoized selector for user permissions to prevent unnecessary re-renders
export const selectUserPermissions = createSelector(
  [selectUser],
  (user) => user?.permissions || []
);

export const selectIsUserActive = (state) => state.auth.user?.isActive !== false;
export const selectLastLoginAttempt = (state) => state.auth.lastLoginAttempt;

// Role-based selectors
export const selectCanAccessAdmin = createSelector(
  [selectUser],
  (user) => user?.role === "admin" && user?.isActive !== false
);

export const selectCanAccessUser = createSelector(
  [selectUser],
  (user) => (user?.role === "user" || user?.role === "admin") && user?.isActive !== false
);

export default authSlice.reducer;
