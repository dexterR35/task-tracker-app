import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  orderBy,
  query as fsQuery,
} from "firebase/firestore";

import { normalizeTimestamp, serializeTimestampsForRedux } from "../../shared/utils/dateUtils";
import { db, auth } from "../../app/firebase";
import { logger } from "../../shared/utils/logger";



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

            checkAuth();
            logger.log("Fetching users from database...");
            const users = await fetchUsersFromFirestore();

            // Ensure timestamps are serialized before returning
            const serializedUsers = serializeTimestampsForRedux(users);
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
      // Keep data for 5 minutes and don't refetch unnecessarily
      keepUnusedDataFor: 300, // Keep data for 5 minutes (300 seconds)
      // Don't refetch on window focus or reconnect
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }),

  }),
});

export const {
  useGetUsersQuery,
} = usersApi;