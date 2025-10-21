/**
 * Tasks API Slice
 * 
 * @fileoverview RTK Query API for task management with role-based access control
 * @author Senior Developer
 * @version 2.0.0
 */

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
// ============================================================================
// IMPORTS (Optimized - unused imports removed)
// ============================================================================
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { getCurrentUserInfo } from "@/features/auth/authSlice";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import firestoreUsageTracker from "@/utils/firestoreUsageTracker";
import {
  collection,
  query as fsQuery,
  orderBy,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  limit,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import listenerManager from "@/features/utils/firebaseListenerManager";
import { handleApiError } from "@/features/utils/errorHandling";
import { 
  withApiErrorHandling
} from "@/utils/apiUtils";
import { validateUserPermissions } from "@/features/utils/authUtils";

import {
  formatMonth,
  getStartOfMonth,
  getEndOfMonth,
  getCurrentYear,
} from "@/utils/dateUtils";
import { isUserAdmin, canAccessTasks, isUserActive } from "@/features/utils/authUtils";

// Month utility functions are now imported from monthUtils.jsx

// REMOVED: getYearFromMonthId - not used anywhere

/**
 * Helper functions for Firestore references - always use current year
 */

/**
 * Get Firestore reference for tasks (collection or individual document)
 * @param {string} monthId - Month identifier (e.g., "2025-01")
 * @param {string|null} taskId - Optional task ID for individual task
 * @returns {DocumentReference|CollectionReference} - Firestore reference
 */
const getTaskRef = (monthId, taskId = null) => {
  const yearId = getCurrentYear();
  const basePath = ["departments", "design", yearId, monthId, "taskdata"];

  if (taskId) {
    return doc(db, ...basePath, taskId); // Individual task
  } else {
    return collection(db, ...basePath); // Task collection
  }
};

/**
 * Get Firestore reference for a specific month document
 * @param {string} monthId - Month identifier (e.g., "2025-01")
 * @returns {DocumentReference} - Month document reference
 */
const getMonthRef = (monthId) => {
  // Based on the actual database structure: /departments/design/2025/2025-09/
  const yearId = monthId.split('-')[0]; // Extract year from monthId (e.g., "2025" from "2025-09")
  return doc(db, "departments", "design", yearId, monthId); // Month document
};

/**
 * Get Firestore reference for months collection
 * @param {string|null} yearId - Optional year ID, defaults to current year
 * @returns {CollectionReference} - Months collection reference
 */
const getMonthsRef = (yearId = null) => {
  // Based on the actual database structure: /departments/design/{year}/
  // If yearId is provided, return collection for that year, otherwise return current year
  const targetYear = yearId || getCurrentYear();
  return collection(db, "departments", "design", targetYear); // Year collection under design department
};

/**
 * API Configuration constants
 */
const API_CONFIG = {
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 500,
    USER_QUERY_LIMIT: 1,
  },
  CACHE_DURATION: {
    TASKS: 5 * 60 * 1000, // 5 minutes
    MONTHS: 10 * 60 * 1000, // 10 minutes
  },
};

/**
 * Validate user permissions for task operations
 * @param {Object} userData - User data object
 * @param {string} operation - Operation being performed
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
const validateTaskPermissions = (userData, operation) => {
  if (!userData) {
    return { isValid: false, errors: ['User data is required'] };
  }
  
  return validateUserPermissions(userData, operation, {
    operation: `task_${operation}`,
    logWarnings: true,
    requireActive: true
  });
};

/**
 * Build Firestore query for tasks based on user role and permissions
 * @param {CollectionReference} tasksRef - Tasks collection reference
 * @param {string} role - User role (admin, user)
 * @param {string|null} userUID - Optional user UID for filtering
 * @returns {Query} - Firestore query
 */
const buildTaskQuery = (tasksRef, role, userUID) => {
  if (role === "user") {
    // Regular users: fetch only their own tasks
    return fsQuery(tasksRef, where("userUID", "==", userUID));
  } else if (role === "admin" && userUID) {
    // Admin users: specific user's tasks when a user is selected
    return fsQuery(tasksRef, where("userUID", "==", userUID));
  } else {
    // Admin users: all tasks when no specific user is selected
    return fsQuery(tasksRef);
  }
};

