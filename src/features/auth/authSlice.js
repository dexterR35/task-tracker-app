// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Module-level listener guard & unsubscribe holder
let authListenerRegistered = false;
let authUnsubscribe = null;

// --- Helpers & Config ---
const SESSION_EXPIRY_TOLERANCE_MS = 30 * 1000; // 30s grace for clock skew
const SOFT_MAX_SESSION_MS = 3 * 60 * 60 * 1000; // 3 hours desired lifespan
const VALID_ROLES = ['admin','user'];

// Fetch user data from Firestore users collection by userUID field
async function fetchUserFromFirestore(uid) {
  // First attempt direct document lookup (preferred if doc id == uid)
  const directRef = doc(db, 'users', uid);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    const data = directSnap.data();
    return data;
  }
  // Fallback: query by userUID field (legacy structure)
  const usersQuery = query(collection(db, 'users'), where('userUID', '==', uid));
  const querySnapshot = await getDocs(usersQuery);
  if (querySnapshot.empty) throw new Error('User not found');
  return querySnapshot.docs[0].data();
}

// Fetch user data from Firestore and normalize
async function fetchAndNormalizeUser(firebaseUser) {
  const raw = await fetchUserFromFirestore(firebaseUser.uid);
  if (!raw.role) throw new Error('User role not defined');
  if (!VALID_ROLES.includes(raw.role)) throw new Error('Invalid role');
  const createdAtMs = raw.createdAt
    ? (typeof raw.createdAt.toDate === 'function'
        ? raw.createdAt.toDate().getTime()
        : (typeof raw.createdAt === 'number' ? raw.createdAt : new Date(raw.createdAt).getTime()))
    : null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: raw.name || '',
    role: raw.role,
    createdAt: createdAtMs,
  };
}

// Utility: validate token expiration with tolerance
function isTokenExpired(tokenResult, sessionStartedAt) {
  const now = Date.now();
  // Hard token expiry check
  if (tokenResult?.expirationTime) {
    const exp = new Date(tokenResult.expirationTime).getTime();
    if (now - exp > SESSION_EXPIRY_TOLERANCE_MS) return true;
  }
  // Soft max session age (force silent refresh/relogin)
  if (sessionStartedAt && (now - sessionStartedAt > SOFT_MAX_SESSION_MS)) return true;
  return false;
}

// Legacy fetchCurrentUser thunk removed – persistent listener only.

// Persistent listener init (call once at app start)
export const initAuthListener = createAsyncThunk('auth/initListener', async (_, { dispatch, rejectWithValue, getState }) => {
  try {
    if (authListenerRegistered) {
      console.log('[auth] initListener:skip-already-registered');
      return 'already';
    }
    console.log('[auth] initListener:register');
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('[auth] listener:user:null');
        dispatch(authStateChanged(null));
        return;
      }
      try {
        const tokenResult = await getIdTokenResult(user);
        const started = getState().auth.sessionStartedAt;
        if (isTokenExpired(tokenResult, started)) {
          console.log('[auth] listener:session-expired');
          await signOut(auth);
          dispatch(authStateChanged(null));
          return;
        }
        const normalized = await fetchAndNormalizeUser(user);
        console.log('[auth] listener:user', { uid: normalized.uid, role: normalized.role });
        dispatch(authStateChanged(normalized));
      } catch (err) {
        console.log('[auth] listener:error', err.message);
        dispatch(authErrorOccurred(err.message || 'Auth listener error'));
        dispatch(authStateChanged(null));
      }
    });
    authListenerRegistered = true; // set immediately to block double registration in StrictMode
    return 'registered';
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

// Prehydrate from cached firebase auth.currentUser synchronously (avoids login flicker)
export const prehydrateAuth = createAsyncThunk('auth/prehydrateAuth', async (_, { dispatch }) => {
  try {
    const cached = auth.currentUser;
    if (!cached) return 'no-user';
    const normalized = await fetchAndNormalizeUser(cached);
    console.log('[auth] prehydrate:success', { uid: normalized.uid });
    dispatch(authStateChanged(normalized));
    return 'hydrated';
  } catch (e) {
    console.log('[auth] prehydrate:error', e.message);
    return 'error';
  }
});

