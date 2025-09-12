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
  setDoc,
} from "firebase/firestore";
import { db, auth } from "@/app/firebase";
import { logger } from "@/utils/logger";
import listenerManager from "@/features/utils/firebaseListenerManager";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { handleApiError, ERROR_TYPES } from "@/features/utils/errorHandling";

import {
  serializeTimestampsForRedux,
  formatMonth,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
} from "@/utils/dateUtils";
import { hasPermission, isAdmin, canAccessTasks, isUserActive } from "@/utils/permissions";
import { validateUserForAPI, isUserAuthenticated } from "@/utils/authUtils";
import { validateOperation, validateClientSide } from "@/utils/securityValidation";

// Helper function to get month info using centralized dateUtils
const getMonthInfo = (date = new Date()) => {
  const start = getStartOfMonth(date);
  const end = getEndOfMonth(date);
  const monthId = formatDate(date, "yyyy-MM");
  return {
    monthId,
    startDate: start.toISOString(), // Serialize to ISO string
    endDate: end.toISOString(), // Serialize to ISO string
    monthName: formatMonth(monthId),
    daysInMonth: end.getDate(),
  };
};

// Helper function to get current user info
const getCurrentUserInfo = () => {
  if (!isUserAuthenticated({ user: auth.currentUser, isAuthChecking: false, isLoading: false })) {
    return null;
  }
  return {
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    name: auth.currentUser.displayName || auth.currentUser.email
  };
};
// API Configuration - moved from constants.js
const API_CONFIG = {
  // Request limits
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 500, // Maximum tasks to fetch per month
    USER_QUERY_LIMIT: 1, // Limit for single user queries
  },
};

// Firebase Configuration - moved from constants.js
const FIREBASE_CONFIG = {
  // Collection names
  COLLECTIONS: {
    USERS: "users",
    TASKS: "tasks",
    REPORTERS: "reporters",
    MONTH_TASKS: "monthTasks",
  },
  
  // Field names
  FIELDS: {
    USER_UID: "userUID",
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    MONTH_ID: "monthId",
  },
  
  // Query constraints
  // QUERY_LIMITS: {
  //   MAX_QUERY_RESULTS: 1000,
  //   DEFAULT_ORDER_LIMIT: 100,
  // },
};

// Helper function to validate user data for tasks API
const validateUserDataForTasks = (userData) => {
  const validation = validateUserForAPI(userData, {
    requireUID: true,
    requireEmail: false,
    requireName: false,
    requireRole: false,
    logWarnings: true
  });
  
  if (!validation.isValid) {
    logger.warn("User data validation failed:", validation.errors);
    return false;
  }
  
  return true;
};

// Helper function to validate boardId consistency
const validateBoardIdConsistency = (providedBoardId, expectedBoardId, currentTaskBoardId) => {
  // Validate that the provided boardId matches the month board's boardId
  if (providedBoardId && expectedBoardId && providedBoardId !== expectedBoardId) {
    throw new Error("Provided boardId does not match the month board's boardId");
  }
  
  // Validate that the task's boardId matches the expected boardId
  if (currentTaskBoardId && expectedBoardId && currentTaskBoardId !== expectedBoardId) {
    throw new Error("Task boardId mismatch - task may have been moved to a different board");
  }
};

