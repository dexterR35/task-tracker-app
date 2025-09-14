import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { handleApiError } from "@/features/utils/errorHandling";
import { logger } from "@/utils/logger";
import { auth } from "@/app/firebase";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

/**
 * Base API Factory for Firestore APIs
 * Standardizes patterns across tasksApi, usersApi, and reportersApi
 * Eliminates ~150 lines of duplicate code
 */

/**
 * Create a standardized Firestore API
 * @param {Object} config - API configuration
 * @returns {Object} - RTK Query API instance
 */
export const createFirestoreApi = (config) => {
  const {
    reducerPath,
    tagTypes = [],
    cacheType = 'USERS',
    endpoints: createEndpoints
  } = config;

  return createApi({
    reducerPath,
    baseQuery: fakeBaseQuery(),
    tagTypes,
    ...getCacheConfigByType(cacheType),
    endpoints: (builder) => {
      const endpoints = createEndpoints(builder);
      
      // Add common error handling wrapper to all endpoints
      return Object.keys(endpoints).reduce((acc, key) => {
        const endpoint = endpoints[key];
        
        if (endpoint.queryFn) {
          acc[key] = {
            ...endpoint,
            queryFn: async (arg, api, extraOptions, baseQuery) => {
              try {
                return await endpoint.queryFn(arg, api, extraOptions, baseQuery);
              } catch (error) {
                logger.error(`[${reducerPath}] ${key} error:`, error);
                return { error: handleApiError(error, key, { showToast: false, logError: true }) };
              }
            }
          };
        } else {
          acc[key] = endpoint;
        }
        
        return acc;
      }, {});
    }
  });
};

/**
 * Common authentication check function
 * @param {Object} authState - Authentication state (optional)
 * @returns {Object} - Current user info or null
 */
export const getCurrentUserInfo = (authState) => {
  // Check if user is authenticated
  if (!auth.currentUser) {
    logger.warn('[getCurrentUserInfo] No current user found');
    return null;
  }
  
  const userInfo = {
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    name: auth.currentUser.displayName || auth.currentUser.email
  };
  
  // Only log once per session by checking if we've already logged this user
  if (!window._loggedUser || window._loggedUser !== userInfo.uid) {
    logger.log('[getCurrentUserInfo] User found:', { uid: userInfo.uid, email: userInfo.email });
    window._loggedUser = userInfo.uid;
  }
  
  return userInfo;
};

/**
 * Common user validation function
 * @param {Object} userData - User data to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateUserForAPI = (userData, options = {}) => {
  const { 
    requireUID = true, 
    requireEmail = false, 
    requireName = false, 
    requireRole = false,
    logWarnings = true 
  } = options;

  if (!userData) {
    if (logWarnings) {
      logger.warn("User data not provided");
    }
    return { isValid: false, errors: ["User data not provided"] };
  }

  const errors = [];
  
  if (requireUID && !userData.userUID && !userData.uid) {
    errors.push("User data missing userUID");
  }
  
  if (requireEmail && !userData.email) {
    errors.push("User data missing email");
  }
  
  if (requireName && !userData.name) {
    errors.push("User data missing name");
  }
  
  if (requireRole && !userData.role) {
    errors.push("User data missing role");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Common Firestore collection fetch function
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of documents
 */
export const fetchCollectionFromFirestore = async (db, collectionName, options = {}) => {
  const { 
    orderBy: orderByField = 'createdAt', 
    orderDirection = 'desc',
    limit: limitCount = null,
    where: whereClause = null
  } = options;

  try {
    // Check authentication before making the request
    if (!auth.currentUser) {
      logger.warn(`[fetchCollectionFromFirestore] No authenticated user, skipping ${collectionName} fetch`);
      return [];
    }

    // Using static imports instead of dynamic imports
    
    let q = query(collection(db, collectionName));
    
    if (whereClause) {
      q = query(q, where(whereClause.field, whereClause.operator, whereClause.value));
    }
    
    if (orderByField && orderByField !== null) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logger.error(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Common document creation function
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @param {Object} options - Creation options
 * @returns {Promise<Object>} - Created document
 */
export const createDocumentInFirestore = async (db, collectionName, data, options = {}) => {
  const { 
    useServerTimestamp = true,
    addMetadata = true 
  } = options;

  try {
    // Check authentication before making the request
    if (!auth.currentUser) {
      logger.warn(`[createDocumentInFirestore] No authenticated user, skipping ${collectionName} creation`);
      throw new Error('User must be authenticated to create documents');
    }

    // Using static imports instead of dynamic imports
    
    const docData = { ...data };
    
    if (addMetadata) {
      docData.createdAt = useServerTimestamp ? serverTimestamp() : new Date().toISOString();
      docData.updatedAt = useServerTimestamp ? serverTimestamp() : new Date().toISOString();
    }
    
    const docRef = await addDoc(collection(db, collectionName), docData);
    
    return {
      id: docRef.id,
      ...docData
    };
  } catch (error) {
    logger.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Common document update function
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} updates - Update data
 * @param {Object} options - Update options
 * @returns {Promise<Object>} - Updated document
 */
export const updateDocumentInFirestore = async (db, collectionName, docId, updates, options = {}) => {
  const { 
    useServerTimestamp = true,
    addMetadata = true 
  } = options;

  try {
    // Check authentication before making the request
    if (!auth.currentUser) {
      logger.warn(`[updateDocumentInFirestore] No authenticated user, skipping ${collectionName} update`);
      throw new Error('User must be authenticated to update documents');
    }

    // Using static imports instead of dynamic imports
    
    const updateData = { ...updates };
    
    if (addMetadata) {
      updateData.updatedAt = useServerTimestamp ? serverTimestamp() : new Date().toISOString();
    }
    
    await updateDoc(doc(db, collectionName, docId), updateData);
    
    return {
      id: docId,
      ...updateData
    };
  } catch (error) {
    logger.error(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Common document deletion function
 * @param {Object} db - Firestore database instance
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteDocumentFromFirestore = async (db, collectionName, docId) => {
  try {
    // Check authentication before making the request
    if (!auth.currentUser) {
      logger.warn(`[deleteDocumentFromFirestore] No authenticated user, skipping ${collectionName} deletion`);
      throw new Error('User must be authenticated to delete documents');
    }

    // Using static imports instead of dynamic imports
    
    await deleteDoc(doc(db, collectionName, docId));
    
    return { id: docId, deleted: true };
  } catch (error) {
    logger.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};


// Re-export serializeTimestampsForRedux for backward compatibility
export { serializeTimestampsForRedux };

export default {
  createFirestoreApi,
  getCurrentUserInfo,
  validateUserForAPI,
  fetchCollectionFromFirestore,
  createDocumentInFirestore,
  updateDocumentInFirestore,
  deleteDocumentFromFirestore
};
