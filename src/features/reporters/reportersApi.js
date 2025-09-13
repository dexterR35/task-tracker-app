import { createFirestoreApi, fetchCollectionFromFirestore, createDocumentInFirestore, updateDocumentInFirestore, deleteDocumentFromFirestore, serializeTimestampsForRedux } from "@/features/api/baseApi";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";

/**
 * Reporters API - Refactored to use base API factory
 * Eliminates duplicate patterns and standardizes error handling
 */

export const reportersApi = createFirestoreApi({
  reducerPath: "reportersApi",
  tagTypes: ["Reporter"],
  cacheType: "REPORTERS",
  endpoints: (builder) => ({
    // Get all reporters
    getReporters: builder.query({
      async queryFn() {
        try {
          logger.log(`[Reporters API] Starting to fetch reporters...`);
          const reporters = await fetchCollectionFromFirestore(db, "reporters", {
            orderBy: "createdAt",
            orderDirection: "desc"
          });
          
          logger.log(`[Reporters API] Fetched ${reporters.length} reporters:`, reporters.map(r => ({ id: r.id, name: r.name })));
          
          // Serialize timestamps for Redux
          const serializedReporters = serializeTimestampsForRedux(reporters);
          return { data: serializedReporters };
        } catch (error) {
          logger.error(`[Reporters API] Error fetching reporters:`, error);
          throw error; // Let base API handle the error
        }
      },
      providesTags: ["Reporter"]
    }),

    // Create reporter
    createReporter: builder.mutation({
      async queryFn(reporterData) {
        try {
          logger.log(`[Reporters API] Creating reporter:`, reporterData);
          
          // Generate reporterUID from the document ID
          const createdReporter = await createDocumentInFirestore(db, "reporters", {
            ...reporterData,
            reporterUID: null // Will be set after creation
          });
          
          // Update with the generated reporterUID
          const updatedReporter = await updateDocumentInFirestore(
            db, 
            "reporters", 
            createdReporter.id, 
            { reporterUID: createdReporter.id }
          );
          
          logger.log(`[Reporters API] Reporter created successfully:`, updatedReporter);
          
          // Serialize timestamps for Redux
          const serializedReporter = serializeTimestampsForRedux(updatedReporter);
          return { data: serializedReporter };
        } catch (error) {
          logger.error(`[Reporters API] Error creating reporter:`, error);
          throw error; // Let base API handle the error
        }
      },
      invalidatesTags: ["Reporter"],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const tempId = `temp-${Date.now()}`;
            const now = new Date().toISOString();
            // Add the new reporter optimistically
            draft.unshift({
              id: tempId, // Temporary ID
              reporterUID: tempId, // Same temporary ID
              ...arg,
              createdAt: now,
              updatedAt: now,
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),

    // Update reporter
    updateReporter: builder.mutation({
      async queryFn({ id, updates }) {
        try {
          logger.log(`[Reporters API] Updating reporter ${id}:`, updates);
          
          const updatedReporter = await updateDocumentInFirestore(db, "reporters", id, updates);
          
          logger.log(`[Reporters API] Reporter updated successfully:`, updatedReporter);
          
          // Serialize timestamps for Redux
          const serializedReporter = serializeTimestampsForRedux(updatedReporter);
          return { data: serializedReporter };
        } catch (error) {
          logger.error(`[Reporters API] Error updating reporter:`, error);
          throw error; // Let base API handle the error
        }
      },
      invalidatesTags: ["Reporter"],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const reporter = draft.find(r => r.id === arg.id);
            if (reporter) {
              Object.assign(reporter, arg.updates, {
                updatedAt: new Date().toISOString(),
              });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),

    // Delete reporter
    deleteReporter: builder.mutation({
      async queryFn(id) {
        try {
          logger.log(`[Reporters API] Deleting reporter ${id}`);
          
          const result = await deleteDocumentFromFirestore(db, "reporters", id);
          
          logger.log(`[Reporters API] Reporter deleted successfully:`, result);
          return { data: result };
        } catch (error) {
          logger.error(`[Reporters API] Error deleting reporter:`, error);
          throw error; // Let base API handle the error
        }
      },
      invalidatesTags: ["Reporter"],
      // Optimistic update to remove from cache immediately
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const index = draft.findIndex(reporter => reporter.id === arg);
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
      }
    })
  })
});

export const {
  useGetReportersQuery,
  useCreateReporterMutation,
  useUpdateReporterMutation,
  useDeleteReporterMutation,
} = reportersApi;