// Enhanced transaction wrapper with retry logic and error handling
const executeTransaction = async (transactionFn, operationName, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`[Transaction] Starting ${operationName} (attempt ${attempt}/${maxRetries})`);
      
      const result = await runTransaction(db, transactionFn);
      
      logger.log(`[Transaction] ${operationName} completed successfully on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      logger.warn(`[Transaction] ${operationName} failed on attempt ${attempt}:`, error.message);
      
      // Don't retry on certain types of errors
      if (error.code === 'permission-denied' || 
          error.code === 'not-found' || 
          error.message.includes('not found') ||
          error.message.includes('permission denied')) {
        logger.error(`[Transaction] ${operationName} failed with non-retryable error:`, error);
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        logger.log(`[Transaction] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error(`[Transaction] ${operationName} failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
};


export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(), // Used because this API doesn't use standard RESTful endpoints - it uses Firebase Firestore directly
  tagTypes: [
    "MonthTasks",
    "Tasks",
    "Analytics",
    "CurrentMonth",
  ],
  // Cache optimization settings - using shared configuration
  ...getCacheConfigByType("TASKS"),
  endpoints: (builder) => ({
    // Real-time fetch for tasks - optimized for month changes and CRUD operations
    // SECURITY NOTE: This endpoint relies on Firebase Security Rules for server-side validation.
    // Client-side validation is implemented for UX, but Firebase rules must enforce:
    // - Users can only read/write their own tasks unless they are admin
    // - Admin users can read/write all tasks
    // - Proper authentication is required for all operations
    getMonthTasks: builder.query({
      async queryFn({ monthId, userId, role, userData }) {
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
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: monthId is null or undefined`
            );
            return;
          }

          // Authentication and validation checks
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: User not authenticated`
            );
            return;
          }

          const currentUserUID = currentUser.uid;

          // Get current user data for validation
          if (!arg.userData) {
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: User data not found`
            );
            return;
          }

          // Validate user is active
          if (!isUserActive(arg.userData)) {
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: Account is deactivated`
            );
            return;
          }

          // Validate role parameter
          const isValidRole = ["admin", "user"].includes(arg.role);
          if (!isValidRole) {
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: Invalid role parameter`
            );
            return;
          }

          // Validate userId for non-admin users only
          if (!isAdmin({ role: arg.role }) && !arg.userId) {
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: userId is required for non-admin users`
            );
            return;
          }

          // Security check: Ensure user can only access their own data (for non-admin)
          // Admin users with undefined userId can access all data
          const canAccessThisUser =
            isAdmin({ role: arg.role }) || 
            (arg.userId && arg.userId === currentUserUID);
          
          if (!canAccessThisUser) {
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: Access denied - cannot access other user's data`
            );
            return;
          }

          // Check if user has permission to view tasks
          if (!canAccessTasks(arg.userData)) {
            logger.warn(
              `[Tasks API] Cannot set up real-time subscription: No task access permissions`
            );
            return;
          }
          
          // Check if board exists before setting up task subscription
          const monthDocRef = doc(
            db,
            FIREBASE_CONFIG.COLLECTIONS.TASKS,
            arg.monthId
          );
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            logger.log(
              `[Tasks API] Board ${arg.monthId} does not exist, no task listener needed`
            );
            logger.warn(
              `[Tasks API] MONTH BOARD MISSING: ${arg.monthId} - Tasks will be empty until board is created`
            );
            
            return;
          }
          
          // Set up task listener with role-based filtering
          const colRef = collection(
            db,
            FIREBASE_CONFIG.COLLECTIONS.TASKS,
            arg.monthId,
            FIREBASE_CONFIG.COLLECTIONS.MONTH_TASKS
          );
          
          // Single limit for all use cases - optimized for 300-400 tasks/month
          const taskLimit =
            arg.limitCount || API_CONFIG.REQUEST_LIMITS.TASKS_PER_MONTH;

          let query = fsQuery(
            colRef,
            orderBy("createdAt", "desc"),
            limit(taskLimit)
          );

          // Role-based filtering logic:
          // Admin Role: role === 'admin' + userUID → Fetches ALL tasks (ignores userUID filter)
          // User Role: role === 'user' + userUID → Fetches only tasks where userUID matches their ID
          // Both userUID and role parameters are required for proper filtering
          const userFilter =
            isAdmin({ role: arg.role }) ? null : arg.userId || currentUserUID;

          // Apply user filtering
          
          if (userFilter && userFilter.trim() !== "") {
            query = fsQuery(
              colRef,
              where("userUID", "==", userFilter),
              orderBy("createdAt", "desc"),
              limit(taskLimit)
            );
          }


          // Use centralized listener manager for task subscription
          const taskListenerKey = `tasks_${arg.monthId}_${arg.role}_${arg.userId || "all"}`;
          
          unsubscribe = listenerManager.addListener(taskListenerKey, () => {
            // Update activity when listener is created
            listenerManager.updateActivity();
            
            return onSnapshot(
              query,
              (snapshot) => {
                // Process all updates immediately for real-time experience
                if (!snapshot || !snapshot.docs) {
                  updateCachedData(() => []);
                  return;
                }

                if (snapshot.empty) {
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

              // Update activity when data is received
              listenerManager.updateActivity();

              // Update cache with new data
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
          const taskListenerKey = `tasks_${arg.monthId}_${arg.role}_${arg.userId || "all"}`;
          const boardListenerKey = `board_tasks_${arg.monthId}`;
          listenerManager.removeListener(taskListenerKey);
          listenerManager.removeListener(boardListenerKey);
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId },
        { type: "Tasks", id: "LIST" },
        { type: "Analytics", id: "LIST" },
      ],
    }),

    // Create task with transaction for atomic operations
    createTask: builder.mutation({
      async queryFn({ task, userData }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }
          
          // Comprehensive security validation
          const validation = await validateOperation('create_task', userData, {
            taskData: task,
            monthId: task.monthId
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }
          
          // Use task's monthId - should always be provided by the component
          const monthId = task.monthId;
          
          if (!monthId) {
            return { error: { message: "Month ID is required" } };
          }
          
          // Use enhanced transaction wrapper for atomic operations with retry logic
          const result = await executeTransaction(async (transaction) => {
            // Read operation first: Check if board exists
            const monthDocRef = doc(db, "tasks", monthId);
            const monthDoc = await transaction.get(monthDocRef);

            if (!monthDoc.exists()) {
              throw new Error("Month board not available. Please contact an administrator to generate the month board for this period, or try selecting a different month.");
            }
            
            // Get the boardId from the month board document
            const boardData = monthDoc.data();
            const boardId = boardData?.boardId;
            
            // Validate boardId exists
            if (!boardId) {
              throw new Error("Month board is missing boardId. Please contact an administrator to regenerate the month board.");
            }
            
            // Write operation: Create the task document
            // Note: Firestore will generate a unique document ID automatically
            const colRef = collection(db, "tasks", monthId, "monthTasks");
            
            // Get current user info for task creation
            const currentUserUID = currentUser.uid;
            const currentUserName = userData.name || userData.email || currentUser.name || "Unknown User";
            
            const payload = {
              ...task,
              monthId: monthId, // Use the determined monthId
              boardId: boardId, // Link task to the month board
              createdAt: new Date().toISOString(),
              createdByUID: currentUserUID,
              createdByName: currentUserName,
              userUID: currentUserUID, // Add userUID field for ownership tracking and API filtering
            };
            
            // Generate taskName from jiraLink if not provided
            if (!payload.taskName && payload.jiraLink) {
              const jiraMatch = payload.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
              if (jiraMatch) {
                payload.taskName = jiraMatch[1]; // e.g., "GIMODEAR-124124"
              } else {
                // Fallback: use the last part of the URL
                const urlParts = payload.jiraLink.split('/');
                payload.taskName = urlParts[urlParts.length - 1] || 'Unknown Task';
              }
            }
            
            // Validate payload before creating
            if (!payload.taskName || !payload.userUID || !payload.monthId || !payload.boardId) {
              throw new Error("Invalid task data: missing required fields (taskName, userUID, monthId, or boardId)");
            }
            
            const ref = await addDoc(colRef, payload);
            
            return { 
              id: ref.id, 
              monthId, 
              ...payload,
            };
          }, "Create Task");
       
          logger.log(`[tasksApi] Created task:`, { 
            id: result.id, 
            monthId: result.monthId,
            taskName: result.taskName,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          });

          return { data: result };
        } catch (error) {
          const errorResponse = handleApiError(error, "Create Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      // Note: We don't use invalidatesTags here because we rely on real-time listeners
      // The onSnapshot listener in onCacheEntryAdded will automatically update the cache
      // when new tasks are created, updated, or deleted
    }),

    // Update task with transaction using boardId
    updateTask: builder.mutation({
      async queryFn({ monthId, boardId, taskId, updates, userData }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Comprehensive security validation
          const validation = await validateOperation('update_task', userData, {
            taskData: updates,
            monthId: monthId,
            currentUserUID: currentUser.uid
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }

          // Use enhanced transaction wrapper for atomic update with retry logic
          await executeTransaction(async (transaction) => {
            // Read operation first: Check if month board exists
            const monthDocRef = doc(db, "tasks", monthId);
            const monthDoc = await transaction.get(monthDocRef);
            
            if (!monthDoc.exists()) {
              throw new Error("Month board not found");
            }

            // Read operation: Get current task
            const taskRef = doc(db, "tasks", monthId, "monthTasks", taskId);
            const taskDoc = await transaction.get(taskRef);

            if (!taskDoc.exists()) {
              throw new Error("Task not found");
            }

            // Validate boardId consistency (security check)
            const currentTaskData = taskDoc.data();
            const monthBoardData = monthDoc.data();
            const expectedBoardId = monthBoardData?.boardId;
            
            validateBoardIdConsistency(boardId, expectedBoardId, currentTaskData.boardId);

            // Validate user ownership (additional security check)
            const currentUserUID = currentUser.uid;
            if (currentTaskData.userUID !== currentUserUID && !isAdmin({ role: userData.role })) {
              throw new Error("Permission denied: You can only update your own tasks");
            }

            // Prepare updates with validation
            const updatesWithMonthId = {
              ...updates,
              monthId: monthId,
              updatedAt: new Date().toISOString(),
              // Only add userUID if it's not already in updates and we're not updating userUID specifically
              // This ensures the userUID field stays consistent with the authenticated user
              ...(updates.userUID === undefined && { userUID: currentUserUID }),
            };

            // Validate updates don't contain sensitive fields that shouldn't be changed
            const forbiddenFields = ['createdAt', 'createdByUID', 'createdByName'];
            for (const field of forbiddenFields) {
              if (updatesWithMonthId[field] !== undefined) {
                throw new Error(`Cannot update protected field: ${field}`);
              }
            }

            // Write operation: Update the task document
            transaction.update(taskRef, updatesWithMonthId);
          }, "Update Task");
          logger.log(
            "Task updated successfully, real-time subscription will update cache automatically"
          );

          return { data: { id: taskId, monthId, boardId, success: true } };
        } catch (error) {
          const errorResponse = handleApiError(error, "Update Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      // Note: We don't use invalidatesTags here because we rely on real-time listeners
      // The onSnapshot listener in onCacheEntryAdded will automatically update the cache
      // when tasks are updated
    }),

    // Delete task with transaction using boardId
    deleteTask: builder.mutation({
      async queryFn({ monthId, boardId, taskId, userData }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Comprehensive security validation
          const validation = await validateOperation('delete_task', userData, {
            monthId: monthId,
            currentUserUID: currentUser.uid
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }

          // Use enhanced transaction wrapper for atomic delete with retry logic
          await executeTransaction(async (transaction) => {
            // Read operation first: Check if month board exists
            const monthDocRef = doc(db, "tasks", monthId);
            const monthDoc = await transaction.get(monthDocRef);
            
            if (!monthDoc.exists()) {
              throw new Error("Month board not found");
            }
            
            // Read operation: Check if task exists
            const taskRef = doc(db, "tasks", monthId, "monthTasks", taskId);
            const taskDoc = await transaction.get(taskRef);

            if (!taskDoc.exists()) {
              throw new Error("Task not found");
            }

            // Validate boardId consistency (security check)
            const currentTaskData = taskDoc.data();
            const monthBoardData = monthDoc.data();
            const expectedBoardId = monthBoardData?.boardId;
            
            validateBoardIdConsistency(boardId, expectedBoardId, currentTaskData.boardId);

            // Validate user ownership (additional security check)
            const currentUserUID = currentUser.uid;
            if (currentTaskData.userUID !== currentUserUID && !isAdmin({ role: userData.role })) {
              throw new Error("Permission denied: You can only delete your own tasks");
            }

            // Write operation: Delete the task document by its Firestore document ID
            // Note: We delete the document by its 'id' (Firestore document ID), not by userUID
            transaction.delete(taskRef);
          }, "Delete Task");

          logger.log(
            "Task deleted successfully, real-time subscription will update cache automatically"
          );

          return { data: { id: taskId, monthId, boardId } };
        } catch (error) {
          const errorResponse = handleApiError(error, "Delete Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      // Note: We don't use invalidatesTags here because we rely on real-time listeners
      // The onSnapshot listener in onCacheEntryAdded will automatically update the cache
      // when tasks are deleted
    }),


    // Generate month board (admin only)
    generateMonthBoard: builder.mutation({
      async queryFn({ monthId, meta = {}, userData }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Validate user data and check admin role
          if (!validateUserDataForTasks(userData)) {
            return { error: { message: "User data not provided or invalid" } };
          }
          
          if (!isAdmin(userData)) {
            return { error: { message: "Admin permissions required to generate month boards" } };
          }

          logger.log(
            `[tasksApi] Starting month board generation for monthId: ${monthId} by admin: ${currentUser.uid}`
          );

          // Check if board already exists
          const boardRef = doc(db, "tasks", monthId);
          const boardDoc = await getDoc(boardRef);

          if (boardDoc.exists()) {
            return { error: { message: "Month board already exists" } };
          }

          // Create the board
          const boardId = `${monthId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const boardData = {
            monthId,
            boardId,
            createdAt: serverTimestamp(),
            createdBy: currentUser?.uid,
            createdByName: userData.name || userData.email || currentUser?.email,
            createdByRole: userData.role,
            ...meta,
          };

          await setDoc(boardRef, boardData);

          logger.log(`[tasksApi] Month board created successfully:`, {
            monthId,
            boardId,
          });

          // Return serialized data for Redux
          const serializedBoardData = {
            monthId,
            boardId,
            exists: true,
            createdAt: new Date().toISOString(), // Use current time instead of serverTimestamp for return
            createdBy: currentUser?.uid,
            createdByName: userData.name || userData.email || currentUser?.email,
            createdByRole: userData.role,
          };

          return { data: serializedBoardData };
        } catch (error) {
          logger.error(
            `[tasksApi] Failed to generate board for ${monthId}:`,
            error
          );
          return { error: { message: error.message } };
        }
      },
      // Invalidate the getCurrentMonth cache to ensure immediate UI update
      invalidatesTags: [{ type: "CurrentMonth", id: "ENHANCED" }],
    }),


    // Enhanced getCurrentMonth - Single Source of Truth for All Month Data
    // Returns: { currentMonth, availableMonths, boardExists, lastUpdated }
    // Real-time triggers: date changes, board creation/deletion, month switching
    // This endpoint replaces: getCurrentMonth, getAvailableMonths, checkMonthBoardExists
    getCurrentMonth: builder.query({
      async queryFn() {
        try {
          const monthInfo = getMonthInfo();
          logger.log(`[tasksApi] Getting enhanced current month data:`, monthInfo);

          // Check for existing month boards on initial load
          const monthsRef = collection(db, "tasks");
          const monthsSnapshot = await getDocs(monthsRef);
          
          const availableMonths = monthsSnapshot.docs
            .filter((doc) => doc && doc.exists() && doc.data() && doc.id)
            .map((doc) => {
              const monthData = serializeTimestampsForRedux({
                monthId: doc.id,
                ...doc.data(),
              });
              
              // Add monthName for display purposes
              if (monthData && monthData.monthId) {
                monthData.monthName = formatMonth(monthData.monthId);
                monthData.isCurrent = monthData.monthId === monthInfo.monthId;
              }
              
              return monthData;
            })
            .filter((month) => month !== null);

          // Check if current month board exists
          const currentMonthBoard = availableMonths.find(
            (month) => month.monthId === monthInfo.monthId
          );
          const boardExists = !!currentMonthBoard;

          // Month data loaded successfully

          return { 
            data: {
              currentMonth: monthInfo,
              availableMonths,
              boardExists,
              lastUpdated: Date.now()
            }
          };
        } catch (error) {
          logger.error(`[tasksApi] Failed to get current month data:`, error);
          return { error: { message: error.message } };
        }
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribeMonths = null;
        let dateCheckInterval = null;

        try {
          await cacheDataLoaded;

          // Authentication check
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            logger.warn(
              `[Tasks API] Cannot set up enhanced month listeners: User not authenticated`
            );
            return;
          }


          // Set up real-time listener for all month boards
          const monthsRef = collection(db, "tasks");
          const monthsListenerKey = "enhanced_months";
          
          unsubscribeMonths = listenerManager.addListener(monthsListenerKey, () => {
            // Update activity when listener is created
            listenerManager.updateActivity();
            
            
            return onSnapshot(
              monthsRef,
              (snapshot) => {

                if (!snapshot || !snapshot.docs || snapshot.empty) {
                  updateCachedData((draft) => {
                    draft.availableMonths = [];
                    draft.boardExists = false;
                    draft.lastUpdated = Date.now();
                  });
                  return;
                }

                // Get current month info first
                const currentMonthInfo = getMonthInfo();

                const availableMonths = snapshot.docs
                  .filter((doc) => doc && doc.exists() && doc.data() && doc.id)
                  .map((doc) => {
                    const monthData = serializeTimestampsForRedux({
                      monthId: doc.id,
                      ...doc.data(),
                    });
                    
                    // Add monthName for display purposes
                    if (monthData && monthData.monthId) {
                      monthData.monthName = formatMonth(monthData.monthId);
                      monthData.isCurrent = monthData.monthId === currentMonthInfo.monthId;
                    }
                    
                    return monthData;
                  })
                  .filter((month) => month !== null);

                // Check if current month board exists
                const currentMonthBoard = availableMonths.find(
                  (month) => month.monthId === currentMonthInfo.monthId
                );
                const boardExists = !!currentMonthBoard;


                // Update activity when data is received
                listenerManager.updateActivity();

                updateCachedData((draft) => {
                  draft.currentMonth = currentMonthInfo;
                  draft.availableMonths = availableMonths;
                  draft.boardExists = boardExists;
                  draft.lastUpdated = Date.now();
                });
              },
              (error) => {
                logger.error("Enhanced months listener error:", error);
              }
            );
          });

          // Set up date change detection (check every minute for new month)
          dateCheckInterval = setInterval(() => {
            const currentMonthInfo = getMonthInfo();
            updateCachedData((draft) => {
              // Check if month has changed
              if (draft.currentMonth.monthId !== currentMonthInfo.monthId) {
                draft.currentMonth = currentMonthInfo;
                draft.lastUpdated = Date.now();
                // boardExists will be updated by the months listener
              }
            });
          }, 60000); // Check every minute

          await cacheEntryRemoved;
        } catch (error) {
          logger.error("Error setting up enhanced month listeners:", error);
        } finally {
          if (unsubscribeMonths) {
            unsubscribeMonths();
          }
          if (dateCheckInterval) {
            clearInterval(dateCheckInterval);
          }
          // Clean up listeners using centralized manager
          const monthsListenerKey = "enhanced_months";
          listenerManager.removeListener(monthsListenerKey);
        }
      },
      providesTags: [{ type: "CurrentMonth", id: "ENHANCED" }],
    }),
  }),
});

export const {
  useGetMonthTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGenerateMonthBoardMutation,
  useGetCurrentMonthQuery,
} = tasksApi;
