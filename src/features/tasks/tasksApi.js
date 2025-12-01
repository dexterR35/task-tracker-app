
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  getDocs,
  getDoc
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { serializeTimestampsForContext } from "@/utils/dateUtils";
import { getCurrentYear } from "@/utils/dateUtils";
import listenerManager from "@/features/utils/firebaseListenerManager";
import { validateTaskPermissions } from '@/utils/permissionValidation';
import { getUserUID } from '@/features/utils/authUtils';


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
  const yearId = monthId.split('-')[0]; // Extract year from monthId
  return doc(db, "departments", "design", yearId, monthId);
};


const buildTaskQuery = (tasksRef, role, userUID) => {
  if (role === "user") {
    // Regular users: fetch only their own tasks
    return query(tasksRef, where("userUID", "==", userUID));
  } else if (role === "admin" && userUID) {
    // Admin users: specific user's tasks when a user is selected
    return query(tasksRef, where("userUID", "==", userUID));
  } else {
    // Admin users: all tasks when no specific user is selected
    return query(tasksRef);
  }
};

/**
 * Helper function to detect if task data has actually changed
 */
const hasTaskDataChanged = (currentData, newData) => {
  // Remove timestamp fields from comparison as they will always be different
  const fieldsToIgnore = ['createdAt', 'updatedAt', 'data_task'];

  // Extract the actual task data from currentData
  const currentTaskData = currentData?.data_task || currentData;

  // Debug logging only in development mode
  if (import.meta.env.MODE === 'development') {
    logger.log('🔍 [hasTaskDataChanged] Comparing data:', {
      currentTaskData: currentTaskData,
      newData: newData,
      fieldsToIgnore: fieldsToIgnore
    });
  }

  // Compare relevant fields
  const relevantFields = Object.keys(newData).filter(key => !fieldsToIgnore.includes(key));

  for (const field of relevantFields) {
    const currentValue = currentTaskData?.[field];
    const newValue = newData[field];

    // Debug logging only in development mode
    if (import.meta.env.MODE === 'development') {
      logger.log(`🔍 [hasTaskDataChanged] Comparing field "${field}":`, {
        currentValue: currentValue,
        newValue: newValue,
        areEqual: currentValue === newValue
      });
    }

    // Handle array comparisons
    if (Array.isArray(currentValue) && Array.isArray(newValue)) {
      if (currentValue.length !== newValue.length) {
        if (import.meta.env.MODE === 'development') {
          logger.log(`🔍 [hasTaskDataChanged] Array length different for "${field}"`);
        }
        return true;
      }
      if (!currentValue.every((item, index) => item === newValue[index])) {
        if (import.meta.env.MODE === 'development') {
          logger.log(`🔍 [hasTaskDataChanged] Array content different for "${field}"`);
        }
        return true;
      }
    }
    // Handle object comparisons
    else if (typeof currentValue === 'object' && typeof newValue === 'object') {
      if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
        if (import.meta.env.MODE === 'development') {
          logger.log(`🔍 [hasTaskDataChanged] Object different for "${field}"`);
        }
        return true;
      }
    }
    // Handle primitive comparisons
    else if (currentValue !== newValue) {
      if (import.meta.env.MODE === 'development') {
        logger.log(`🔍 [hasTaskDataChanged] Primitive different for "${field}"`);
      }
      return true;
    }
  }

  if (import.meta.env.MODE === 'development') {
    logger.log('🔍 [hasTaskDataChanged] No changes detected');
  }
  return false;
};

/**
 * Helper function to handle reporter name resolution with security validation
 */
const resolveReporterName = (reporters, reporterId, reporterName) => {
  if (!reporters || !Array.isArray(reporters)) {
    throw new Error("Invalid reporters data provided");
  }

  if (!reporterId || typeof reporterId !== 'string') {
    return reporterName;
  }

  const sanitizedReporterId = reporterId.trim();
  if (sanitizedReporterId.length === 0 || sanitizedReporterId.length > 100) {
    throw new Error("Invalid reporter ID format");
  }

  if (reporterId && !reporterName) {
    const selectedReporter = reporters.find(r => {
      if (!r || typeof r !== 'object') return false;
      // Use reporterUID field
      const reporterIdField = r.reporterUID;
      return reporterIdField &&
             typeof reporterIdField === 'string' &&
             reporterIdField === sanitizedReporterId;
    });

    if (selectedReporter) {
      const name = selectedReporter.name || selectedReporter.reporterName;
      if (name && typeof name === 'string' && name.trim().length > 0) {
        return name.trim().substring(0, 100);
      }
    }

    throw new Error("Reporter not found for the selected ID");
  }

  return reporterName;
};

