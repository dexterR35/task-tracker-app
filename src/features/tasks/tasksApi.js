import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { format } from "date-fns";
import {
  collection,
  query as fsQuery,
  orderBy,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  onSnapshot,
  limit,
  startAfter,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../../app/firebase";
import {
  normalizeTimestamp,
  serializeTimestampsForRedux,
} from "../../shared/utils/dateUtils";
import { logger } from "../../shared/utils/logger";

// Simple task normalization
const normalizeTask = (monthId, id, data) => {
  if (!data || typeof data !== "object") {
    return null;
  }

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
    createdAt,
    updatedAt,
    timeInHours,
    timeSpentOnAI,
  };
};

// Fetch tasks from Firestore with pagination support
const fetchTasksFromFirestore = async (
  monthId,
  userId = null,
  options = {}
) => {
  const { limitCount = 50, startAfterDoc = null } = options;

  const colRef = collection(db, "tasks", monthId, "monthTasks");
  let query = fsQuery(colRef, orderBy("createdAt", "desc"), limit(limitCount));

  if (userId && userId.trim() !== "") {
    query = fsQuery(
      colRef,
      where("userUID", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
  }

  if (startAfterDoc) {
    query = fsQuery(query, startAfter(startAfterDoc));
  }

  const snap = await getDocs(query);
  return snap.docs.map((d) => normalizeTask(monthId, d.id, d.data()));
};



export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthTasks", "MonthBoard", "Charts", "Analytics", "Task"],
  endpoints: (builder) => ({
    // Get single task by ID
    getTaskById: builder.query({
      async queryFn({ monthId, taskId }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          const ref = doc(db, "tasks", monthId, "monthTasks", taskId);
          const snap = await getDoc(ref);
          
          if (!snap.exists()) {
            return { error: { message: "Task not found" } };
          }

          const task = normalizeTask(monthId, snap.id, snap.data());
          return { data: task };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      transformResponse: (response) => {
        return serializeTimestampsForRedux(response);
      },
      providesTags: (result, error, arg) => [
        { type: "Task", id: `${arg.monthId}_${arg.taskId}` },
      ],
    }),

    // Check if month board exists
    getMonthBoardExists: builder.query({
      async queryFn({ monthId }) {
        try {
          if (!auth.currentUser) {
            return { data: { exists: false } };
          }

          const ref = doc(db, "tasks", monthId);
          const snap = await getDocFromServer(ref);
          return { data: { exists: snap.exists() } };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthBoard", id: arg.monthId },
      ],
    }),

    // One-time fetch for tasks (for initial load or pagination)
    getMonthTasks: builder.query({
      async queryFn({ monthId, limitCount = 50, startAfterDoc = null } = {}) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Check if board exists first
          const monthDocRef = doc(db, "tasks", monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            return { data: [] };
          }

          // Fetch tasks from Firestore
          const tasks = await fetchTasksFromFirestore(monthId, null, {
            limitCount,
            startAfterDoc,
          });
          return { data: tasks };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      transformResponse: (response) => {
        return serializeTimestampsForRedux(response);
      },
      providesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId },
        {
          type: "MonthTasks",
          id: `${arg.monthId}_user_${arg.userId || "all"}`,
        },
      ],
    }),

    // Real-time subscription for tasks - optimized to reduce excessive updates
    subscribeToMonthTasks: builder.query({
      async queryFn({ monthId, userId = null } = {}) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          const normalizedUserId =
            userId && userId.trim() !== "" ? userId : null;
          const tasks = await fetchTasksFromFirestore(
            monthId,
            normalizedUserId
          );
          return { data: tasks };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      transformResponse: (response) => {
        return serializeTimestampsForRedux(response);
      },
      // Optimized caching configuration
      keepUnusedDataFor: 300, // Keep data for 5 minutes (300 seconds)
      refetchOnFocus: false, // Don't refetch when window gains focus
      refetchOnReconnect: false, // Don't refetch when reconnecting
      refetchOnMountOrArgChange: false, // Don't refetch on mount or arg change (real-time handles updates)
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe = null;
        let lastUpdateTime = 0;
        const updateDebounce = 100; // Debounce updates by 100ms

        try {
          await cacheDataLoaded;

          // Check if board exists
          const monthDocRef = doc(db, "tasks", arg.monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            updateCachedData(() => []);
            return;
          }

          const colRef = collection(db, "tasks", arg.monthId, "monthTasks");
          let query = fsQuery(colRef, orderBy("createdAt", "desc"));

          if (arg.userId && arg.userId.trim() !== "") {
            query = fsQuery(
              colRef,
              where("userUID", "==", arg.userId),
              orderBy("createdAt", "desc")
            );
          }

          unsubscribe = onSnapshot(
            query,
            (snapshot) => {
              // Debounce rapid updates
              const now = Date.now();
              if (now - lastUpdateTime < updateDebounce) {
                return;
              }
              lastUpdateTime = now;

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
                .map((d) => normalizeTask(arg.monthId, d.id, d.data()))
                .filter((task) => task !== null);

              updateCachedData(() => tasks);

              // Trigger analytics recalculation with debouncing
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("task-changed", {
                    detail: {
                      monthId: arg.monthId,
                      userId: arg.userId,
                      source: "firebase-realtime",
                      operation: "update",
                      tasksCount: tasks.length,
                      timestamp: Date.now(),
                    },
                  })
                );
              }, 50); // Small delay to batch multiple updates
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
        }
      },
      providesTags: (result, error, arg) => [
        {
          type: "MonthTasks",
          id: arg.userId ? `${arg.monthId}_user_${arg.userId}` : arg.monthId,
        },
      ],
    }),

    // Real-time subscription for board status
    subscribeToMonthBoard: builder.query({
      async queryFn({ monthId } = {}) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          const ref = doc(db, "tasks", monthId);
          const snap = await getDoc(ref);
          return { data: { exists: snap.exists(), monthId } };
        } catch (error) {
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

          const ref = doc(db, "tasks", arg.monthId);

          unsubscribe = onSnapshot(
            ref,
            (snapshot) => {
              updateCachedData(() => ({
                exists: snapshot.exists(),
                monthId: arg.monthId,
                lastUpdated: Date.now(),
              }));
            },
            (error) => {
              logger.error("Real-time board subscription error:", error);
            }
          );

          await cacheEntryRemoved;
        } catch (error) {
          logger.error(
            "Error setting up real-time board subscription:",
            error
          );
        } finally {
          if (unsubscribe) {
            unsubscribe();
          }
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthBoard", id: arg.monthId },
      ],
    }),

    // Create task with transaction for atomic operations
    createTask: builder.mutation({
      async queryFn(task, { getState }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
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

          return { data: result };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      // No cache invalidation needed - real-time subscription handles updates
      // invalidatesTags: [] // Removed - let real-time subscription handle cache updates
    }),

    // Update task with transaction
    updateTask: builder.mutation({
      async queryFn({ monthId, id, updates }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
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
      // No cache invalidation needed - real-time subscription handles updates
      // invalidatesTags: [] // Removed - let real-time subscription handle cache updates
    }),

    // Delete task with transaction
    deleteTask: builder.mutation({
      async queryFn({ monthId, id }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
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
      // No cache invalidation needed - real-time subscription handles updates
      // invalidatesTags: [] // Removed - let real-time subscription handle cache updates
    }),

    // Generate month board (admin only)
    generateMonthBoard: builder.mutation({
      async queryFn({ monthId, meta = {} }) {
        try {
          logger.log(`[tasksApi] Starting month board generation for monthId: ${monthId}`);
          
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Use transaction to ensure atomic board creation
          const result = await runTransaction(db, async (transaction) => {
            // Read operation first: Check if board already exists
            const boardRef = doc(db, "tasks", monthId);
            const boardDoc = await transaction.get(boardRef);

            if (boardDoc.exists()) {
              throw new Error("Month board already exists");
            }

            // Write operation: Create the board
            const boardId = `${monthId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const boardData = {
              monthId,
              boardId,
              createdAt: serverTimestamp(),
              createdBy: auth.currentUser.uid,
              createdByName:
                auth.currentUser.displayName || auth.currentUser.email,
              ...meta,
            };

            logger.log(`[tasksApi] Creating month board with data:`, { monthId, boardId, createdBy: auth.currentUser.uid });
            transaction.set(boardRef, boardData);
            return { monthId, boardId };
          });

          logger.log(`[tasksApi] Month board generated successfully. Result:`, result);

          return { data: result };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthBoard", id: arg.monthId },
      ],
    }),

    // Save charts data with batch operations
    saveChartsData: builder.mutation({
      async queryFn({ monthId, chartsData }) {
        try {
          if (!auth.currentUser) {
            return { error: { message: "Authentication required" } };
          }

          // Use batch operations for atomic writes
          const batch = writeBatch(db);

          // Save charts data to Firebase
          const chartsRef = doc(db, "charts", monthId);
          batch.set(chartsRef, {
            ...chartsData,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid,
          });

          // Also save to analytics collection for historical tracking
          const analyticsRef = doc(db, "analytics", monthId);
          batch.set(analyticsRef, {
            monthId,
            chartsData,
            generatedAt: serverTimestamp(),
            generatedBy: chartsData.generatedBy || auth.currentUser.uid,
            version: Date.now(), // For versioning
          });

          // Commit the batch atomically
          await batch.commit();

          return { data: { monthId, success: true } };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Charts", id: arg.monthId },
        { type: "Analytics", id: arg.monthId },
      ],
    }),


  }),
});

export const {
  useGetMonthTasksQuery,
  useSubscribeToMonthTasksQuery,
  useSubscribeToMonthBoardQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetMonthBoardExistsQuery,
  useGenerateMonthBoardMutation,
  useSaveChartsDataMutation,
  useGetTaskByIdQuery,
} = tasksApi;
