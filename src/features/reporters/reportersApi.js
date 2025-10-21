import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { 
  createApiEndpointFactory,
  fetchCollectionFromFirestoreAdvanced,
  checkDocumentExists
} from "@/utils/apiUtils";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import { API_CONFIG } from "@/constants";

/**
 * Reporters API - Refactored to use base API factory
 * Eliminates duplicate patterns and standardizes error handling
 */

// Create API endpoint factory for reporters
const reportersApiFactory = createApiEndpointFactory({
  collectionName: 'reporters',
  requiresAuth: true,
  defaultOrderBy: 'createdAt',
  defaultOrderDirection: 'desc'
});

/**
 * Check if reporter email already exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if email exists
 */
const checkReporterEmailExists = async (email) => {
  return await checkDocumentExists("reporters", "email", email.toLowerCase().trim());
};

export const reportersApi = createApi({
  reducerPath: "reportersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Reporter"],
  ...getCacheConfigByType("REPORTERS"),
  endpoints: (builder) => ({
    // Get all reporters - Public data, no authentication required
    getReporters: builder.query({
      async queryFn() {
        try {
          // Fetch reporters with proper ordering by createdAt
          // If createdAt field doesn't exist, fallback to no ordering
          let reporters;
          try {
            reporters = await fetchCollectionFromFirestoreAdvanced("reporters", {
              orderBy: 'createdAt', 
              orderDirection: 'desc',
              limit: API_CONFIG.REQUEST_LIMITS.REPORTERS_PER_QUERY,
              useCache: true,
              cacheKey: 'getReporters'
            });
          } catch (orderError) {
            // Fallback: fetch without ordering if createdAt field doesn't exist
            reporters = await fetchCollectionFromFirestoreAdvanced("reporters", {
              orderBy: null,
              limit: API_CONFIG.REQUEST_LIMITS.REPORTERS_PER_QUERY,
              useCache: true,
              cacheKey: 'getReporters_no_order'
            });
          }

          return { data: reporters };
        } catch (error) {
          throw error; // Let base API handle the error
        }
      },
      providesTags: ["Reporter"],
    }),

    // Create reporter
    createReporter: builder.mutation({
      async queryFn({ reporter, userData }) {
        const cacheKey = `createReporter_${userData?.uid}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if reporter email already exists
            if (reporter.email) {
              const emailExists = await checkReporterEmailExists(reporter.email);
              if (emailExists) {
                return { error: { message: "A reporter with this email address already exists. Please use a different email." } };
              }
            }

            // Clean the reporter data - remove any undefined fields
            const cleanReporterData = Object.fromEntries(
              Object.entries(reporter).filter(([_, value]) => value !== undefined)
            );

            // Use the API factory for creation
            const createdReporter = await reportersApiFactory.create(
              {
                ...cleanReporterData,
                reporterUID: null, // Will be set after creation
                createdBy: userData.userUID || userData.uid,
                createdByName: userData.name,
              },
              userData,
              {
                addMetadata: true, // Add createdAt and updatedAt fields
                useServerTimestamp: true, // Use server timestamp for consistency
                lowercaseStrings: true,
                fieldsToLowercase: ['name', 'email', 'departament', 'country', 'channelName']
              }
            );

            // Update with the generated reporterUID
            const updatedReporter = await reportersApiFactory.update(
              createdReporter.id,
              { reporterUID: createdReporter.id },
              userData,
              {
                addMetadata: true, // Add updatedAt field
                useServerTimestamp: true, // Use server timestamp for consistency
                lowercaseStrings: false // Don't lowercase the reporterUID
              }
            );

            return { data: updatedReporter };
          } catch (error) {
            throw error; // Let base API handle the error
          }
        }, 'ReportersAPI');
      },
      invalidatesTags: ["Reporter"],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const tempId = `temp-${Date.now()}`;
            const now = new Date().toISOString();
            // Add the new reporter optimistically with proper field mapping
            draft.unshift({
              id: tempId, // Temporary ID
              reporterUID: tempId, // Same temporary ID
              name: arg.reporter.name,
              email: arg.reporter.email,
              departament: arg.reporter.departament,
              country: arg.reporter.country,
              channelName: arg.reporter.channelName,
              createdBy: arg.userData.userUID || arg.userData.uid,
              createdByName: arg.userData.name,
              createdAt: now,
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Update reporter
    updateReporter: builder.mutation({
      async queryFn({ id, updates, userData }) {
        const cacheKey = `updateReporter_${id}_${userData?.uid}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if email is being updated and if it already exists for another reporter
            if (updates.email) {
              const emailExists = await checkReporterEmailExists(updates.email);
              if (emailExists) {
                // Check if the email belongs to the current reporter being updated
                const currentReporter = await fetchCollectionFromFirestoreAdvanced("reporters", { 
                  where: { field: "__name__", operator: "==", value: id },
                  limit: 1
                });
                
                if (currentReporter.length === 0 || currentReporter[0].email !== updates.email.toLowerCase().trim()) {
                  return { error: { message: "A reporter with this email address already exists. Please use a different email." } };
                }
              }
            }

            const updatedReporter = await reportersApiFactory.update(
              id,
              updates,
              userData,
              {
                addMetadata: true, // Add updatedAt field
                useServerTimestamp: true, // Use server timestamp for consistency
                lowercaseStrings: true,
                fieldsToLowercase: ['name', 'email', 'departament', 'country', 'channelName']
              }
            );

            return { data: updatedReporter };
          } catch (error) {
            throw error; // Let base API handle the error
          }
        }, 'ReportersAPI');
      },
      invalidatesTags: ["Reporter"],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const reporter = draft.find((r) => r.id === arg.id);
            if (reporter) {
              Object.assign(reporter, arg.updates);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Delete reporter
    deleteReporter: builder.mutation({
      async queryFn({ id, userData }) {
        const cacheKey = `deleteReporter_${id}_${userData?.uid}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            const result = await reportersApiFactory.delete(id, userData);
            return { data: result };
          } catch (error) {
            throw error; // Let base API handle the error
          }
        }, 'ReportersAPI');
      },
      invalidatesTags: ["Reporter"],
      // Optimistic update to remove from cache immediately
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const index = draft.findIndex((reporter) => reporter.id === arg);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetReportersQuery,
  useCreateReporterMutation,
  useUpdateReporterMutation,
  useDeleteReporterMutation,
} = reportersApi;
