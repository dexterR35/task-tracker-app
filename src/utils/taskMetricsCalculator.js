/**
 * Shared Task Metrics Calculator
 *
 * Provides common task calculation utilities used for:
 * - Dashboard metrics and reporting
 *
 * This eliminates duplication while keeping concerns separated.
 */

/**
 * Extract task hours from a task object
 * Handles both data_task.timeInHours and legacy timeInHours
 * @param {Object} task - Task object
 * @returns {number} - Hours value (0 if invalid)
 */
export const getTaskHours = (task) => {
  if (!task) return 0;
  const timeInHours = task.data_task?.timeInHours || task.timeInHours;
  if (timeInHours === undefined || timeInHours === null) return 0;
  const hours = typeof timeInHours === 'string' ? parseFloat(timeInHours) : Number(timeInHours);
  return isNaN(hours) || hours < 0 ? 0 : hours;
};

/**
 * Extract AI hours from a task object
 * Supports both aiTime (current) and hours (legacy) formats
 * @param {Object} task - Task object
 * @returns {number} - Total AI hours from all AI uses
 */
export const getTaskAIHours = (task) => {
  if (!task) return 0;
  const aiUsed = task.data_task?.aiUsed || task.aiUsed;
  if (!Array.isArray(aiUsed) || aiUsed.length === 0) return 0;

  let totalAIHours = 0;
  aiUsed.forEach(ai => {
    const aiTimeValue = ai.aiTime !== undefined ? ai.aiTime : ai.hours;
    if (aiTimeValue !== undefined && aiTimeValue !== null) {
      const hours = typeof aiTimeValue === 'string' ? parseFloat(aiTimeValue) : Number(aiTimeValue);
      if (!isNaN(hours) && hours > 0) {
        totalAIHours += hours;
      }
    }
  });

  return totalAIHours;
};

/**
 * Count deliverables in a task
 * @param {Object} task - Task object
 * @returns {number} - Number of deliverables
 */
export const getTaskDeliverableCount = (task) => {
  if (!task) return 0;
  const deliverablesUsed = task.data_task?.deliverablesUsed || task.deliverablesUsed;
  if (!Array.isArray(deliverablesUsed)) return 0;
  return deliverablesUsed.filter(d => d && d.name).length;
};

/**
 * Calculate deliverable hours from a task
 * Uses deliverablesOptions to calculate time based on deliverable type
 * @param {Object} task - Task object
 * @param {Array} deliverablesOptions - Array of deliverable options with timePerUnit, timeUnit, etc.
 * @returns {Object} - { deliverableHours, variationHours }
 */
export const getTaskDeliverableHours = (task, deliverablesOptions = []) => {
  if (!task) return { deliverableHours: 0, variationHours: 0 };

  const deliverablesUsed = task.data_task?.deliverablesUsed || task.deliverablesUsed;
  if (!Array.isArray(deliverablesUsed) || deliverablesUsed.length === 0) {
    return { deliverableHours: 0, variationHours: 0 };
  }

  // Create Map for O(1) deliverable lookup
  const deliverablesMap = new Map();
  if (deliverablesOptions && deliverablesOptions.length > 0) {
    deliverablesOptions.forEach(opt => {
      if (opt.value) deliverablesMap.set(opt.value.toLowerCase().trim(), opt);
      if (opt.label) deliverablesMap.set(opt.label.toLowerCase().trim(), opt);
    });
  }

  let deliverableHours = 0;
  let variationHours = 0;

  deliverablesUsed.forEach(deliverable => {
    if (!deliverable || !deliverable.name) return;

    // Calculate deliverable time (if deliverablesOptions provided)
    if (deliverablesMap.size > 0) {
      const deliverableOption = deliverablesMap.get(deliverable.name?.toLowerCase().trim());

      if (deliverableOption) {
        // Calculate base deliverable time
        const quantity = deliverable.quantity || 1;
        const timePerUnit = deliverableOption.timePerUnit || 0;
        const timeUnit = deliverableOption.timeUnit || 'min';

        // Convert to hours
        let baseTime = timePerUnit * quantity;
        if (timeUnit === 'min') baseTime = baseTime / 60;
        else if (timeUnit === 'day') baseTime = baseTime * 8;
        // timeUnit === 'hr' requires no conversion

        deliverableHours += baseTime;

        // Calculate variation time
        if (deliverable.variationsEnabled && deliverable.variationsCount) {
          const variationsTime = deliverableOption.variationsTime || 0;
          const variationsTimeUnit = deliverableOption.variationsTimeUnit || 'min';
          let variationTime = variationsTime * deliverable.variationsCount;

          if (variationsTimeUnit === 'min') variationTime = variationTime / 60;
          else if (variationsTimeUnit === 'day') variationTime = variationTime * 8;
          // variationsTimeUnit === 'hr' requires no conversion

          variationHours += variationTime;
        }
      }
    }
  });

  return { deliverableHours, variationHours };
};

/**
 * Calculate basic task metrics (hours, counts)
 * Used by dashboard metrics and reporting systems
 * @param {Array} tasks - Array of tasks
 * @param {Array} deliverablesOptions - Optional deliverables options for time calculations
 * @returns {Object} - Basic metrics: { taskCount, taskHours, deliverableCount, deliverableHours, variationHours, aiHours, totalHours }
 */
export const calculateBasicTaskMetrics = (tasks = [], deliverablesOptions = []) => {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return {
      taskCount: 0,
      taskHours: 0,
      deliverableCount: 0,
      deliverableHours: 0,
      variationHours: 0,
      aiHours: 0,
      totalHours: 0
    };
  }

  let taskCount = 0;
  let taskHours = 0;
  let deliverableCount = 0;
  let deliverableHours = 0;
  let variationHours = 0;
  let aiHours = 0;

  tasks.forEach(task => {
    if (!task) return;

    taskCount++;

    // Calculate task hours
    taskHours += getTaskHours(task);

    // Calculate AI hours
    aiHours += getTaskAIHours(task);

    // Count and calculate deliverable hours
    const deliverableCountForTask = getTaskDeliverableCount(task);
    deliverableCount += deliverableCountForTask;

    if (deliverableCountForTask > 0) {
      const { deliverableHours: taskDeliverableHours, variationHours: taskVariationHours } =
        getTaskDeliverableHours(task, deliverablesOptions);
      deliverableHours += taskDeliverableHours;
      variationHours += taskVariationHours;
    }
  });

  // Total hours = task hours only (from timeInHours field)
  // Deliverable hours and variation hours are tracked separately but NOT added to total
  // The user manually enters timeInHours which represents the total time spent on the task
  const totalHours = taskHours;

  return {
    taskCount,
    taskHours,
    deliverableCount,
    deliverableHours,
    variationHours,
    aiHours, // Tracked separately for AI achievements, but NOT added to total
    totalHours
  };
};

