/**
 * Experience Points Calculator
 *
 * Calculates experience points from task data
 */

import {
  EXPERIENCE_POINTS,
} from "./constants";
import { logger } from "@/utils/logger";
import { calculateBasicTaskMetrics } from "@/utils/taskMetricsCalculator";

export const calculateTaskPoints = (task) => {
  if (!task || !task.data_task) {
    logger.warn("Invalid task data for point calculation");
    return 0;
  }

  const taskData = task.data_task;
  let points = 0;

  // Base points for task added
  points += EXPERIENCE_POINTS.TASK_ADDED;

  // Points for deliverables
  if (taskData.deliverablesUsed && Array.isArray(taskData.deliverablesUsed)) {
    taskData.deliverablesUsed.forEach((deliverable) => {
      if (deliverable && deliverable.name) {
        points += EXPERIENCE_POINTS.DELIVERABLE;

        // Points for variations
        if (deliverable.variationsEnabled && deliverable.variationsCount) {
          points += deliverable.variationsCount * EXPERIENCE_POINTS.VARIATION;
        }
      }
    });
  }

  // Points for Shutterstock usage
  if (taskData.useShutterstock) {
    points += EXPERIENCE_POINTS.SHUTTERSTOCK_USED;
  } else {
    points += EXPERIENCE_POINTS.SHUTTERSTOCK_NOT_USED;
  }

  // Points for AI usage
  if (
    taskData.aiUsed &&
    Array.isArray(taskData.aiUsed) &&
    taskData.aiUsed.length > 0
  ) {
    const hasAiModels = taskData.aiUsed.some(
      (ai) =>
        ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0
    );
    if (hasAiModels) {
      points += EXPERIENCE_POINTS.AI_USED;
    } else {
      points += EXPERIENCE_POINTS.AI_NOT_USED;
    }
  } else {
    points += EXPERIENCE_POINTS.AI_NOT_USED;
  }

  return points;
};

export const calculateBonusAchievements = (_tasks, _currentExperience) => {
  // General achievements removed - only time level achievements are used
  return [];
};

/**
 * @deprecated Use calculateCompleteExperienceFromTasks instead
 * This function is kept for backward compatibility but is redundant.
 * It's a simplified version that doesn't include hours, deliverableCount, vipCount, etc.
 */
export const calculateTotalExperience = (tasks, userUID = null) => {
  // Use the complete function and extract only the needed fields for backward compatibility
  const complete = calculateCompleteExperienceFromTasks(tasks, [], userUID);
  return {
    totalPoints: complete.points,
    shutterstockCount: complete.shutterstockCount,
    aiCount: complete.aiCount,
    taskCount: complete.taskCount,
  };
};

/**
 * Calculate ALL experience metrics from tasks (single source of truth)
 *
 * CRITICAL: Experience points are calculated ONLY from tasks that belong to the user
 * (filtered by userUID). Each task in the database has a userUID field that identifies
 * the owner. This ensures each user's experience is based on their own tasks.
 *

 */
