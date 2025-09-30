import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { 
  createDocumentInFirestore,
  updateDocumentInFirestore,
  deleteDocumentFromFirestore,
  fetchCollectionFromFirestore,
  validateUserPermissions,
  createOptimisticUpdate
} from "@/utils/apiUtils";
import { logger } from "@/utils/logger";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";

/**
 * Reporters API - Refactored to use base API factory
 * Eliminates duplicate patterns and standardizes error handling
 */

// Centralized API utilities are now imported from @/utils/apiUtils

export const reportersApi = createApi({
  reducerPath: "reportersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Reporter"],
  // Simple configuration for plain data
  keepUnusedDataFor: 300, // Keep data for 5 minutes
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // Get all reporters - Public data, no authentication required
    getReporters: builder.query({
      async queryFn() {
        try {
          logger.log(`[Reporters API] Starting to fetch reporters...`);
          
          // Fetch reporters with proper ordering by createdAt
          // If createdAt field doesn't exist, fallback to no ordering
          let reporters;
          try {
            reporters = await fetchCollectionFromFirestore(
              "reporters",
              { 
                orderBy: 'createdAt', 
                orderDirection: 'desc' 
              }
            );
          } catch (orderError) {
            // Fallback: fetch without ordering if createdAt field doesn't exist
            logger.warn(`[Reporters API] createdAt field not found, fetching without ordering:`, orderError);
            reporters = await fetchCollectionFromFirestore(
              "reporters",
              { orderBy: null }
            );
          }

          logger.log(`[Reporters API] Successfully fetched ${reporters?.length || 0} reporters:`, reporters);
          return { data: reporters };
        } catch (error) {
          logger.error(`[Reporters API] Error fetching reporters:`, error);
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
            logger.log(`[Reporters API] Creating reporter:`, reporter);
            logger.log(`[Reporters API] User data:`, userData);

          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can create reporters (admin only)
          const permissionValidation = validateUserPermissions(userData, 'create_board', {
            operation: 'createReporter',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          // Validate that we have proper user data - if not, user is not authenticated
          if (!userData?.name || !userData?.email) {
            return { error: { message: "User authentication data incomplete. Please log in again." } };
          }

          // Clean the reporter data - remove any undefined fields
          const cleanReporterData = Object.fromEntries(
            Object.entries(reporter).filter(([_, value]) => value !== undefined)
          );

          // Generate reporterUID from the document ID
          const createdReporter = await createDocumentInFirestore(
            "reporters",
            {
              ...cleanReporterData,
              reporterUID: null, // Will be set after creation
              createdBy: userData.userUID || userData.uid,
              createdByName: userData.name,
            },
            {
              addMetadata: true, // Add createdAt and updatedAt fields
              useServerTimestamp: true // Use server timestamp for consistency
            }
          );

          // Update with the generated reporterUID
          const updatedReporter = await updateDocumentInFirestore(
            "reporters",
            createdReporter.id,
            { reporterUID: createdReporter.id },
            {
              addMetadata: true, // Add updatedAt field
              useServerTimestamp: true // Use server timestamp for consistency
            }
          );

          logger.log(
            `[Reporters API] Reporter created successfully:`,
            updatedReporter
          );

          return { data: updatedReporter };
        } catch (error) {
          logger.error(`[Reporters API] Error creating reporter:`, error);
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
            logger.log(`[Reporters API] Updating reporter ${id}:`, updates);

          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can update reporters (admin only)
          const { validateUserPermissions } = await import('@/features/utils/authUtils');
          const permissionValidation = validateUserPermissions(userData, 'create_board', {
            operation: 'updateReporter',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          const updatedReporter = await updateDocumentInFirestore(
            "reporters",
            id,
            updates,
            {
              addMetadata: true, // Add updatedAt field
              useServerTimestamp: true // Use server timestamp for consistency
            }
          );

          logger.log(
            `[Reporters API] Reporter updated successfully:`,
            updatedReporter
          );

          return { data: updatedReporter };
        } catch (error) {
          logger.error(`[Reporters API] Error updating reporter:`, error);
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
            logger.log(`[Reporters API] Deleting reporter ${id}`);

          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can delete reporters (admin only)
          const { validateUserPermissions } = await import('@/features/utils/authUtils');
          const permissionValidation = validateUserPermissions(userData, 'create_board', {
            operation: 'deleteReporter',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          const result = await deleteDocumentFromFirestore("reporters", id);

          logger.log(`[Reporters API] Reporter deleted successfully:`, result);
          return { data: result };
        } catch (error) {
          logger.error(`[Reporters API] Error deleting reporter:`, error);
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
