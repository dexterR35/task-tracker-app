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
  serverTimestamp,
  where,
  limit,
  getDoc
} from "firebase/firestore";
import { fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { db, auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { parseFirebaseError } from "@/features/utils/errorHandling";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { transformDataToLowercase } from "@/utils/formUtils";
import { API_CONFIG } from "@/constants";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";

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
    useServerTimestamp = true,
    lowercaseStrings = true,
    fieldsToLowercase = []
  } = options;

  try {
    if (!auth.currentUser) {
      logger.warn(`[createDocumentInFirestore] No authenticated user, skipping ${collectionName} creation`);
      throw new Error('User must be authenticated to create documents');
    }

    let docData = { ...data };
    
    // Apply lowercase transformation if enabled
    if (lowercaseStrings) {
      docData = transformDataToLowercase(docData, fieldsToLowercase);
    }
    
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
    useServerTimestamp = true,
    lowercaseStrings = true,
    fieldsToLowercase = []
  } = options;

  try {
    if (!auth.currentUser) {
      logger.warn(`[updateDocumentInFirestore] No authenticated user, skipping ${collectionName} update`);
      throw new Error('User must be authenticated to update documents');
    }

    let updateData = { ...updates };
    
    // Apply lowercase transformation if enabled
    if (lowercaseStrings) {
      updateData = transformDataToLowercase(updateData, fieldsToLowercase);
    }
    
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
    
    if (orderByField && orderByField !== null) {
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
    // Permission check logging removed
  }

  return {
    isValid: true,
    errors: []
  };
};

/**
 * Create optimistic update for RTK Query mutations (Legacy)
 * @param {string} queryName - Name of the query to update
 * @param {Object} queryArgs - Query arguments
 * @param {Function} updateFn - Function to update the cache
 * @returns {Object} Optimistic update configuration
 */
export const createLegacyOptimisticUpdate = (queryName, queryArgs, updateFn) => {
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
      const result = await apiFunction(...args);
      return { data: result };
    } catch (error) {
      logger.error(`[${operation}] Error:`, error);
      throw error;
    }
  };
};

/**
 * Enhanced fetch collection with advanced query options
 * @param {string} collectionName - Name of the collection
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of documents
 */
