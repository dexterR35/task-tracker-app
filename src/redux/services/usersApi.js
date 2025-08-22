import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { collection, getDocs, orderBy, fsQuery, doc, setDoc, getDocFromServer, serverTimestamp, onSnapshot, getAuth, createUserWithEmailAndPassword, signOut, getApp, getApps, initializeApp  } from '../../hooks/useImports';
import { normalizeTimestamp } from '../../utils/dateUtils';
import { db, auth } from '../../firebase';
// import { getAuth, createUserWithEmailAndPassword, signOut, getApp, getApps, initializeApp } from '../../hooks/useImports';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      async queryFn({ useCache = true } = {}) {
        try {
          // Check if we have fresh cached users
          if (useCache) {
            const { userStorage } = await import('../../utils/indexedDBStorage');
            if (await userStorage.hasUsers() && await userStorage.isUsersFresh()) {
              const cachedUsers = await userStorage.getUsers();
              console.log('Using cached users:', cachedUsers.length);
              return { data: cachedUsers };
            }
          }

          console.log('Fetching users from database...');
          const snap = await getDocs(fsQuery(collection(db, 'users'), orderBy('createdAt', 'desc')));
          const users = deduplicateUsers(snap.docs.map(d => mapUserDoc(d)));
          
          // Cache the users in IndexedDB
          if (useCache) {
            const { userStorage } = await import('../../utils/indexedDBStorage');
            await userStorage.storeUsers(users);
          }
          
          return { data: users };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to load users' } };
        }
      },
      async onCacheEntryAdded(arg, { updateCachedData, cacheEntryRemoved }) {
        // Subscribe to realtime changes to keep presence fresh and avoid duplicates
        const q = fsQuery(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const next = deduplicateUsers(snapshot.docs.map(d => mapUserDoc(d)));
          updateCachedData(() => next);
          
          // Update cache with real-time changes
          const { userStorage } = await import('../../utils/indexedDBStorage');
          await userStorage.storeUsers(next);
        });
        try {
          await cacheEntryRemoved;
        } finally {
          unsubscribe();
        }
      },
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      async queryFn({ email, password, confirmPassword, name }) {
        try {
          // Validation
          if (!name || !String(name).trim()) {
            throw new Error('Name is required');
          }
          if (!email || !String(email).trim()) {
            throw new Error('Email is required');
          }
          if (!password || String(password).length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          if (password !== confirmPassword) {
            const error = new Error('Passwords do not match');
            error.code = 'INVALID_PASSWORD_MATCH';
            throw error;
          }

          // Use a secondary app to avoid switching the current admin session
          const primary = getApp();
          const cfg = primary.options;
          let secondaryApp;
          try {
            secondaryApp = getApps().find(a => a.name === 'secondary') || initializeApp(cfg, 'secondary');
          } catch (_) {
            secondaryApp = initializeApp(cfg, 'secondary');
          }
          const secondaryAuth = getAuth(secondaryApp);
          const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
          const uid = cred.user.uid;
          const userDocRef = doc(collection(db, 'users'), uid);
          const createdBy = auth.currentUser?.uid || null;
          await setDoc(
            userDocRef,
            { userUID: uid, email, name: name || '', role: 'user', isActive: true, createdBy, createdAt: serverTimestamp() },
            { merge: true }
          );
          
          // Read back the doc to normalize server timestamps
          const fresh = await getDocFromServer(userDocRef);
          const raw = fresh.data() || {};
          const createdAt = normalizeTimestamp(raw.createdAt);
          const updatedAt = normalizeTimestamp(raw.updatedAt);
          const lastActive = normalizeTimestamp(raw.lastActive);
          const lastLogin = normalizeTimestamp(raw.lastLogin);
          const heartbeatAt = normalizeTimestamp(raw.heartbeatAt);
          const isOnline = typeof heartbeatAt === 'number' ? (Date.now() - heartbeatAt) < 2 * 60 * 1000 : false;
          
          // Sign out the secondary auth to clean up, preserving the admin session on primary auth
          try { await signOut(secondaryAuth); } catch (_) {}
          
          const newUser = { id: uid, userUID: uid, email, name: name || '', role: 'user', isActive: true, createdAt, updatedAt, lastActive, lastLogin, heartbeatAt, isOnline };
          
          // Add new user to cache
          const { userStorage } = await import('../../utils/indexedDBStorage');
          await userStorage.addUser(newUser);
          
          return { data: newUser };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to create user', code: error.code } };
        }
      },
      // Removed invalidatesTags since real-time subscription handles updates
    }),
  })
});

export const { useGetUsersQuery, useCreateUserMutation } = usersApi;

// ---- Helpers ----
function mapUserDoc(d) {
  const raw = d.data() || {};
  const createdAt = normalizeTimestamp(raw.createdAt);
  const updatedAt = normalizeTimestamp(raw.updatedAt);
  const lastActive = normalizeTimestamp(raw.lastActive);
  const lastLogin = normalizeTimestamp(raw.lastLogin);
  const heartbeatAt = normalizeTimestamp(raw.heartbeatAt);
  // Consider online if beat within last 12 minutes (slightly above 10-min interval)
  const isOnline = typeof heartbeatAt === 'number' ? (Date.now() - heartbeatAt) < 12 * 60 * 1000 : false;
  // Only include serializable, whitelisted fields
  return {
    id: d.id,
    userUID: raw.userUID || d.id,
    email: raw.email || '',
    name: raw.name || '',
    role: raw.role || 'user',
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
    createdAt,
    updatedAt,
    lastActive,
    lastLogin,
    heartbeatAt,
    isOnline,
  };
}

function deduplicateUsers(users) {
  const seen = new Map();
  for (const u of users) {
    const key = u.userUID || u.id;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, u);
      continue;
    }
    // Prefer document whose id equals the UID, otherwise keep the one with latest updatedAt
    const preferCurrent = u.id === key || (u.updatedAt || 0) > (existing.updatedAt || 0);
    if (preferCurrent) seen.set(key, u);
  }
  return Array.from(seen.values());
}


