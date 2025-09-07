import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

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
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import listenerManager from "@/features/utils/firebaseListenerManager";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { handleApiError, ERROR_TYPES } from "@/features/utils/errorHandling";
// Constants moved to specific feature files
import { serializeTimestampsForRedux } from "@/utils/dateUtils";

// API Configuration - moved from constants.js
const API_CONFIG = {
  // Request limits
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 500,    // Maximum tasks to fetch per month
    DEBUG_TASKS_LIMIT: 10,   // Limit for debug queries
    USER_QUERY_LIMIT: 1      // Limit for single user queries
  }
};

// Firebase Configuration - moved from constants.js
const FIREBASE_CONFIG = {
  // Collection names
  COLLECTIONS: {
    USERS: 'users',
    TASKS: 'tasks',
    REPORTERS: 'reporters',
    MONTH_TASKS: 'monthTasks'
  },
  
  // Field names
  FIELDS: {
    USER_UID: 'userUID',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    MONTH_ID: 'monthId'
  },
  
  // Query constraints
  QUERY_LIMITS: {
    MAX_QUERY_RESULTS: 1000,
    DEFAULT_ORDER_LIMIT: 100
  }
};

// Helper function to get current user data from Firestore with caching
const getCurrentUserData = async () => {
  if (!auth.currentUser) {
    return null;
  }
  
  const cacheKey = `currentUser_${auth.currentUser.uid}`;
  return await deduplicateRequest(cacheKey, async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return null;
      }
      return userSnap.data();
    } catch (error) {
      logger.error("Error fetching current user data:", error);
      return null;
    }
  });
};

// Helper function to check if user has specific permission
const hasPermission = (userData, permission) => {
  if (!userData || !userData.permissions) return false;
  return userData.permissions.includes(permission);
};






