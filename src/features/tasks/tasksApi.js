import { createFirestoreApi, getCurrentUserInfo, validateUserForAPI, serializeTimestampsForRedux } from "@/features/api/baseApi";
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
import { handleApiError } from "@/features/utils/errorHandling";

import {
  formatMonth,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
} from "@/utils/dateUtils";
import { hasPermission, isAdmin, canAccessTasks, isUserActive } from "@/utils/permissions";
import { validateOperation } from "@/utils/securityValidation";

/**
 * Tasks API - Refactored to use base API factory
 * Preserves real-time functionality while standardizing patterns
 */

// Helper function to get month info using centralized dateUtils
const getMonthInfo = (date = new Date()) => {
  const start = getStartOfMonth(date);
  const end = getEndOfMonth(date);
  const monthId = formatDate(date, "yyyy-MM");
  return {
    monthId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    monthName: formatMonth(monthId),
    daysInMonth: end.getDate(),
  };
};

// API Configuration
const API_CONFIG = {
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 500,
    USER_QUERY_LIMIT: 1,
  },
};

// Firebase Configuration
const FIREBASE_CONFIG = {
  COLLECTIONS: {
    USERS: "users",
    TASKS: "tasks",
    REPORTERS: "reporters",
    MONTH_TASKS: "monthTasks",
  },
  FIELDS: {
    USER_UID: "userUID",
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    MONTH_ID: "monthId",
  },
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
  if (providedBoardId && expectedBoardId && providedBoardId !== expectedBoardId) {
    throw new Error("Provided boardId does not match the month board's boardId");
  }
  
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
      
      if (error.code === 'permission-denied' || 
          error.code === 'not-found' || 
          error.message.includes('not found') ||
          error.message.includes('permission denied')) {
        logger.error(`[Transaction] ${operationName} failed with non-retryable error:`, error);
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.log(`[Transaction] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error(`[Transaction] ${operationName} failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
};

export const tasksApi = createFirestoreApi({
  reducerPath: "tasksApi",
  tagTypes: ["MonthTasks", "Tasks", "Analytics", "CurrentMonth"],
  cacheType: "TASKS",
  endpoints: (builder) => ({
    // Real-time fetch for tasks - optimized for month changes and CRUD operations
    getMonthTasks: builder.query({
      async queryFn({ monthId, userId, role, userData }) {
        return { data: [] };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe = null;

        try {
          await cacheDataLoaded;
          
          if (!arg.monthId) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: monthId is null or undefined`);
            return;
          }

          // Wait for user authentication to be ready
          if (!arg.userData) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: User data not provided`);
            return;
          }

          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: User not authenticated`);
            return;
          }

          const currentUserUID = currentUser.uid;

          if (!isUserActive(arg.userData)) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: Account is deactivated`);
            return;
          }

          const isValidRole = ["admin", "user"].includes(arg.role);
          if (!isValidRole) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: Invalid role parameter`);
            return;
          }

          if (!isAdmin({ role: arg.role }) && !arg.userId) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: userId is required for non-admin users`);
            return;
          }

          const canAccessThisUser =
            isAdmin({ role: arg.role }) || 
            (arg.userId && arg.userId === currentUserUID);
          
          if (!canAccessThisUser) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: Access denied - cannot access other user's data`);
            return;
          }

          if (!canAccessTasks(arg.userData)) {
            logger.warn(`[Tasks API] Cannot set up real-time subscription: No task access permissions`);
            return;
          }
          
          const monthDocRef = doc(
            db,
            FIREBASE_CONFIG.COLLECTIONS.TASKS,
            arg.monthId
          );
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            logger.log(`[Tasks API] Board ${arg.monthId} does not exist, no task listener needed`);
            logger.warn(`[Tasks API] MONTH BOARD MISSING: ${arg.monthId} - Tasks will be empty until board is created`);
            return;
          }
          
          const colRef = collection(
            db,
            FIREBASE_CONFIG.COLLECTIONS.TASKS,
            arg.monthId,
            FIREBASE_CONFIG.COLLECTIONS.MONTH_TASKS
          );
          
          const taskLimit = arg.limitCount || API_CONFIG.REQUEST_LIMITS.TASKS_PER_MONTH;

          let query = fsQuery(
            colRef,
            orderBy("createdAt", "desc"),
            limit(taskLimit)
          );

          const userFilter = isAdmin({ role: arg.role }) ? null : arg.userId || currentUserUID;

          if (userFilter && userFilter.trim() !== "") {
            query = fsQuery(
              colRef,
              where("userUID", "==", userFilter),
              orderBy("createdAt", "desc"),
              limit(taskLimit)
            );
          }

          const taskListenerKey = `tasks_${arg.monthId}_${arg.role}_${arg.userId || "all"}`;
          
          unsubscribe = listenerManager.addListener(taskListenerKey, () => {
            listenerManager.updateActivity();
            
            return onSnapshot(
              query,
              (snapshot) => {
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
          
          const validation = await validateOperation('create_task', userData, {
            taskData: task,
            monthId: task.monthId
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }
          
          const monthId = task.monthId;
          
          if (!monthId) {
            return { error: { message: "Month ID is required" } };
          }
          
          const result = await executeTransaction(async (transaction) => {
            const monthDocRef = doc(db, "tasks", monthId);
            const monthDoc = await transaction.get(monthDocRef);

            if (!monthDoc.exists()) {
              throw new Error("Month board not available. Please contact an administrator to generate the month board for this period, or try selecting a different month.");
            }
            
            const boardData = monthDoc.data();
            const boardId = boardData?.boardId;
            
            if (!boardId) {
              throw new Error("Month board is missing boardId. Please contact an administrator to regenerate the month board.");
            }
            
            const colRef = collection(db, "tasks", monthId, "monthTasks");
            
            const currentUserUID = currentUser.uid;
            const currentUserName = userData.name || userData.email || currentUser.name || "Unknown User";
            
            const payload = {
              ...task,
              monthId: monthId,
              boardId: boardId,
              createdAt: new Date().toISOString(),
              createdByUID: currentUserUID,
              createdByName: currentUserName,
              userUID: currentUserUID,
            };
            
            if (!payload.taskName && payload.jiraLink) {
              const jiraMatch = payload.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
              if (jiraMatch) {
                payload.taskName = jiraMatch[1];
              } else {
                const urlParts = payload.jiraLink.split('/');
                payload.taskName = urlParts[urlParts.length - 1] || 'Unknown Task';
              }
            }
            
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
    }),

    // Update task with transaction using boardId
    updateTask: builder.mutation({
      async queryFn({ monthId, boardId, taskId, updates, userData }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          const validation = await validateOperation('update_task', userData, {
            taskData: updates,
            monthId: monthId,
            currentUserUID: currentUser.uid
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }

          await executeTransaction(async (transaction) => {
            const monthDocRef = doc(db, "tasks", monthId);
            const monthDoc = await transaction.get(monthDocRef);
            
            if (!monthDoc.exists()) {
              throw new Error("Month board not found");
            }

            const taskRef = doc(db, "tasks", monthId, "monthTasks", taskId);
            const taskDoc = await transaction.get(taskRef);

            if (!taskDoc.exists()) {
              throw new Error("Task not found");
            }

            const currentTaskData = taskDoc.data();
            const monthBoardData = monthDoc.data();
            const expectedBoardId = monthBoardData?.boardId;
            
            validateBoardIdConsistency(boardId, expectedBoardId, currentTaskData.boardId);

            const currentUserUID = currentUser.uid;
            if (currentTaskData.userUID !== currentUserUID && !isAdmin({ role: userData.role })) {
              throw new Error("Permission denied: You can only update your own tasks");
            }

            const updatesWithMonthId = {
              ...updates,
              monthId: monthId,
              updatedAt: new Date().toISOString(),
              ...(updates.userUID === undefined && { userUID: currentUserUID }),
            };

            const forbiddenFields = ['createdAt', 'createdByUID', 'createdByName'];
            for (const field of forbiddenFields) {
              if (updatesWithMonthId[field] !== undefined) {
                throw new Error(`Cannot update protected field: ${field}`);
              }
            }

            transaction.update(taskRef, updatesWithMonthId);
          }, "Update Task");
          
          logger.log("Task updated successfully, real-time subscription will update cache automatically");

          return { data: { id: taskId, monthId, boardId, success: true } };
        } catch (error) {
          const errorResponse = handleApiError(error, "Update Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
    }),

    // Delete task with transaction using boardId
    deleteTask: builder.mutation({
      async queryFn({ monthId, boardId, taskId, userData }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          const validation = await validateOperation('delete_task', userData, {
            monthId: monthId,
            currentUserUID: currentUser.uid
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }

          await executeTransaction(async (transaction) => {
            const monthDocRef = doc(db, "tasks", monthId);
            const monthDoc = await transaction.get(monthDocRef);
            
            if (!monthDoc.exists()) {
              throw new Error("Month board not found");
            }
            
            const taskRef = doc(db, "tasks", monthId, "monthTasks", taskId);
            const taskDoc = await transaction.get(taskRef);

            if (!taskDoc.exists()) {
              throw new Error("Task not found");
            }

            const currentTaskData = taskDoc.data();
            const monthBoardData = monthDoc.data();
            const expectedBoardId = monthBoardData?.boardId;
            
            validateBoardIdConsistency(boardId, expectedBoardId, currentTaskData.boardId);

            const currentUserUID = currentUser.uid;
            if (currentTaskData.userUID !== currentUserUID && !isAdmin({ role: userData.role })) {
              throw new Error("Permission denied: You can only delete your own tasks");
            }

            transaction.delete(taskRef);
          }, "Delete Task");

          logger.log("Task deleted successfully, real-time subscription will update cache automatically");

          return { data: { id: taskId, monthId, boardId } };
        } catch (error) {
          const errorResponse = handleApiError(error, "Delete Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
    }),

    // Generate month board (admin only)
    generateMonthBoard: builder.mutation({
      async queryFn({ monthId, meta = {}, userData }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          if (!validateUserDataForTasks(userData)) {
            return { error: { message: "User data not provided or invalid" } };
          }
          
          if (!isAdmin(userData)) {
            return { error: { message: "Admin permissions required to generate month boards" } };
          }

          logger.log(`[tasksApi] Starting month board generation for monthId: ${monthId} by admin: ${currentUser.uid}`);

          const boardRef = doc(db, "tasks", monthId);
          const boardDoc = await getDoc(boardRef);

          if (boardDoc.exists()) {
            return { error: { message: "Month board already exists" } };
          }

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

          const serializedBoardData = {
            monthId,
            boardId,
            exists: true,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.uid,
            createdByName: userData.name || userData.email || currentUser?.email,
            createdByRole: userData.role,
          };

          return { data: serializedBoardData };
        } catch (error) {
          logger.error(`[tasksApi] Failed to generate board for ${monthId}:`, error);
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "CurrentMonth", id: "ENHANCED" }],
    }),

    // Enhanced getCurrentMonth - Single Source of Truth for All Month Data
    getCurrentMonth: builder.query({
      async queryFn() {
        try {
          const monthInfo = getMonthInfo();
          logger.log(`[tasksApi] Getting enhanced current month data:`, monthInfo);

          const monthsRef = collection(db, "tasks");
          const monthsSnapshot = await getDocs(monthsRef);
          
          const availableMonths = monthsSnapshot.docs
            .filter((doc) => doc && doc.exists() && doc.data() && doc.id)
            .map((doc) => {
              const monthData = serializeTimestampsForRedux({
                monthId: doc.id,
                ...doc.data(),
              });
              
              if (monthData && monthData.monthId) {
                monthData.monthName = formatMonth(monthData.monthId);
                monthData.isCurrent = monthData.monthId === monthInfo.monthId;
              }
              
              return monthData;
            })
            .filter((month) => month !== null);

          const currentMonthBoard = availableMonths.find(
            (month) => month.monthId === monthInfo.monthId
          );
          const boardExists = !!currentMonthBoard;

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

          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            logger.warn(`[Tasks API] Cannot set up enhanced month listeners: User not authenticated`);
            return;
          }

          const monthsRef = collection(db, "tasks");
          const monthsListenerKey = "enhanced_months";
          
          unsubscribeMonths = listenerManager.addListener(monthsListenerKey, () => {
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

                const currentMonthInfo = getMonthInfo();

                const availableMonths = snapshot.docs
                  .filter((doc) => doc && doc.exists() && doc.data() && doc.id)
                  .map((doc) => {
                    const monthData = serializeTimestampsForRedux({
                      monthId: doc.id,
                      ...doc.data(),
                    });
                    
                    if (monthData && monthData.monthId) {
                      monthData.monthName = formatMonth(monthData.monthId);
                      monthData.isCurrent = monthData.monthId === currentMonthInfo.monthId;
                    }
                    
                    return monthData;
                  })
                  .filter((month) => month !== null);

                const currentMonthBoard = availableMonths.find(
                  (month) => month.monthId === currentMonthInfo.monthId
                );
                const boardExists = !!currentMonthBoard;

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

          dateCheckInterval = setInterval(() => {
            const currentMonthInfo = getMonthInfo();
            updateCachedData((draft) => {
              if (draft.currentMonth.monthId !== currentMonthInfo.monthId) {
                draft.currentMonth = currentMonthInfo;
                draft.lastUpdated = Date.now();
              }
            });
          }, 60000);

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
          const monthsListenerKey = "enhanced_months";
          listenerManager.removeListener(monthsListenerKey);
        }
      },
      providesTags: [{ type: "CurrentMonth", id: "ENHANCED" }],
    }),
  })
});

export const {
  useGetMonthTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGenerateMonthBoardMutation,
  useGetCurrentMonthQuery,
} = tasksApi;