import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../app/firebase";

// --- Configuration & Constants ---
const SESSION_EXPIRY_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes tolerance
const VALID_ROLES = ["admin", "user"];

// --- Internal Utilities ---
let authListenerRegistered = false;
let authUnsubscribe = null;
let tokenRefreshInterval = null;

const fetchUserFromFirestore = async (uid) => {
  const directRef = doc(db, "users", uid);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    return directSnap.data();
  }
  const usersQuery = query(
    collection(db, "users"),
    where("userUID", "==", uid)
  );
  const querySnapshot = await getDocs(usersQuery);
  if (querySnapshot.empty) {
    throw new Error("User not found in Firestore");
  }
  return querySnapshot.docs[0].data();
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
    occupation: firestoreData.occupation || "user", // Add occupation field
    createdAt: createdAtMs,
  };
};

const isTokenExpired = async (tokenResult) => {
  const now = Date.now();

  // Check if token is expired
  if (tokenResult?.expirationTime) {
    const exp = new Date(tokenResult.expirationTime).getTime();
    const timeUntilExpiry = exp - now;

    // Token is expired if it's past expiration time minus tolerance
    if (timeUntilExpiry < -SESSION_EXPIRY_TOLERANCE_MS) {
      console.log(
        `Token expired: ${new Date(exp).toISOString()}, current: ${new Date(now).toISOString()}`
      );
      return true;
    }
  }

  return false;
};

const handleTokenRefresh = async (user) => {
  try {
    const tokenResult = await getIdTokenResult(user, true);
    const expired = await isTokenExpired(tokenResult);
    
    if (expired) {
      console.log("Token expired, signing out user");
      await signOut(auth);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
};

const setupTokenRefresh = (user) => {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }
  
  // Refresh token every 10 minutes
  tokenRefreshInterval = setInterval(async () => {
    const isValid = await handleTokenRefresh(user);
    if (!isValid) {
      clearInterval(tokenRefreshInterval);
    }
  }, 10 * 60 * 1000);
};

const clearTokenRefresh = () => {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
};

// Cleanup function for auth listener
export const cleanupAuthListener = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
  authListenerRegistered = false;
  clearTokenRefresh();
};

// --- Async Thunks ---
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user data from Firestore
      const firestoreData = await fetchUserFromFirestore(user.uid);
      const normalizedUser = normalizeUser(user, firestoreData);
      
      // Setup token refresh
      setupTokenRefresh(user);
      
      return normalizedUser;
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
      clearTokenRefresh();
      await signOut(auth);
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
      clearTokenRefresh();
      return { message };
    } catch (error) {
      console.error("Reauth error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const checkAuthState = createAsyncThunk(
  "auth/checkAuthState",
  async (_, { rejectWithValue }) => {
    try {
      return new Promise((resolve, reject) => {
        if (authListenerRegistered) {
          // If already registered, just resolve with current state
          const currentUser = auth.currentUser;
          if (currentUser) {
            // User is already authenticated, fetch their data
            fetchUserFromFirestore(currentUser.uid)
              .then(firestoreData => {
                const normalizedUser = normalizeUser(currentUser, firestoreData);
                setupTokenRefresh(currentUser);
                resolve(normalizedUser);
              })
              .catch(error => {
                console.error("Error fetching user data:", error);
                reject(error);
              });
          } else {
            resolve(null);
          }
          return;
        }

        authUnsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            if (user) {
              try {
                // Fetch user data from Firestore
                const firestoreData = await fetchUserFromFirestore(user.uid);
                const normalizedUser = normalizeUser(user, firestoreData);
                
                // Setup token refresh
                setupTokenRefresh(user);
                
                resolve(normalizedUser);
              } catch (error) {
                console.error("Error fetching user data:", error);
                reject(error);
              }
            } else {
              clearTokenRefresh();
              resolve(null);
            }
          },
          (error) => {
            console.error("Auth state change error:", error);
            reject(error);
          }
        );

        authListenerRegistered = true;
      });
    } catch (error) {
      console.error("Check auth state error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// --- Slice ---
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
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
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.reauthRequired = false;
        state.reauthMessage = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.reauthRequired = false;
        state.reauthMessage = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Reauth
      .addCase(requireReauth.fulfilled, (state, action) => {
        state.reauthRequired = true;
        state.reauthMessage = action.payload.message;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Check Auth State
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.error = null;
          state.reauthRequired = false;
          state.reauthMessage = null;
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.error = null;
          state.reauthRequired = false;
          state.reauthMessage = null;
        }
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, clearReauth, setLoading } = authSlice.actions;

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