export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthTasks"],
  // Cache optimization settings - using shared configuration
  ...getCacheConfigByType('TASKS'),
  endpoints: (builder) => ({

    // Real-time fetch for tasks - optimized for month changes and CRUD operations
    getMonthTasks: builder.query({
      async queryFn() {
        // Return initial empty state - onSnapshot listener will populate the cache
        // Parameters are handled in onCacheEntryAdded
        return { data: [] };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe = null;

        try {
          await cacheDataLoaded;
          
          // Check if monthId is valid before setting up subscription
          if (!arg.monthId) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: monthId is null or undefined`);
            return;
          }

          // Authentication and validation checks
          if (!auth.currentUser) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: User not authenticated`);
            return;
          }

          const currentUserUID = auth.currentUser.uid;

          // Get current user data for validation
          const userData = await getCurrentUserData();
          if (!userData) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: User data not found`);
            return;
          }

          // Validate user is active
          if (userData.isActive === false) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: Account is deactivated`);
            return;
          }

          // Validate role parameter
          const isValidRole = ['admin', 'user'].includes(arg.role);
          if (!isValidRole) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: Invalid role parameter`);
            return;
          }

          // Validate that both userUID and role are provided for proper filtering
          if (!arg.userId) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: userId is required for both admin and user roles`);
            return;
          }

          logger.log(`[Tasks API] User validation passed:`, {
            userId: arg.userId,
            role: arg.role,
            currentUserUID,
            userData: {
              userUID: userData.userUID,
              role: userData.role,
              permissions: userData.permissions,
              isActive: userData.isActive
            }
          });

          // Security check: Ensure user can only access their own data (for non-admin)
          const canAccessThisUser = (arg.role === 'admin') || (arg.userId === currentUserUID);
          
          logger.log(`[Tasks API] Security check:`, {
            argUserId: arg.userId,
            currentUserUID,
            role: arg.role,
            canAccessThisUser,
            isAdmin: arg.role === 'admin',
            userIdMatch: arg.userId === currentUserUID
          });
          
          if (!canAccessThisUser) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: Access denied - cannot access other user's data`);
            return;
          }

          // Check if user has permission to view tasks
          const hasTaskAccess = hasPermission(userData, 'view_task') || 
                               hasPermission(userData, 'view_tasks') || 
                               hasPermission(userData, 'create_task') || 
                               hasPermission(userData, 'update_task') || 
                               hasPermission(userData, 'delete_task');
          if (!hasTaskAccess) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: No task access permissions`);
            return;
          }
          
          // Check if board exists before setting up task subscription
          const monthDocRef = doc(db, FIREBASE_CONFIG.COLLECTIONS.TASKS, arg.monthId);
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            logger.log(`[Tasks API] Board ${arg.monthId} does not exist, setting up board listener first`);
            logger.warn(`[Tasks API] MONTH BOARD MISSING: ${arg.monthId} - This is why no tasks are showing!`);
            
            // Set up board listener to restart task subscription when board is created
            const boardListenerKey = `board_tasks_${arg.monthId}`;
            const boardUnsubscribe = listenerManager.addListener(boardListenerKey, () => {
              return onSnapshot(monthDocRef, (doc) => {
                if (doc.exists()) {
                  logger.log(`[Tasks API] Board ${arg.monthId} created, restarting task subscription`);
                  // Board was created, restart the task subscription
                  if (unsubscribe) {
                    unsubscribe();
                  }
                  // The subscription will be restarted by the component
                  return;
                }
              });
            });
            
            // Return early - no task subscription until board exists
            return;
          }
          
          // Set up task listener with role-based filtering
          const colRef = collection(db, FIREBASE_CONFIG.COLLECTIONS.TASKS, arg.monthId, FIREBASE_CONFIG.COLLECTIONS.MONTH_TASKS);
          
          // Single limit for all use cases - optimized for 300-400 tasks/month
          const taskLimit = arg.limitCount || API_CONFIG.REQUEST_LIMITS.TASKS_PER_MONTH;
          
          let query = fsQuery(colRef, orderBy("createdAt", "desc"), limit(taskLimit));

          // Role-based filtering logic:
          // Admin Role: role === 'admin' + userUID → Fetches ALL tasks (ignores userUID filter)
          // User Role: role === 'user' + userUID → Fetches only tasks where userUID matches their ID
          // Both userUID and role parameters are required for proper filtering
          const userFilter = arg.role === 'admin' ? null : (arg.userId || currentUserUID);

          // Apply user filtering
          if (userFilter && userFilter.trim() !== "") {
            query = fsQuery(
              colRef,
              where("userUID", "==", userFilter),
              orderBy("createdAt", "desc"),
              limit(taskLimit)
            );
            logger.log(`[Tasks API] Applied user filter:`, {
              userFilter,
              query: `where("userUID", "==", "${userFilter}")`
            });
          } else {
            logger.log(`[Tasks API] No user filter applied (admin mode)`);
          }

          // logger.log(`[Tasks API] Setting up real-time task listener for ${arg.monthId}`);
          logger.log(`[Tasks API] Query parameters:`, { 
            monthId: arg.monthId, 
            userId: arg.userId, 
            role: arg.role, 
            limitCount: arg.limitCount,
            userFilter,
            taskLimit,
            filteringLogic: arg.role === 'admin' ? 'ALL_TASKS' : 'USER_SPECIFIC_TASKS'
          });
          // logger.log(`[Tasks API] About to start onSnapshot listener...`);

          // Debug: Check what tasks exist in the database (without filtering)
          try {
            const debugQuery = fsQuery(colRef, orderBy("createdAt", "desc"), limit(API_CONFIG.REQUEST_LIMITS.DEBUG_TASKS_LIMIT));
            const debugSnap = await getDocs(debugQuery);
            logger.log(`[Tasks API] Debug - All tasks in database:`, {
              totalDocs: debugSnap.docs.length,
              tasks: debugSnap.docs.map(doc => ({
                id: doc.id,
                userUID: doc.data().userUID,
                taskName: doc.data().taskName
              }))
            });
          } catch (debugError) {
            logger.error(`[Tasks API] Debug query failed:`, debugError);
          }

          // Use centralized listener manager for task subscription
          const taskListenerKey = `tasks_${arg.monthId}_${arg.role}_${arg.userId || 'all'}`;
          unsubscribe = listenerManager.addListener(taskListenerKey, () => {
            return onSnapshot(
              query,
              (snapshot) => {
                logger.log(`[tasksApi] Real-time snapshot received for ${arg.monthId}:`, {
                hasSnapshot: !!snapshot,
                hasDocs: !!(snapshot && snapshot.docs),
                docCount: snapshot?.docs?.length || 0,
                isEmpty: snapshot?.empty || false,
                hasChanges: snapshot?.docChanges?.length || 0
              });

              // Process all updates immediately for real-time experience
              if (!snapshot || !snapshot.docs) {
                logger.log(`[tasksApi] No snapshot or docs, setting empty array`);
                updateCachedData(() => []);
                return;
              }

              if (snapshot.empty) {
                logger.log(`[tasksApi] Snapshot is empty, setting empty array`);
                updateCachedData(() => []);
                return;
              }

              const validDocs = snapshot.docs.filter(
                (doc) => doc && doc.exists() && doc.data() && doc.id
              );

              const tasks = validDocs
                .map((d) => serializeTimestampsForRedux({ id: d.id, monthId: arg.monthId, ...d.data() }))
                .filter((task) => task !== null);

              // logger.log(`[tasksApi] Real-time subscription update: ${tasks.length} tasks for ${arg.monthId}`);
              logger.log(`[tasksApi] Real-time update - Tasks:`, tasks.map(t => ({ 
                id: t.id, 
                taskName: t.taskName, 
                userUID: t.userUID,
                createdAt: t.createdAt 
              })));
              // logger.log(`[tasksApi] Filtering info:`, {
              //   userFilter,
              //   role: arg.role,
              //   userId: arg.userId,
              //   currentUserUID
              // });
              
              // Tasks are ready for Redux
              updateCachedData(() => tasks);

              },
              (error) => {
                logger.error("Real-time subscription error:", error);
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
          // Clean up listeners using centralized manager
          const taskListenerKey = `tasks_${arg.monthId}_${arg.role}_${arg.userId || 'all'}`;
          const boardListenerKey = `board_tasks_${arg.monthId}`;
          listenerManager.removeListener(taskListenerKey);
          listenerManager.removeListener(boardListenerKey);
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId }
      ],
    }),


    // Create task with transaction for atomic operations
    createTask: builder.mutation({
      async queryFn(task, { getState }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }
          
          // Get current user data and check permissions
          const userData = await getCurrentUserData();
          if (!userData) {
            return { error: { message: "User data not found" } };
          }
          
          // Check if user has permission to create tasks
          if (!hasPermission(userData, 'create_task')) {
            return { error: { message: "Permission denied: You don't have permission to create tasks" } };
          }
          
          // Use task's monthId - should always be provided by the component
          const monthId = task.monthId;
          
          if (!monthId) {
            return { error: { message: "Month ID is required" } };
          }
          
          // Use transaction to ensure atomic operations
          const result = await runTransaction(db, async (transaction) => {
            // Read operation first: Check if board exists
            const monthDocRef = doc(db, "tasks", monthId);
            const monthDoc = await transaction.get(monthDocRef);

            if (!monthDoc.exists()) {
              throw new Error("Month board not generated");
            }
            // Write operation: Create the task
            const colRef = collection(db, "tasks", monthId, "monthTasks");
            const payload = {
              ...task,
              monthId: monthId, // Use the determined monthId
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            const ref = await addDoc(colRef, payload);
            // Read back the saved doc to resolve server timestamps
            const savedSnap = await getDoc(ref);
            const created = serializeTimestampsForRedux({ 
              id: ref.id, 
              monthId, 
              ...savedSnap.data() 
            });
            return created;
          });

          logger.log("Task created successfully, real-time subscription will update cache automatically");
          logger.log(`[tasksApi] Created task:`, { 
            id: result.id, 
            monthId: result.monthId,
            taskName: result.taskName,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
          });
          logger.log(`[tasksApi] Task creation completed - real-time listener should detect this change`);

          return { data: result };
        } catch (error) {
          const errorResponse = handleApiError(error, 'Create Task', { showToast: false, logError: true });
          return { error: errorResponse };
        }
      },
      invalidatesTags: [], // Don't invalidate cache - let real-time subscription handle updates
    }),

    // Update task with transaction
    updateTask: builder.mutation({
      async queryFn({ monthId, id, updates }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Get current user data and check permissions
          const userData = await getCurrentUserData();
          if (!userData) {
            return { error: { message: "User data not found" } };
          }
          
          // Check if user has permission to update tasks
          if (!hasPermission(userData, 'update_task')) {
            return { error: { message: "Permission denied: You don't have permission to update tasks" } };
          }

          // Use transaction for atomic update
          await runTransaction(db, async (transaction) => {
            // Read operation first: Get current task
            const taskRef = doc(db, "tasks", monthId, "monthTasks", id);
            const taskDoc = await transaction.get(taskRef);

            if (!taskDoc.exists()) {
              throw new Error("Task not found");
            }

            // Write operation: Update the task
            const updatesWithMonthId = {
              ...updates,
              monthId: monthId,
              updatedAt: serverTimestamp(),
            };

            transaction.update(taskRef, updatesWithMonthId);
          });

          logger.log("Task updated successfully, real-time subscription will update cache automatically");

          return { data: { id, monthId, success: true } };
        } catch (error) {
          const errorResponse = handleApiError(error, 'Update Task', { showToast: false, logError: true });
          return { error: errorResponse };
        }
      },
      invalidatesTags: [], // Don't invalidate cache - let real-time subscription handle updates
    }),

    // Delete task with transaction
    deleteTask: builder.mutation({
      async queryFn({ monthId, id }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Get current user data and check permissions
          const userData = await getCurrentUserData();
          if (!userData) {
            return { error: { message: "User data not found" } };
          }
          
          // Check if user has permission to delete tasks
          if (!hasPermission(userData, 'delete_task')) {
            return { error: { message: "Permission denied: You don't have permission to delete tasks" } };
          }

          // Use transaction for atomic delete
          await runTransaction(db, async (transaction) => {
            // Read operation first: Check if task exists
            const taskRef = doc(db, "tasks", monthId, "monthTasks", id);
            const taskDoc = await transaction.get(taskRef);

            if (!taskDoc.exists()) {
              throw new Error("Task not found");
            }

            // Write operation: Delete the task
            transaction.delete(taskRef);
          });

          logger.log("Task deleted successfully, real-time subscription will update cache automatically");

          return { data: { id, monthId } };
        } catch (error) {
          const errorResponse = handleApiError(error, 'Delete Task', { showToast: false, logError: true });
          return { error: errorResponse };
        }
      },
      invalidatesTags: [], // Don't invalidate cache - let real-time subscription handle updates 
    }),


  }),
});

export const {
  useGetMonthTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