// Helper function to handle reporter name resolution with security validation
const resolveReporterName = (reporters, reporterId, reporterName) => {
  // Security: Validate inputs
  if (!reporters || !Array.isArray(reporters)) {
    throw new Error("Invalid reporters data provided");
  }
  
  if (!reporterId || typeof reporterId !== 'string') {
    return reporterName; // Return existing name if no valid ID
  }
  
  // Security: Sanitize reporterId to prevent injection
  const sanitizedReporterId = reporterId.trim().toLowerCase();
  if (sanitizedReporterId.length === 0 || sanitizedReporterId.length > 100) {
    throw new Error("Invalid reporter ID format");
  }
  
  if (reporterId && !reporterName) {
    // Security: Validate reporter exists and is authorized
    const selectedReporter = reporters.find(r => {
      if (!r || typeof r !== 'object') return false;
      return r.reporterUID && 
             typeof r.reporterUID === 'string' && 
             r.reporterUID.toLowerCase() === sanitizedReporterId;
    });
    
    if (selectedReporter) {
      // Security: Validate and sanitize reporter name
      const name = selectedReporter.name || selectedReporter.reporterName;
      if (name && typeof name === 'string' && name.trim().length > 0) {
        return name.trim().substring(0, 100); // Limit length to prevent abuse
      }
    }
    
    // Security: Don't expose internal data in error messages
    throw new Error("Reporter not found for the selected ID");
  }
  
  return reporterName;
};

