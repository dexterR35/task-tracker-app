import { createFirestoreApi, fetchCollectionFromFirestore, serializeTimestampsForRedux } from "@/features/api/baseApi";
import { db, auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import { isUserAuthenticated as checkUserAuth } from "@/utils/authUtils";

/**
 * Users API - Refactored to use base API factory
 * Eliminates duplicate patterns and standardizes error handling
 */

// Shared function for fetching users from Firestore
const fetchUsersFromFirestore = async () => {
  return await fetchCollectionFromFirestore(db, "users", {
    orderBy: "createdAt",
    orderDirection: "desc"
  });
};

// Shared function for fetching a single user by UID - OPTIMIZED
const fetchUserByUIDFromFirestore = async (userUID) => {
  const cacheKey = `getUserByUID_${userUID}`;
  
  return await deduplicateRequest(cacheKey, async () => {
    try {
      const users = await fetchCollectionFromFirestore(db, "users", {
        where: { field: "userUID", operator: "==", value: userUID },
        limit: 1
      });
      
      if (users.length === 0) {
        logger.log(`[Users API] No user found with UID: ${userUID}`);
        return null;
      }
      
      logger.log(`[Users API] Found user by UID: ${userUID}`);
      return users[0];
    } catch (error) {
      logger.error(`[Users API] Error fetching user by UID ${userUID}:`, error);
      throw error;
    }
  });
};

export const usersApi = createFirestoreApi({
  reducerPath: "usersApi",
  tagTypes: ["Users"],
  cacheType: "USERS",
  endpoints: (builder) => ({
    getUsers: builder.query({
      async queryFn() {
        const cacheKey = `getUsers`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if user is authenticated before proceeding
            if (!checkUserAuth({ user: auth.currentUser, isAuthChecking: false, isLoading: false })) {
              logger.log('User not authenticated yet, skipping users fetch');
              return { data: [] };
            }
            
            logger.log("Fetching users from database...");
            const users = await fetchUsersFromFirestore();

            // Ensure timestamps are serialized before returning
            const serializedUsers = serializeTimestampsForRedux(users);
            const result = { data: serializedUsers };
            
            logger.log('[getUsers] Success:', { resultCount: result.data.length });
            return result;
          } catch (error) {
            // If it's an auth error, return empty array instead of error
            if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
              logger.log('Auth required for users fetch, returning empty array');
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
              logger.log('User not authenticated yet, skipping user fetch');
              return { data: null };
            }
            
            logger.log(`Fetching user ${userUID} from database...`);
            const user = await fetchUserByUIDFromFirestore(userUID);

            if (!user) {
              return { error: { message: 'User not found', code: 'USER_NOT_FOUND' } };
            }

            // Ensure timestamps are serialized before returning
            const serializedUser = serializeTimestampsForRedux(user);
            const result = { data: serializedUser };
            
            logger.log('[getUserByUID] Success:', { userUID, found: !!result.data });
            return result;
          } catch (error) {
            // If it's an auth error, return null instead of error
            if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
              logger.log('Auth required for user fetch, returning null');
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
  logger.log('Users cache invalidated manually');
};

// Utility function to reset all users API state
export const resetUsersApiState = (dispatch) => {
  dispatch(usersApi.util.resetApiState());
  logger.log('Users API state reset');
};