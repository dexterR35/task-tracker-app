// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
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
import { auth, db } from "../../firebase";

// --- Configuration & Constants ---
const SESSION_EXPIRY_TOLERANCE_MS = 30 * 1000;
const SOFT_MAX_SESSION_MS = 3 * 60 * 60 * 1000;
const VALID_ROLES = ["admin", "user"];

// --- Internal Utilities ---
let authListenerRegistered = false;
let authUnsubscribe = null;

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
    createdAt: createdAtMs,
  };
};

const isTokenExpired = (tokenResult, sessionStartedAt) => {
  const now = Date.now();
  if (tokenResult?.expirationTime) {
    const exp = new Date(tokenResult.expirationTime).getTime();
    if (exp - now < -SESSION_EXPIRY_TOLERANCE_MS) return true;
  }
  return sessionStartedAt && now - sessionStartedAt > SOFT_MAX_SESSION_MS;
};

// --- Async Thunks ---
export const initAuthListener = createAsyncThunk(
  "auth/initListener",
  (_, { dispatch, getState }) => {
    if (authListenerRegistered) {
      return authUnsubscribe;
    }

    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      // This is now purely reactive, responding to auth changes
      if (!user) {
        dispatch(authSlice.actions.authLogout());
        return;
      }
      try {
        const tokenResult = await getIdTokenResult(user);
        const started = getState().auth.sessionStartedAt;
        if (isTokenExpired(tokenResult, started)) {
          await signOut(auth);
          dispatch(authSlice.actions.authLogout());
          return;
        }
        const firestoreData = await fetchUserFromFirestore(user.uid);
        const normalized = normalizeUser(user, firestoreData);
        dispatch(authSlice.actions.authLogin(normalized));
      } catch (err) {
        dispatch(authSlice.actions.authErrorOccurred(err.message));
        dispatch(authSlice.actions.authLogout());
      }
    });

    authListenerRegistered = true;
    
    // THIS IS THE KEY FIX: Dispatch the action immediately after registering the listener.
    // This resolves the state as soon as possible, preventing the flicker.
    dispatch(authSlice.actions.setInitialResolved());

    // This returns the unsubscribe function to the calling component
    return authUnsubscribe;
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firestoreData = await fetchUserFromFirestore(
        userCredential.user.uid
      );
      const normalizedUser = normalizeUser(userCredential.user, firestoreData);
      return normalizedUser;
    } catch (error) {
      return rejectWithValue(error?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      return rejectWithValue(error?.message || "Logout failed");
    }
  }
);

// --- Slice Definition ---
const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  listenerActive: false,
  initialAuthResolved: false,
  reauthRequired: false,
  loading: {
    loginUser: false,
    logoutUser: false,
    initListener: false,
  },
  sessionStartedAt: null,
  error: {
    loginUser: null,
    logoutUser: null,
    initListener: null,
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authLogin(state, action) {
      const user = action.payload;
      state.user = user;
      state.role = user.role;
      state.isAuthenticated = true;
      state.reauthRequired = false;
      if (!state.sessionStartedAt) state.sessionStartedAt = Date.now();
      state.error.initListener = null;
    },
    authLogout(state) {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.sessionStartedAt = null;
    },
    authErrorOccurred(state, action) {
      state.error.initListener = action.payload;
    },
    clearError(state, action) {
      const key = action.payload;
      if (key && state.error[key]) {
        state.error[key] = null;
      }
    },
    resetAuth(state) {
      Object.assign(state, initialState);
    },
    requireReauth(state, action) {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.error.initListener =
        action.payload?.message || "Please sign back in to continue";
      state.reauthRequired = true;
    },
    setInitialResolved(state) {
      state.initialAuthResolved = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle login/logout
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading.loginUser = false;
        authSlice.caseReducers.authLogin(state, action);
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.loading.logoutUser = false;
        authSlice.caseReducers.authLogout(state, action);
      })
      // Standard Thunk lifecycle management
      .addCase(loginUser.pending, (state) => {
        state.loading.loginUser = true;
        state.error.loginUser = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading.loginUser = false;
        state.error.loginUser = action.payload || action.error.message;
        authSlice.caseReducers.authLogout(state);
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading.logoutUser = true;
        state.error.logoutUser = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading.logoutUser = false;
        state.error.logoutUser = action.payload || action.error.message;
      })
      // Init listener state
      .addCase(initAuthListener.pending, (state) => {
        state.loading.initListener = true;
        state.error.initListener = null;
      })
      .addCase(initAuthListener.fulfilled, (state) => {
        state.loading.initListener = false;
        state.listenerActive = true;
      })
      .addCase(initAuthListener.rejected, (state, action) => {
        state.loading.initListener = false;
        state.error.initListener = action.payload || action.error.message;
        state.initialAuthResolved = true;
      });
  },
});

export const { clearError, resetAuth, requireReauth, setInitialResolved } = authSlice.actions;

export const unsubscribeAuthListener = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
    authListenerRegistered = false;
  }
};

export default authSlice.reducer;