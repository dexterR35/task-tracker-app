import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  query as fsQuery,
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
  limit,
  startAfter,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../app/firebase";
import { normalizeTimestamp, serializeTimestampsForRedux } from "../../shared/utils/dateUtils";
import { logger } from "../../shared/utils/logger";

// ===== UTILITY FUNCTIONS =====

// Token validation utility
const validateToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    // Force token refresh if needed
    await user.getIdToken(true);
    return true;
  } catch (error) {
    logger.error('Token validation failed:', error);
    throw new Error('Authentication required');
  }
};

// Wrapper for all Firestore operations with token validation
const withTokenValidation = async (operation) => {
  try {
    await validateToken();
    return await operation();
  } catch (error) {
    if (error.message === 'Authentication required') {
      throw new Error('AUTH_REQUIRED');
    }
    throw error;
  }
};

// Check if user is authenticated (for early returns)
const isUserAuthenticated = () => {
  return auth.currentUser !== null;
};

// Request deduplication
const pendingRequests = new Map();

const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = requestFn();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};

// Retry mechanism for network errors
const withRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Only retry on network errors
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
};

// Error handling wrapper
const handleFirestoreError = (error, operation) => {
  logger.error(`Firestore ${operation} failed:`, error);
  
  if (error.code === 'permission-denied') {
    return { error: { message: 'Access denied', code: 'PERMISSION_DENIED' } };
  }
  
  if (error.code === 'unavailable') {
    return { error: { message: 'Service temporarily unavailable', code: 'SERVICE_UNAVAILABLE' } };
  }
  
  if (error.code === 'not-found') {
    return { error: { message: 'Resource not found', code: 'NOT_FOUND' } };
  }
  
  return { error: { message: error?.message || `Failed to ${operation}` } };
};

// Shared function for fetching tasks from Firestore
const fetchTasksFromFirestore = async (monthId, userId = null, options = {}) => {
  const { limitCount = 50, startAfterDoc = null } = options;
  
  const colRef = collection(db, "tasks", monthId, "monthTasks");
  let query = fsQuery(colRef, orderBy("createdAt", "desc"), limit(limitCount));

  if (userId && userId.trim() !== '') {
    query = fsQuery(colRef, where("userUID", "==", userId), orderBy("createdAt", "desc"), limit(limitCount));
  }

  if (startAfterDoc) {
    query = fsQuery(query, startAfter(startAfterDoc));
  }

  const snap = await getDocs(query);
  return snap.docs.map((d) => normalizeTask(monthId, d.id, d.data()));
};

// API call logging
const logApiCall = (endpoint, args, result, error = null) => {
  if (error) {
    logger.error(`[${endpoint}] Failed:`, { args, error: error.message });
  } else {
    logger.log(`[${endpoint}] Success:`, { 
      args, 
      resultCount: Array.isArray(result) ? result.length : 1 
    });
  }
};

