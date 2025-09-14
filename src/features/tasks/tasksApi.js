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
  formatMonth,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
} from "@/utils/dateUtils";
import {  isAdmin, canAccessTasks, isUserActive } from "@/utils/permissions";
import { validateOperation } from "@/utils/securityValidation";


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
          
          logger.log(`[Tasks API] Starting getMonthTasks listener setup for: ${arg.monthId}`);
          
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
          
          logger.log(`[Tasks API] Checking if month board exists: ${arg.monthId}`);
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            logger.log(`[Tasks API] Board ${arg.monthId} does not exist, no task listener needed`);
            logger.warn(`[Tasks API] MONTH BOARD MISSING: ${arg.monthId} - Tasks will be empty until board is created`);
            return;
          }
          
          logger.log(`[Tasks API] Board ${arg.monthId} exists, setting up task listener`);
          
          const colRef = collection(
            db,
            FIREBASE_CONFIG.COLLECTIONS.TASKS,
            arg.monthId,
            FIREBASE_CONFIG.COLLECTIONS.MONTH_TASKS
          );
          
          logger.log(`[Tasks API] Collection reference: tasks/${arg.monthId}/monthTasks`);
          
          const taskLimit = arg.limitCount || API_CONFIG.REQUEST_LIMITS.TASKS_PER_MONTH;

          // Build query based on user role
          let query;
          const userFilter = isAdmin({ role: arg.role }) ? null : arg.userId || currentUserUID;

          if (userFilter && userFilter.trim() !== "") {
            // For regular users, filter by userUID
            query = fsQuery(
              colRef,
              where("userUID", "==", userFilter),
              limit(taskLimit)
            );
          } else {
            // For admin users, get all tasks (no filtering, no ordering for now)
            query = fsQuery(
              colRef,
              limit(taskLimit)
            );
          }
          
          logger.log(`[Tasks API] Query built for ${arg.monthId}:`, {
            hasUserFilter: !!userFilter,
            userFilter: userFilter,
            role: arg.role,
            limit: taskLimit
          });

          const taskListenerKey = `tasks_${arg.monthId}_${arg.role}_${arg.userId || "all"}`;
          
          logger.log(`[Tasks API] Setting up real-time listener for month: ${arg.monthId}, role: ${arg.role}, userId: ${arg.userId || "all"}`);
          
          unsubscribe = listenerManager.addListener(taskListenerKey, () => {
            listenerManager.updateActivity();
            
            return onSnapshot(
              query,
              (snapshot) => {
                logger.log(`[Tasks API] Real-time listener snapshot received for ${arg.monthId}:`, {
                  exists: !!snapshot,
                  docs: snapshot?.docs?.length || 0,
                  empty: snapshot?.empty || false
                });
                
                if (!snapshot || !snapshot.docs) {
                  logger.log(`[Tasks API] No snapshot or docs for ${arg.monthId}, setting empty array`);
                  updateCachedData(() => []);
                  return;
                }

                if (snapshot.empty) {
                  logger.log(`[Tasks API] Snapshot is empty for ${arg.monthId}, setting empty array`);
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

                logger.log(`[Tasks API] Real-time listener received ${tasks.length} tasks for month ${arg.monthId}`);
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
          console.log('[tasksApi] createTask called with:', { task, userData });
          const currentUser = getCurrentUserInfo();
          const monthId = task.monthId;
          
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }
          
          // Simplified validation - only check business logic, not user auth
          const validation = await validateOperation('create_task', {
            userUID: currentUser.uid,
            email: currentUser.email,
            name: currentUser.name,
            role: userData?.role || 'user', // Fallback to user role
            permissions: userData?.permissions || [], // Include permissions array
            isActive: userData?.isActive !== false // Include active status
          }, {
            taskData: task,
            monthId: task.monthId,
            currentUserUID: currentUser.uid
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }
          
          if (!monthId) {
            return { error: { message: "Month ID is required" } };
          }
          
          // Get month document to retrieve boardId
          const monthDocRef = doc(db, "tasks", monthId);
          const monthDoc = await getDoc(monthDocRef);

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
          
          const createdAt = new Date().toISOString();
          const updatedAt = createdAt; // For new tasks, updatedAt equals createdAt
          
          // Filter out UI-only fields and system fields from task data
          const cleanTaskData = Object.keys(task).reduce((acc, key) => {
            // Skip UI-only fields (prefixed with _) and system fields
            if (!key.startsWith('_') && 
                !['createdAt', 'updatedAt', 'monthId', 'userUID', 'boardId', 'createbyUID', 'createdByName'].includes(key)) {
              acc[key] = task[key];
            }
            return acc;
          }, {});

          // Create final document data directly
          const documentData = {
            data_task: cleanTaskData,  // Clean task data as object
            userUID: currentUserUID,
            monthId: monthId,
            boardId: boardId,
            createbyUID: currentUserUID,
            createdByName: currentUserName,
            updatedAt: updatedAt,
            createdAt: createdAt,
          };
          
          if (!documentData.userUID || !documentData.monthId) {
            throw new Error("Invalid task data: missing required fields (userUID or monthId)");
          }
          
          // Sanitize document data to ensure all values are serializable
          const sanitizedData = JSON.parse(JSON.stringify(documentData));
          
          const ref = await addDoc(colRef, sanitizedData);
          
          // Debug logging to verify document data
          console.log(`[tasksApi] Task document before saving:`, {
            hasDataTask: !!sanitizedData.data_task,
            dataTaskContent: sanitizedData.data_task,
            fullDocument: sanitizedData
          });
          logger.log(`[tasksApi] Task document before saving:`, {
            hasDataTask: !!sanitizedData.data_task,
            dataTaskContent: sanitizedData.data_task
          });
          
          const result = { 
            id: ref.id, 
            monthId, 
            ...sanitizedData,
          };

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

          // Simplified validation - only check business logic, not user auth
          const validation = await validateOperation('update_task', {
            userUID: currentUser.uid,
            email: currentUser.email,
            name: currentUser.name,
            role: userData?.role || 'user', // Fallback to user role
            permissions: userData?.permissions || [], // Include permissions array
            isActive: userData?.isActive !== false // Include active status
          }, {
            taskData: updates,
            monthId: monthId,
            currentUserUID: currentUser.uid
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }

          // Get month document to validate boardId
          const monthDocRef = doc(db, "tasks", monthId);
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            throw new Error("Month board not found");
          }

          const taskRef = doc(db, "tasks", monthId, "monthTasks", taskId);
          const taskDoc = await getDoc(taskRef);

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

          const updatedAt = new Date().toISOString();
          const currentUserName = userData.name || userData.email || currentUser.name || "Unknown User";
          
          // Filter out UI-only fields and system fields from updates
          const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
            if (!key.startsWith('_') && 
                !['createdAt', 'updatedAt', 'monthId', 'userUID', 'boardId', 'createbyUID', 'createdByName'].includes(key)) {
              acc[key] = updates[key];
            }
            return acc;
          }, {});
          
          const updatesWithSystemFields = {
            data_task: {
              ...currentTaskData.data_task,
              ...cleanUpdates
            },
            updatedAt: updatedAt,
            ...(updates.userUID === undefined && { userUID: currentUserUID }),
          };

          const forbiddenFields = ['createdAt', 'createbyUID', 'createdByName'];
          for (const field of forbiddenFields) {
            if (updatesWithSystemFields[field] !== undefined) {
              throw new Error(`Cannot update protected field: ${field}`);
            }
          }

          await updateDoc(taskRef, updatesWithSystemFields);
          
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

          // Simplified validation - only check business logic, not user auth
          const validation = await validateOperation('delete_task', {
            userUID: currentUser.uid,
            email: currentUser.email,
            name: currentUser.name,
            role: userData?.role || 'user', // Fallback to user role
            permissions: userData?.permissions || [], // Include permissions array
            isActive: userData?.isActive !== false // Include active status
          }, {
            monthId: monthId,
            currentUserUID: currentUser.uid
          });
          
          if (!validation.isValid) {
            return { error: { message: validation.errors.join(', ') } };
          }

          // Get month document to validate boardId
          const monthDocRef = doc(db, "tasks", monthId);
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            throw new Error("Month board not found");
          }
          
          const taskRef = doc(db, "tasks", monthId, "monthTasks", taskId);
          const taskDoc = await getDoc(taskRef);

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

          await deleteDoc(taskRef);

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

    // Enhanced getCurrentMonth - Fetches month metadata + current month tasks in one call
    getCurrentMonth: builder.query({
      async queryFn({ userId, role, userData }) {
        try {
          const monthInfo = getMonthInfo();
          logger.log(`[tasksApi] Getting enhanced current month data with tasks:`, monthInfo);

          // Fetch month boards metadata
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
          
          // Fetch current month tasks if board exists and user is authenticated
          let currentMonthTasks = [];
          
          if (boardExists && userData) {
            try {
              const currentUser = getCurrentUserInfo();
              if (currentUser) {
                const tasksRef = collection(db, "tasks", monthInfo.monthId, "monthTasks");
                let tasksQuery = fsQuery(tasksRef);
                
                // Apply user filtering based on role
                if (role === 'user' && userId) {
                  tasksQuery = fsQuery(tasksRef, where("userUID", "==", userId));
                }
                // For admin users, fetch all tasks (no filtering)
                
                // Order by creation date
                tasksQuery = fsQuery(tasksQuery, orderBy("createdAt", "desc"));
                
                const tasksSnapshot = await getDocs(tasksQuery);
                currentMonthTasks = tasksSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...serializeTimestampsForRedux(doc.data())
                }));
                
                logger.log(`[tasksApi] Fetched ${currentMonthTasks.length} tasks for current month ${monthInfo.monthId}`);
              }
            } catch (taskError) {
              logger.error(`[tasksApi] Error fetching current month tasks:`, taskError);
              // Don't fail the entire query if tasks fail to load
            }
          }
          
          return { 
            data: {
              currentMonth: monthInfo,
              availableMonths,
              boardExists,
              currentMonthTasks,
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
        let unsubscribeCurrentMonthTasks = null;
        let midnightScheduler = null;

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
                
                // Set up real-time listener for current month tasks if board exists
                if (boardExists && arg.userData && currentUser && !unsubscribeCurrentMonthTasks) {
                  const tasksRef = collection(db, "tasks", currentMonthInfo.monthId, "monthTasks");
                  let tasksQuery = fsQuery(tasksRef);
                  
                  // Apply user filtering based on role
                  if (arg.role === 'user' && arg.userId) {
                    tasksQuery = fsQuery(tasksRef, where("userUID", "==", arg.userId));
                  }
                  // For admin users, fetch all tasks (no filtering)
                  
                  // Order by creation date
                  tasksQuery = fsQuery(tasksQuery, orderBy("createdAt", "desc"));
                  
                  const currentMonthTasksListenerKey = `current_month_tasks_${currentMonthInfo.monthId}_${arg.role}_${arg.userId || "all"}`;
                  
                  unsubscribeCurrentMonthTasks = listenerManager.addListener(currentMonthTasksListenerKey, () => {
                    listenerManager.updateActivity();
                    
                    return onSnapshot(
                      tasksQuery,
                      (snapshot) => {
                        if (!snapshot || !snapshot.docs) {
                          updateCachedData((draft) => {
                            draft.currentMonthTasks = [];
                            draft.lastUpdated = Date.now();
                          });
                          return;
                        }

                        const validDocs = snapshot.docs.filter(
                          (doc) => doc && doc.exists() && doc.data() && doc.id
                        );

                        const currentMonthTasks = validDocs
                          .map((d) =>
                            serializeTimestampsForRedux({
                              id: d.id,
                              monthId: currentMonthInfo.monthId,
                              ...d.data(),
                            })
                          )
                          .filter((task) => task !== null);

                        listenerManager.updateActivity();
                        
                        updateCachedData((draft) => {
                          draft.currentMonthTasks = currentMonthTasks;
                          draft.lastUpdated = Date.now();
                        });
                      },
                      (error) => {
                        logger.error("Current month tasks listener error:", error);
                      }
                    );
                  });
                }
              },
              (error) => {
                logger.error("Enhanced months listener error:", error);
              }
            );
          });


          // Set up midnight-based month rollover scheduler with alerts
          midnightScheduler = createMidnightScheduler(
            (newDate) => {
              // Date has changed - check if month has changed
              const currentMonthInfo = getMonthInfo();
              updateCachedData((draft) => {
                if (draft.currentMonth.monthId !== currentMonthInfo.monthId) {
                  logger.log(`[getCurrentMonth] Month rollover detected: ${draft.currentMonth.monthId} → ${currentMonthInfo.monthId}`);
                  draft.currentMonth = currentMonthInfo;
                  draft.lastUpdated = Date.now();
                  
                  // Trigger data refresh for new month
                  // This will cause components to re-fetch data for the new month
                }
              });
            },
            (msUntilMidnight) => {
              logger.log(`[getCurrentMonth] Next midnight check scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
            },
            {
              showAlert: true,
              alertMessage: "🌙 Midnight Alert! New day has begun. Your task tracker is updating..."
            }
          );
          
          midnightScheduler.start();

          await cacheEntryRemoved;
        } catch (error) {
          logger.error("Error setting up enhanced month listeners:", error);
        } finally {
          if (unsubscribeMonths) {
            unsubscribeMonths();
          }
          if (unsubscribeCurrentMonthTasks) {
            unsubscribeCurrentMonthTasks();
          }
          if (midnightScheduler) {
            midnightScheduler.stop();
          }
          const monthsListenerKey = "enhanced_months";
          listenerManager.removeListener(monthsListenerKey);
          
          // Clean up current month tasks listener
          if (arg.userId && arg.userData) {
            const currentMonthInfo = getMonthInfo();
            const currentMonthTasksListenerKey = `current_month_tasks_${currentMonthInfo.monthId}_${arg.role}_${arg.userId || "all"}`;
            listenerManager.removeListener(currentMonthTasksListenerKey);
          }
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