export const fetchCollectionFromFirestoreAdvanced = async (collectionName, options = {}) => {
  const { 
    orderBy: orderByField = 'createdAt', 
    orderDirection = 'desc',
    where: whereClause = null,
    limit: limitCount = null,
    useCache = true,
    cacheKey = null
  } = options;
  
  // Apply default limit if none specified to reduce Firestore reads
  const effectiveLimit = limitCount || API_CONFIG.REQUEST_LIMITS.ANALYTICS_LIMIT;

  const executeQuery = async () => {
    try {
      if (!auth.currentUser) {
        logger.warn(`[fetchCollectionFromFirestoreAdvanced] No authenticated user, skipping ${collectionName} fetch`);
        return [];
      }

      let q = query(collection(db, collectionName));
      
      if (whereClause) {
        if (Array.isArray(whereClause)) {
          // Multiple where clauses
          whereClause.forEach(clause => {
            q = query(q, where(clause.field, clause.operator, clause.value));
          });
        } else {
          // Single where clause
          q = query(q, where(whereClause.field, whereClause.operator, whereClause.value));
        }
      }
      
      if (orderByField && orderByField !== null) {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      if (effectiveLimit) {
        q = query(q, limit(effectiveLimit));
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

  if (useCache && cacheKey) {
    return await deduplicateRequest(cacheKey, executeQuery);
  }
  
  return await executeQuery();
};

/**
 * Fetch single document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export const fetchDocumentById = async (collectionName, docId) => {
  try {
    if (!auth.currentUser) {
      logger.warn(`[fetchDocumentById] No authenticated user, skipping ${collectionName} fetch`);
      return null;
    }

    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...serializeTimestampsForRedux(docSnap.data()) };
  } catch (error) {
    const errorResponse = parseFirebaseError(error);
    logger.error(`Error fetching document ${docId} from ${collectionName}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Check if document exists by field value
 * @param {string} collectionName - Name of the collection
 * @param {string} field - Field name to check
 * @param {*} value - Value to check for
 * @returns {Promise<boolean>} True if document exists
 */
export const checkDocumentExists = async (collectionName, field, value) => {
  try {
    if (!auth.currentUser) {
      logger.warn(`[checkDocumentExists] No authenticated user, skipping ${collectionName} check`);
      return false;
    }

    const q = query(collection(db, collectionName), where(field, "==", value));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    const errorResponse = parseFirebaseError(error);
    logger.error(`Error checking document existence in ${collectionName}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Unified authentication middleware
 * @param {Function} operation - The operation to wrap
 * @param {Object} options - Authentication options
 * @returns {Function} Wrapped operation with authentication
 */
export const withAuthentication = (operation, options = {}) => {
  const { 
    requireActive = true,
    logWarnings = true,
    throwOnAuth = true
  } = options;

  return async (...args) => {
    if (!auth.currentUser) {
      const message = 'User must be authenticated to perform this operation';
      if (logWarnings) {
        logger.warn(`[withAuthentication] ${message}`);
      }
      if (throwOnAuth) {
        throw new Error(message);
      }
      return { data: null, error: { message } };
    }

    if (requireActive) {
      // Additional active user checks can be added here
      // For now, we'll rely on the existing user data validation
    }

    return operation(...args);
  };
};

/**
 * Create standardized API endpoint factory
 * @param {Object} config - API configuration
 * @returns {Object} Standardized API functions
 */
export const createApiEndpointFactory = (config) => {
  const {
    collectionName,
    requiresAuth = true,
    defaultOrderBy = 'createdAt',
    defaultOrderDirection = 'desc'
  } = config;

  return {
    // Get all documents
    getAll: async (options = {}) => {
      const cacheKey = `getAll_${collectionName}_${JSON.stringify(options)}`;
      return await fetchCollectionFromFirestoreAdvanced(collectionName, {
        orderBy: defaultOrderBy,
        orderDirection: defaultOrderDirection,
        useCache: true,
        cacheKey,
        ...options
      });
    },

    // Get single document by ID
    getById: async (docId) => {
      return await fetchDocumentById(collectionName, docId);
    },

    // Create document
    create: async (data, userData, options = {}) => {
      if (requiresAuth && !userData) {
        throw new Error('User data is required for this operation');
      }

      const permissionValidation = validateUserPermissions(userData, 'create', {
        operation: `create_${collectionName}`,
        logWarnings: true,
        requireActive: true
      });

      if (!permissionValidation.isValid) {
        throw new Error(permissionValidation.errors.join(', '));
      }

      return await createDocumentInFirestore(collectionName, data, options);
    },

    // Update document
    update: async (docId, updates, userData, options = {}) => {
      if (requiresAuth && !userData) {
        throw new Error('User data is required for this operation');
      }

      const permissionValidation = validateUserPermissions(userData, 'update', {
        operation: `update_${collectionName}`,
        logWarnings: true,
        requireActive: true
      });

      if (!permissionValidation.isValid) {
        throw new Error(permissionValidation.errors.join(', '));
      }

      return await updateDocumentInFirestore(collectionName, docId, updates, options);
    },

    // Delete document
    delete: async (docId, userData) => {
      if (requiresAuth && !userData) {
        throw new Error('User data is required for this operation');
      }

      const permissionValidation = validateUserPermissions(userData, 'delete', {
        operation: `delete_${collectionName}`,
        logWarnings: true,
        requireActive: true
      });

      if (!permissionValidation.isValid) {
        throw new Error(permissionValidation.errors.join(', '));
      }

      return await deleteDocumentFromFirestore(collectionName, docId);
    },

    // Check if document exists by field
    exists: async (field, value) => {
      return await checkDocumentExists(collectionName, field, value);
    }
  };
};

/**
 * Create standardized RTK Query API with common patterns
 * @param {Object} config - API configuration
 * @returns {Object} RTK Query API configuration
 */
export const createStandardApi = (config) => {
  const {
    reducerPath,
    tagTypes = [],
    cacheConfig = {},
    endpoints = {}
  } = config;

  return {
    reducerPath,
    baseQuery: fakeBaseQuery(),
    tagTypes,
    ...cacheConfig,
    endpoints: (builder) => endpoints(builder)
  };
};

/**
 * Create standardized query endpoint
 * @param {Function} queryFn - Query function
 * @param {Array} providesTags - Cache tags
 * @param {Object} options - Additional options
 * @returns {Object} Query endpoint configuration
 */
export const createQueryEndpoint = (queryFn, providesTags = [], options = {}) => {
  return {
    async queryFn(...args) {
      try {
        const result = await queryFn(...args);
        return { data: result };
      } catch (error) {
        logger.error(`[Query Endpoint] Error:`, error);
        throw error;
      }
    },
    providesTags,
    ...options
  };
};

/**
 * Create standardized mutation endpoint
 * @param {Function} mutationFn - Mutation function
 * @param {Array|Function} invalidatesTags - Cache invalidation tags
 * @param {Object} options - Additional options
 * @returns {Object} Mutation endpoint configuration
 */
export const createMutationEndpoint = (mutationFn, invalidatesTags = [], options = {}) => {
  return {
    async queryFn(...args) {
      try {
        const result = await mutationFn(...args);
        return { data: result };
      } catch (error) {
        logger.error(`[Mutation Endpoint] Error:`, error);
        throw error;
      }
    },
    invalidatesTags,
    ...options
  };
};

/**
 * Create optimistic update configuration
 * @param {string} queryName - Query name to update
 * @param {Function} updateFn - Update function
 * @returns {Object} Optimistic update configuration
 */
export const createOptimisticUpdate = (queryName, updateFn) => {
  return {
    onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
      const patchResult = dispatch(
        queryName.util.updateQueryData(queryName, {}, updateFn)
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
 * Create standardized cache invalidation tags
 * @param {string} type - Tag type
 * @param {string|Array} ids - Tag IDs
 * @returns {Array} Cache tags
 */
export const createCacheTags = (type, ids) => {
  if (Array.isArray(ids)) {
    return ids.map(id => ({ type, id }));
  }
  return [{ type, id: ids }];
};

/**
 * Create standardized error response
 * @param {Error} error - Error object
 * @param {string} operation - Operation name
 * @param {Object} options - Error options
 * @returns {Object} Standardized error response
 */
export const createErrorResponse = (error, operation = 'API Operation', options = {}) => {
  const {
    showToast = false,
    logError = true,
    fallbackMessage = 'An error occurred'
  } = options;

  if (logError) {
    logger.error(`[${operation}] Error:`, error);
  }

  return {
    error: {
      message: error.message || fallbackMessage,
      code: error.code || 'UNKNOWN_ERROR',
      operation,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Create standardized success response
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Standardized success response
 */
export const createSuccessResponse = (data, meta = {}) => {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
};

/**
 * Create standardized validation function
 * @param {Object} rules - Validation rules
 * @returns {Function} Validation function
 */
export const createValidator = (rules) => {
  return (data) => {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      if (rule.required && (!value || value === '')) {
        errors.push(`${field} is required`);
      }
      
      if (rule.minLength && value && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors.push(`${field} must be no more than ${rule.maxLength} characters`);
      }
      
      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      
      if (rule.custom && value) {
        const customError = rule.custom(value, data);
        if (customError) {
          errors.push(customError);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
};

/**
 * Create standardized permission checker
 * @param {Object} permissions - Permission configuration
 * @returns {Function} Permission checker
 */
export const createPermissionChecker = (permissions) => {
  return (userData, operation) => {
    if (!userData) {
      return {
        isValid: false,
        errors: ['User data is required']
      };
    }

    const operationPermissions = permissions[operation];
    if (!operationPermissions) {
      return {
        isValid: false,
        errors: [`Operation '${operation}' not found`]
      };
    }

    const { required = [], requireActive = true } = operationPermissions;

    if (requireActive && !userData.isActive) {
      return {
        isValid: false,
        errors: ['User account is not active']
      };
    }

    const missingPermissions = required.filter(permission => 
      !userData.permissions || !userData.permissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      return {
        isValid: false,
        errors: [`Missing required permissions: ${missingPermissions.join(', ')}`]
      };
    }

    return {
      isValid: true,
      errors: []
    };
  };
};

/**
 * Create standardized cache key generator
 * @param {string} prefix - Cache key prefix
 * @returns {Function} Cache key generator
 */
export const createCacheKeyGenerator = (prefix) => {
  return (...args) => {
    const keyParts = [prefix, ...args.filter(arg => arg !== undefined && arg !== null)];
    return keyParts.join('_');
  };
};

/**
 * Create standardized retry configuration
 * @param {Object} options - Retry options
 * @returns {Object} Retry configuration
 */
export const createRetryConfig = (options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = options;

  return {
    maxRetries,
    baseDelay,
    maxDelay,
    backoffMultiplier,
    retryCondition: (error) => {
      // Retry on network errors, timeouts, and 5xx errors
      return error.code === 'NETWORK_ERROR' || 
             error.code === 'TIMEOUT' || 
             (error.status >= 500 && error.status < 600);
    }
  };
};

/**
 * Create standardized request deduplication
 * @param {string} key - Request key
 * @param {Function} requestFn - Request function
 * @param {Object} options - Deduplication options
 * @returns {Promise} Deduplicated request
 */
export const createDeduplicatedRequest = async (key, requestFn, options = {}) => {
  const {
    ttl = 300000, // 5 minutes default
    maxConcurrent = 10
  } = options;

  return await deduplicateRequest(key, requestFn, ttl, maxConcurrent);
};

/**
 * Create standardized API response wrapper
 * @param {Function} apiFunction - API function
 * @param {string} operation - Operation name
 * @param {Object} options - Wrapper options
 * @returns {Function} Wrapped API function
 */
export const createApiWrapper = (apiFunction, operation, options = {}) => {
  const {
    validateInput = false,
    validateOutput = false,
    retryOnFailure = false,
    logPerformance = false
  } = options;

  return async (...args) => {
    const startTime = logPerformance ? Date.now() : null;
    
    try {
      if (validateInput && options.inputValidator) {
        const validation = options.inputValidator(args[0]);
        if (!validation.isValid) {
          throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
        }
      }

      const result = await apiFunction(...args);
      
      if (validateOutput && options.outputValidator) {
        const validation = options.outputValidator(result);
        if (!validation.isValid) {
          throw new Error(`Output validation failed: ${validation.errors.join(', ')}`);
        }
      }

      if (logPerformance) {
        const duration = Date.now() - startTime;
        logger.log(`[${operation}] Completed in ${duration}ms`);
      }

      return result;
    } catch (error) {
      if (retryOnFailure && options.retryConfig) {
        // Implement retry logic here
        return await retryWithBackoff(apiFunction, args, options.retryConfig);
      }
      
      throw error;
    }
  };
};

/**
 * Create standardized batch operations
 * @param {Array} operations - Array of operations
 * @param {Object} options - Batch options
 * @returns {Promise} Batch operation result
 */
export const createBatchOperations = async (operations, options = {}) => {
  const {
    maxConcurrent = 5,
    stopOnError = false,
    retryFailed = false
  } = options;

  const results = [];
  const errors = [];

  for (let i = 0; i < operations.length; i += maxConcurrent) {
    const batch = operations.slice(i, i + maxConcurrent);
    
    try {
      const batchResults = await Promise.allSettled(
        batch.map(operation => operation())
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            index: i + index,
            error: result.reason
          });
          
          if (stopOnError) {
            throw result.reason;
          }
        }
      });
    } catch (error) {
      if (stopOnError) {
        throw error;
      }
    }
  }

  return {
    results,
    errors,
    successCount: results.length,
    errorCount: errors.length
  };
};