// Coerce Firestore timestamps and ensure numeric fields are numbers
const normalizeTask = (monthId, id, data) => {
  // Handle undefined or null data
  if (!data || typeof data !== "object") {
    logger.warn("[normalizeTask] Invalid data provided:", {
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
  tagTypes: ["MonthTasks", "MonthBoard"],
  endpoints: (builder) => ({

    getMonthBoardExists: builder.query({
      async queryFn({ monthId }) {
        const cacheKey = `getMonthBoardExists_${monthId}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // Check if user is authenticated before proceeding
            if (!isUserAuthenticated()) {
              logger.log('User not authenticated yet, skipping month board check');
              return { data: { exists: false } };
            }

            const result = await withTokenValidation(async () => {
              const ref = doc(db, "tasks", monthId);
              const snap = await getDocFromServer(ref);
              return { data: { exists: snap.exists() } };
            });
            
            logApiCall('getMonthBoardExists', { monthId }, result.data);
            return result;
          } catch (error) {
            // If it's an auth error, return false instead of error
            if (error.message === 'AUTH_REQUIRED' || error.message.includes('Authentication required')) {
              logger.log('Auth required for month board check, returning false');
              return { data: { exists: false } };
            }
            
            const errorResult = handleFirestoreError(error, 'check month board');
            logApiCall('getMonthBoardExists', { monthId }, null, error);
            return errorResult;
          }
        });
      },
      providesTags: (result, error, arg) => [
        { type: "MonthBoard", id: arg.monthId },
      ],
    }),

    // Online-only fetch from Firestore
    getMonthTasks: builder.query({
      async queryFn({ monthId, limitCount = 50, startAfterDoc = null } = {}) {
        const cacheKey = `getMonthTasks_${monthId}_${limitCount}_${startAfterDoc?.id || 'null'}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            const result = await withTokenValidation(async () => {
              // Check if board exists first
              const monthDocRef = doc(db, "tasks", monthId);
              const monthDoc = await getDoc(monthDocRef);

              if (!monthDoc.exists()) {
                logger.log(
                  "Board does not exist for month:",
                  monthId,
                  "- skipping fetch"
                );
                return { data: [] };
              }

              // Fetch tasks from Firestore
              logger.log("Fetching tasks from Firebase for month:", monthId);
              const tasks = await fetchTasksFromFirestore(monthId, null, { limitCount, startAfterDoc });

              return { data: tasks };
            });
            
            logApiCall('getMonthTasks', { monthId, limitCount }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'load tasks');
            logApiCall('getMonthTasks', { monthId }, null, error);
            return errorResult;
          }
        });
      },
      // Transform response to ensure only serializable data is stored in Redux
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

    // Real-time subscription for tasks with enhanced error handling
    subscribeToMonthTasks: builder.query({
      async queryFn({ monthId, userId = null } = {}) {
        const cacheKey = `subscribeToMonthTasks_${monthId}_${userId || 'all'}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            const result = await withTokenValidation(async () => {
              // Normalize userId to prevent duplicate queries
              const normalizedUserId = userId && userId.trim() !== '' ? userId : null;
              
              logger.log("[subscribeToMonthTasks] Called with:", {
                monthId,
                userId: normalizedUserId,
              });

              // Dynamic Firestore query with user filtering
              const tasks = await fetchTasksFromFirestore(monthId, normalizedUserId);

              return { data: tasks };
            });
            
            logApiCall('subscribeToMonthTasks', { monthId, userId }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'load tasks');
            logApiCall('subscribeToMonthTasks', { monthId, userId }, null, error);
            return errorResult;
          }
        });
      },
      // Transform response to store full data in Redux
      transformResponse: (response) => {
        return serializeTimestampsForRedux(response);
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        let unsubscribe = null;
        
        try {
          await cacheDataLoaded;

          // Check if board exists before setting up real-time listener
          const monthDocRef = doc(db, "tasks", arg.monthId);
          const monthDoc = await getDoc(monthDocRef);

          if (!monthDoc.exists()) {
            logger.log(
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

          unsubscribe = onSnapshot(
            query,
            async (snapshot) => {
              // Check if snapshot exists and is valid
              if (!snapshot || !snapshot.docs) {
                logger.log(
                  "[Real-time] Invalid snapshot for monthId:",
                  arg.monthId
                );
                updateCachedData(() => []);
                return;
              }

              // Handle case where collection doesn't exist (board not created)
              if (snapshot.empty) {
                logger.log(
                  "[Real-time] Board exists but no tasks found for monthId:",
                  arg.monthId
                );
                updateCachedData(() => []);
                return;
              }

              logger.log(
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
                logger.log(
                  "[Real-time] First task after normalize:",
                  tasks[0]
                );
              } else {
                logger.log(
                  "[Real-time] No tasks found for monthId:",
                  arg.monthId
                );
              }

              // Update Redux cache with the tasks
              updateCachedData((draft) => {
                // Only update if the data is actually different
                const currentData = draft || [];
                
                // Simple length check first
                if (currentData.length !== tasks.length) {
                  logger.log(
                    "[Real-time] Updating cache for monthId:",
                    arg.monthId,
                    "Total tasks:",
                    tasks.length
                  );
                  return tasks;
                }
                
                // Deep comparison only if lengths match
                const hasChanged = currentData.some((task, index) => {
                  const newTask = tasks[index];
                  return !newTask || task.id !== newTask.id || 
                         task.updatedAt !== newTask.updatedAt;
                });
                
                if (hasChanged) {
                  logger.log(
                    "[Real-time] Updating cache for monthId:",
                    arg.monthId,
                    "Total tasks:",
                    tasks.length
                  );
                  return tasks;
                }
                
                // Return draft unchanged if no actual changes
                return draft;
              });

              // Trigger analytics recalculation for cards with more detailed event
              window.dispatchEvent(new CustomEvent('task-changed', { 
                detail: { 
                  monthId: arg.monthId,
                  userId: arg.userId,
                  source: 'firebase-realtime',
                  operation: 'update',
                  tasksCount: tasks.length,
                  timestamp: Date.now()
                } 
              }));
            },
            (error) => {
              logger.error("Real-time subscription error:", error);
            }
          );

          await cacheEntryRemoved;
        } catch (error) {
          logger.error("Error setting up real-time subscription:", error);
        } finally {
          // Ensure cleanup
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

    // Enhanced CRUD operations with retry logic
    createTask: builder.mutation({
      async queryFn(task) {
        return await withRetry(async () => {
          try {
            const result = await withTokenValidation(async () => {
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
              logger.log(
                "[CreateTask] Task created:",
                created.id,
                "for month:",
                task.monthId
              );
              
              // Trigger real-time update for cards with detailed event
              window.dispatchEvent(new CustomEvent('task-changed', { 
                detail: { 
                  monthId: task.monthId,
                  operation: 'create',
                  taskId: created.id,
                  taskUserId: task.userUID,
                  source: 'crud-operation',
                  timestamp: Date.now()
                } 
              }));

              return { data: created };
            });
            
            logApiCall('createTask', { monthId: task.monthId, taskName: task.taskName }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'create task');
            logApiCall('createTask', { monthId: task.monthId }, null, error);
            return errorResult;
          }
        });
      },
      // Enhanced optimistic update for immediate UI feedback
      async onQueryStarted(task, { dispatch, queryFulfilled, getState }) {
        // Generate optimistic ID
        const optimisticId = `optimistic_${Date.now()}`;
        const optimisticTask = {
          ...task,
          id: optimisticId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true
        };

        // Update all related queries
        const patchResults = [];
        
        // Update main query (all users)
        patchResults.push(dispatch(
          tasksApi.util.updateQueryData(
            "subscribeToMonthTasks",
            { monthId: task.monthId },
            (draft) => {
              // Check if task already exists to prevent duplicates
              const existingIndex = draft.findIndex(t => 
                t._isOptimistic && t.taskNumber === task.taskNumber && t.userUID === task.userUID
              );
              if (existingIndex === -1) {
                draft.unshift(optimisticTask);
              }
            }
          )
        ));

        // Update user-specific query if needed
        if (task.userUID) {
          patchResults.push(dispatch(
            tasksApi.util.updateQueryData(
              "subscribeToMonthTasks",
              { monthId: task.monthId, userId: task.userUID },
              (draft) => {
                // Check if task already exists to prevent duplicates
                const existingIndex = draft.findIndex(t => 
                  t._isOptimistic && t.taskNumber === task.taskNumber && t.userUID === task.userUID
                );
                if (existingIndex === -1) {
                  draft.unshift(optimisticTask);
                }
              }
            )
          ));
        }

        try {
          // Wait for the actual API call to complete
          const { data: createdTask } = await queryFulfilled;
          
          // Replace optimistic task with real task in all queries
          const replaceOptimisticTask = (draft) => {
            const optimisticIndex = draft.findIndex(t => t.id === optimisticId);
            if (optimisticIndex !== -1) {
              draft[optimisticIndex] = createdTask;
            } else {
              // If optimistic task not found, add the real task
              const existingIndex = draft.findIndex(t => t.id === createdTask.id);
              if (existingIndex === -1) {
                draft.unshift(createdTask);
              }
            }
          };

          // Update main query
          dispatch(
            tasksApi.util.updateQueryData(
              "subscribeToMonthTasks",
              { monthId: task.monthId },
              replaceOptimisticTask
            )
          );

          // Update user-specific query if needed
          if (task.userUID) {
            dispatch(
              tasksApi.util.updateQueryData(
                "subscribeToMonthTasks",
                { monthId: task.monthId, userId: task.userUID },
                replaceOptimisticTask
              )
            );
          }
        } catch (error) {
          // If the API call failed, remove the optimistic task
          const removeOptimisticTask = (draft) => {
            const index = draft.findIndex(t => t.id === optimisticId);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          };

          // Remove from all queries
          patchResults.forEach(patchResult => {
            if (patchResult.undo) {
              patchResult.undo();
            }
          });
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
        return await withRetry(async () => {
          try {
            const result = await withTokenValidation(async () => {
              const ref = doc(db, "tasks", monthId, "monthTasks", id);

              // Ensure monthId is preserved in updates
              const updatesWithMonthId = {
                ...updates,
                monthId: monthId, // Ensure monthId is preserved
                updatedAt: serverTimestamp(),
              };

              await updateDoc(ref, updatesWithMonthId);
              
              // Trigger real-time update for cards with detailed event
              window.dispatchEvent(new CustomEvent('task-changed', { 
                detail: { 
                  monthId,
                  operation: 'update',
                  taskId: id,
                  taskUserId: updates.userUID || null,
                  source: 'crud-operation',
                  timestamp: Date.now()
                } 
              }));

              return { data: { id, monthId, success: true } };
            });
            
            logApiCall('updateTask', { monthId, id }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'update task');
            logApiCall('updateTask', { monthId, id }, null, error);
            return errorResult;
          }
        });
      },
      // Enhanced optimistic update for immediate UI feedback
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
        return await withRetry(async () => {
          try {
            const result = await withTokenValidation(async () => {
              const ref = doc(db, "tasks", monthId, "monthTasks", id);
              await deleteDoc(ref);
              
              // Trigger real-time update for cards with detailed event
              window.dispatchEvent(new CustomEvent('task-changed', { 
                detail: { 
                  monthId,
                  operation: 'delete',
                  taskId: id,
                  taskUserId: null, // We don't have the user ID for deleted tasks
                  source: 'crud-operation',
                  timestamp: Date.now()
                } 
              }));
              
              return { data: { id, monthId } };
            });
            
            logApiCall('deleteTask', { monthId, id }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'delete task');
            logApiCall('deleteTask', { monthId, id }, null, error);
            return errorResult;
          }
        });
      },
      // Enhanced optimistic update for immediate UI feedback
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
        return await withRetry(async () => {
          try {
            const result = await withTokenValidation(async () => {
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
            });
            
            logApiCall('generateMonthBoard', { monthId }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'generate month board');
            logApiCall('generateMonthBoard', { monthId }, null, error);
            return errorResult;
          }
        });
      },
      invalidatesTags: (result, error, arg) => [
        { type: "MonthBoard", id: arg.monthId },
      ],
    }),

    // Save charts data to Firebase using batch operations
    saveChartsData: builder.mutation({
      async queryFn({ monthId, chartsData }) {
        return await withRetry(async () => {
          try {
            const result = await withTokenValidation(async () => {
              // Create a batch for atomic operations
              const batch = writeBatch(db);
              
              // Save charts data to Firebase
              const chartsRef = doc(db, "charts", monthId);
              batch.set(chartsRef, {
                ...chartsData,
                updatedAt: serverTimestamp(),
              });

              // Also save to analytics collection for historical tracking
              const analyticsRef = doc(db, "analytics", monthId);
              batch.set(analyticsRef, {
                monthId,
                chartsData,
                generatedAt: serverTimestamp(),
                generatedBy: chartsData.generatedBy,
              });

              // Commit the batch
              await batch.commit();

              logger.log("[SaveChartsData] Charts saved for month:", monthId);

              return { data: { monthId, success: true } };
            });
            
            logApiCall('saveChartsData', { monthId }, result.data);
            return result;
          } catch (error) {
            const errorResult = handleFirestoreError(error, 'save charts data');
            logApiCall('saveChartsData', { monthId }, null, error);
            return errorResult;
          }
        });
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
  useGetMonthBoardExistsQuery,
  useGenerateMonthBoardMutation,
  useSaveChartsDataMutation,
} = tasksApi;
