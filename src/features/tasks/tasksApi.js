
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { validateTaskPermissions } from '@/utils/permissionValidation';
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


/**
 * Build Firestore query with all database-level filters
 * 
 * INDEX REQUIREMENTS:
 * - Single where() clauses: NO index needed
 * - Multiple where() on same field (e.g., createdAt >= AND <=): NO composite index needed
 * - Multiple where() on DIFFERENT fields: Composite index REQUIRED
 * 
 * Why filters work without explicit indexes:
 * 1. Collection path filtering (monthId in path) narrows collection before querying - very efficient
 * 2. Single filters don't need indexes
 * 3. Firebase Console auto-creates composite indexes when queries run (check Firebase Console > Firestore > Indexes)
 * 4. Some filters (aiUsed, deliverable) are client-side, so no DB index needed
 * 
 * If you combine multiple filters (userUID + department + reporter), check Firebase Console
 * for auto-created composite indexes or create them manually for better performance.
 * 
 * @param {Object} tasksRef - Firestore collection reference
 * @param {string} role - User role ('user' or 'admin')
 * @param {string|null} userUID - Current user UID
 * @param {Object} filters - Filter options
 * @param {string|null} filters.selectedUserId - Selected user ID for admin filtering
 * @param {string|null} filters.selectedReporterId - Reporter ID filter
 * @param {string|null} filters.selectedDepartment - Department filter
 * @param {string|null} filters.selectedDeliverable - Deliverable name filter
 * @param {string|null} filters.selectedFilter - Task type filter (aiUsed, marketing, etc.)
 * @param {Date|null} filters.weekStart - Week start date for createdAt filter
 * @param {Date|null} filters.weekEnd - Week end date for createdAt filter
 * @param {Date|null} filters.monthStart - Month start date for createdAt filter (when "All Weeks")
 * @param {Date|null} filters.monthEnd - Month end date for createdAt filter (when "All Weeks")
 * @returns {Query} Firestore query
 */
const buildTaskQuery = (tasksRef, role, userUID, filters = {}) => {
  const {
    selectedUserId = null,
    selectedReporterId = null,
    selectedDepartment = null,
    selectedDeliverable = null,
    selectedFilter = null,
    weekStart = null,
    weekEnd = null,
    monthStart = null,
    monthEnd = null,
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

// Task cache to store previously fetched tasks
const taskCache = new Map();

/**
 * Get cache key for tasks
 */
const getCacheKey = (monthId, role, userUID, filters = {}) => {
  const {
    selectedUserId = null,
    selectedReporterId = null,
    selectedDepartment = null,
    selectedDeliverable = null,
    selectedFilter = null,
    weekStart = null,
    weekEnd = null,
    monthStart = null,
    monthEnd = null,
  } = filters;
  
  const targetUserId = selectedUserId || userUID;
  const filterParts = [
    monthId,
    role,
    targetUserId || 'all',
    selectedReporterId || 'no-reporter',
    selectedDepartment || 'no-dept',
    selectedDeliverable || 'no-deliv',
    selectedFilter || 'no-filter',
    weekStart ? weekStart.toISOString().split('T')[0] : (monthStart ? monthStart.toISOString().split('T')[0] : 'no-date'),
  ];
  return filterParts.join('_');
};

/**
 * Tasks Hook (Direct Firestore with Snapshots with Caching)
 * 
 * IMPORTANT: This hook ONLY fetches tasks for the SPECIFIC monthId provided.
 * It does NOT fetch tasks from all years/months - only the selected month.
 * 
 * Tasks are fetched from: /departments/design/{yearId}/{monthId}/taskdata
 * Where yearId is extracted from monthId (e.g., "2024" from "2024-09")
 * 
 * @param {string} monthId - The specific month to fetch tasks for (e.g., "2024-09")
 * @param {string} role - User role ('user' or 'admin')
 * @param {string|null} userUID - Current user UID
 * @param {Object} filters - Additional filters (selectedUserId, selectedReporterId, etc.)
 * @returns {Object} - { tasks, isLoading, error }
 */
export const useTasks = (monthId, role = 'user', userUID = null, filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Serialize filters for stable comparison
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      selectedUserId: filters.selectedUserId || null,
      selectedReporterId: filters.selectedReporterId || null,
      selectedDepartment: filters.selectedDepartment || null,
      selectedDeliverable: filters.selectedDeliverable || null,
      selectedFilter: filters.selectedFilter || null,
      weekStart: filters.weekStart?.getTime() || null,
      weekEnd: filters.weekEnd?.getTime() || null,
    });
  }, [
    filters.selectedUserId,
    filters.selectedReporterId,
    filters.selectedDepartment,
    filters.selectedDeliverable,
    filters.selectedFilter,
    filters.weekStart?.getTime(),
    filters.weekEnd?.getTime(),
  ]);

  useEffect(() => {
    // Only fetch tasks when a specific monthId is provided
    // If no monthId, return empty array (no fetching)
    if (!monthId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const tasksRef = getTaskRef(monthId);
    const tasksQuery = buildTaskQuery(tasksRef, role, userUID, filters);

    // Set up real-time listener - simple and direct
    // onSnapshot automatically handles errors and empty collections
    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        if (!snapshot || !snapshot.docs) {
          setTasks([]);
          setIsLoading(false);
          return;
        }

        if (snapshot.empty) {
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
    );

    // Cleanup: unsubscribe when filters change or component unmounts
    return () => {
      unsubscribe();
    };
  }, [monthId, role, userUID, filtersKey]);

  return { tasks, isLoading, error };
};

