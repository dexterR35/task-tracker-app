import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { getCurrentUserInfo } from "@/features/auth/authSlice";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
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
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import listenerManager from "@/features/utils/firebaseListenerManager";
import { handleApiError } from "@/features/utils/errorHandling";
import { createMidnightScheduler } from "@/utils/midnightScheduler";
import { 
  withAuthentication,
  withApiErrorHandling
} from "@/utils/apiUtils";
import { validateUserPermissions } from "@/features/utils/authUtils";

import {
  formatMonth,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
  getCurrentYear,
} from "@/utils/dateUtils";
import { isUserAdmin, canAccessTasks, isUserActive } from "@/features/utils/authUtils";

// Month utility functions are now imported from monthUtils.jsx

// REMOVED: getYearFromMonthId - not used anywhere

// Helper functions for Firestore references - always use current year
const getTaskRef = (monthId, taskId = null) => {
  const yearId = getCurrentYear();
  const basePath = ["departments", "design", yearId, monthId, "taskdata"];

  if (taskId) {
    return doc(db, ...basePath, taskId); // Individual task
  } else {
    return collection(db, ...basePath); // Task collection
  }
};

const getMonthRef = (monthId) => {
  // Based on the actual database structure: /departments/design/2025/2025-09/
  const yearId = monthId.split('-')[0]; // Extract year from monthId (e.g., "2025" from "2025-09")
  return doc(db, "departments", "design", yearId, monthId); // Month document
};

const getMonthsRef = (yearId = null) => {
  // Based on the actual database structure: /departments/design/{year}/
  // If yearId is provided, return collection for that year, otherwise return current year
  const targetYear = yearId || getCurrentYear();
  return collection(db, "departments", "design", targetYear); // Year collection under design department
};

// API Configuration
const API_CONFIG = {
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 500,
    USER_QUERY_LIMIT: 1,
  },
};

// Helper function to validate user permissions consistently
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

// Helper function to build task query with user filtering
  const buildTaskQuery = (tasksRef, role, userId) => {
    if (role === "user" && userId) {
      // TEMPORARY: For debugging, let's fetch all tasks and filter in the app
      // This will help us see what userUID values are actually in the tasks
      return fsQuery(tasksRef); // Remove the where clause temporarily
    } else if (role === "admin" && userId) {
      // Admin users: specific user's tasks when selected
      return fsQuery(tasksRef, where("userUID", "==", userId));
    } else {
      // Admin users: all tasks (no filtering)
      return fsQuery(tasksRef);
    }
  };

// Helper function to handle reporter name resolution
const resolveReporterName = (reporters, reporterId, reporterName) => {
  if (reporterId && !reporterName) {
    // Check ONLY reporterUID since that's what we're using as the value (case-insensitive)
    const selectedReporter = reporters.find(r => 
      r.reporterUID && r.reporterUID.toLowerCase() === reporterId.toLowerCase()
    );
    
    if (selectedReporter) {
      return selectedReporter.name || selectedReporter.reporterName;
    } else {
      console.error('resolveReporterName - Reporter not found for ID:', reporterId);
      console.error('resolveReporterName - Available reporter IDs:', reporters.map(r => r.id));
      console.error('resolveReporterName - Available reporterUIDs:', reporters.map(r => r.reporterUID));
      console.error('resolveReporterName - Available UIDs:', reporters.map(r => r.uid));
      console.error('resolveReporterName - Full reporter objects:', reporters);
      throw new Error("Reporter not found for the selected reporter ID");
    }
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
      async queryFn({ monthId, userId, role, userData }) {
        // Use consistent cache key for all users viewing the same month
        // This ensures cache invalidation works across different user sessions
        const cacheKey = `getMonthTasks_${monthId}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            console.log('🔍 getMonthTasks API called:', { monthId, userId, role });
            
            if (!monthId) {
              console.log('❌ No monthId provided');
              return { data: [] };
            }

          // Permission validation handled by UI components

          const yearId = getCurrentYear();
          // Check if month board exists
          const monthDocRef = getMonthRef(monthId);
          const monthDoc = await getDoc(monthDocRef);

          console.log('📅 Month board check:', { 
            monthId, 
            boardExists: monthDoc.exists(),
            yearId 
          });

          if (!monthDoc.exists()) {
            console.log('❌ Month board does not exist for:', monthId);
            return { data: [] };
          }


          // Fetch tasks for the month
          const tasksRef = getTaskRef(monthId);
          let tasksQuery = fsQuery(tasksRef);

          // Apply user filtering based on role using helper function
          tasksQuery = buildTaskQuery(tasksRef, role, userId);

          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map((doc) => ({
            id: doc.id,
            monthId: monthId,
            ...serializeTimestampsForRedux(doc.data()),
          }));

          console.log('📋 Tasks fetched:', { 
            monthId, 
            tasksCount: tasks.length,
            userId,
            role,
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
            (arg.userId && arg.userId === currentUserUID);

          if (
            !isValidRole ||
            (!isUserAdmin(arg.userData) && !arg.userId) ||
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
          const taskLimit =
            arg.limitCount || API_CONFIG.REQUEST_LIMITS.TASKS_PER_MONTH;
          // Build query - ALL users listen to ALL tasks for real-time updates
          // Filtering happens in the UI, not in the Firestore query
          const query = fsQuery(colRef, limit(taskLimit));
          const taskListenerKey = `tasks_${arg.monthId}_all`;
          unsubscribe = listenerManager.addListener(taskListenerKey, () => {
            listenerManager.updateActivity();

            return onSnapshot(
              query,
              (snapshot) => {
                if (!snapshot || !snapshot.docs || snapshot.empty) {
                  updateCachedData(() => []);
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

                console.log('Real-time update: tasks count:', tasks.length);
                console.log('Real-time update: updating cache for monthId:', arg.monthId);
                listenerManager.updateActivity();
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