// Helper function for consistent cache invalidation
const getTaskCacheTags = (monthId) => [
  { type: "CurrentMonth", id: "ENHANCED" },
  { type: "Tasks", id: "LIST" },
  { type: "MonthTasks", id: monthId },
  { type: "Analytics", id: "LIST" },
  { type: "MonthTasks", id: "LIST" },
  { type: "MonthTasks", id: "ALL" },
  { type: "CurrentMonth", id: "ALL" },
];

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthTasks", "Tasks", "Analytics"],
  ...getCacheConfigByType("TASKS"),
  endpoints: (builder) => ({
    // Real-time fetch for tasks - optimized for month changes and CRUD operations
    getMonthTasks: builder.query({
      async queryFn({ monthId, userUID, role, userData }) {
        // Use consistent cache key for all users viewing the same month
        // This ensures cache invalidation works across different user sessions
        const cacheKey = `getMonthTasks_${monthId}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            logger.log('🔍 getMonthTasks API called:', { 
              monthId, 
              userUID: userUID || 'ALL_USERS', 
              role,
              queryType: userUID ? 'SPECIFIC_USER' : 'ALL_USERS'
            });
            
            if (!monthId) {
              logger.warn('❌ No monthId provided');
              return { data: [] };
            }

          // Permission validation handled by UI components

          const yearId = getCurrentYear();
          // Check if month board exists
          const monthDocRef = getMonthRef(monthId);
          const monthDoc = await getDoc(monthDocRef);

          logger.log('📅 Month board check:', { 
            monthId, 
            boardExists: monthDoc.exists(),
            yearId 
          });

          if (!monthDoc.exists()) {
            logger.warn('❌ Month board does not exist for:', monthId);
            return { data: [] };
          }


          // Fetch tasks for the month
          const tasksRef = getTaskRef(monthId);
          let tasksQuery = fsQuery(tasksRef);

          // Apply user filtering based on role using helper function
          tasksQuery = buildTaskQuery(tasksRef, role, userUID);

          const tasksSnapshot = await getDocs(tasksQuery);
          
          // Track Firestore usage - count actual documents read
          const documentsRead = tasksSnapshot.docs.length;
          firestoreUsageTracker.trackQuery(`tasks_${monthId}`, documentsRead);
          
          // Also track the month document read
          firestoreUsageTracker.trackDocumentRead(`months/${monthId}`);
          
          const tasks = tasksSnapshot.docs.map((doc) => ({
            id: doc.id,
            monthId: monthId,
            ...serializeTimestampsForRedux(doc.data()),
          }));

          logger.log('📋 Tasks fetched:', { 
            monthId, 
            tasksCount: tasks.length,
            userUID: userUID || 'ALL_USERS',
            role,
            queryType: userUID ? 'SPECIFIC_USER' : 'ALL_USERS',
            tasks: tasks.map(t => ({ id: t.id, userUID: t.userUID }))
          });

          return { data: tasks };
        } catch (error) {
          logger.error(
            `[getMonthTasks] Error fetching tasks for ${monthId}:`,
            error
          );
          return { error: { message: error.message } };
        }
        }, 'TasksAPI');
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe = null;

        try {
          await cacheDataLoaded;

          if (!arg.monthId) {
            return;
          }

          // Validate user access
          if (
            !arg.userData ||
            !isUserActive(arg.userData) ||
            !canAccessTasks(arg.userData)
          ) {
            return;
          }

          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return;
          }

          const currentUserUID = currentUser.uid;
          const isValidRole = ["admin", "user"].includes(arg.role);
          const canAccessThisUser =
            isUserAdmin(arg.userData) ||
            (arg.userUID && arg.userUID === currentUserUID);

          if (
            !isValidRole ||
            (!isUserAdmin(arg.userData) && !arg.userUID) ||
            !canAccessThisUser
          ) {
            return;
          }

          const monthDocRef = getMonthRef(arg.monthId);
          const monthDoc = await getDoc(monthDocRef);
          if (!monthDoc.exists()) {
            return;
          }

          const colRef = getTaskRef(arg.monthId);
          // OPTIMIZED: Very strict limit to prevent excessive reads
          const query = fsQuery(colRef, limit(25)); // Reduced from 50 to 25
          const taskListenerKey = `tasks_${arg.monthId}_all`;
          
          // Add throttling to prevent rapid re-renders and excessive updates
          let updateTimeout = null;
          let lastUpdate = 0;
          const THROTTLE_MS = 1000; // 1 second between updates (faster but still throttled)
          
          const throttledUpdate = (tasks) => {
            const now = Date.now();
            if (now - lastUpdate < THROTTLE_MS) {
              if (updateTimeout) clearTimeout(updateTimeout);
              updateTimeout = setTimeout(() => {
                updateCachedData(() => tasks);
                lastUpdate = Date.now();
              }, THROTTLE_MS - (now - lastUpdate));
            } else {
              updateCachedData(() => tasks);
              lastUpdate = now;
            }
          };

          unsubscribe = listenerManager.addListener(taskListenerKey, () => {
            listenerManager.updateActivity();

            return onSnapshot(
              query,
              (snapshot) => {
                // Track real-time listener reads
                if (snapshot && snapshot.docs) {
                  firestoreUsageTracker.trackListener(`tasks_${arg.monthId}`, snapshot.docs.length);
                }
                
                if (!snapshot || !snapshot.docs || snapshot.empty) {
                  throttledUpdate([]);
                  return;
                }

                const validDocs = snapshot.docs.filter(
                  (doc) => doc && doc.exists() && doc.data() && doc.id
                );

                const tasks = validDocs
                  .map((d) =>
                    serializeTimestampsForRedux({
                      id: d.id,
                      monthId: arg.monthId,
                      ...d.data(),
                    })
                  )
                  .filter((task) => task !== null);

                // Apply user filtering in the listener to reduce data processing
                const filteredTasks = tasks.filter((task) => {
                  if (arg.role === "user") {
                    return task.userUID === arg.userUID;
                  } else if (arg.role === "admin" && arg.userUID) {
                    return task.userUID === arg.userUID;
                  }
                  return true; // Admin viewing all tasks
                });

                throttledUpdate(filteredTasks);
              },
              (error) => {
                logger.error("Real-time subscription error:", error);
                throttledUpdate([]);
              }
            );
          });

          await cacheEntryRemoved;
        } catch (error) {
          logger.error("Error setting up real-time subscription:", error);
        } finally {
          if (unsubscribe) {
            unsubscribe();
          }
          const taskListenerKey = `tasks_${arg.monthId}_all`;
          const boardListenerKey = `board_tasks_${arg.monthId}`;
          listenerManager.removeListener(taskListenerKey);
          listenerManager.removeListener(boardListenerKey);
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId },
        { type: "Tasks", id: "LIST" },
        { type: "Analytics", id: "LIST" },
        // Invalidate all month tasks queries to ensure real-time updates
        { type: "MonthTasks", id: "LIST" },
      ],
    }),

    // Create task with transaction for atomic operations
    createTask: builder.mutation({
      async queryFn({ task, userData, reporters = [] }) {
        try {
          const monthId = task.monthId;

          // SECURITY: Validate user permissions at API level
          const permissionValidation = validateTaskPermissions(userData, 'create_task');
          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          const currentUser = getCurrentUserInfo();

          // Business logic validation - check month ID

          if (!monthId) {
            return { error: { message: "Month ID is required" } };
          }
          // Get month document to retrieve boardId
          const monthDocRef = getMonthRef(monthId);
          const monthDoc = await getDoc(monthDocRef);
          if (!monthDoc.exists()) {
            throw new Error(
              "Month board not available. Please contact an administrator to generate the month board for this period, or try selecting a different month."
            );
          }

          const boardData = monthDoc.data();
          const boardId = boardData?.boardId;

          if (!boardId) {
            throw new Error(
              "Month board is missing boardId. Please contact an administrator to regenerate the month board."
            );
          }

          const colRef = getTaskRef(monthId);
          const currentUserUID = currentUser.uid;
          const currentUserName = userData.name;
          const createdAt = serverTimestamp();
          const updatedAt = createdAt; // For new tasks, updatedAt equals createdAt

            // Auto-add reporter name if we have reporter ID but no name
            if (task.reporters && !task.reporterName) {
            task.reporterName = resolveReporterName(reporters, task.reporters, task.reporterName);
          }

          // Create final document data with the new structure
          const documentData = {
            data_task: task, // Use processed task data directly
            userUID: currentUserUID,
            monthId: monthId,
            boardId: boardId,
            createbyUID: currentUserUID,
            createdByName: currentUserName,
            updatedAt: updatedAt,
            createdAt: createdAt,
          };

          if (!documentData.userUID || !documentData.monthId) {
            throw new Error(
              "Invalid task data: missing required fields (userUID or monthId)"
            );
          }
          const ref = await addDoc(colRef, documentData);
          
          // Create result with serialized timestamps for Redux
          const result = {
            id: ref.id,
            monthId,
            ...documentData,
          };

          return { data: serializeTimestampsForRedux(result) };
        } catch (error) {
          return withApiErrorHandling(() => { throw error; }, "Create Task")(error);
        }
      },
        invalidatesTags: (result, error, { task }) => {
          // Only invalidate specific month tasks - real-time listeners handle updates
          return [
            { type: "MonthTasks", id: task.monthId }
          ];
        },
    }),
    // Update task - simple Firestore update
    updateTask: builder.mutation({
      async queryFn({ monthId, taskId, updates, reporters = [], userData }) {
        try {
          // SECURITY: Validate user permissions at API level
          const permissionValidation = validateTaskPermissions(userData, 'update_task');
          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          // Simple update - just update the document
          const taskRef = getTaskRef(monthId, taskId);
          // Auto-add reporter name if we have reporter ID but no name
          if (updates.reporters && !updates.reporterName) {
            updates.reporterName = resolveReporterName(reporters, updates.reporters, updates.reporterName);
          }
          
          // Structure the updates with data_task wrapper
          const updatesWithTimestamp = {
            data_task: updates, // Wrap updates in data_task
            updatedAt: serverTimestamp(),
          };

          await updateDoc(taskRef, updatesWithTimestamp);
          
          // Return serialized result for Redux
          const result = { id: taskId, monthId, success: true };
          return { data: serializeTimestampsForRedux(result) };
        } catch (error) {
          return withApiErrorHandling(() => { throw error; }, "Update Task")(error);
        }
      },
        invalidatesTags: (result, error, { monthId }) => {
          // Only invalidate specific month tasks - real-time listeners handle updates
          return [
            { type: "MonthTasks", id: monthId }
          ];
        },
    }),

    // Delete task - simple Firestore delete
    deleteTask: builder.mutation({
        async queryFn({ monthId, taskId, userData }) {
          try {
            // SECURITY: Validate user permissions at API level
          const permissionValidation = validateTaskPermissions(userData, 'delete_task');
          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          // Delete the task document
          const taskRef = getTaskRef(monthId, taskId);
            await deleteDoc(taskRef);

            return { data: { id: taskId, monthId } };
        } catch (error) {
          console.error('Error deleting task:', error);
          return withApiErrorHandling(() => { throw error; }, "Delete Task")(error);
        }
      },
        invalidatesTags: (result, error, { monthId }) => {
          // Only invalidate specific month tasks - real-time listeners handle updates
          return [
            { type: "MonthTasks", id: monthId }
          ];
        },
    }),




  }),
});

export const {
  useGetMonthTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
