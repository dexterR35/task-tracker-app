import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  orderBy,
  query as fsQuery,
  doc,
  getDocFromServer,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { normalizeTimestamp, serializeTimestampsForRedux } from "../../shared/utils/dateUtils";
import { db, auth } from "../../app/firebase";
import { logger } from "../../shared/utils/logger";



// Token validation utility
const validateToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    // Force token refresh if needed
    await user.getIdToken(true);
    return true;
  } catch (error) {
    logger.error('Token validation failed:', error);
    throw new Error('Authentication required');
  }
};

// Wrapper for all Firestore operations with token validation
const withTokenValidation = async (operation) => {
  try {
    await validateToken();
    return await operation();
  } catch (error) {
    if (error.message === 'Authentication required') {
      throw new Error('AUTH_REQUIRED');
    }
    throw error;
  }
};

// Check if user is authenticated (for early returns)
const isUserAuthenticated = () => {
  return auth.currentUser !== null;
};

// Request deduplication
const pendingRequests = new Map();

const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = requestFn();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};

// Retry mechanism for network errors
const withRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Only retry on network errors
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
};

// Error handling wrapper
const handleFirestoreError = (error, operation) => {
  logger.error(`Firestore ${operation} failed:`, error);
  
  if (error.code === 'permission-denied') {
    return { error: { message: 'Access denied', code: 'PERMISSION_DENIED' } };
  }
  
  if (error.code === 'unavailable') {
    return { error: { message: 'Service temporarily unavailable', code: 'SERVICE_UNAVAILABLE' } };
  }
  
  if (error.code === 'not-found') {
    return { error: { message: 'Resource not found', code: 'NOT_FOUND' } };
  }
  
  return { error: { message: error?.message || `Failed to ${operation}` } };
};

// API call logging
const logApiCall = (endpoint, args, result, error = null) => {
  if (error) {
    logger.error(`[${endpoint}] Failed:`, { args, error: error.message });
  } else {
    logger.log(`[${endpoint}] Success:`, { 
      args, 
      resultCount: Array.isArray(result) ? result.length : 1 
    });
  }
};

// User data normalization
const mapUserDoc = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    lastActive: normalizeTimestamp(data.lastActive),
    lastLogin: normalizeTimestamp(data.lastLogin),
  };
};

// Deduplicate users by UID
const deduplicateUsers = (users) => {
  const seen = new Set();
  return users.filter((user) => {
    if (seen.has(user.userUID)) {
      return false;
    }
    seen.add(user.userUID);
    return true;
  });
};