// Task cache to store previously fetched tasks
const taskCache = new Map();

/**
 * Get cache key for tasks
 */
const getCacheKey = (monthId, role, userUID) => {
  return `${monthId}_${role}_${userUID || 'all'}`;
};

/**
 * Tasks Hook (Direct Firestore with Snapshots with Caching)
 */
export const useTasks = (monthId, role = 'user', userUID = null) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!monthId) {
      logger.log('🔍 [useTasks] No monthId provided, skipping tasks fetch');
      setTasks([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = getCacheKey(monthId, role, userUID);
    
    // Check cache first
    if (taskCache.has(cacheKey)) {
      const cachedData = taskCache.get(cacheKey);
      logger.log('🔍 [useTasks] Using cached data for:', cacheKey);
      setTasks(cachedData);
      setIsLoading(false);
      // Still set up listener to get updates, but don't show loading
    } else {
      setIsLoading(true);
    }

    logger.log('🔍 [useTasks] Starting tasks fetch', { monthId, role, userUID });
    let unsubscribe = null;

    const setupListener = async () => {
      try {
        setError(null);

        // Check if month board exists
        const monthDocRef = getMonthRef(monthId);
        const monthDoc = await getDoc(monthDocRef);

        if (!monthDoc.exists()) {
          logger.warn('Month board does not exist for:', monthId);
          setTasks([]);
          taskCache.set(cacheKey, []); // Cache empty result
          setIsLoading(false);
          return;
        }

        const tasksRef = getTaskRef(monthId);
        const tasksQuery = buildTaskQuery(tasksRef, role, userUID);

        const listenerKey = `tasks_${monthId}_${role}_${userUID || 'all'}`;

        // Check if listener already exists
        if (listenerManager.hasListener(listenerKey)) {
          logger.log('Listener already exists, skipping duplicate setup for:', listenerKey);
          // Get current data from listener if available
          const existingData = taskCache.get(cacheKey);
          if (existingData) {
            setTasks(existingData);
          }
          setIsLoading(false);
          return;
        }

        unsubscribe = listenerManager.addListener(
          listenerKey,
          () => onSnapshot(
            tasksQuery,
            (snapshot) => {
              if (!snapshot || !snapshot.docs || snapshot.empty) {
                const emptyTasks = [];
                setTasks(emptyTasks);
                taskCache.set(cacheKey, emptyTasks); // Cache empty result
                setIsLoading(false);
                return;
              }

              const validDocs = snapshot.docs.filter(
                (doc) => doc && doc.exists() && doc.data() && doc.id
              );

              const tasksData = validDocs
                .map((d) =>
                  serializeTimestampsForContext({
                    id: d.id,
                    monthId: monthId,
                    ...d.data(),
                  })
                )
                .filter((task) => task !== null);

              // Update cache
              taskCache.set(cacheKey, tasksData);
              setTasks(tasksData);
              setIsLoading(false);
              setError(null);
            },
            (err) => {
              logger.error('Tasks real-time error:', err);
              setError(err);
              setIsLoading(false);
            }
          ),
          true, // preserve setup function for restoration, but will be paused when tab hidden
          'tasks', // category
          'tasks' // page
        );

      } catch (err) {
        logger.error('Error setting up tasks listener:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Don't remove listener on cleanup - keep it active for real-time updates
      // Only remove if component unmounts completely
    };
  }, [monthId, role, userUID]); // Keep dependencies but optimize the hook

  return { tasks, isLoading, error };
};

const checkForDuplicateTask = async (colRef, task, userUID) => {
  try {
    // Check if task has gimodear and name for duplicate checking
    if (!task.gimodear || !task.name) {
      return { isDuplicate: false, message: '' };
    }

    // Query for existing tasks with same gimodear and name for this user
    const duplicateQuery = query(
      colRef,
      where("userUID", "==", userUID),
      where("data_task.gimodear", "==", task.gimodear),
      where("data_task.name", "==", task.name)
    );

    const duplicateSnapshot = await getDocs(duplicateQuery);

    if (!duplicateSnapshot.empty) {
      return {
        isDuplicate: true,
        message: `A task with gimodear "${task.gimodear}" and name "${task.name}" already exists`
      };
    }

    return { isDuplicate: false, message: '' };
  } catch (error) {
    logger.error('Error checking for duplicate task:', error);
    // If duplicate check fails, allow creation but log the error
    return { isDuplicate: false, message: '' };
  }
};

/**
 * Create Task Hook
 */
export const useCreateTask = () => {
  const createTask = useCallback(async (task, userData, reporters = []) => {
    try {
      // Validate user permissions using centralized validation
      const permissionValidation = validateTaskPermissions(userData, 'create_tasks');
      if (!permissionValidation.isValid) {
        throw new Error(permissionValidation.errors.join(', '));
      }

      const monthId = task.monthId;
      if (!monthId) {
        throw new Error("Month ID is required");
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
      const currentUserUID = getUserUID(userData);
      const currentUserName = userData?.name || userData?.displayName || userData?.email || '';
      const createdAt = serverTimestamp();
      const updatedAt = createdAt;

      // Check for duplicate tasks before creating
      const duplicateCheck = await checkForDuplicateTask(colRef, task, currentUserUID);
      if (duplicateCheck.isDuplicate) {
        throw new Error(`Duplicate task found: ${duplicateCheck.message}`);
      }

      // Auto-add reporter name if we have reporter ID but no name
      if (task.reporters && !task.reporterName) {
        task.reporterName = resolveReporterName(reporters, task.reporters, task.reporterName);
      }

      // Set reporterUID to match reporters ID for analytics consistency
      if (task.reporters && !task.reporterUID) {
        task.reporterUID = task.reporters;
      }

      // Create final document data
      const documentData = {
        data_task: task,
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

      const result = {
        id: ref.id,
        monthId,
        ...documentData,
      };

      logger.log('Task created successfully:', ref.id);
      return { success: true, data: serializeTimestampsForContext(result) };
    } catch (err) {
      logger.error('Error creating task:', err);
      throw err;
    }
  }, []);

  return [createTask];
};

/**
 * Update Task Hook
 */
export const useUpdateTask = () => {
  const updateTask = useCallback(async (monthId, taskId, updates, reporters = [], userData) => {
    try {
      // Validate user permissions using centralized validation
      const permissionValidation = validateTaskPermissions(userData, 'update_tasks');
      if (!permissionValidation.isValid) {
        throw new Error(permissionValidation.errors.join(', '));
      }

      // Fetch current task data to check for changes
      const currentTaskRef = getTaskRef(monthId, taskId);
      const currentTaskDoc = await getDoc(currentTaskRef);

      if (!currentTaskDoc.exists()) {
        throw new Error("Task not found");
      }

      const currentTaskData = currentTaskDoc.data();

      // Check if there are any actual changes
      if (!hasTaskDataChanged(currentTaskData, updates)) {
        logger.log("No changes detected, skipping update");
        return { success: true, id: taskId, message: "No changes detected" };
      }

      // Auto-add reporter name if we have reporter ID but no name
      if (updates.reporters && !updates.reporterName) {
        updates.reporterName = resolveReporterName(reporters, updates.reporters, updates.reporterName);
      }

      // Set reporterUID to match reporters ID for analytics consistency
      if (updates.reporters && !updates.reporterUID) {
        updates.reporterUID = updates.reporters;
      }

      // Structure the updates with data_task wrapper
      const updatesWithTimestamp = {
        data_task: updates,
        updatedAt: serverTimestamp(),
      };

      const taskRef = getTaskRef(monthId, taskId);
      await updateDoc(taskRef, updatesWithTimestamp);

      logger.log('Task updated successfully:', taskId);
      return { success: true, data: { id: taskId, monthId } };
    } catch (err) {
      logger.error('Error updating task:', err);
      throw err;
    }
  }, []);

  return [updateTask];
};

/**
 * Delete Task Hook
 */
export const useDeleteTask = () => {
  const deleteTask = useCallback(async (monthId, taskId, userData) => {
    try {
      // Validate user permissions using centralized validation
      const permissionValidation = validateTaskPermissions(userData, 'delete_tasks');
      if (!permissionValidation.isValid) {
        throw new Error(permissionValidation.errors.join(', '));
      }

      const taskRef = getTaskRef(monthId, taskId);
      await deleteDoc(taskRef);

      logger.log('Task deleted successfully:', taskId);
      return { success: true, data: { id: taskId, monthId } };
    } catch (err) {
      logger.error('Error deleting task:', err);
      throw err;
    }
  }, []);

  return [deleteTask];
};

// Export hooks for backward compatibility
export const useGetMonthTasksQuery = useTasks;
export const useCreateTaskMutation = useCreateTask;
export const useUpdateTaskMutation = useUpdateTask;
export const useDeleteTaskMutation = useDeleteTask;
