import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

// Refresh users every 10 minutes by default
const STALE_MS = 10 * 60 * 1000;

// Async thunk to fetch all users
export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    console.log('[users] fetchUsers:start');
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log('[users] fetchUsers:success', { count: list.length });
    return list;
  } catch (e) {
    console.log('[users] fetchUsers:error', e.message);
    return rejectWithValue(e.message || 'Failed to load users');
  }
});

// Thunk to fetch users if stale or forced
export const fetchUsersIfNeeded = (force = false) => (dispatch, getState) => {
  const { users } = getState();
  if (force) return dispatch(fetchUsers());
  if (!users.lastFetched) return dispatch(fetchUsers());
  const stale = Date.now() - users.lastFetched > STALE_MS;
  if (stale) return dispatch(fetchUsers());
  return null;
};

// Auto-refresh every 10 minutes
let autoRefreshInterval;
export const startAutoRefreshUsers = () => (dispatch) => {
  dispatch(fetchUsersIfNeeded());
  if (!autoRefreshInterval) {
    autoRefreshInterval = setInterval(() => dispatch(fetchUsersIfNeeded()), STALE_MS);
  }
};
export const stopAutoRefreshUsers = () => {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = null;
};

// Users slice
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    byId: {},
    allIds: [],
    status: 'idle', // 'idle' | 'loading' | 'refreshing' | 'succeeded' | 'failed'
    error: null,
    lastFetched: null
  },
  reducers: {
    invalidateUsers(state) {
      state.lastFetched = null;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = state.status === 'succeeded' ? 'refreshing' : 'loading';
        state.error = null;
        console.log('[users] state:pending');
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.lastFetched = Date.now();
        state.byId = action.payload.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
        state.allIds = action.payload.map(u => u.id);
        console.log('[users] state:fulfilled', { total: state.allIds.length });
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message || 'Error';
        console.log('[users] state:rejected', { error: state.error });
      });
  }
});

export const { invalidateUsers } = usersSlice.actions;
export default usersSlice.reducer;

// Selectors
const root = s => s.users;
export const selectUsersStatus = createSelector(root, s => s.status);
export const selectUsersError = createSelector(root, s => s.error);
export const selectAllUsers = createSelector(root, s => s.allIds.map(id => s.byId[id]));
export const makeSelectUserById = id => createSelector(root, s => s.byId[id]);
