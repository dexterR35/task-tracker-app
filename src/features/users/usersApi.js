import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { db, auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { parseFirebaseError, withErrorHandling } from "@/features/utils/errorHandling";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import { isUserAuthenticated as checkUserAuth } from "@/features/utils/authUtils";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDocs 
} from "firebase/firestore";


/**
 * Fetch collection from Firestore with options
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of documents
 */
const fetchCollectionFromFirestore = async (db, collectionName, options = {}) => {
  const { 
    orderBy: orderByField = 'createdAt', 
    orderDirection = 'desc',
    where: whereClause = null,
    limit: limitCount = null
  } = options;

  try {
    // Check authentication before making the request
    if (!auth.currentUser) {
      logger.warn(`[fetchCollectionFromFirestore] No authenticated user, skipping ${collectionName} fetch`);
      return [];
    }

    let q = query(collection(db, collectionName));
    
    if (whereClause) {
      q = query(q, where(whereClause.field, whereClause.operator, whereClause.value));
    }
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    const errorResponse = parseFirebaseError(error);
    logger.error(`Error fetching collection ${collectionName}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Fetch a single user by UID from Firestore with caching
 * @param {string} userUID - The user UID to fetch
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const fetchUserByUIDFromFirestore = async (userUID) => {
  const cacheKey = `getUserByUID_${userUID}`;
  
  return await deduplicateRequest(cacheKey, async () => {
    try {
      const users = await fetchCollectionFromFirestore(db, "users", {
        where: { field: "userUID", operator: "==", value: userUID },
        orderBy: null, // No ordering needed for single user lookup
        limit: 1
      });
      
      if (users.length === 0) {
        return null;
      }
      
      return users[0];
    } catch (error) {
      const errorResponse = parseFirebaseError(error);
      logger.error(`[Users API] Error fetching user by UID ${userUID}:`, errorResponse);
      throw errorResponse;
    }
  });
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Users"],
  ...getCacheConfigByType("USERS"),
  endpoints: (builder) => ({
    getUsers: builder.query({
      async queryFn() {
        const cacheKey = `getUsers`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if user is authenticated before proceeding
            if (!checkUserAuth({ user: auth.currentUser, isAuthChecking: false, isLoading: false })) {
              return { data: [] };
            }
            
            const users = await fetchCollectionFromFirestore(db, "users", {
              orderBy: "createdAt",
              orderDirection: "desc"
            });

            // Ensure timestamps are serialized before returning
            const serializedUsers = serializeTimestampsForRedux(users);
            const result = { data: serializedUsers };
            
            return result;
          } catch (error) {
            // If it's an auth error, return empty array instead of error
            if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
              return { data: [] };
            }
            
            throw error; // Let base API handle the error
          }
        });
      },
      providesTags: ["Users"]
    }),

    // Get single user by UID (for regular users)
    getUserByUID: builder.query({
      async queryFn({ userUID }) {
        const cacheKey = `getUserByUID_${userUID}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if user is authenticated before proceeding
            if (!checkUserAuth({ user: auth.currentUser, isAuthChecking: false, isLoading: false })) {
              return { data: null };
            }
            
            const user = await fetchUserByUIDFromFirestore(userUID);

            if (!user) {
              return { error: { message: 'User not found', code: 'USER_NOT_FOUND' } };
            }

            // Ensure timestamps are serialized before returning
            const serializedUser = serializeTimestampsForRedux(user);
            const result = { data: serializedUser };
            
            return result;
          } catch (error) {
            // If it's an auth error, return null instead of error
            if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
              return { data: null };
            }
            
            throw error; // Let base API handle the error
          }
        });
      },
      providesTags: (result, error, { userUID }) => [
        { type: "Users", id: userUID }
      ]
    })
  })
});

export const {
  useGetUsersQuery,
  useGetUserByUIDQuery,
} = usersApi;

// Utility function for manual cache invalidation
export const invalidateUsersCache = (dispatch) => {
  dispatch(usersApi.util.invalidateTags(['Users']));
};

// Utility function to reset all users API state
export const resetUsersApiState = (dispatch) => {
  dispatch(usersApi.util.resetApiState());
};