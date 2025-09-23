/**
 * Centralized API Utilities
 * Eliminates duplicate API patterns across the application
 */

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
import { db, auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { parseFirebaseError } from "@/features/utils/errorHandling";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";

/**
 * Create document in Firestore with standardized error handling
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @param {Object} options - Creation options
 * @returns {Promise<Object>} Created document
 */
export const createDocumentInFirestore = async (collectionName, data, options = {}) => {
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
    const errorResponse = parseFirebaseError(error);
    logger.error(`Error creating document in ${collectionName}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Update document in Firestore with standardized error handling
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} updates - Update data
 * @param {Object} options - Update options
 * @returns {Promise<Object>} Updated document
 */
export const updateDocumentInFirestore = async (collectionName, docId, updates, options = {}) => {
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
    const errorResponse = parseFirebaseError(error);
    logger.error(`Error updating document ${docId} in ${collectionName}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Delete document from Firestore with standardized error handling
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDocumentFromFirestore = async (collectionName, docId) => {
  try {
    if (!auth.currentUser) {
      logger.warn(`[deleteDocumentFromFirestore] No authenticated user, skipping ${collectionName} deletion`);
      throw new Error('User must be authenticated to delete documents');
    }
    
    await deleteDoc(doc(db, collectionName, docId));
    
    return { id: docId, deleted: true };
  } catch (error) {
    const errorResponse = parseFirebaseError(error);
    logger.error(`Error deleting document ${docId} from ${collectionName}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Fetch collection from Firestore with standardized error handling
 * @param {string} collectionName - Name of the collection
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of documents
 */
export const fetchCollectionFromFirestore = async (collectionName, options = {}) => {
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
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Serialize timestamps for Redux
    return serializeTimestampsForRedux(documents);
  } catch (error) {
    const errorResponse = parseFirebaseError(error);
    logger.error(`Error fetching collection ${collectionName}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Validate user permissions for API operations
 * @param {Object} userData - User data object
 * @param {string} operation - Operation being performed
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateUserPermissions = (userData, operation, options = {}) => {
  const {
    requireActive = true,
    logWarnings = true
  } = options;

  if (!userData) {
    return {
      isValid: false,
      errors: ['User data is required']
    };
  }

  if (requireActive && !userData.isActive) {
    return {
      isValid: false,
      errors: ['User account is not active']
    };
  }

  if (!userData.userUID && !userData.uid) {
    return {
      isValid: false,
      errors: ['User ID is required']
    };
  }

  if (logWarnings) {
    logger.log(`[Permission Check] ${operation}:`, {
      userUID: userData.userUID || userData.uid,
      isActive: userData.isActive,
      role: userData.role
    });
  }

  return {
    isValid: true,
    errors: []
  };
};

/**
 * Create optimistic update for RTK Query mutations
 * @param {string} queryName - Name of the query to update
 * @param {Object} queryArgs - Query arguments
 * @param {Function} updateFn - Function to update the cache
 * @returns {Object} Optimistic update configuration
 */
export const createOptimisticUpdate = (queryName, queryArgs, updateFn) => {
  return {
    onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
      const patchResult = dispatch(
        queryName.util.updateQueryData(queryName, queryArgs, updateFn)
      );
      
      try {
        await queryFulfilled;
      } catch {
        patchResult.undo();
      }
    }
  };
};

/**
 * Standardized API response wrapper
 * @param {Function} apiFunction - The API function to wrap
 * @param {string} operation - Operation name for logging
 * @returns {Function} Wrapped API function
 */
export const withApiErrorHandling = (apiFunction, operation = 'API Operation') => {
  return async (...args) => {
    try {
      logger.log(`[${operation}] Starting:`, args);
      const result = await apiFunction(...args);
      logger.log(`[${operation}] Success:`, result);
      return { data: result };
    } catch (error) {
      logger.error(`[${operation}] Error:`, error);
      throw error;
    }
  };
};