/**
 * Get all tasks for a user across ALL years and ALL months (for experience system)
 * Queries each year/month collection individually to avoid collection group index requirement
 * 
 * Queries across: 
 * - /departments/design/2024/{monthId}/taskdata
 * - /departments/design/2025/{monthId}/taskdata
 * - /departments/design/2026/{monthId}/taskdata
 * - ... (all years from 2020 to current year + 1, all months)
 * 
 * Note: Tasks are filtered by userUID directly. The role parameter is not needed
 * because filtering is done at the database level using userUID field.
 * 
 * @param {string} userUID - User UID to filter tasks (required)
 * @returns {Object} - { tasks, isLoading, error }
 */
export const useAllUserTasks = (userUID) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userUID) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Get current year and query range (2020 to current year + 1)
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 1;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    // Set up listeners for each year/month combination
    const unsubscribes = [];
    const tasksMap = new Map(); // Track tasks by monthId+taskId for deduplication

    // Function to setup listener for a specific month
    const setupMonthListener = (yearId, monthId) => {
      try {
        const taskdataRef = collection(db, 'departments', 'design', yearId.toString(), monthId, 'taskdata');
        
        // Filter by userUID for experience calculation
        const constraints = [where("userUID", "==", userUID)];
        const tasksQuery = query(taskdataRef, ...constraints);

        // Set up real-time listener for this month
        const unsubscribe = onSnapshot(
          tasksQuery,
          (snapshot) => {
            // Remove all tasks from this month first (to handle deletions)
            const keysToDelete = [];
            tasksMap.forEach((task, key) => {
              if (key.startsWith(`${monthId}_`)) {
                keysToDelete.push(key);
              }
            });
            keysToDelete.forEach(key => tasksMap.delete(key));

            // Add/update tasks from this month
            snapshot.docs.forEach((doc) => {
              const taskData = doc.data();
              const taskKey = `${monthId}_${doc.id}`;
              
              tasksMap.set(taskKey, serializeTimestampsForContext({
                id: doc.id,
                monthId: monthId,
                department: 'design',
                ...taskData,
              }));
            });

            // Update state with all tasks
            const allTasks = Array.from(tasksMap.values());
            setTasks(allTasks);
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            // Ignore errors for months that don't exist yet
            if (err.code !== 'not-found' && err.code !== 'permission-denied') {
              logger.error(`[useAllUserTasks] Error listening to ${yearId}/${monthId}:`, err);
            }
            // Still set loading to false if this was the last listener
            setIsLoading(false);
          }
        );

        unsubscribes.push(unsubscribe);
      } catch (err) {
        // Ignore errors for months that don't exist
        logger.log(`[useAllUserTasks] Could not set up listener for ${yearId}/${monthId}:`, err.message);
      }
    };

    // Initial fetch: Get all months and set up listeners
    (async () => {
      try {
        // Query all years in parallel to get all months
        const yearPromises = years.map(async (yearId) => {
          try {
            const monthsRef = collection(db, 'departments', 'design', yearId.toString());
            const monthsSnapshot = await getDocs(query(monthsRef));
            
            return monthsSnapshot.docs.map((monthDoc) => ({
              yearId,
              monthId: monthDoc.id
            }));
          } catch (err) {
            // Ignore errors for years that don't exist
            return [];
          }
        });

        const yearMonths = await Promise.all(yearPromises);
        const allMonths = yearMonths.flat();

        // Set up listeners for all months
        allMonths.forEach(({ yearId, monthId }) => {
          setupMonthListener(yearId, monthId);
        });

        logger.log(`[useAllUserTasks] Set up ${allMonths.length} month listeners for user ${userUID}`);
      } catch (err) {
        logger.error('[useAllUserTasks] Error setting up listeners:', err);
        setError(err);
        setIsLoading(false);
      }
    })();

    // Cleanup: unsubscribe all listeners when component unmounts
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [userUID]);

  return { tasks, isLoading, error };
};

