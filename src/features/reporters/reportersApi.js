import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";

/**
 * Reporters API - Refactored to use base API factory
 * Eliminates duplicate patterns and standardizes error handling
 */

/**
 * Create document in Firestore
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @param {Object} options - Creation options
 * @returns {Promise<Object>} - Created document
 */
const createDocumentInFirestore = async (db, collectionName, data, options = {}) => {
  const { 
    addMetadata = true,
    useServerTimestamp = true
  } = options;

  try {
    if (!auth.currentUser) {
      logger.warn(`[createDocumentInFirestore] No authenticated user, skipping ${collectionName} creation`);
      throw new Error('User must be authenticated to create documents');
    }

    const docData = { ...data };
    
    if (addMetadata) {
      docData.createdAt = useServerTimestamp ? serverTimestamp() : new Date().toISOString();
      docData.updatedAt = useServerTimestamp ? serverTimestamp() : new Date().toISOString();
    }
    
    const docRef = await addDoc(collection(db, collectionName), docData);
    
    return { id: docRef.id, ...docData };
  } catch (error) {
    logger.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update document in Firestore
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} updates - Update data
 * @param {Object} options - Update options
 * @returns {Promise<Object>} - Updated document
 */
const updateDocumentInFirestore = async (db, collectionName, docId, updates, options = {}) => {
  const { 
    addMetadata = true,
    useServerTimestamp = true
  } = options;

  try {
    if (!auth.currentUser) {
      logger.warn(`[updateDocumentInFirestore] No authenticated user, skipping ${collectionName} update`);
      throw new Error('User must be authenticated to update documents');
    }

    const updateData = { ...updates };
    
    if (addMetadata) {
      updateData.updatedAt = useServerTimestamp ? serverTimestamp() : new Date().toISOString();
    }
    
    await updateDoc(doc(db, collectionName, docId), updateData);
    
    return { id: docId, ...updateData };
  } catch (error) {
    logger.error(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete document from Firestore
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} - Deletion result
 */
const deleteDocumentFromFirestore = async (db, collectionName, docId) => {
  try {
    if (!auth.currentUser) {
      logger.warn(`[deleteDocumentFromFirestore] No authenticated user, skipping ${collectionName} deletion`);
      throw new Error('User must be authenticated to delete documents');
    }
    
    await deleteDoc(doc(db, collectionName, docId));
    
    return { id: docId, deleted: true };
  } catch (error) {
    logger.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

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
    orderDirection = 'desc'
  } = options;

  try {
    let q = query(collection(db, collectionName));
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logger.error(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

export const reportersApi = createApi({
  reducerPath: "reportersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Reporter"],
  ...getCacheConfigByType("REPORTERS"),
  endpoints: (builder) => ({
    // Get all reporters
    getReporters: builder.query({
      async queryFn() {
        try {
          logger.log(`[Reporters API] Starting to fetch reporters...`);
          const reporters = await fetchCollectionFromFirestore(
            db,
            "reporters",
            {
              orderBy: "createdAt",
              orderDirection: "desc",
            }
          );

          logger.log(
            `[Reporters API] Fetched ${reporters.length} reporters:`,
            reporters.map((r) => ({ id: r.id, name: r.name }))
          );

          // Serialize timestamps for Redux
          const serializedReporters = serializeTimestampsForRedux(reporters);
          return { data: serializedReporters };
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
        try {
          logger.log(`[Reporters API] Creating reporter:`, reporter);
          logger.log(`[Reporters API] User data:`, userData);

          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can create reporters (admin only)
          const { validateUserPermissions } = await import('@/utils/permissions');
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
            db,
            "reporters",
            {
              ...cleanReporterData,
              reporterUID: null, // Will be set after creation
              createdBy: userData.userUID || userData.uid,
              createdByName: userData.name,
            },
            {
              addMetadata: false, // Don't add updatedAt field
            }
          );

          // Update with the generated reporterUID
          const updatedReporter = await updateDocumentInFirestore(
            db,
            "reporters",
            createdReporter.id,
            { reporterUID: createdReporter.id },
            {
              addMetadata: false, // Don't add updatedAt field
            }
          );

          logger.log(
            `[Reporters API] Reporter created successfully:`,
            updatedReporter
          );

          // Serialize timestamps for Redux
          const serializedReporter =
            serializeTimestampsForRedux(updatedReporter);
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
              ...arg.reporter,
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
        try {
          logger.log(`[Reporters API] Updating reporter ${id}:`, updates);

          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can update reporters (admin only)
          const { validateUserPermissions } = await import('@/utils/permissions');
          const permissionValidation = validateUserPermissions(userData, 'create_board', {
            operation: 'updateReporter',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          const updatedReporter = await updateDocumentInFirestore(
            db,
            "reporters",
            id,
            updates,
            {
              addMetadata: false, // Don't add updatedAt field
            }
          );

          logger.log(
            `[Reporters API] Reporter updated successfully:`,
            updatedReporter
          );

          // Serialize timestamps for Redux
          const serializedReporter =
            serializeTimestampsForRedux(updatedReporter);
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
        try {
          logger.log(`[Reporters API] Deleting reporter ${id}`);

          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can delete reporters (admin only)
          const { validateUserPermissions } = await import('@/utils/permissions');
          const permissionValidation = validateUserPermissions(userData, 'create_board', {
            operation: 'deleteReporter',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

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
