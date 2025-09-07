import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  orderBy,
  query as fsQuery,
  limit,
  where,
} from "firebase/firestore";

import { db, auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { normalizeForRedux } from "@/utils/dateUtils";

// Simple authentication check
const checkAuth = () => {
  if (!auth.currentUser) {
    throw new Error('AUTH_REQUIRED');
  }
  return true;
};

// Check if user is authenticated (for early returns)
const isUserAuthenticated = () => {
  return auth.currentUser !== null;
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


// Shared function for fetching users from Firestore
const fetchUsersFromFirestore = async () => {
  const snap = await getDocs(
    fsQuery(collection(db, "users"), orderBy("createdAt", "desc"))
  );
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return users;
};

// Shared function for fetching a single user by UID - OPTIMIZED
const fetchUserByUIDFromFirestore = async (userUID) => {
  const cacheKey = `getUserByUID_${userUID}`;
  
  return await deduplicateRequest(cacheKey, async () => {
    try {
      // OPTIMIZATION: Use direct query instead of fetching all users
      const usersRef = collection(db, "users");
      const q = fsQuery(usersRef, where("userUID", "==", userUID), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        logger.log(`[Users API] No user found with UID: ${userUID}`);
        return null;
      }
      
      const userDoc = snap.docs[0];
      logger.log(`[Users API] Found user by UID: ${userUID}`);
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      logger.error(`[Users API] Error fetching user by UID ${userUID}:`, error);
      throw error;
    }
  });
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Users"],
  // Cache optimization settings - using shared configuration
  ...getCacheConfigByType('USERS'),
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

            checkAuth();
            logger.log("Fetching users from database...");
            const users = await fetchUsersFromFirestore();

            // Ensure timestamps are serialized before returning
            const serializedUsers = normalizeForRedux(users);
            const result = { data: serializedUsers };
            
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
      providesTags: ["Users"],
      // Use shared cache configuration for users
      ...getCacheConfigByType('USERS')
    }),

    // Get single user by UID (for regular users)
    getUserByUID: builder.query({
      async queryFn({ userUID }) {
        const cacheKey = `getUserByUID_${userUID}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if user is authenticated before proceeding
            if (!isUserAuthenticated()) {
              logger.log('User not authenticated yet, skipping user fetch');
              return { data: null };
            }

            checkAuth();
            logger.log(`Fetching user ${userUID} from database...`);
            const user = await fetchUserByUIDFromFirestore(userUID);

            if (!user) {
              return { error: { message: 'User not found', code: 'USER_NOT_FOUND' } };
            }

            // Ensure timestamps are serialized before returning
            const serializedUser = normalizeForRedux(user);
            const result = { data: serializedUser };
            
            logApiCall('getUserByUID', { userUID }, result.data);
            return result;
          } catch (error) {
            // If it's an auth error, return null instead of error
            if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
              logger.log('Auth required for user fetch, returning null');
              return { data: null };
            }
            
            const errorResult = handleFirestoreError(error, 'fetch user');
            logApiCall('getUserByUID', { userUID }, null, error);
            return errorResult;
          }
        });
      },
      providesTags: (result, error, { userUID }) => [
        { type: "Users", id: userUID }
      ],
      // Use shared cache configuration for users
      ...getCacheConfigByType('USERS')
    }),

  }),
});

export const {
  useGetUsersQuery,
  useGetUserByUIDQuery,
} = usersApi;

// Utility function for manual cache invalidation
// Use this when you manually add/update/delete users in Firestore
// Example: After manually adding a user in Firestore console, call this to refresh the cache
export const invalidateUsersCache = (dispatch) => {
  dispatch(usersApi.util.invalidateTags(['Users']));
  logger.log('Users cache invalidated manually');
};

// Utility function to reset all users API state
export const resetUsersApiState = (dispatch) => {
  dispatch(usersApi.util.resetApiState());
  logger.log('Users API state reset');
};