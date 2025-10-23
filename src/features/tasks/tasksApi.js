/**
 * Tasks API (Direct Firestore with Snapshots)
 *
 * @fileoverview Direct Firestore hooks for tasks with real-time updates
 * @author Senior Developer
 * @version 3.0.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
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

/**
 * Get Firestore reference for tasks (collection or individual document)
 * @param {string} monthId - Month identifier (e.g., "2025-01")
 * @param {string|null} taskId - Optional task ID for individual task
 * @returns {DocumentReference|CollectionReference} - Firestore reference
 */
const getTaskRef = (monthId, taskId = null) => {
  const yearId = getCurrentYear();
  const basePath = ["departments", "design", yearId, monthId, "taskdata"];

  if (taskId) {
    return doc(db, ...basePath, taskId); // Individual task
  } else {
    return collection(db, ...basePath); // Task collection
  }
};

/**
 * Get Firestore reference for a specific month document
 * @param {string} monthId - Month identifier (e.g., "2025-01")
 * @returns {DocumentReference} - Month document reference
 */
const getMonthRef = (monthId) => {
  const yearId = monthId.split('-')[0]; // Extract year from monthId
  return doc(db, "departments", "design", yearId, monthId);
};

/**
 * Build Firestore query for tasks based on user role and permissions
 * @param {CollectionReference} tasksRef - Tasks collection reference
 * @param {string} role - User role (admin, user)
 * @param {string|null} userUID - Optional user UID for filtering
 * @returns {Query} - Firestore query
 */
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
 * Validate user permissions for task operations
 * @param {Object} userData - User data object
 * @param {string} operation - Operation being performed
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
const validateTaskPermissions = (userData, operation) => {
  if (!userData) {
    return { isValid: false, errors: ['User data is required'] };
  }

  // Check if user is active (both admin and user need to be active)
  if (userData.isActive === false) {
    return { isValid: false, errors: ['User account is not active'] };
  }

  // Both admin and user roles are allowed, but no bypass
  if (userData.role === 'admin' || userData.role === 'user') {
    return { isValid: true, errors: [] };
  }

  return { isValid: false, errors: ['Insufficient permissions for task operations'] };
};

/**
 * Helper function to detect if task data has actually changed
 */
const hasTaskDataChanged = (currentData, newData) => {
  // Remove timestamp fields from comparison as they will always be different
  const fieldsToIgnore = ['createdAt', 'updatedAt', 'data_task'];

  // Extract the actual task data from currentData
  const currentTaskData = currentData?.data_task || currentData;

  // Compare relevant fields
  const relevantFields = Object.keys(newData).filter(key => !fieldsToIgnore.includes(key));

  for (const field of relevantFields) {
    const currentValue = currentTaskData?.[field];
    const newValue = newData[field];

    // Handle array comparisons
    if (Array.isArray(currentValue) && Array.isArray(newValue)) {
      if (currentValue.length !== newValue.length) return true;
      if (!currentValue.every((item, index) => item === newValue[index])) return true;
    }
    // Handle object comparisons
    else if (typeof currentValue === 'object' && typeof newValue === 'object') {
      if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) return true;
    }
    // Handle primitive comparisons
    else if (currentValue !== newValue) {
      return true;
    }
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
      // Check multiple possible ID fields
      const reporterIdField = r.id || r.uid || r.reporterUID;
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

/**
 * Tasks Hook (Direct Firestore with Snapshots)
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

    logger.log('🔍 [useTasks] Starting tasks fetch', { monthId, role, userUID });
    let unsubscribe = null;

    const setupListener = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if month board exists
        const monthDocRef = getMonthRef(monthId);
        const monthDoc = await getDoc(monthDocRef);

        if (!monthDoc.exists()) {
          logger.warn('Month board does not exist for:', monthId);
          setTasks([]);
          setIsLoading(false);
          return;
        }

        const tasksRef = getTaskRef(monthId);
        const tasksQuery = buildTaskQuery(tasksRef, role, userUID);

        const listenerKey = `tasks_${monthId}_${role}_${userUID || 'all'}`;

        // Check if listener already exists
        if (listenerManager.hasListener(listenerKey)) {
          logger.log('Listener already exists, skipping duplicate setup for:', listenerKey);
          setIsLoading(false);
          return;
        }

        unsubscribe = listenerManager.addListener(
          listenerKey, 
          () => onSnapshot(
            tasksQuery,
            (snapshot) => {
              if (snapshot && snapshot.docs) {
              }

              if (!snapshot || !snapshot.docs || snapshot.empty) {
                setTasks([]);
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
          true, // preserve - tasks need real-time updates
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
      const listenerKey = `tasks_${monthId}_${role}_${userUID || 'all'}`;
      listenerManager.removeListener(listenerKey);
    };
  }, [monthId, role, userUID]); // Keep dependencies but optimize the hook

  return { tasks, isLoading, error };
};


/**
 * Check for duplicate tasks based on gimodear and name
 * @param {CollectionReference} colRef - Tasks collection reference
 * @param {Object} task - Task data to check
 * @param {string} userUID - Current user UID
 * @returns {Object} - Duplicate check result
 */
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
      const duplicateTask = duplicateSnapshot.docs[0].data();
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
      // Validate user permissions
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
      const currentUserUID = userData.uid;
      const currentUserName = userData.name;
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
      // Validate user permissions
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
      // Validate user permissions
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
