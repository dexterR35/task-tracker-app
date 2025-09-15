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
  increment,
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
  const yearId = formatDate(date, "yyyy");
  return {
    monthId,
    yearId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    monthName: formatMonth(monthId),
    daysInMonth: end.getDate(),
  };
};

// Helper function to get current year
const getCurrentYear = () => {
  return new Date().getFullYear().toString(); // Always use current year
};

// Helper function to extract year from monthId (e.g., "2025-09" -> "2025")
const getYearFromMonthId = (monthId) => {
  // Always use current year for data fetching
  return getCurrentYear();
};

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
  const yearId = getCurrentYear();
  return doc(db, "departments", "design", yearId, monthId); // Month document
};

const getMonthsRef = () => {
  const yearId = getCurrentYear();
  return collection(db, "departments", "design", yearId); // Months collection
};

// API Configuration
const API_CONFIG = {
  REQUEST_LIMITS: {
    TASKS_PER_MONTH: 500,
    USER_QUERY_LIMIT: 1,
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
        try {
          if (!monthId) {
            return { data: [] };
          }

          const yearId = getCurrentYear();
          logger.log(`[getMonthTasks] Fetching tasks for month: ${monthId}, year: ${yearId}`);

          // Check if month board exists
          const monthDocRef = getMonthRef(monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            logger.warn(`[getMonthTasks] Month board does not exist: ${monthId}`);
            return { data: [] };
          }

          // Fetch tasks for the month
          const tasksRef = getTaskRef(monthId);
          let tasksQuery = fsQuery(tasksRef);

          // Apply user filtering based on role
          if (role === 'user' && userId) {
            tasksQuery = fsQuery(tasksRef, where("userUID", "==", userId));
          }
          // For admin users, fetch all tasks (no filtering)

          // Order by creation date
          tasksQuery = fsQuery(tasksQuery, orderBy("createdAt", "desc"));

          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            monthId: monthId,
            ...serializeTimestampsForRedux(doc.data())
          }));

          logger.log(`[getMonthTasks] Fetched ${tasks.length} tasks for month ${monthId}`);
          return { data: tasks };
        } catch (error) {
          logger.error(`[getMonthTasks] Error fetching tasks for ${monthId}:`, error);
          return { error: { message: error.message } };
        }
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
          
          const yearId = getCurrentYear();
          const monthDocRef = getMonthRef(arg.monthId);
          
          logger.log(`[Tasks API] Checking if month board exists: ${arg.monthId}`);
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            logger.log(`[Tasks API] Board ${arg.monthId} does not exist, no task listener needed`);
            logger.warn(`[Tasks API] MONTH BOARD MISSING: ${arg.monthId} - Tasks will be empty until board is created`);
            return;
          }
          
          logger.log(`[Tasks API] Board ${arg.monthId} exists, setting up task listener`);
          
          const colRef = getTaskRef(arg.monthId);
          
          logger.log(`[Tasks API] Collection reference: departments/design/${yearId}/${arg.monthId}/taskdata`);
          
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
      async queryFn({ task, userData, reporters = [] }) {
        try {
          logger.log('[tasksApi] createTask called with:', { task, userData });
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
          const monthDocRef = getMonthRef(monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            throw new Error("Month board not available. Please contact an administrator to generate the month board for this period, or try selecting a different month.");
          }
          
          const boardData = monthDoc.data();
          const boardId = boardData?.boardId;
          
          if (!boardId) {
            throw new Error("Month board is missing boardId. Please contact an administrator to regenerate the month board.");
          }
          
          const colRef = getTaskRef(monthId);
          
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

          // Auto-add reporter name if we have reporter ID but no name
          if (cleanTaskData.reporters && !cleanTaskData.reporterName) {
            // Use the reporters data passed from the API call
            const selectedReporter = reporters.find(r => r.id === cleanTaskData.reporters);
            if (selectedReporter) {
              cleanTaskData.reporterName = selectedReporter.name || selectedReporter.reporterName || 'Unknown Reporter';
              logger.log(`Auto-added reporter name: ${cleanTaskData.reporterName} for reporter ID: ${cleanTaskData.reporters}`);
            } else {
              logger.warn(`Reporter not found for ID: ${cleanTaskData.reporters} in provided reporters list`);
              cleanTaskData.reporterName = 'Unknown Reporter';
            }
          }

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
          
          const ref = await addDoc(colRef, documentData);
          
          
          // Debug logging to verify document data
          logger.log(`[tasksApi] Task document before saving:`, {
            hasDataTask: !!documentData.data_task,
            dataTaskContent: documentData.data_task
          });
          
          const result = { 
            id: ref.id, 
            monthId, 
            ...documentData,
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
      invalidatesTags: (result, error, { task }) => [
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "Tasks", id: "LIST" }
      ],
    }),

    // Update task - simple Firestore update
    updateTask: builder.mutation({
      async queryFn({ monthId, taskId, updates, reporters = [] }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Simple update - just update the document
          const taskRef = getTaskRef(monthId, taskId);
          
          // Filter out protected fields
          const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
            if (!key.startsWith('_') && 
                !['createdAt', 'updatedAt', 'monthId', 'userUID', 'boardId', 'createbyUID', 'createdByName'].includes(key)) {
              acc[key] = updates[key];
            }
            return acc;
          }, {});

          // Auto-add reporter name if we have reporter ID but no name
          if (cleanUpdates.reporters && !cleanUpdates.reporterName) {
            // Use the reporters data passed from the API call
            const selectedReporter = reporters.find(r => r.id === cleanUpdates.reporters);
            if (selectedReporter) {
              cleanUpdates.reporterName = selectedReporter.name || selectedReporter.reporterName || 'Unknown Reporter';
              logger.log(`Auto-added reporter name: ${cleanUpdates.reporterName} for reporter ID: ${cleanUpdates.reporters}`);
            } else {
              logger.warn(`Reporter not found for ID: ${cleanUpdates.reporters} in provided reporters list`);
              cleanUpdates.reporterName = 'Unknown Reporter';
            }
          }
          
          const updatesWithTimestamp = {
            ...cleanUpdates,
            updatedAt: new Date().toISOString()
          };

          await updateDoc(taskRef, updatesWithTimestamp);
          
          
          logger.log("Task updated successfully, real-time subscription will update cache automatically");

          return { data: { id: taskId, monthId, success: true } };
        } catch (error) {
          const errorResponse = handleApiError(error, "Update Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      invalidatesTags: (result, error, { monthId }) => [
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "Tasks", id: "LIST" }
      ],
    }),

    // Delete task - simple Firestore delete
    deleteTask: builder.mutation({
      async queryFn({ monthId, taskId }) {
        try {
          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Delete the task document
          const taskRef = getTaskRef(monthId, taskId);
          await deleteDoc(taskRef);

          logger.log("Task deleted successfully, real-time subscription will update cache automatically");

          return { data: { id: taskId, monthId } };
        } catch (error) {
          const errorResponse = handleApiError(error, "Delete Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      invalidatesTags: (result, error, { monthId }) => [
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "Tasks", id: "LIST" }
      ],
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

          const boardRef = getMonthRef(monthId);
          const boardDoc = await getDoc(boardRef);

          if (boardDoc.exists()) {
            return { error: { message: "Month board already exists" } };
          }

          const yearId = getCurrentYear();
          const boardId = `${monthId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const monthMetadata = {
            monthId,
            boardId,
            yearId,
            department: "design",
            month: parseInt(monthId.split('-')[1]),
            year: parseInt(yearId),
            monthName: formatMonth(monthId),
            createdAt: serverTimestamp(),
            createdBy: currentUser?.uid,
            createdByName: userData.name || userData.email || currentUser?.email,
            createdByRole: userData.role,
            status: "active",
            description: `Month ${monthId} board for Design department`,
            ...meta,
          };

          await setDoc(boardRef, monthMetadata);

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

    // Enhanced getCurrentMonth - Fetches only current month data (optimized)
    getCurrentMonth: builder.query({
      async queryFn({ userId, role, userData }) {
        try {
          const monthInfo = getMonthInfo();
          logger.log(`[tasksApi] Getting current month data only:`, monthInfo);

          // Check if current month board exists
          const monthDocRef = getMonthRef(monthInfo.monthId);
          const monthDoc = await getDoc(monthDocRef);
          
          const boardExists = monthDoc.exists();
          let currentMonthBoard = null;
          
          if (boardExists) {
            currentMonthBoard = {
              monthId: monthInfo.monthId,
              monthName: monthInfo.monthName,
              isCurrent: true,
              boardExists: true,
              ...serializeTimestampsForRedux(monthDoc.data())
            };
          }
          
          // Fetch current month tasks if board exists and user is authenticated
          let currentMonthTasks = [];
          
          if (boardExists && userData) {
            try {
              const currentUser = getCurrentUserInfo();
              if (currentUser) {
                const tasksRef = getTaskRef(monthInfo.monthId);
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
          
          // Calculate initial msUntilMidnight
          const now = new Date();
          const midnight = new Date();
          midnight.setHours(24, 0, 0, 0);
          const initialMsUntilMidnight = midnight.getTime() - now.getTime();

          return { 
            data: {
              currentMonth: monthInfo,
              currentMonthBoard,
              boardExists,
              currentMonthTasks,
              msUntilMidnight: initialMsUntilMidnight,
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
        let unsubscribeCurrentMonthTasks = null;
        let midnightScheduler = null;

        try {
          await cacheDataLoaded;
          const currentUser = getCurrentUserInfo();

          if (!currentUser) {
            logger.warn(`[Tasks API] Cannot set up current month listener: User not authenticated`);
            return;
          }
          
          const currentMonthInfo = getMonthInfo();
          
          // Set up real-time listener for current month tasks only
          if (arg.userData && currentUser && !unsubscribeCurrentMonthTasks) {
            const tasksRef = getTaskRef(currentMonthInfo.monthId);
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
              logger.log(`[getCurrentMonth] Next midnight check scheduled in ${Math.round(msUntilMidnight / 1000 / 60 / 60)} hours`);
              // Store the msUntilMidnight value in cached data for real-time countdown
              updateCachedData((draft) => {
                draft.msUntilMidnight = msUntilMidnight;
              });
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
          if (unsubscribeCurrentMonthTasks) {
            unsubscribeCurrentMonthTasks();
          }
          if (midnightScheduler) {
            midnightScheduler.stop();
          }
          
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

    // Get available months (on-demand for dropdown)
    getAvailableMonths: builder.query({
      async queryFn() {
        try {
          logger.log(`[tasksApi] Fetching available months for dropdown`);

          // Fetch month boards metadata
          const monthsRef = getMonthsRef();
          const monthsSnapshot = await getDocs(monthsRef);
          
          const currentMonthInfo = getMonthInfo();
          
          const availableMonths = monthsSnapshot.docs
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
            .filter((month) => month !== null)
            .sort((a, b) => {
              // Current month first, then by monthId (newest first)
              if (a.isCurrent) return -1;
              if (b.isCurrent) return 1;
              return b.monthId.localeCompare(a.monthId);
            });

          logger.log(`[tasksApi] Fetched ${availableMonths.length} available months`);
          return { data: availableMonths };
        } catch (error) {
          logger.error(`[tasksApi] Failed to get available months:`, error);
          return { error: { message: error.message } };
        }
      },
      providesTags: [{ type: "MonthTasks", id: "AVAILABLE_MONTHS" }],
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
  useGetAvailableMonthsQuery,
} = tasksApi;