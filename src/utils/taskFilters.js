/**
 * Task Filtering Utilities
 * Shared utilities for filtering and matching tasks
 */

/**
 * Check if a task matches a user ID
 * @param {Object} task - Task object
 * @param {string} userId - User ID to match
 * @returns {boolean}
 */
export const matchesUser = (task, userId) => {
  return task.userUID === userId || task.createbyUID === userId;
};

/**
 * Get reporter ID from a task
 * @param {Object} task - Task object
 * @returns {string|null} Reporter ID or null
 */
export const getTaskReporterId = (task) => {
  return task.data_task?.reporters || task.data_task?.reporterUID || task.reporters || task.reporterUID || null;
};

/**
 * Get reporter name from a task
 * @param {Object} task - Task object
 * @returns {string|null} Reporter name or null
 */
export const getTaskReporterName = (task) => {
  return task.data_task?.reporterName || task.reporterName || null;
};

/**
 * Check if a task matches a reporter ID
 * @param {Object} task - Task object
 * @param {string} reporterId - Reporter ID to match
 * @returns {boolean}
 */
export const matchesReporter = (task, reporterId) => {
  const taskReporterId = getTaskReporterId(task);
  if (!taskReporterId) return false;
  return String(taskReporterId) === String(reporterId);
};

/**
 * Check if a task matches a reporter name (fuzzy match)
 * @param {Object} task - Task object
 * @param {string} reporterName - Reporter name to match
 * @returns {boolean}
 */
export const matchesReporterName = (task, reporterName) => {
  if (!reporterName) return false;

  const taskReporterName = getTaskReporterName(task);
  if (taskReporterName && taskReporterName.toLowerCase() === reporterName.toLowerCase()) {
    return true;
  }

  const taskReporterId = getTaskReporterId(task);
  if (taskReporterId && String(taskReporterId).toLowerCase() === reporterName.toLowerCase()) {
    return true;
  }

  return false;
};

/**
 * Check if a task matches a user name (fuzzy match)
 * @param {Object} task - Task object
 * @param {string} userName - User name to match
 * @returns {boolean}
 */
export const matchesUserName = (task, userName) => {
  if (!userName) return false;

  const userMatch = (
    task.createdByName === userName ||
    task.userName === userName ||
    (task.userUID && task.userUID.includes(userName)) ||
    (task.createbyUID && task.createbyUID.includes(userName)) ||
    (task.createdByName && task.createdByName.toLowerCase().includes(userName.toLowerCase())) ||
    (task.data_task?.createdByName && task.data_task.createdByName.toLowerCase().includes(userName.toLowerCase()))
  );

  return userMatch;
};

/**
 * Get task data (handles both data_task and direct task properties)
 * @param {Object} task - Task object
 * @returns {Object} Task data object
 */
export const getTaskData = (task) => {
  return task.data_task || task;
};

/**
 * Filter tasks by user and reporter
 * @param {Array} tasks - Array of tasks
 * @param {Object} options - Filtering options
 * @param {string|null} options.selectedUserId - Selected user ID
 * @param {string|null} options.selectedReporterId - Selected reporter ID
 * @param {string|null} options.currentMonthId - Current month ID
 * @param {boolean} options.isUserAdmin - Whether user is admin
 * @param {string|null} options.currentUserUID - Current user UID (for non-admin filtering)
 * @returns {Array} Filtered tasks
 */
export const filterTasksByUserAndReporter = (tasks, options = {}) => {
  const {
    selectedUserId = null,
    selectedReporterId = null,
    currentMonthId = null,
    isUserAdmin = false,
    currentUserUID = null,
  } = options;

  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }

  return tasks.filter((task) => {
    // Always filter by month first
    if (currentMonthId && task.monthId !== currentMonthId) {
      return false;
    }

    // Role-based filtering: Regular users can only see their own tasks
    if (!isUserAdmin) {
      // Check if this task belongs to the current user
      const isUserTask = currentUserUID && matchesUser(task, currentUserUID);
      if (!isUserTask) return false;

      // If reporter is selected, also filter by reporter
      if (selectedReporterId) {
        return matchesReporter(task, selectedReporterId);
      }

      // Regular users can ONLY see their own tasks
      return true;
    }

    // Admin filtering logic
    // If both user and reporter are selected, show tasks that match BOTH
    if (selectedUserId && selectedReporterId) {
      const matchesSelectedUser = matchesUser(task, selectedUserId);
      const taskReporterId = getTaskReporterId(task);
      if (!taskReporterId) return false;
      // Compare task reporter ID directly with selectedReporterId (exact match)
      return matchesSelectedUser && String(taskReporterId) === String(selectedReporterId);
    }

    // If only user is selected, show tasks for that user
    if (selectedUserId && !selectedReporterId) {
      return matchesUser(task, selectedUserId);
    }

    // If only reporter is selected, show tasks for that reporter
    if (selectedReporterId && !selectedUserId) {
      const taskReporterId = getTaskReporterId(task);
      if (!taskReporterId) return false;
      // Compare task reporter ID directly with selectedReporterId (exact match)
      return String(taskReporterId) === String(selectedReporterId);
    }

    // If neither user nor reporter is selected, admin sees all tasks
    return true;
  });
};

