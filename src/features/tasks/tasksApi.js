
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
import { getUserUID } from '@/features/utils/authUtils';


const getTaskRef = (monthId, taskId = null) => {
  // Extract year from monthId (e.g., "2024" from "2024-09")
  const yearId = monthId ? monthId.split('-')[0] : getCurrentYear();
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


const buildTaskQuery = (tasksRef, role, userUID, filters = {}) => {
  const {
    selectedUserId = null,
    selectedReporterId = null,
    selectedDepartment = null,
    selectedDeliverable = null,
    selectedFilter = null,
    weekStart = null,
    weekEnd = null,
  } = filters;

  // Use selectedUserId if provided (for admin filtering), otherwise use userUID
  const targetUserId = selectedUserId || userUID;
  
  // Start building query constraints
  const constraints = [];

  // 1. User filter (always applied)
  if (role === "user") {
    // Regular users: fetch only their own tasks
    constraints.push(where("userUID", "==", userUID));
  } else if (role === "admin" && targetUserId) {
    // Admin users: specific user's tasks when a user is selected
    constraints.push(where("userUID", "==", targetUserId));
  }
  // If admin and no targetUserId, don't filter by user (show all)

  // 2. Reporter filter
  if (selectedReporterId) {
    // Try reporterUID first, fallback to reporters field
    constraints.push(where("data_task.reporterUID", "==", selectedReporterId));
  }

  // 3. Department filter
  if (selectedDepartment) {
    constraints.push(where("data_task.departments", "array-contains", selectedDepartment));
  }

  // 4. Deliverable filter (DB-level using deliverableNames array)
  if (selectedDeliverable) {
    constraints.push(where("data_task.deliverableNames", "array-contains", selectedDeliverable));
  }
  
  // 5. Task type filters
  if (selectedFilter) {
    switch (selectedFilter) {
      case "aiUsed":
        // DB-level filter using hasAiUsed boolean field
        constraints.push(where("data_task.hasAiUsed", "==", true));
        break;
      case "marketing":
        constraints.push(where("data_task.products", "==", "marketing"));
        break;
      case "acquisition":
        constraints.push(where("data_task.products", "==", "acquisition"));
        break;
      case "product":
        constraints.push(where("data_task.products", "==", "product"));
        break;
      case "vip":
        constraints.push(where("data_task.isVip", "==", true));
        break;
      case "reworked":
        constraints.push(where("data_task.reworked", "==", true));
        break;
      case "shutterstock":
        constraints.push(where("data_task.useShutterstock", "==", true));
        break;
    }
  }

  // 6. Date range filter (createdAt - when task was added)
  // Note: Month filtering is already done via monthId in the query path (getTaskRef)
  // Filter by createdAt to show tasks that were added within the week
  // Firestore only allows one range query per field
  if (weekStart && weekEnd) {
    constraints.push(where("createdAt", ">=", weekStart));
    constraints.push(where("createdAt", "<=", weekEnd));
  }
  // Don't apply monthStart/monthEnd filters - monthId in query path already filters by month

  // Build and return query
  if (constraints.length === 0) {
    return query(tasksRef);
  }

  return query(tasksRef, ...constraints);
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

/**
 * Helper function to normalize reporter data (used by create and update)
 */
const normalizeReporterData = (taskData, reporters) => {
  // Auto-add reporter name if we have reporter ID but no name
  if (taskData.reporters && !taskData.reporterName) {
    taskData.reporterName = resolveReporterName(reporters, taskData.reporters, taskData.reporterName);
  }

  // Set reporterUID to match reporters ID for data consistency
  if (taskData.reporters && !taskData.reporterUID) {
    taskData.reporterUID = taskData.reporters;
  }

  return taskData;
};

/**
 * Helper function to compute derived filter fields (deliverableNames, hasAiUsed)
 */
const computeDerivedFilterFields = (taskData) => {
  // Compute deliverableNames for DB-level filtering
  if (taskData.deliverablesUsed !== undefined) {
    const deliverablesUsed = Array.isArray(taskData.deliverablesUsed) ? taskData.deliverablesUsed : [];
    taskData.deliverableNames = deliverablesUsed
      .map(d => d?.name)
      .filter(name => name && name.trim() !== '');
  }

  // Compute hasAiUsed for DB-level filtering
  if (taskData.aiUsed !== undefined) {
    const aiUsed = Array.isArray(taskData.aiUsed) ? taskData.aiUsed : [];
    taskData.hasAiUsed = aiUsed.length > 0 && aiUsed[0]?.aiModels?.length > 0;
  }

  return taskData;
};

/**
 * Tasks Hook - Real-time task fetching for a specific month
 * 
 * IMPORTANT: This hook ONLY fetches tasks for the SPECIFIC monthId provided.
 * Tasks are fetched from: /departments/design/{yearId}/{monthId}/taskdata
 * Where yearId is extracted from monthId (e.g., "2024" from "2024-09")
 */
export const useTasks = (monthId, role = 'user', userUID = null, filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!monthId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const tasksRef = getTaskRef(monthId);
    const tasksQuery = buildTaskQuery(tasksRef, role, userUID, filters);

    // Firebase onSnapshot handles real-time updates, deduplication, and caching
    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasksData = snapshot.docs.map((doc) =>
          serializeTimestampsForContext({
            id: doc.id,
            monthId: monthId,
            ...doc.data(),
          })
        );
        setTasks(tasksData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        logger.error('Tasks real-time error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [monthId, role, userUID, JSON.stringify(filters)]);

  return { tasks, isLoading, error };
};

/**
 * Fetch all tasks across ALL years and ALL months
 * @param {string|null} userUID - Optional user ID to filter by. If null, fetches all tasks (admin mode)
 * @returns {Object} - { tasks, isLoading, error }
 */
const useAllTasksBase = (userUID = null) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userUID === '') {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    const fetchAllTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);

        // Fetch all months for all years in parallel
        const yearPromises = years.map(async (yearId) => {
          try {
            const monthsRef = collection(db, 'departments', 'design', yearId.toString());
            const monthsSnapshot = await getDocs(query(monthsRef));
            return monthsSnapshot.docs.map((monthDoc) => ({ yearId, monthId: monthDoc.id }));
          } catch {
            return [];
          }
        });

        const allMonths = (await Promise.all(yearPromises)).flat();

        // Fetch tasks from all months in parallel
        const taskPromises = allMonths.map(async ({ yearId, monthId }) => {
          try {
            const taskdataRef = collection(db, 'departments', 'design', yearId.toString(), monthId, 'taskdata');
            const tasksQuery = userUID 
              ? query(taskdataRef, where("userUID", "==", userUID))
              : query(taskdataRef);
            
            const snapshot = await getDocs(tasksQuery);
            return snapshot.docs.map((doc) =>
              serializeTimestampsForContext({
                id: doc.id,
                monthId: monthId,
                department: 'design',
                ...doc.data(),
              })
            );
          } catch {
            return [];
          }
        });

        const allTasks = (await Promise.all(taskPromises)).flat();
        setTasks(allTasks);
        setIsLoading(false);
      } catch (err) {
        logger.error('[useAllTasksBase] Error fetching tasks:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    fetchAllTasks();
  }, [userUID]);

  return { tasks, isLoading, error };
};

/**
 * Get all tasks for a specific user across ALL years and ALL months
 */
export const useAllUserTasks = (userUID) => {
  return useAllTasksBase(userUID || '');
};

/**
 * Get all tasks across ALL years and ALL months (for admin - no user filter)
 */
export const useAllTasks = () => {
  return useAllTasksBase(null);
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

      // Normalize reporter data and compute derived filter fields
      normalizeReporterData(task, reporters);
      computeDerivedFilterFields(task);

      // Create final document data
      const documentData = {
        data_task: task,
        userUID: currentUserUID,
        monthId: monthId,
        boardId: boardId,
        createdByUID: currentUserUID,
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

      // Normalize reporter data and compute derived filter fields
      normalizeReporterData(updates, reporters);
      computeDerivedFilterFields(updates);

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
