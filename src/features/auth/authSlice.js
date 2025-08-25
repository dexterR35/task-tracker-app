import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
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

  // Start auth init immediately to show auth loader during initial app load
  // This prevents showing login page before auth state is determined
  dispatch(authSlice.actions.startAuthInit());

  authUnsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      if (user) {
        try {
          // Fetch user data from Firestore
          const firestoreData = await fetchUserFromFirestore(user.uid);
          const normalizedUser = normalizeUser(user, firestoreData);
          
          // Add a delay to cover the initial data fetching period
          // This ensures users see "Authenticating..." throughout the entire login flow
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Dispatch auth success action
          dispatch(authSlice.actions.authStateChanged({ user: normalizedUser }));
        } catch (error) {
          console.error("Error fetching user data:", error);
          dispatch(authSlice.actions.authStateChanged({ user: null, error: error.message }));
        }
      } else {
        // User signed out - no need to show loading for this
        dispatch(authSlice.actions.authStateChanged({ user: null }));
      }
    },
    (error) => {
      console.error("Auth state change error:", error);
      dispatch(authSlice.actions.authStateChanged({ user: null, error: error.message }));
    }
  );
};

// --- Async Thunks ---
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Return serializable data instead of Firebase user object
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      };
    } catch (error) {
      console.error("Login error:", error);
      return rejectWithValue(error.message);
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
      console.error("Logout error:", error);
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
      console.error("Reauth error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// --- Slice ---
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false, // Start with false instead of true
  isAuthChecking: false, // Track if we're checking auth state
  error: null,
  reauthRequired: false,
  reauthMessage: null,
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
      state.isAuthChecking = false; // Stop auth checking
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
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isAuthChecking = true; // Mark that we're checking auth during login
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        // Auth listener will handle the actual state update
        // Keep loading true until auth listener completes
        state.isLoading = true;
        state.isAuthChecking = true; // Keep checking until auth listener completes
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthChecking = false; // Stop checking on error
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
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

export const { clearError, clearReauth, setLoading, authStateChanged, startAuthInit } = authSlice.actions;

// --- Selectors ---
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectReauthRequired = (state) => state.auth.reauthRequired;
export const selectReauthMessage = (state) => state.auth.reauthMessage;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";

export default authSlice.reducer;