// Internal actions for listener
const authStateChanged = createAction('auth/stateChanged');
const authErrorOccurred = createAction('auth/errorOccurred');

// Login user with email/password and fetch user data
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
  console.log('[auth] login:start', { email });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const normalizedUser = await fetchAndNormalizeUser(userCredential.user);
  console.log('[auth] login:success', { uid: normalizedUser.uid });
      return normalizedUser;
    } catch (error) {
      // Provide clearer error messages
      const msg = error?.message || 'Login failed';
  console.log('[auth] login:error', msg);
      return rejectWithValue(msg);
    }
  }
);

// Logout user from Firebase
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
  console.log('[auth] logout:start');
      await signOut(auth);
  console.log('[auth] logout:success');
      return true;
    } catch (error) {
  console.log('[auth] logout:error', error?.message);
      return rejectWithValue(error?.message || 'Logout failed');
    }
  }
);

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
  name: 'auth',
  initialState,
  reducers: {
    clearError(state, action) {
      const key = action.payload;
      if (key && state.error[key]) {
        state.error[key] = null;
      }
    },
    resetAuth(state) {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      Object.keys(state.loading).forEach((k) => (state.loading[k] = false));
      Object.keys(state.error).forEach((k) => (state.error[k] = null));
    },
    // Handle admin re-auth after user creation
    requireReauth(state, action) {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.error.initListener = action.payload?.message || 'Please sign back in to continue';
      state.reauthRequired = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // persistent listener internal events
    .addCase(authStateChanged, (state, action) => {
        const user = action.payload;
        if (user) {
      state.user = user; state.role = user.role; state.isAuthenticated = true; state.reauthRequired = false;
      if (!state.sessionStartedAt) state.sessionStartedAt = Date.now();
  console.log('[auth] stateChanged:login', { uid: user.uid, role: user.role });
        } else {
      state.user = null; state.role = null; state.isAuthenticated = false; state.sessionStartedAt = null;
  console.log('[auth] stateChanged:logout');
        }
  state.initialAuthResolved = true;
      })
      .addCase(authErrorOccurred, (state, action) => {
        state.error.initListener = action.payload;
      })
      .addCase(initAuthListener.pending, (state) => {
        state.loading.initListener = true; state.error.initListener = null;
      })
      .addCase(initAuthListener.fulfilled, (state) => {
        state.loading.initListener = false; state.listenerActive = true;
      })
      .addCase(initAuthListener.rejected, (state, action) => {
        state.loading.initListener = false; state.error.initListener = action.payload || action.error.message;
  })

      // loginUser lifecycle
      .addCase(loginUser.pending, (state) => {
        state.loading.loginUser = true;
        state.error.loginUser = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading.loginUser = false;
        state.user = action.payload;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.sessionStartedAt = Date.now();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading.loginUser = false;
        state.error.loginUser = action.payload || action.error.message;
      })

      // logoutUser lifecycle
      .addCase(logoutUser.pending, (state) => {
        state.loading.logoutUser = true;
        state.error.logoutUser = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading.logoutUser = false;
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
  state.reauthRequired = false;
        state.sessionStartedAt = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading.logoutUser = false;
        state.error.logoutUser = action.payload || action.error.message;
      })

      // prehydrateAuth lifecycle (manual loading control to prevent flash)
      .addCase(prehydrateAuth.fulfilled, (state, action) => {
        // endGlobalLoading is dispatched directly in the component
      })
      .addCase(prehydrateAuth.rejected, (state, action) => {
        // endGlobalLoading is dispatched directly in the component
      });
  },
});

export const { clearError, resetAuth, requireReauth } = authSlice.actions;

// Expose optional cleanup (not typically used in SPA)
export const unsubscribeAuthListener = () => {
  if (authUnsubscribe) {
    try { authUnsubscribe(); console.log('[auth] listener:unsubscribed'); }
    catch(e){ console.log('[auth] listener:unsubscribe-error', e?.message); }
    authUnsubscribe = null; authListenerRegistered = false;
  }
};

export default authSlice.reducer;
