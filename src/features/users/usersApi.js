import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  orderBy,
  query as fsQuery,
  doc,
  setDoc,
  getDocFromServer,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import { normalizeTimestamp } from "../../shared/utils/dateUtils";
import { db, auth } from "../../app/firebase";
import { logger } from "../../shared/utils/logger";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query({
      async queryFn({ useCache = true } = {}) {
        try {
          // Check if we have fresh cached users
          if (useCache) {
            const { userStorage } = await import(
              "../../shared/utils/indexedDBStorage"
            );
            if (
              (await userStorage.hasUsers()) &&
              (await userStorage.isUsersFresh())
            ) {
              const cachedUsers = await userStorage.getUsers();
              // Only log once per session to reduce spam
              if (import.meta.env.MODE === 'development' && !window._cachedUsersLogged) {
                logger.log("Using cached users:", cachedUsers.length);
                window._cachedUsersLogged = true;
              }
              return { data: cachedUsers };
            }
          }

          // Only log once per session to reduce spam
          if (import.meta.env.MODE === 'development' && !window._fetchingUsersLogged) {
            logger.log("Fetching users from database...");
            window._fetchingUsersLogged = true;
          }
          const snap = await getDocs(
            fsQuery(collection(db, "users"), orderBy("createdAt", "desc"))
          );
          const users = deduplicateUsers(snap.docs.map((d) => mapUserDoc(d)));

          // Cache the users in IndexedDB
          if (useCache) {
            const { userStorage } = await import(
              "../../shared/utils/indexedDBStorage"
            );
            await userStorage.storeUsers(users);
          }

          return { data: users };
        } catch (error) {
          return {
            error: {
              message: error?.message || "Failed to fetch users",
              code: error.code,
            },
          };
        }
      },
      providesTags: ["Users"],
    }),
    
    // Real-time subscription for users
    subscribeToUsers: builder.query({
      async queryFn() {
        return { data: [] }; // Initial empty data
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        try {
          await cacheDataLoaded;

          const unsubscribe = onSnapshot(
            fsQuery(collection(db, "users"), orderBy("createdAt", "desc")),
            (snapshot) => {
              const users = deduplicateUsers(snapshot.docs.map((d) => mapUserDoc(d)));
              
              // Update cache with real-time data
              updateCachedData((draft) => {
                Object.assign(draft, users);
              });
              
              // Update IndexedDB cache
              const updateCache = async () => {
                const { userStorage } = await import(
                  "../../shared/utils/indexedDBStorage"
                );
                await userStorage.storeUsers(users);
              };
              updateCache();
            },
            (error) => {
              logger.error("Users subscription error:", error);
            }
          );

          await cacheEntryRemoved;
          unsubscribe();
        } catch (error) {
          logger.error("Failed to set up users subscription:", error);
        }
      },
      providesTags: ["Users"],
    }),

    createUser: builder.mutation({
      async queryFn({ email, password, confirmPassword, name, occupation = "user" }) {
        try {
          if (password !== confirmPassword) {
            return {
              error: {
                message: "Passwords do not match",
                code: "PASSWORD_MISMATCH",
              },
            };
          }

          // Create secondary auth instance for user creation
          const secondaryApp = getApps().length === 0 
            ? initializeApp({
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID,
              })
            : getApp();
          
          const secondaryAuth = getAuth(secondaryApp);

          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            email,
            password
          );
          const { uid } = userCredential.user;

          const userDocRef = doc(db, "users", uid);
          await setDoc(userDocRef, {
            userUID: uid,
            email,
            name,
            role: "user",
            occupation: occupation, // Add occupation field
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });

          // Read back the doc to normalize server timestamps
          const fresh = await getDocFromServer(userDocRef);
          const raw = fresh.data() || {};
          const createdAt = normalizeTimestamp(raw.createdAt);
          const updatedAt = normalizeTimestamp(raw.updatedAt);
          const lastActive = normalizeTimestamp(raw.lastActive);
          const lastLogin = normalizeTimestamp(raw.lastLogin);

          // Sign out the secondary auth to clean up, preserving the admin session on primary auth
          try {
            await signOut(secondaryAuth);
          } catch (_) {}

          const newUser = {
            id: uid,
            userUID: uid,
            email,
            name,
            role: "user",
            isActive: true,
            createdAt,
            updatedAt,
            lastActive,
            lastLogin,
          };

          // Add new user to cache
          const { userStorage } = await import("../../shared/utils/indexedDBStorage");
          await userStorage.addUser(newUser);

          return { data: newUser };
        } catch (error) {
          return {
            error: {
              message: error?.message || "Failed to create user",
              code: error.code,
            },
          };
        }
      },
      // Removed invalidatesTags since real-time subscription handles updates
    }),
  }),
});

export const { useGetUsersQuery, useSubscribeToUsersQuery, useCreateUserMutation } = usersApi;

// ---- Helpers ----
function mapUserDoc(d) {
  const raw = d.data() || {};
  const createdAt = normalizeTimestamp(raw.createdAt);
  const updatedAt = normalizeTimestamp(raw.updatedAt);
  const lastActive = normalizeTimestamp(raw.lastActive);
  const lastLogin = normalizeTimestamp(raw.lastLogin);
  
  // Only include serializable, whitelisted fields
  return {
    id: d.id,
    userUID: raw.userUID || d.id,
    email: raw.email || "",
    name: raw.name || "",
    role: raw.role || "user",
    occupation: raw.occupation || "user", // Add occupation field
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : true,
    createdAt,
    updatedAt,
    lastActive,
    lastLogin,
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
    const preferCurrent =
      u.id === key || (u.updatedAt || 0) > (existing.updatedAt || 0);
    if (preferCurrent) seen.set(key, u);
  }
  return Array.from(seen.values());
}
