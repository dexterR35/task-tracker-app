import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  fsQuery,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "../../hooks/useImports";
import { db } from "../../firebase";
import { computeAnalyticsFromTasks } from "../../utils/analyticsUtils";
import { normalizeTimestamp } from "../../utils/dateUtils";

// Coerce Firestore timestamps and ensure numeric fields are numbers
const normalizeTask = (monthId, id, data) => {
  // Handle undefined or null data
  if (!data || typeof data !== "object") {
    console.warn("[normalizeTask] Invalid data provided:", {
      monthId,
      id,
      data,
    });
    return null;
  }

  const createdAt = normalizeTimestamp(data.createdAt);
  const updatedAt = normalizeTimestamp(data.updatedAt);
  const timeInHours = Number(data.timeInHours) || 0;
  const timeSpentOnAI = Number(data.timeSpentOnAI) || 0;

  // Ensure deliverablesOther is false when not selected, array when selected
  const deliverablesOther = Array.isArray(data.deliverablesOther)
    ? data.deliverablesOther
    : false;

  // Ensure aiModels is false when not selected, array when selected
  const aiModels = Array.isArray(data.aiModels) ? data.aiModels : false;

  // Ensure deliverablesCount is always a number
  const deliverablesCount = Number(data.deliverablesCount) || 0;

  return {
    id,
    monthId,
    ...data,
    deliverablesOther, // Ensure it's false when not selected, array when selected
    aiModels, // Ensure it's false when not selected, array when selected
    deliverablesCount, // Ensure it's always a number
    createdAt,
    updatedAt,
    timeInHours,
    timeSpentOnAI,
  };
};

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthTasks", "MonthAnalytics", "MonthBoard"],
  endpoints: (builder) => ({
    listAllAnalytics: builder.query({
      async queryFn() {
        try {
          const snap = await getDocs(collection(db, "analytics"));
          const items = snap.docs
            .map((d) => {
              const raw = d.data();
              const savedAt = normalizeTimestamp(raw.savedAt);
              // Spread raw first, then overwrite savedAt with normalized number to avoid Timestamp leaks
              return {
                id: d.id,
                monthId: raw.monthId || d.id,
                ...raw,
                savedAt,
              };
            })
            .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
          return { data: items };
        } catch (error) {
          return {
            error: {
              message: error?.message || "Failed to load analytics list",
            },
          };
        }
      },
      providesTags: ["MonthAnalytics"],
    }),
    getMonthBoardExists: builder.query({
      async queryFn({ monthId }) {
        try {
          const ref = doc(db, "tasks", monthId);
          const snap = await getDocFromServer(ref);
          return { data: { exists: snap.exists() } };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to check month board" },
          };
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthBoard", id: arg.monthId },
      ],
    }),

    // Enhanced initial fetch with caching
    getMonthTasks: builder.query({
      async queryFn({ monthId, useCache = true } = {}) {
        try {
          // Strategy 1: Check IndexedDB cache first
          if (useCache) {
            const { taskStorage } = await import(
              "../../utils/indexedDBStorage"
            );
            if (
              (await taskStorage.hasTasks(monthId)) &&
              (await taskStorage.isTasksFresh(monthId))
            ) {
              const cachedTasks = await taskStorage.getTasks(monthId);
              console.log(
                "Using cached tasks from IndexedDB:",
                cachedTasks.length,
                "tasks for month:",
                monthId
              );
              return { data: cachedTasks };
            }
          }

          // Strategy 1: Check if board exists first
          const monthDocRef = doc(db, "tasks", monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            console.log(
              "Board does not exist for month:",
              monthId,
              "- skipping fetch"
            );
            return { data: [] };
          }

          // Strategy 2: Fetch tasks only if board exists
          console.log("Fetching tasks from Firebase for month:", monthId);
          const colRef = collection(db, "tasks", monthId, "monthTasks");
          const snap = await getDocs(
            fsQuery(colRef, orderBy("createdAt", "desc"))
          );
          const tasks = snap.docs.map((d) =>
            normalizeTask(monthId, d.id, d.data())
          );

          // Cache tasks in IndexedDB for future use (only if board exists)
          if (useCache && tasks.length > 0) {
            const { taskStorage } = await import(
              "../../utils/indexedDBStorage"
            );
            await taskStorage.storeTasks(monthId, tasks);
            console.log(
              "Tasks cachedeee in IndexedDB for month 2:",
              monthId,
              "count:",
              tasks.length
            );
          }

          return { data: tasks };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to load tasks" },
          };
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId },
        {
          type: "MonthTasks",
          id: `${arg.monthId}_user_${arg.userId || "all"}`,
        },
      ],
    }),

    // Real-time subscription for tasks with dynamic user filtering
    subscribeToMonthTasks: builder.query({
      async queryFn({ monthId, userId = null, useCache = true } = {}) {
        try {
          // Normalize userId to prevent duplicate queries
          const normalizedUserId = userId && userId.trim() !== '' ? userId : null;
          
          console.log("[subscribeToMonthTasks] Called with:", {
            monthId,
            userId: normalizedUserId,
            useCache,
          });
          // Create cache key that includes user filter
          const cacheKey = normalizedUserId ? `${monthId}_user_${normalizedUserId}` : monthId;

          // Strategy 1: Check IndexedDB cache first
          if (useCache) {
            const { taskStorage } = await import(
              "../../utils/indexedDBStorage"
            );
            if (
              (await taskStorage.hasTasks(cacheKey)) &&
              (await taskStorage.isTasksFresh(cacheKey))
            ) {
              const cachedTasks = await taskStorage.getTasks(cacheKey);
              console.log(
                "Using cached tasks from IndexedDB:",
                cachedTasks.length,
                "tasks for",
                normalizedUserId ? `user ${normalizedUserId}` : "all users",
                "month:",
                monthId
              );
              return { data: cachedTasks };
            }
          }

          // Strategy 1: Dynamic Firestore query with user filtering
          const colRef = collection(db, "tasks", monthId, "monthTasks");
          let query = fsQuery(colRef, orderBy("createdAt", "desc"));

          // Apply user filter if specified
          if (normalizedUserId) {
            query = fsQuery(
              colRef,
              where("userUID", "==", normalizedUserId),
              orderBy("createdAt", "desc")
            );
          }

          const snap = await getDocs(query);
          const tasks = snap.docs.map((d) =>
            normalizeTask(monthId, d.id, d.data())
          );

          // Cache filtered data with user-specific key
          if (useCache && tasks.length > 0) {
            const { taskStorage } = await import(
              "../../utils/indexedDBStorage"
            );
            await taskStorage.storeTasks(cacheKey, tasks);
            console.log(
              "Tasks cached in IndexedDB for",
              normalizedUserId ? `user ${normalizedUserId}` : "all users",
              "month:",
              monthId
            );
          }

          return { data: tasks };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to load tasks" },
          };
        }
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        try {
          await cacheDataLoaded;

          // Check if board exists before setting up real-time listener
          const monthDocRef = doc(db, "tasks", arg.monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            console.log(
              "[Real-time] Board does not exist for monthId:",
              arg.monthId,
              "- no real-time updates needed"
            );
            updateCachedData(() => []);
            return;
          }

          const colRef = collection(db, "tasks", arg.monthId, "monthTasks");
          let query = fsQuery(colRef, orderBy("createdAt", "desc"));

          // Apply user filter if specified
          if (arg.userId && arg.userId.trim() !== '') {
            query = fsQuery(
              colRef,
              where("userUID", "==", arg.userId),
              orderBy("createdAt", "desc")
            );
          }

          const unsubscribe = onSnapshot(
            query,
            async (snapshot) => {
              // Check if snapshot exists and is valid
              if (!snapshot || !snapshot.docs) {
                console.log(
                  "[Real-time] Invalid snapshot for monthId:",
                  arg.monthId
                );
                updateCachedData(() => []);
                return;
              }

              // Handle case where collection doesn't exist (board not created)
              if (snapshot.empty) {
                console.log(
                  "[Real-time] Board exists but no tasks found for monthId:",
                  arg.monthId
                );
                updateCachedData(() => []);
                return;
              }

              console.log(
                "[Real-time] Normalizing tasks with monthId:",
                arg.monthId
              );

              // Filter out any undefined or invalid documents
              const validDocs = snapshot.docs.filter(
                (doc) => doc && doc.exists() && doc.data() && doc.id
              );

              const tasks = validDocs
                .map((d) => normalizeTask(arg.monthId, d.id, d.data()))
                .filter((task) => task !== null); // Filter out null tasks

              // Only log if there are tasks
              if (tasks.length > 0) {
                console.log(
                  "[Real-time] First task after normalize:",
                  tasks[0]
                );
              } else {
                console.log(
                  "[Real-time] No tasks found for monthId:",
                  arg.monthId
                );
              }

              const cacheKey = arg.userId && arg.userId.trim() !== ''
                ? `${arg.monthId}_user_${arg.userId}`
                : arg.monthId;

              // Update Redux state locally
              updateCachedData(() => tasks);

              // Update IndexedDB cache with real-time changes (debounced)
              const { taskStorage, analyticsStorage } = await import(
                "../../utils/indexedDBStorage"
              );
              
              // Only cache if we have tasks to avoid empty cache entries
              if (tasks.length > 0) {
                await taskStorage.storeTasks(cacheKey, tasks);

                // Pre-compute and cache analytics from updated tasks
                const analyticsData = computeAnalyticsFromTasks(
                  tasks,
                  arg.monthId
                );
                await analyticsStorage.storeAnalytics(arg.monthId, analyticsData);
              }
            },
            (error) => {
              console.error("Real-time subscription error:", error);
            }
          );

          await cacheEntryRemoved;
          unsubscribe();
        } catch (error) {
          console.error("Error setting up real-time subscription:", error);
        }
      },
      providesTags: (result, error, arg) => [
        {
          type: "MonthTasks",
          id: arg.userId ? `${arg.monthId}_user_${arg.userId}` : arg.monthId,
        },
      ],
    }),

    // Strategy 2: CRUD operations with local Redux updates
    createTask: builder.mutation({
      async queryFn(task) {
        try {
          // Ensure month board exists
          const monthDocRef = doc(db, "tasks", task.monthId);
          const monthDoc = await getDoc(monthDocRef);
          if (!monthDoc.exists()) {
            const err = new Error("MONTH_NOT_GENERATED");
            err.code = "month-not-generated";
            throw err;
          }

          const colRef = collection(db, "tasks", task.monthId, "monthTasks");
          const payload = {
            ...task,
            monthId: task.monthId, // Ensure monthId is explicitly set
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          const ref = await addDoc(colRef, payload);

          // Read back the saved doc to resolve server timestamps to real values
          const savedSnap = await getDoc(ref);
          const created = normalizeTask(
            task.monthId,
            ref.id,
            savedSnap.data() || {}
          );
          console.log(
            "[CreateTask] Task created:",
            created.id,
            "for month:",
            task.monthId
          );

          // Update IndexedDB cache
          const { taskStorage } = await import("../../utils/indexedDBStorage");
          await taskStorage.addTask(task.monthId, created);

          return { data: created };
        } catch (error) {
          return {
            error: {
              message: error?.message || "Failed to create task",
              code: error?.code,
            },
          };
        }
      },
      // Optimistic update for immediate UI feedback
      async onQueryStarted(task, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData(
            "subscribeToMonthTasks",
            { monthId: task.monthId },
            (draft) => {
              // Add the new task to the beginning of the list
              const newTaskWithId = {
                ...task,
                id: `temp-${Date.now()}`, // Temporary ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              draft.unshift(newTaskWithId);
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          // If the mutation fails, revert the optimistic update
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId },
        { type: "MonthTasks", id: `${arg.monthId}_user_all` },
        {
          type: "MonthTasks",
          id: `${arg.monthId}_user_${arg.userUID || "all"}`,
        },
      ],
    }),

    updateTask: builder.mutation({
      async queryFn({ monthId, id, updates }) {
        try {
          const ref = doc(db, "tasks", monthId, "monthTasks", id);

          // Ensure monthId is preserved in updates
          const updatesWithMonthId = {
            ...updates,
            monthId: monthId, // Ensure monthId is preserved
            updatedAt: serverTimestamp(),
          };

          await updateDoc(ref, updatesWithMonthId);

          // Update IndexedDB cache with the same data
          const { taskStorage } = await import("../../utils/indexedDBStorage");
          await taskStorage.updateTask(monthId, id, updatesWithMonthId);

          return { data: { id, monthId, updates: updatesWithMonthId } };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to update task" },
          };
        }
      },
      // Optimistic update for immediate UI feedback
      async onQueryStarted(
        { monthId, id, updates },
        { dispatch, queryFulfilled, getState }
      ) {
        // Get current cache data
        const patchResult = dispatch(
          tasksApi.util.updateQueryData(
            "subscribeToMonthTasks",
            { monthId },
            (draft) => {
              const taskIndex = draft.findIndex((task) => task.id === id);
              if (taskIndex !== -1) {
                // Update the task in cache immediately
                draft[taskIndex] = {
                  ...draft[taskIndex],
                  ...updates,
                  monthId: monthId,
                  updatedAt: new Date().toISOString(),
                };
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          // If the mutation fails, revert the optimistic update
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId },
        { type: "MonthTasks", id: `${arg.monthId}_user_all` },
        {
          type: "MonthTasks",
          id: `${arg.monthId}_user_${arg.userUID || "all"}`,
        },
      ],
    }),

    deleteTask: builder.mutation({
      async queryFn({ monthId, id }) {
        try {
          const ref = doc(db, "tasks", monthId, "monthTasks", id);
          await deleteDoc(ref);
          // Update IndexedDB cache
          const { taskStorage } = await import("../../utils/indexedDBStorage");
          await taskStorage.removeTask(monthId, id);
          return { data: { id, monthId } };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to delete task" },
          };
        }
      },
      // Optimistic update for immediate UI feedback
      async onQueryStarted({ monthId, id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData(
            "subscribeToMonthTasks",
            { monthId },
            (draft) => {
              // Remove the task from cache immediately
              const taskIndex = draft.findIndex((task) => task.id === id);
              if (taskIndex !== -1) {
                draft.splice(taskIndex, 1);
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          // If the mutation fails, revert the optimistic update
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthTasks", id: arg.monthId },
        { type: "MonthTasks", id: `${arg.monthId}_user_all` },
        {
          type: "MonthTasks",
          id: `${arg.monthId}_user_${arg.userUID || "all"}`,
        },
      ],
    }),

    generateMonthBoard: builder.mutation({
      async queryFn({ monthId, meta = {} }) {
        try {
          const boardId = `${monthId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(
            doc(db, "tasks", monthId),
            {
              monthId,
              boardId, // Add auto-generated board ID
              createdAt: serverTimestamp(),
              ...meta,
            },
            { merge: true }
          );

          return { data: { monthId, boardId } };
        } catch (error) {
          return {
            error: {
              message: error?.message || "Failed to generate month board",
            },
          };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthBoard", id: arg.monthId },
      ],
    }),

    getMonthAnalytics: builder.query({
      async queryFn({ monthId }) {
        try {
          const ref = doc(db, "analytics", monthId);
          const snap = await getDocFromServer(ref);
          if (!snap.exists()) return { data: null };
          const raw = snap.data();
          const savedAt = normalizeTimestamp(raw.savedAt);
          return { data: { ...raw, savedAt } };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to load analytics" },
          };
        }
      },
      providesTags: (result, error, arg) => [
        { type: "MonthAnalytics", id: arg.monthId },
      ],
    }),

    // Strategy 3: Analytics generation from Redux state (no Firebase reads)
    computeMonthAnalytics: builder.mutation({
      async queryFn({ monthId, useCache = true, tasks = null }) {
        try {
          console.log(
            "computeMonthAnalytics called for month:",
            monthId,
            "useCache:",
            useCache
          );

          // Strategy 3: Check if we have fresh cached analytics
          if (useCache) {
            const { analyticsStorage, taskStorage } = await import(
              "../../utils/indexedDBStorage"
            );
            if (
              (await analyticsStorage.hasAnalytics(monthId)) &&
              (await analyticsStorage.isAnalyticsFresh(monthId))
            ) {
              const cachedAnalytics =
                await analyticsStorage.getAnalytics(monthId);
              // console.log('Using cached analytics for month:', monthId);
              return { data: cachedAnalytics };
            }
            // Strategy 3: Use tasks from Redux state if provided, otherwise fetch from cache
            let tasksToUse = tasks;
            console.log("tasksToUse", tasksToUse);
            if (!tasksToUse) {
              // console.log('No tasks provided, checking IndexedDB cache for month:', monthId);
              tasksToUse = await taskStorage.getTasks(monthId);
            }
          }

          if (!tasksToUse || tasksToUse.length === 0) {
            // console.log('No tasks found for month:', monthId);
            return {
              error: {
                code: "NO_TASKS",
                message: `No tasks found for ${monthId}. Please create some tasks first.`,
              },
            };
          }

          // console.log('Computing analytics from', tasksToUse.length, 'tasks for month:', monthId);
          const analyticsData = computeAnalyticsFromTasks(tasksToUse, monthId);
          // Store in IndexedDB for future use
          const { analyticsStorage } = await import(
            "../../utils/indexedDBStorage"
          );
          await analyticsStorage.storeAnalytics(monthId, analyticsData);
          // console.log('Analytics computed and stored in IndexedDB for month:', monthId);

          return { data: analyticsData };
        } catch (error) {
          console.error("Error computing analytics:", error);
          return {
            error: { message: error?.message || "Failed to compute analytics" },
          };
        }
      },
    }),

    saveMonthAnalytics: builder.mutation({
      async queryFn({ monthId, data, overwrite = false }) {
        try {
          const ref = doc(db, "analytics", monthId);
          const snap = await getDocFromServer(ref);
          if (!overwrite && snap.exists()) {
            return {
              error: {
                code: "ANALYTICS_EXISTS",
                message: "Analytics for this month already exist",
              },
            };
          }
          await setDoc(
            ref,
            { ...data, savedAt: serverTimestamp() },
            { merge: true }
          );
          const fresh = await getDocFromServer(ref);
          const raw = fresh.data() || {};
          const savedAt = normalizeTimestamp(raw.savedAt);
          return { data: { ...raw, savedAt } };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to save analytics" },
          };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthAnalytics", id: arg.monthId },
        "MonthAnalytics",
      ],
    }),

    deleteMonthAnalytics: builder.mutation({
      async queryFn({ monthId }) {
        try {
          const ref = doc(db, "analytics", monthId);
          await deleteDoc(ref);
          return { data: { monthId, deleted: true } };
        } catch (error) {
          return {
            error: { message: error?.message || "Failed to delete analytics" },
          };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthAnalytics", id: arg.monthId },
        "MonthAnalytics",
      ],
    }),
  }),
});

export const {
  useGetMonthTasksQuery,
  useSubscribeToMonthTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetMonthBoardExistsQuery,
  useGenerateMonthBoardMutation,
  useGetMonthAnalyticsQuery,
  useComputeMonthAnalyticsMutation,
  useSaveMonthAnalyticsMutation,
  useListAllAnalyticsQuery,
  useDeleteMonthAnalyticsMutation,
} = tasksApi;
