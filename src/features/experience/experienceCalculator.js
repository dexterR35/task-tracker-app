/**
 * Experience Points Calculator
 * 
 * Calculates experience points from task data
 */

import { EXPERIENCE_POINTS, GENERAL_ACHIEVEMENTS, EXPERIENCE_CONFIG, DEPARTMENT_ACHIEVEMENTS } from './constants';
import { logger } from '@/utils/logger';

/**
 * Calculate experience points from a single task
 * @param {Object} task - Task data object
 * @returns {number} - Points earned from this task
 */
export const calculateTaskPoints = (task) => {
  if (!task || !task.data_task) {
    logger.warn('Invalid task data for point calculation');
    return 0;
  }

  const taskData = task.data_task;
  let points = 0;

  // Base points for task added
  points += EXPERIENCE_POINTS.TASK_ADDED;

  // Points for deliverables
  if (taskData.deliverablesUsed && Array.isArray(taskData.deliverablesUsed)) {
    taskData.deliverablesUsed.forEach(deliverable => {
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
  if (taskData.aiUsed && Array.isArray(taskData.aiUsed) && taskData.aiUsed.length > 0) {
    const hasAiModels = taskData.aiUsed.some(ai => 
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

/**
 * Calculate bonus achievements from user's task history
 * @param {Array} tasks - Array of all user tasks
 * @param {Object} currentExperience - Current experience data (only used for taskCount comparison)
 * @returns {Array} - Array of newly unlocked achievements
 */
export const calculateBonusAchievements = (tasks, currentExperience) => {
  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }

  const achievements = [];
  const experience = currentExperience || { 
    taskCount: 0,
    unlockedAchievements: []
  };

  // Count Shutterstock uses from tasks
  const shutterstockCount = tasks.filter(task => 
    task.data_task?.useShutterstock === true
  ).length;

  // Count AI uses from tasks
  const aiCount = tasks.filter(task => {
    const aiUsed = task.data_task?.aiUsed;
    return aiUsed && Array.isArray(aiUsed) && aiUsed.length > 0 &&
           aiUsed.some(ai => ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0);
  }).length;

  // Count total tasks
  const taskCount = tasks.length;
  const previousTaskCount = experience.taskCount || 0;

  // Check for Shutterstock achievement (calculate from tasks, not stored in DB)
  if (shutterstockCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.SHUTTERSTOCK_10.threshold) {
    // Check if achievement was already unlocked
    const wasUnlocked = experience.unlockedAchievements?.includes(EXPERIENCE_CONFIG.ACHIEVEMENTS.SHUTTERSTOCK_10.name) || false;
    // Unlock if threshold reached and not already unlocked
    if (!wasUnlocked && shutterstockCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.SHUTTERSTOCK_10.threshold) {
      achievements.push({
        ...EXPERIENCE_CONFIG.ACHIEVEMENTS.SHUTTERSTOCK_10,
        points: EXPERIENCE_CONFIG.POINTS.BONUS_SHUTTERSTOCK_10
      });
    }
  }

  // Check for AI achievement (calculate from tasks, not stored in DB)
  if (aiCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.AI_10.threshold) {
    const wasUnlocked = experience.unlockedAchievements?.includes(EXPERIENCE_CONFIG.ACHIEVEMENTS.AI_10.name) || false;
    if (!wasUnlocked && aiCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.AI_10.threshold) {
      achievements.push({
        ...EXPERIENCE_CONFIG.ACHIEVEMENTS.AI_10,
        points: EXPERIENCE_CONFIG.POINTS.BONUS_AI_10
      });
    }
  }

  // Check for task count achievements
  if (taskCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_50.threshold) {
    if (previousTaskCount < EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_50.threshold &&
        taskCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_50.threshold) {
      achievements.push({
        ...EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_50,
        points: EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_50.points
      });
    }
  }

  if (taskCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_100.threshold) {
    if (previousTaskCount < EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_100.threshold &&
        taskCount >= EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_100.threshold) {
      achievements.push({
        ...EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_100,
        points: EXPERIENCE_CONFIG.ACHIEVEMENTS.TASKS_100.points
      });
    }
  }

  return achievements;
};

/**
 * Calculate total experience points from all tasks
 * @param {Array} tasks - Array of all user tasks
 * @returns {Object} - Experience summary
 */
export const calculateTotalExperience = (tasks) => {
  if (!tasks || !Array.isArray(tasks)) {
    return {
      totalPoints: 0,
      shutterstockCount: 0,
      aiCount: 0,
      taskCount: 0
    };
  }

  let totalPoints = 0;
  let shutterstockCount = 0;
  let aiCount = 0;

  tasks.forEach(task => {
    const taskPoints = calculateTaskPoints(task);
    totalPoints += taskPoints;

    if (task.data_task?.useShutterstock === true) {
      shutterstockCount++;
    }

    const aiUsed = task.data_task?.aiUsed;
    if (aiUsed && Array.isArray(aiUsed) && aiUsed.length > 0 &&
        aiUsed.some(ai => ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0)) {
      aiCount++;
    }
  });

  return {
    totalPoints,
    shutterstockCount,
    aiCount,
    taskCount: tasks.length
  };
};

/**
 * Calculate ALL experience metrics from tasks (single source of truth)
 * This function calculates everything from tasks across all years/months
 * @param {Array} tasks - Array of all user tasks across all years/months
 * @param {Array} deliverablesOptions - Optional deliverables options for time calculations
 * @param {string} userUID - Optional user UID to filter tasks (safety filter)
 * @returns {Object} - Complete experience summary calculated from tasks
 */
export const calculateCompleteExperienceFromTasks = (tasks, deliverablesOptions = [], userUID = null) => {
  if (!tasks || !Array.isArray(tasks)) {
    return {
      points: 0,
      taskCount: 0,
      shutterstockCount: 0,
      aiCount: 0,
      vipCount: 0,
      deliverableCount: 0,
      taskHours: 0,
      deliverableHours: 0,
      variationHours: 0,
      aiHours: 0,
      totalHours: 0
    };
  }

  // Safety filter: Only calculate from tasks belonging to the specified userUID
  // Task structure: { userUID: "...", data_task: {...}, createbyUID: "...", ... }
  let filteredTasks = tasks;
  if (userUID) {
    filteredTasks = tasks.filter(task => {
      // Check all possible locations where userUID might be stored
      const taskUserUID = task.userUID || task.createbyUID || task.data_task?.userUID || task.createdBy;
      
      // Normalize both UIDs for comparison (trim whitespace, handle null/undefined)
      const normalizedTaskUID = taskUserUID ? String(taskUserUID).trim() : '';
      const normalizedUserUID = String(userUID).trim();
      
      const matches = normalizedTaskUID === normalizedUserUID;
      
      // Debug logging (remove in production if needed)
      if (!matches && taskUserUID) {
        console.log('[Experience] Task filtered out:', {
          taskId: task.id,
          taskUserUID: normalizedTaskUID,
          expectedUserUID: normalizedUserUID,
          task: { userUID: task.userUID, createbyUID: task.createbyUID, data_task_userUID: task.data_task?.userUID }
        });
      }
      
      return matches;
    });
    
    // Debug: Log filtering results
    console.log('[Experience] Task filtering:', {
      totalTasks: tasks.length,
      filteredTasks: filteredTasks.length,
      userUID: userUID,
      filteredOut: tasks.length - filteredTasks.length,
      sampleTask: filteredTasks.length > 0 ? {
        id: filteredTasks[0].id,
        userUID: filteredTasks[0].userUID,
        createbyUID: filteredTasks[0].createbyUID,
        timeInHours: filteredTasks[0].data_task?.timeInHours,
        gimodear: filteredTasks[0].data_task?.gimodear
      } : null,
      recentTasks: filteredTasks.slice(-3).map(t => ({
        id: t.id,
        timeInHours: t.data_task?.timeInHours,
        gimodear: t.data_task?.gimodear
      }))
    });
  }

  let totalPoints = 0;
  let shutterstockCount = 0;
  let aiCount = 0;
  let vipCount = 0;
  let deliverableCount = 0;
  let taskHours = 0;
  let deliverableHours = 0;
  let variationHours = 0;
  let aiHours = 0;

  // Create a Map for O(1) deliverable lookup instead of O(n) find() for each task
  const deliverablesMap = new Map();
  if (deliverablesOptions && deliverablesOptions.length > 0) {
    deliverablesOptions.forEach(opt => {
      if (opt.value) deliverablesMap.set(opt.value.toLowerCase().trim(), opt);
      if (opt.label) deliverablesMap.set(opt.label.toLowerCase().trim(), opt);
    });
  }

  filteredTasks.forEach(task => {
    const taskData = task.data_task || {};
    
    // Calculate points
    const taskPoints = calculateTaskPoints(task);
    totalPoints += taskPoints;

    // Count Shutterstock uses
    if (taskData.useShutterstock === true) {
      shutterstockCount++;
    }

    // Count AI uses
    const aiUsed = taskData.aiUsed;
    if (aiUsed && Array.isArray(aiUsed) && aiUsed.length > 0 &&
        aiUsed.some(ai => ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0)) {
      aiCount++;
      
      // Calculate AI hours from task
      // Support both aiTime (current format) and hours (legacy format)
      aiUsed.forEach(ai => {
        const aiTimeValue = ai.aiTime !== undefined ? ai.aiTime : ai.hours;
        if (aiTimeValue !== undefined && aiTimeValue !== null) {
          const hours = typeof aiTimeValue === 'string' 
            ? parseFloat(aiTimeValue) 
            : Number(aiTimeValue);
          if (!isNaN(hours) && hours > 0) {
            aiHours += hours;
          }
        }
      });
    }

    // Count VIP tasks
    if (taskData.isVip === true) {
      vipCount++;
    }

    // Count and calculate deliverable hours
    if (taskData.deliverablesUsed && Array.isArray(taskData.deliverablesUsed)) {
      taskData.deliverablesUsed.forEach(deliverable => {
        if (deliverable && deliverable.name) {
          deliverableCount++;
          
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
              else if (timeUnit === 'hr') baseTime = baseTime;
              else if (timeUnit === 'day') baseTime = baseTime * 8;
              
              deliverableHours += baseTime;
              
              // Calculate variation time
              if (deliverable.variationsEnabled && deliverable.variationsCount) {
                const variationsTime = deliverableOption.variationsTime || 0;
                const variationsTimeUnit = deliverableOption.variationsTimeUnit || 'min';
                let variationTime = variationsTime * deliverable.variationsCount;
                
                if (variationsTimeUnit === 'min') variationTime = variationTime / 60;
                else if (variationsTimeUnit === 'hr') variationTime = variationTime;
                else if (variationsTimeUnit === 'day') variationTime = variationTime * 8;
                
                variationHours += variationTime;
              }
            }
          }
        }
      });
    }

    // Calculate task hours
    const timeInHours = taskData.timeInHours;
    if (timeInHours !== undefined && timeInHours !== null) {
      const hours = typeof timeInHours === 'string' 
        ? parseFloat(timeInHours) 
        : Number(timeInHours);
      if (!isNaN(hours) && hours > 0) {
        taskHours += hours;
      }
    }
  });

  const totalHours = taskHours + deliverableHours + variationHours + aiHours;

  return {
    points: totalPoints,
    taskCount: filteredTasks.length,
    shutterstockCount,
    aiCount,
    vipCount,
    deliverableCount,
    taskHours,
    deliverableHours,
    variationHours,
    aiHours,
    totalHours
  };
};

/**
 * Calculate all unlocked achievements from current counts (frontend calculation)
 * @param {Object} counts - Current counts from tasks
 * @param {string} userDepartment - User's department
 * @returns {Array} - Array of unlocked achievement names
 */
export const calculateUnlockedAchievements = (counts, userDepartment = 'design') => {
  if (!counts) return [];
  
  const unlocked = [];
  
  // Check all general achievements
  Object.values(GENERAL_ACHIEVEMENTS).forEach(achievement => {
    let currentValue;
    
    switch (achievement.type) {
      case 'taskCount':
        currentValue = counts.taskCount || 0;
        break;
      case 'shutterstockCount':
        currentValue = counts.shutterstockCount || 0;
        break;
      case 'aiCount':
        currentValue = counts.aiCount || 0;
        break;
      case 'totalHours':
        currentValue = Math.round(counts.totalHours || 0);
        break;
      case 'aiHours':
        currentValue = Math.round(counts.aiHours || 0);
        break;
      case 'vipCount':
        currentValue = counts.vipCount || 0;
        break;
      case 'deliverableCount':
        currentValue = counts.deliverableCount || 0;
        break;
      default:
        return; // Skip achievements without type
    }
    
    // If current value meets or exceeds threshold, achievement is unlocked
    if (currentValue >= achievement.threshold) {
      unlocked.push(achievement.name);
    }
  });
  
  // Check department-specific achievements (based on task count)
  const deptAchievements = DEPARTMENT_ACHIEVEMENTS[userDepartment] || DEPARTMENT_ACHIEVEMENTS.design;
  if (deptAchievements) {
    Object.values(deptAchievements).forEach(achievement => {
      const taskCount = counts.taskCount || 0;
      if (taskCount >= achievement.threshold) {
        unlocked.push(achievement.name);
      }
    });
  }
  
  return unlocked;
};