export const calculateCompleteExperienceFromTasks = (
  tasks,
  deliverablesOptions = [],
  userUID = null
) => {
  if (!tasks || !Array.isArray(tasks)) {
    return {
      points: 0,
      taskCount: 0,
      shutterstockCount: 0,
      aiCount: 0,
      vipCount: 0,
      deliverableCount: 0,
      variationCount: 0,
      taskHours: 0,
      deliverableHours: 0,
      variationHours: 0,
      aiHours: 0,
      totalHours: 0,
    };
  }

  // CRITICAL: Only calculate experience from tasks belonging to the specified userUID
  // Tasks in database have userUID at root level: { userUID: "...", data_task: {...}, ... }
  // This filter ensures experience points are calculated ONLY from the user's own tasks
  let filteredTasks = tasks;
  if (userUID) {
    filteredTasks = tasks.filter((task) => {
      // Primary check: task.userUID (this is how tasks are stored in the database)
      // Fallback checks for legacy data or edge cases
      const taskUserUID =
        task.userUID ||
        task.createdByUID ||
        task.createbyUID ||
        task.data_task?.userUID ||
        task.createdBy;

      // Normalize both UIDs for comparison (trim whitespace, handle null/undefined)
      const normalizedTaskUID = taskUserUID ? String(taskUserUID).trim() : "";
      const normalizedUserUID = String(userUID).trim();

      const matches = normalizedTaskUID === normalizedUserUID;

      // Only include tasks that match the user's userUID
      return matches;
    });

    // Log filtering results for debugging
    if (filteredTasks.length !== tasks.length) {
      console.log("[Experience] Task filtering applied:", {
        totalTasks: tasks.length,
        filteredTasks: filteredTasks.length,
        userUID: userUID,
        filteredOut: tasks.length - filteredTasks.length,
      });
    }
  } else {
    // If no userUID provided, log warning (should not happen in production)
    console.warn(
      "[Experience] No userUID provided for task filtering - calculating from all tasks"
    );
  }

  // Use shared task metrics calculator for base calculations
  const basicMetrics = calculateBasicTaskMetrics(
    filteredTasks,
    deliverablesOptions
  );

  // Experience-specific calculations (points, counts for achievements)
  let totalPoints = 0;
  let shutterstockCount = 0;
  let aiCount = 0;
  let vipCount = 0;
  let variationCount = 0;
  // Department task counts (based on task department, not user occupation)
  let designTaskCount = 0;
  let videoTaskCount = 0;
  let developerTaskCount = 0;

  filteredTasks.forEach((task) => {
    const taskData = task.data_task || {};

    // Calculate points (experience-specific)
    const taskPoints = calculateTaskPoints(task);
    totalPoints += taskPoints;

    // Count Shutterstock uses (for achievements)
    if (taskData.useShutterstock === true) {
      shutterstockCount++;
    }

    // Count AI uses (for achievements)
    // Count each AI model used, not just tasks with AI
    // If user selects 2 AI models, that counts as 2 AI uses
    const aiUsed = taskData.aiUsed;
    if (aiUsed && Array.isArray(aiUsed) && aiUsed.length > 0) {
      aiUsed.forEach((ai) => {
        if (ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0) {
          // Count each AI model as a separate use
          aiCount += ai.aiModels.length;
        }
      });
    }

    // Count VIP tasks (for achievements)
    if (taskData.isVip === true) {
      vipCount++;
    }

    // Count variations (for achievements)
    if (taskData.deliverablesUsed && Array.isArray(taskData.deliverablesUsed)) {
      taskData.deliverablesUsed.forEach((deliverable) => {
        if (deliverable?.variationsEnabled && deliverable?.variationsCount) {
          variationCount += deliverable.variationsCount;
        }
      });
    }

    // Count tasks by department (from task.data_task.departments array)
    const departments = taskData.departments;
    if (departments && Array.isArray(departments)) {
      departments.forEach((dept) => {
        const deptLower = String(dept).toLowerCase().trim();
        if (deptLower === "design") {
          designTaskCount++;
        } else if (deptLower === "video") {
          videoTaskCount++;
        } else if (deptLower === "developer" || deptLower === "development") {
          developerTaskCount++;
        }
      });
    }
  });

  return {
    // Experience-specific: points
    points: totalPoints,
    // Experience-specific: achievement counts
    shutterstockCount,
    aiCount,
    vipCount,
    variationCount,
    // Department task counts (based on task department)
    designTaskCount,
    videoTaskCount,
    developerTaskCount,
    // Shared metrics from taskMetricsCalculator
    taskCount: basicMetrics.taskCount,
    deliverableCount: basicMetrics.deliverableCount,
    taskHours: basicMetrics.taskHours,
    deliverableHours: basicMetrics.deliverableHours,
    variationHours: basicMetrics.variationHours,
    aiHours: basicMetrics.aiHours,
    totalHours: basicMetrics.totalHours,
  };
};

export const calculateUnlockedAchievements = (
  _counts
) => {
  // General achievements removed - only time level achievements are used
  // Time level achievements are handled separately in ExperienceProvider
  return [];
};
