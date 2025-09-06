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
import { normalizeTimestamp } from "@/utils/dateUtils";
import { logger } from "@/utils/logger";

// Helper function to get current user data from Firestore
const getCurrentUserData = async () => {
  if (!auth.currentUser) {
    return null;
  }
  
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
};

// Helper function to check if user has specific permission
const hasPermission = (userData, permission) => {
  if (!userData || !userData.permissions) return false;
  return userData.permissions.includes(permission);
};

// Helper function to check if user can generate charts
const canGenerateCharts = (userData) => {
  return hasPermission(userData, 'generate_charts');
};

// Simple task normalization with proper serialization for Redux
const normalizeTask = (monthId, id, data) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  // Normalize timestamps to Date objects and convert to ISO strings for Redux
  const createdAt = normalizeTimestamp(data.createdAt);
  const updatedAt = normalizeTimestamp(data.updatedAt);
  
  const timeInHours = Number(data.timeInHours) || 0;
  const timeSpentOnAI = Number(data.timeSpentOnAI) || 0;
  // Always use arrays - empty array if not selected
  const deliverablesOther = Array.isArray(data.deliverablesOther)
    ? data.deliverablesOther
    : [];
  const aiModels = Array.isArray(data.aiModels) ? data.aiModels : [];
  const deliverablesCount = Number(data.deliverablesCount) || 0;

  return {
    id,
    monthId,
    ...data,
    deliverablesOther,
    aiModels,
    deliverablesCount,
    createdAt: createdAt ? createdAt.toISOString() : null, // Convert to ISO string immediately
    updatedAt: updatedAt ? updatedAt.toISOString() : null, // Convert to ISO string immediately
    timeInHours,
    timeSpentOnAI,
  };
};




