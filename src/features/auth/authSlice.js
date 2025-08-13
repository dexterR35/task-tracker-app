// src/redux/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  getIdTokenResult,
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Fetch user data from Firestore users collection by uid
async function fetchUserFromFirestore(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) throw new Error('User not found');
  const userData = userDoc.data();
  if (!userData.role) throw new Error('User role not defined');
  return userData;
}

// Fetch user data from Firestore and normalize
async function fetchAndNormalizeUser(firebaseUser) {
  const userData = await fetchUserFromFirestore(firebaseUser.uid);

  // Normalize createdAt field if exists
  const createdAtIso = userData.createdAt
    ? (typeof userData.createdAt.toDate === 'function'
        ? userData.createdAt.toDate().toISOString()
        : new Date(userData.createdAt).toISOString())
    : null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: userData.name || '',
    role: userData.role,
    createdAt: createdAtIso,
  };
}

// Observe Firebase Auth state and fetch Firestore user
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) =>
    new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (!user) return resolve(null); // No logged in user

        try {
          const tokenResult = await getIdTokenResult(user);
          if (new Date(tokenResult.expirationTime) < new Date()) throw new Error('Session expired');
          const normalizedUser = await fetchAndNormalizeUser(user);
          resolve(normalizedUser);
        } catch (error) {
          reject(error);
        }
      }, reject);
    }).catch((error) => rejectWithValue(error.message))
);

// Login user with email/password and fetch user data
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const normalizedUser = await fetchAndNormalizeUser(userCredential.user);
      return normalizedUser;
    } catch (error) {
      // Provide clearer error messages
      const msg = error?.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

// Logout user from Firebase
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      return rejectWithValue(error?.message || 'Logout failed');
    }
  }
);

const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  loading: {
    fetchCurrentUser: false,
    loginUser: false,
    logoutUser: false,
  },
  error: {
    fetchCurrentUser: null,
    loginUser: null,
    logoutUser: null,
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
  },
  extraReducers: (builder) => {
    builder
      // fetchCurrentUser lifecycle
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading.fetchCurrentUser = true;
        state.error.fetchCurrentUser = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading.fetchCurrentUser = false;
        if (action.payload) {
          state.user = action.payload;
          state.role = action.payload.role;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.role = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading.fetchCurrentUser = false;
        state.error.fetchCurrentUser = action.payload || action.error.message;
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
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
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading.logoutUser = false;
        state.error.logoutUser = action.payload || action.error.message;
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;

export default authSlice.reducer;