/**
 * Get all tasks across ALL years and ALL months (for admin - no user filter)
 * Queries each year/month collection individually to avoid collection group index requirement
 * 
 * Queries across: 
 * - /departments/design/2024/{monthId}/taskdata
 * - /departments/design/2025/{monthId}/taskdata
 * - /departments/design/2026/{monthId}/taskdata
 * - ... (all years from 2020 to current year + 1, all months)
 * 
 * @returns {Object} - { tasks, isLoading, error }
 */
export const useAllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Get current year and query range (2020 to current year + 1)
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 1;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    // Set up listeners for each year/month combination
    const unsubscribes = [];
    const tasksMap = new Map(); // Track tasks by monthId+taskId for deduplication

    // Function to setup listener for a specific month
    const setupMonthListener = (yearId, monthId) => {
      try {
        const taskdataRef = collection(db, 'departments', 'design', yearId.toString(), monthId, 'taskdata');
        
        // No userUID filter - get all tasks for admin
        const tasksQuery = query(taskdataRef);

        // Set up real-time listener for this month
        const unsubscribe = onSnapshot(
          tasksQuery,
          (snapshot) => {
            // Remove all tasks from this month first (to handle deletions)
            const keysToDelete = [];
            tasksMap.forEach((task, key) => {
              if (key.startsWith(`${monthId}_`)) {
                keysToDelete.push(key);
              }
            });
            keysToDelete.forEach(key => tasksMap.delete(key));

            // Add/update tasks from this month
            snapshot.docs.forEach((doc) => {
              const taskData = doc.data();
              const taskKey = `${monthId}_${doc.id}`;
              
              tasksMap.set(taskKey, serializeTimestampsForContext({
                id: doc.id,
                monthId: monthId,
                department: 'design',
                ...taskData,
              }));
            });

            // Update state with all tasks
            const allTasks = Array.from(tasksMap.values());
            setTasks(allTasks);
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            // Ignore errors for months that don't exist yet
            if (err.code !== 'not-found' && err.code !== 'permission-denied') {
              logger.error(`[useAllTasks] Error listening to ${yearId}/${monthId}:`, err);
            }
            // Still set loading to false if this was the last listener
            setIsLoading(false);
          }
        );

        unsubscribes.push(unsubscribe);
      } catch (err) {
        // Ignore errors for months that don't exist
        logger.log(`[useAllTasks] Could not set up listener for ${yearId}/${monthId}:`, err.message);
      }
    };

    // Initial fetch: Get all months and set up listeners
    (async () => {
      try {
        // Query all years in parallel to get all months
        const yearPromises = years.map(async (yearId) => {
          try {
            const monthsRef = collection(db, 'departments', 'design', yearId.toString());
            const monthsSnapshot = await getDocs(query(monthsRef));
            
            return monthsSnapshot.docs.map((monthDoc) => ({
              yearId,
              monthId: monthDoc.id
            }));
          } catch (err) {
            // Ignore errors for years that don't exist
            return [];
          }
        });

        const yearMonths = await Promise.all(yearPromises);
        const allMonths = yearMonths.flat();

        // Set up listeners for all months
        allMonths.forEach(({ yearId, monthId }) => {
          setupMonthListener(yearId, monthId);
        });

        logger.log(`[useAllTasks] Set up ${allMonths.length} month listeners for all tasks`);
      } catch (err) {
        logger.error('[useAllTasks] Error setting up listeners:', err);
        setError(err);
        setIsLoading(false);
      }
    })();

    // Cleanup: unsubscribe all listeners when component unmounts
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

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

      // Update deliverableNames and hasAiUsed for DB-level filtering
      if (updates.deliverablesUsed !== undefined) {
        const deliverablesUsed = Array.isArray(updates.deliverablesUsed) ? updates.deliverablesUsed : [];
        updates.deliverableNames = deliverablesUsed
          .map(d => d?.name)
          .filter(name => name && name.trim() !== '');
      }
      
      if (updates.aiUsed !== undefined) {
        const aiUsed = Array.isArray(updates.aiUsed) ? updates.aiUsed : [];
        updates.hasAiUsed = aiUsed.length > 0 && aiUsed[0]?.aiModels?.length > 0;
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