// Shared function for fetching users from Firestore
const fetchUsersFromFirestore = async () => {
  const snap = await getDocs(
    fsQuery(collection(db, "users"), orderBy("createdAt", "desc"))
  );
  const users = deduplicateUsers(snap.docs.map((d) => mapUserDoc(d)));
  return users;
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    
    getUsers: builder.query({
      async queryFn() {
        const cacheKey = `getUsers`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if user is authenticated before proceeding
            if (!isUserAuthenticated()) {
              logger.log('User not authenticated yet, skipping users fetch');
              return { data: [] };
            }

            const result = await withTokenValidation(async () => {
              logger.log("Fetching users from database...");
              const users = await fetchUsersFromFirestore();

              return { data: users };
            });
            
            logApiCall('getUsers', {}, result.data);
            return result;
          } catch (error) {
            // If it's an auth error, return empty array instead of error
            if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
              logger.log('Auth required for users fetch, returning empty array');
              return { data: [] };
            }
            
            const errorResult = handleFirestoreError(error, 'fetch users');
            logApiCall('getUsers', {}, null, error);
            return errorResult;
          }
        });
      },
      // Transform response to ensure only serializable data is stored in Redux
      transformResponse: (response) => {
        return serializeTimestampsForRedux(response);
      },
      providesTags: ["Users"],
    }),

    // Real-time subscription for users with enhanced error handling
    subscribeToUsers: builder.query({
      async queryFn() {
        return { data: [] }; // Initial empty data
      },
      // Transform response to ensure only serializable data is stored in Redux
      transformResponse: (response) => {
        return serializeTimestampsForRedux(response);
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        let unsubscribe = null;
        
        try {
          await cacheDataLoaded;

          unsubscribe = onSnapshot(
            fsQuery(collection(db, "users"), orderBy("createdAt", "desc")),
            async (snapshot) => {
              if (!snapshot || !snapshot.docs) {
                logger.log("[Real-time] Invalid users snapshot");
                updateCachedData(() => []);
                return;
              }

              if (snapshot.empty) {
                logger.log("[Real-time] No users found");
                updateCachedData(() => []);
                return;
              }

              const users = deduplicateUsers(snapshot.docs.map((d) => mapUserDoc(d)));

              updateCachedData(() => users);

              logger.log("[Real-time] Users updated:", users.length);
            },
            (error) => {
              logger.error("Real-time users subscription error:", error);
            }
          );

          await cacheEntryRemoved;
        } catch (error) {
          logger.error("Error setting up real-time users subscription:", error);
        } finally {
          // Ensure cleanup
          if (unsubscribe) {
            unsubscribe();
          }
        }
      },
      providesTags: ["Users"],
    }),

    // Enhanced user update with retry logic
    updateUser: builder.mutation({
      async queryFn({ userId, updates }) {
        return await withRetry(async () => {
          try {
            const result = await withTokenValidation(async () => {
              const userRef = doc(db, "users", userId);
              
              const updatesWithTimestamp = {
                ...updates,
                updatedAt: serverTimestamp(),
              };

              await updateDoc(userRef, updatesWithTimestamp);

              logger.log("[UpdateUser] User updated:", userId);

              return { data: { id: userId, success: true } };
            });
            
            logApiCall('updateUser', { userId }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'update user');
            logApiCall('updateUser', { userId }, null, error);
            return errorResult;
          }
        });
      },
      // Enhanced optimistic update
      async onQueryStarted({ userId, updates }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          usersApi.util.updateQueryData("getUsers", {}, (draft) => {
            const userIndex = draft.findIndex((user) => user.id === userId);
            if (userIndex !== -1) {
              draft[userIndex] = {
                ...draft[userIndex],
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Users"],
    }),

    // Enhanced user deletion with retry logic
    deleteUser: builder.mutation({
      async queryFn({ userId }) {
        return await withRetry(async () => {
          try {
            const result = await withTokenValidation(async () => {
              const userRef = doc(db, "users", userId);
              await deleteDoc(userRef);

              logger.log("[DeleteUser] User deleted:", userId);

              return { data: { id: userId, success: true } };
            });
            
            logApiCall('deleteUser', { userId }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'delete user');
            logApiCall('deleteUser', { userId }, null, error);
            return errorResult;
          }
        });
      },
      // Enhanced optimistic update
      async onQueryStarted({ userId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          usersApi.util.updateQueryData("getUsers", {}, (draft) => {
            const userIndex = draft.findIndex((user) => user.id === userId);
            if (userIndex !== -1) {
              draft.splice(userIndex, 1);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Users"],
    }),

    // Get single user by ID
    getUserById: builder.query({
      async queryFn({ userId }) {
        const cacheKey = `getUserById_${userId}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            const result = await withTokenValidation(async () => {
              const userRef = doc(db, "users", userId);
              const userSnap = await getDocFromServer(userRef);
              
              if (!userSnap.exists()) {
                return { data: null };
              }

              const user = mapUserDoc(userSnap);
              return { data: user };
            });
            
            logApiCall('getUserById', { userId }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'get user by ID');
            logApiCall('getUserById', { userId }, null, error);
            return errorResult;
          }
        });
      },
      providesTags: (result, error, arg) => [{ type: "Users", id: arg.userId }],
    }),

  }),
});

export const {
  useGetUsersQuery,
  useSubscribeToUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserByIdQuery,
} = usersApi;