export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthTasks", "Charts"],
  // Add cache cleanup configuration
  keepUnusedDataFor: 300, // Keep unused data for 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({

    // Real-time fetch for tasks - optimized for month changes and CRUD operations
    getMonthTasks: builder.query({
      async queryFn({ 
        monthId, 
        userId = null, 
        role = null,
        limitCount = 500 // Covers all 300-400 tasks/month
      } = {}) {
        // Return initial empty state - onSnapshot listener will populate the cache
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
          const monthDocRef = doc(db, "tasks", arg.monthId);
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            logger.log(`[Tasks API] Board ${arg.monthId} does not exist, setting up board listener first`);
            logger.warn(`[Tasks API] MONTH BOARD MISSING: ${arg.monthId} - This is why no tasks are showing!`);
            
            // Set up board listener to restart task subscription when board is created
            const boardUnsubscribe = onSnapshot(monthDocRef, (doc) => {
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
            
            // Store board listener for cleanup
            if (!window.boardListeners) {
              window.boardListeners = new Map();
            }
            window.boardListeners.set(`${arg.monthId}_tasks`, boardUnsubscribe);
            
            // Return early - no task subscription until board exists
            return;
          }
          
          // Set up task listener with role-based filtering
          const colRef = collection(db, "tasks", arg.monthId, "monthTasks");
          
          // Single limit for all use cases - optimized for 300-400 tasks/month
          const taskLimit = arg.limitCount || 500;
          
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

          logger.log(`[Tasks API] Setting up real-time task listener for ${arg.monthId}`);
          logger.log(`[Tasks API] Query parameters:`, { 
            monthId: arg.monthId, 
            userId: arg.userId, 
            role: arg.role, 
            limitCount: arg.limitCount,
            userFilter,
            taskLimit,
            filteringLogic: arg.role === 'admin' ? 'ALL_TASKS' : 'USER_SPECIFIC_TASKS'
          });
          logger.log(`[Tasks API] About to start onSnapshot listener...`);

          // Debug: Check what tasks exist in the database (without filtering)
          try {
            const debugQuery = fsQuery(colRef, orderBy("createdAt", "desc"), limit(10));
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

          unsubscribe = onSnapshot(
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
                .map((d) => normalizeTask(arg.monthId, d.id, d.data()))
                .filter((task) => task !== null);

              logger.log(`[tasksApi] Real-time subscription update: ${tasks.length} tasks for ${arg.monthId}`);
              logger.log(`[tasksApi] Real-time update - Tasks:`, tasks.map(t => ({ 
                id: t.id, 
                taskName: t.taskName, 
                userUID: t.userUID,
                createdAt: t.createdAt 
              })));
              logger.log(`[tasksApi] Filtering info:`, {
                userFilter,
                role: arg.role,
                userId: arg.userId,
                currentUserUID
              });
              
              // Tasks are already serialized by normalizeTask
              updateCachedData(() => tasks);

            },
            (error) => {
              logger.error("Real-time subscription error:", error);
            }
          );

          await cacheEntryRemoved;
        } catch (error) {
          logger.error("Error setting up real-time subscription:", error);
        } finally {
          if (unsubscribe) {
            unsubscribe();
          }
          // Clean up board listener if it exists
          if (window.boardListeners && window.boardListeners.has(`${arg.monthId}_tasks`)) {
            const boardUnsubscribe = window.boardListeners.get(`${arg.monthId}_tasks`);
            boardUnsubscribe();
            window.boardListeners.delete(`${arg.monthId}_tasks`);
          }
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
            const created = normalizeTask(
              monthId,
              ref.id,
              savedSnap.data() || {}
            );
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
          return { error: { message: error.message } };
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
          return { error: { message: error.message } };
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
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: [], // Don't invalidate cache - let real-time subscription handle updates 
    }),

    // Generate charts/analytics with permission check
    generateCharts: builder.mutation({
      async queryFn({ monthId, chartType = 'overview' }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Get current user data and check permissions
          const userData = await getCurrentUserData();
          if (!userData) {
            return { error: { message: "User data not found" } };
          }
          
          // Check if user has permission to generate charts
          if (!canGenerateCharts(userData)) {
            return { error: { message: "Permission denied: You don't have permission to generate charts" } };
          }

          // Check if board exists
          const monthDocRef = doc(db, "tasks", monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            return { error: { message: "Month board not found" } };
          }

          // Fetch all tasks for the month for chart generation
          const colRef = collection(db, "tasks", monthId, "monthTasks");
          const query = fsQuery(colRef, orderBy("createdAt", "desc"));
          const snap = await getDocs(query);
          const tasks = snap.docs.map((d) => normalizeTask(monthId, d.id, d.data()));
          
          // Generate chart data based on chartType
          let chartData = {};
          
          switch (chartType) {
            case 'overview':
              chartData = {
                totalTasks: tasks.length,
                totalHours: tasks.reduce((sum, task) => sum + (task.timeInHours || 0), 0),
                totalAIHours: tasks.reduce((sum, task) => sum + (task.timeSpentOnAI || 0), 0),
                tasksByUser: tasks.reduce((acc, task) => {
                  const userId = task.userUID || 'unknown';
                  acc[userId] = (acc[userId] || 0) + 1;
                  return acc;
                }, {}),
                tasksByStatus: tasks.reduce((acc, task) => {
                  const status = task.status || 'unknown';
                  acc[status] = (acc[status] || 0) + 1;
                  return acc;
                }, {})
              };
              break;
            case 'user_performance':
              chartData = tasks.reduce((acc, task) => {
                const userId = task.userUID || 'unknown';
                if (!acc[userId]) {
                  acc[userId] = {
                    tasks: 0,
                    hours: 0,
                    aiHours: 0
                  };
                }
                acc[userId].tasks += 1;
                acc[userId].hours += task.timeInHours || 0;
                acc[userId].aiHours += task.timeSpentOnAI || 0;
                return acc;
              }, {});
              break;
            default:
              return { error: { message: "Invalid chart type" } };
          }

          logger.log(`Charts generated successfully for ${monthId}, type: ${chartType}`);

          return { data: { chartData, monthId, chartType, generatedAt: new Date().toISOString() } };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { monthId }) => [
        { type: "Charts", id: monthId }
      ],
    }),

  }),
});

export const {
  useGetMonthTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGenerateChartsMutation,
} = tasksApi;
