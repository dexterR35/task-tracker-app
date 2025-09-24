import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { getCurrentUserInfo } from "@/features/auth/authSlice";
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
import { isUserAdmin, canAccessTasks, isUserActive } from "@/features/utils/authUtils";

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

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthTasks", "Tasks", "Analytics", "CurrentMonth"],
  ...getCacheConfigByType("TASKS"),
  endpoints: (builder) => ({
    // Real-time fetch for tasks - optimized for month changes and CRUD operations
    getMonthTasks: builder.query({
      async queryFn({ monthId, userId, role, userData }) {
        try {
          if (!monthId) {
            return { data: [] };
          }

          // Permission validation handled by UI components

          const yearId = getCurrentYear();
          // Check if month board exists
          const monthDocRef = getMonthRef(monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            return { data: [] };
          }

          // Fetch tasks for the month
          const tasksRef = getTaskRef(monthId);
          let tasksQuery = fsQuery(tasksRef);

          // Apply user filtering based on role
          tasksQuery =
            role === "user" && userId
              ? fsQuery(tasksRef, where("userUID", "==", userId))
              : fsQuery(tasksRef);

          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map((doc) => ({
            id: doc.id,
            monthId: monthId,
            ...serializeTimestampsForRedux(doc.data()),
          }));

          return { data: tasks };
        } catch (error) {
          logger.error(
            `[getMonthTasks] Error fetching tasks for ${monthId}:`,
            error
          );
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

          // const yearId = getCurrentYear();
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
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can create tasks
          const { validateUserPermissions } = await import('@/features/utils/authUtils');
          const permissionValidation = validateUserPermissions(userData, 'create_task', {
            operation: 'createTask',
            logWarnings: true,
            requireActive: true
          });

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
            // Use the reporters data passed from the API call
            const selectedReporter = reporters.find(
              (r) => r.id === task.reporters
            );
            if (selectedReporter) {
              task.reporterName = selectedReporter.name || selectedReporter.reporterName;
            } else {
              throw new Error("Reporter not found for the selected reporter ID");
            }
          }

          // Create final document data directly
          const documentData = {
            data_task: task, // Use task data directly
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
          const errorResponse = handleApiError(error, "Create Task", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      invalidatesTags: (result, error, { task }) => [
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "Tasks", id: "LIST" },
        { type: "MonthTasks", id: task.monthId },
        { type: "Analytics", id: "LIST" },
        // Invalidate all month tasks queries to ensure real-time updates
        { type: "MonthTasks", id: "LIST" },
      ],
    }),
    // Update task - simple Firestore update
    updateTask: builder.mutation({
      async queryFn({ monthId, taskId, updates, reporters = [], userData }) {
        try {
          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can update tasks
          const { validateUserPermissions } = await import('@/features/utils/authUtils');
          const permissionValidation = validateUserPermissions(userData, 'update_task', {
            operation: 'updateTask',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          // Simple update - just update the document
          const taskRef = getTaskRef(monthId, taskId);
          // Auto-add reporter name if we have reporter ID but no name
          if (updates.reporters && !updates.reporterName) {
            // Use the reporters data passed from the API call
            const selectedReporter = reporters.find(
              (r) => r.id === updates.reporters
            );
            if (selectedReporter) {
              updates.reporterName = selectedReporter.name || selectedReporter.reporterName;
            } else {
              throw new Error("Reporter not found for the selected reporter ID");
            }
          }
          const updatesWithTimestamp = {
            ...updates,
            updatedAt: serverTimestamp(),
          };

          await updateDoc(taskRef, updatesWithTimestamp);
          
          // Return serialized result for Redux
          const result = { id: taskId, monthId, success: true };
          return { data: serializeTimestampsForRedux(result) };
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
        { type: "Tasks", id: "LIST" },
        { type: "MonthTasks", id: monthId },
        { type: "Analytics", id: "LIST" },
        // Invalidate all month tasks queries to ensure real-time updates
        { type: "MonthTasks", id: "LIST" },
      ],
    }),

    // Delete task - simple Firestore delete
    deleteTask: builder.mutation({
      async queryFn({ monthId, taskId, userData }) {
        try {
          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can delete tasks
          const { validateUserPermissions } = await import('@/features/utils/authUtils');
          const permissionValidation = validateUserPermissions(userData, 'delete_task', {
            operation: 'deleteTask',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          // Delete the task document
          const taskRef = getTaskRef(monthId, taskId);
          await deleteDoc(taskRef);

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
        { type: "Tasks", id: "LIST" },
        { type: "MonthTasks", id: monthId },
        { type: "Analytics", id: "LIST" },
        // Invalidate all month tasks queries to ensure real-time updates
        { type: "MonthTasks", id: "LIST" },
      ],
    }),

    // Generate month board (admin only)
    generateMonthBoard: builder.mutation({
      async queryFn({ monthId, startDate, endDate, daysInMonth, meta = {}, userData }) {
        try {
          // SECURITY: Validate user permissions at API level
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user can create boards (admin only)
          const { validateUserPermissions } = await import('@/features/utils/authUtils');
          const permissionValidation = validateUserPermissions(userData, 'create_board', {
            operation: 'generateMonthBoard',
            logWarnings: true,
            requireActive: true
          });

          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          const currentUser = getCurrentUserInfo();
          const boardRef = getMonthRef(monthId);
          const boardDoc = await getDoc(boardRef);
          if (boardDoc.exists()) {
            // Board already exists, return success with existing data
            return { 
              data: serializeTimestampsForRedux({
                monthId,
                boardId: boardDoc.data().boardId,
                exists: true,
                createdAt: boardDoc.data().createdAt,
                createdBy: boardDoc.data().createdBy,
                createdByName: boardDoc.data().createdByName,
                createdByRole: boardDoc.data().createdByRole,
              })
            };
          }
          const yearId = getCurrentYear();
          const boardId = `${monthId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const monthMetadata = {
            monthId,
            boardId,
            yearId,
            department: "design",
            month: parseInt(monthId.split("-")[1]),
            year: parseInt(yearId),
            monthName: formatMonth(monthId),
            startDate: startDate || getMonthInfo().startDate,
            endDate: endDate || getMonthInfo().endDate,
            daysInMonth: daysInMonth || getMonthInfo().daysInMonth,
            createdAt: serverTimestamp(),
            createdBy: currentUser?.uid,
            createdByName: userData.name,
            createdByRole: userData.role,
            status: "active",
            description: `Month ${monthId} board for Design department`,
            ...meta,
          };

          await setDoc(boardRef, monthMetadata);
          const serializedBoardData = {
            monthId,
            boardId,
            exists: true,
            createdAt: serverTimestamp(),
            createdBy: currentUser?.uid,
            createdByName: userData.name,
            createdByRole: userData.role,
          };

          return { data: serializeTimestampsForRedux(serializedBoardData) };
        } catch (error) {
          logger.error(
            `[tasksApi] Failed to generate board for ${monthId}:`,
            error
          );
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: [{ type: "CurrentMonth", id: "ENHANCED" }],
    }),

    // Enhanced getCurrentMonth - Fetches only current month data (optimized)
    getCurrentMonth: builder.query({
      async queryFn({ userId, role, userData }) {
        try {
          let currentMonthInfo = getMonthInfo(); // Default to actual current month
          let boardExists = false;
          let currentMonthBoard = null;

          // Get available months from the current year (2025) under departments/design
          // Based on your structure: departments/design/2025/{monthId}/
          const yearId = getCurrentYear(); // This will be "2025"
          const monthsRef = collection(db, "departments", "design", yearId);
          const monthsSnapshot = await getDocs(monthsRef);
          const availableMonths = [];

          monthsSnapshot.docs.forEach((monthDoc) => {
            if (monthDoc && monthDoc.exists() && monthDoc.data() && monthDoc.id) {
              const monthData = {
                monthId: monthDoc.id, // Use document ID as the source of truth
                ...monthDoc.data()
              };
              // Override the monthId from data with the document ID (correct one)
              monthData.monthId = monthDoc.id;
              availableMonths.push(monthData);
            }
          });

          // Always check if the actual current month board exists
          const monthDocRef = getMonthRef(currentMonthInfo.monthId);
          const monthDoc = await getDoc(monthDocRef);
          boardExists = monthDoc.exists();
          
          if (boardExists) {
            currentMonthBoard = {
              monthId: currentMonthInfo.monthId,
              monthName: currentMonthInfo.monthName,
              isCurrent: true,
              boardExists: true,
              ...serializeTimestampsForRedux(monthDoc.data()),
            };
          } else {
            // Even if board doesn't exist, provide the current month info
            currentMonthBoard = {
              monthId: currentMonthInfo.monthId,
              monthName: currentMonthInfo.monthName,
              isCurrent: true,
              boardExists: false,
              startDate: currentMonthInfo.startDate,
              endDate: currentMonthInfo.endDate,
              daysInMonth: currentMonthInfo.daysInMonth,
            };
          }

          // Fetch current month tasks if board exists and user is authenticated
          let currentMonthTasks = [];

          if (boardExists && userData) {
            try {
              const currentUser = getCurrentUserInfo();
              if (currentUser) {
                const tasksRef = getTaskRef(currentMonthInfo.monthId);
                let tasksQuery = fsQuery(tasksRef);

                // Apply user filtering based on role
                if (role === "user" && userId) {
                  tasksQuery = fsQuery(
                    tasksRef,
                    where("userUID", "==", userId)
                  );
                }
                // For admin users, fetch all tasks (no filtering)

                // Order by creation date
                tasksQuery = fsQuery(tasksQuery, orderBy("createdAt", "desc"));

                const tasksSnapshot = await getDocs(tasksQuery);
                currentMonthTasks = tasksSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...serializeTimestampsForRedux(doc.data()),
                }));
              }
            } catch (taskError) {
              logger.error(
                `[tasksApi] Error fetching current month tasks:`,
                taskError
              );
              // Don't fail the entire query if tasks fail to load
            }
          }

          // Calculate initial msUntilMidnight
          const now = new Date();
          const midnight = new Date();
          midnight.setHours(24, 0, 0, 0);
          const initialMsUntilMidnight = midnight.getTime() - now.getTime();

          const finalBoardExists = boardExists;

          return {
            data: {
              currentMonth: currentMonthInfo,
              currentMonthBoard,
              boardExists: finalBoardExists, // Use task-based boardExists
              currentMonthTasks,
              msUntilMidnight: initialMsUntilMidnight,
              lastUpdated: Date.now(),
            },
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
        let unsubscribeCurrentMonthBoard = null;
        let midnightScheduler = null;

        try {
          await cacheDataLoaded;
          const currentUser = getCurrentUserInfo();

          if (!currentUser) {
            logger.warn(
              `[Tasks API] Cannot set up current month listener: User not authenticated`
            );
            return;
          }

          const currentMonthInfo = getMonthInfo();

          // Note: Current month tasks are handled by the getMonthTasks query
          // No need for a separate listener here as it would be redundant

          // Set up real-time listener for current month board document
          if (arg.userData && currentUser && !unsubscribeCurrentMonthBoard) {
            const monthDocRef = getMonthRef(currentMonthInfo.monthId);
            const currentMonthBoardListenerKey = `current_month_board_${currentMonthInfo.monthId}`;

            unsubscribeCurrentMonthBoard = listenerManager.addListener(
              currentMonthBoardListenerKey,
              () => {
                listenerManager.updateActivity();

                return onSnapshot(
                  monthDocRef,
                  (snapshot) => {
                    const boardExists = snapshot.exists();
                    let currentMonthBoard = null;

                    if (boardExists) {
                      currentMonthBoard = {
                        monthId: currentMonthInfo.monthId,
                        monthName: currentMonthInfo.monthName,
                        isCurrent: true,
                        boardExists: true,
                        ...serializeTimestampsForRedux(snapshot.data()),
                      };
                    }

                    updateCachedData((draft) => {
                      draft.boardExists = boardExists;
                      draft.currentMonthBoard = currentMonthBoard;
                      draft.lastUpdated = Date.now();
                    });
                  },
                  (error) => {
                    logger.error("Current month board listener error:", error);
                  }
                );
              }
            );
          }

          // Set up midnight-based month rollover scheduler with alerts
          midnightScheduler = createMidnightScheduler(
            (newDate) => {
              // Date has changed - check if month has changed
              const currentMonthInfo = getMonthInfo();
              updateCachedData((draft) => {
                if (draft.currentMonth.monthId !== currentMonthInfo.monthId) {
                  draft.currentMonth = currentMonthInfo;
                  draft.lastUpdated = Date.now();

                  // Trigger data refresh for new month
                  // This will cause components to re-fetch data for the new month
                }
              });
            },
            (msUntilMidnight) => {
              // Store the msUntilMidnight value in cached data for real-time countdown
              updateCachedData((draft) => {
                draft.msUntilMidnight = msUntilMidnight;
              });
            },
            {
              showAlert: true,
              alertMessage:
                "🌙 Midnight Alert! New day has begun. Your task tracker is updating...",
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

          // Note: Current month tasks listener cleanup not needed as we don't create it

          // Clean up current month board listener
          if (unsubscribeCurrentMonthBoard) {
            const currentMonthInfo = getMonthInfo();
            const currentMonthBoardListenerKey = `current_month_board_${currentMonthInfo.monthId}`;
            listenerManager.removeListener(currentMonthBoardListenerKey);
          }
        }
      },
      providesTags: (result, error, arg) => [
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "MonthTasks", id: getMonthInfo().monthId }, // Invalidate when current month tasks change
        { type: "MonthTasks", id: "LIST" }, // Also invalidate all month tasks
        { type: "Analytics", id: "LIST" }, // Invalidate analytics data
      ],
    }),

    // Get available months (on-demand for dropdown)
    getAvailableMonths: builder.query({
      async queryFn() {
        try {
          const currentMonthInfo = getMonthInfo();
          const availableMonths = [];

          // Get months from the current year under departments/design
          // Based on your structure: departments/design/2025/{monthId}/
          const yearId = getCurrentYear(); // This will be "2025"
          const monthsRef = collection(db, "departments", "design", yearId);
          const monthsSnapshot = await getDocs(monthsRef);

          monthsSnapshot.docs.forEach((monthDoc) => {
            if (monthDoc && monthDoc.exists() && monthDoc.data() && monthDoc.id) {
              const monthData = serializeTimestampsForRedux({
                monthId: monthDoc.id, // Use document ID as the source of truth
                ...monthDoc.data(),
              });
              
              // Override the monthId from data with the document ID (correct one)
              monthData.monthId = monthDoc.id;
              
              if (monthData && monthData.monthId) {
                monthData.monthName = formatMonth(monthData.monthId);
                monthData.isCurrent = monthData.monthId === currentMonthInfo.monthId;
                monthData.boardExists = true; // If we found the document, the board exists
                availableMonths.push(monthData);
              }
            }
          });

          // Sort by monthId (newest first)
          availableMonths.sort((a, b) => {
            if (a.isCurrent) return -1;
            if (b.isCurrent) return 1;
            return b.monthId.localeCompare(a.monthId);
          });

          return { data: availableMonths };
        } catch (error) {
          logger.error(`[tasksApi] Failed to get available months:`, error);
          return { error: { message: error.message } };
        }
      },
      providesTags: [{ type: "MonthTasks", id: "AVAILABLE_MONTHS" }],
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
  useGetAvailableMonthsQuery,
} = tasksApi;
