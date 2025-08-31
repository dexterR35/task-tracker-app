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
  startAfter,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../../app/firebase";
import {
  normalizeTimestamp,
} from "../../shared/utils/dateUtils";
import { logger } from "../../shared/utils/logger";

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
  tagTypes: ["MonthTasks", "Charts", "Analytics"],
  // Add cache cleanup configuration
  keepUnusedDataFor: 300, // Keep unused data for 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    // One-time fetch for tasks (for initial load or pagination)
    getMonthTasks: builder.query({
      async queryFn({ monthId, limitCount = 50, startAfterDoc = null } = {}) {
        try {
          if (!auth.currentUser) {
            // During logout, this is expected - return empty data instead of error
            return { data: [] };
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
      // No transformResponse needed - normalizeTask already returns serialized timestamps
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
            // During logout, this is expected - return empty data instead of error
            return { data: { tasks: [], boardExists: true, monthId } };
          }

          // Always return boardExists: true - let currentMonthSlice handle board status
          const normalizedUserId =
            userId && userId.trim() !== "" ? userId : null;
          const tasks = await fetchTasksFromFirestore(
            monthId,
            normalizedUserId
          );
          return { data: { tasks, boardExists: true, monthId } };
        } catch (error) {
          return { error: { message: error.message } };
        }
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
        const updateDebounce = 200; // Debounce updates by 200ms

        try {
          await cacheDataLoaded;

          // Set up task listener - let currentMonthSlice handle board status
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
                updateCachedData(() => ({ tasks: [], boardExists: true, monthId: arg.monthId }));
                return;
              }

              if (snapshot.empty) {
                updateCachedData(() => ({ tasks: [], boardExists: true, monthId: arg.monthId }));
                return;
              }

              const validDocs = snapshot.docs.filter(
                (doc) => doc && doc.exists() && doc.data() && doc.id
              );

              const tasks = validDocs
                .map((d) => normalizeTask(arg.monthId, d.id, d.data()))
                .filter((task) => task !== null);

              logger.debug(`[tasksApi] Real-time subscription update: ${tasks.length} tasks for ${arg.monthId}`);
              
              // Tasks are already serialized by normalizeTask
              updateCachedData(() => ({ tasks, boardExists: true, monthId: arg.monthId }));

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
      providesTags: (result, error, arg) => {
        // Optimized cache tags - use fewer, more general tags
        const tags = [
          { type: "MonthTasks", id: arg.monthId }, // All tasks for this month
        ];
        
        // Only add user-specific tag if userId is provided
        if (arg.userId) {
          tags.push({ type: "MonthTasks", id: `${arg.monthId}_user_${arg.userId}` });
        }
        
        return tags;
      },
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
          logger.debug(`[tasksApi] Created task:`, { 
            id: result.id, 
            monthId: result.monthId,
            taskName: result.taskName,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
          });

          return { data: result };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      // No transformResponse needed - normalizeTask already returns serialized timestamps
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
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useSaveChartsDataMutation,
} = tasksApi;
