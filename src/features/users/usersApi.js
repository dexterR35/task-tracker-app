import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { 
  fetchCollectionFromFirestoreAdvanced,
  fetchDocumentById,
  withAuthentication,
  createApiEndpointFactory,
  withApiErrorHandling
} from "@/utils/apiUtils";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import { isUserAuthenticated as checkUserAuth } from "@/features/utils/authUtils";
import { auth } from "@/app/firebase";


// Create API endpoint factory for users
const usersApiFactory = createApiEndpointFactory({
  collectionName: 'users',
  requiresAuth: true,
  defaultOrderBy: 'createdAt',
  defaultOrderDirection: 'desc'
});

// Helper function for consistent error handling
const handleAuthError = (error) => {
  if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
    return { data: [] };
  }
  throw error;
};

/**
 * Fetch a single user by UID from Firestore with caching
 * @param {string} userUID - The user UID to fetch
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const fetchUserByUIDFromFirestore = async (userUID) => {
  const cacheKey = `getUserByUID_${userUID}`;
  
  return await deduplicateRequest(cacheKey, async () => {
    const users = await fetchCollectionFromFirestoreAdvanced("users", {
      where: { field: "userUID", operator: "==", value: userUID },
      orderBy: null, // No ordering needed for single user lookup
      limit: 1,
      useCache: true,
      cacheKey: cacheKey // Use the same cache key to avoid duplication
    });
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0];
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
            
            const users = await usersApiFactory.getAll({
              orderBy: "createdAt",
              orderDirection: "desc"
            });

            return { data: users };
          } catch (error) {
            return handleAuthError(error);
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

            return { data: user };
          } catch (error) {
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