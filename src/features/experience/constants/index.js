/**
 * Experience System Constants
 *
 * All experience-related constants in one file for easy management
 * - Points configuration
 * - Level progression
 * - Achievements (general and department-specific)
 */

// ============================================================================
// EXPERIENCE POINTS CONFIGURATION
// ============================================================================

export const EXPERIENCE_POINTS = {
  TASK_ADDED: 20,
  DELIVERABLE: 10,
  VARIATION: 5,
  SHUTTERSTOCK_USED: 5,
  SHUTTERSTOCK_NOT_USED: 0,
  AI_USED: 5,
  AI_NOT_USED: 0,
  // Bonus achievements
  BONUS_SHUTTERSTOCK_10: 20, // Bonus for 10 Shutterstock uses
  BONUS_AI_10: 20, // Bonus for 10 AI uses
};

// ============================================================================
// EXPERIENCE LEVELS CONFIGURATION
// ============================================================================

export const EXPERIENCE_LEVELS = [
  { level: 1, minPoints: 0, maxPoints: 100, name: "Amateur", color: "#94a3b8", badge: "🥉" },
  { level: 2, minPoints: 100, maxPoints: 300, name: "Rookie", color: "#60a5fa", badge: "🥈" },
  { level: 3, minPoints: 300, maxPoints: 600, name: "Apprentice", color: "#34d399", badge: "⭐" },
  { level: 4, minPoints: 600, maxPoints: 1000, name: "Professional", color: "#a78bfa", badge: "💎" },
  { level: 5, minPoints: 1000, maxPoints: 1500, name: "Expert", color: "#f59e0b", badge: "🔥" },
  { level: 6, minPoints: 1500, maxPoints: 2200, name: "Master", color: "#ef4444", badge: "👑" },
  { level: 7, minPoints: 2200, maxPoints: 3000, name: "Grandmaster", color: "#ec4899", badge: "⚡" },
  { level: 8, minPoints: 3000, maxPoints: 4000, name: "Legend", color: "#8b5cf6", badge: "🌟" },
  { level: 9, minPoints: 4000, maxPoints: 5500, name: "Mythic", color: "#06b6d4", badge: "💫" },
  { level: 10, minPoints: 5500, maxPoints: Infinity, name: "Transcendent", color: "#fbbf24", badge: "✨" },
];

/**
 * Calculate level from total experience points
 */
export const calculateLevel = (points) => {
  if (!points || points < 0) return EXPERIENCE_LEVELS[0];

  for (let i = EXPERIENCE_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = EXPERIENCE_LEVELS[i];
    if (points >= levelConfig.minPoints) {
      return levelConfig;
    }
  }

  return EXPERIENCE_LEVELS[0];
};

/**
 * Get next level information
 */
export const getNextLevel = (currentLevel) => {
  const currentIndex = EXPERIENCE_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < EXPERIENCE_LEVELS.length - 1) {
    return EXPERIENCE_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress percentage to next level
 */
export const calculateProgress = (points, currentLevel) => {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 100; // Max level reached

  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsNeededForNext = nextLevel.minPoints - currentLevel.minPoints;

  return Math.min(100, Math.max(0, (pointsInCurrentLevel / pointsNeededForNext) * 100));
};

/**
 * Get points needed for next level
 */
export const getPointsToNextLevel = (points, currentLevel) => {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 0; // Max level reached

  return nextLevel.minPoints - points;
};

// ============================================================================
// ACHIEVEMENTS CONFIGURATION
// ============================================================================

/**
 * General achievements (available to all users)
 */
export const GENERAL_ACHIEVEMENTS = {
  // Task Count Achievements
  TASKS_10: {
    threshold: 10,
    points: 25,
    name: "Getting Started",
    description: "Completed 10 tasks!",
    icon: "🎯",
    category: "general",
    type: "taskCount"
  },
  TASKS_25: {
    threshold: 25,
    points: 40,
    name: "Task Enthusiast",
    description: "Completed 25 tasks!",
    icon: "⭐",
    category: "general",
    type: "taskCount"
  },
  TASKS_50: {
    threshold: 50,
    points: 50,
    name: "Task Master",
    description: "Completed 50 tasks!",
    icon: "🎯",
    category: "general",
    type: "taskCount"
  },
  TASKS_100: {
    threshold: 100,
    points: 100,
    name: "Centurion",
    description: "Completed 100 tasks!",
    icon: "🏆",
    category: "general",
    type: "taskCount"
  },
  TASKS_200: {
    threshold: 200,
    points: 200,
    name: "Task Legend",
    description: "Completed 200 tasks!",
    icon: "👑",
    category: "general",
    type: "taskCount"
  },
  TASKS_500: {
    threshold: 500,
    points: 500,
    name: "Task God",
    description: "Completed 500 tasks!",
    icon: "⚡",
    category: "general",
    type: "taskCount"
  },

  // AI Hours Achievements
  AI_HOURS_10: {
    threshold: 10,
    points: 25,
    name: "AI Explorer",
    description: "Spent 10 hours with AI tools!",
    icon: "🤖",
    category: "general",
    type: "aiHours"
  },
  AI_HOURS_25: {
    threshold: 25,
    points: 50,
    name: "AI Specialist",
    description: "Spent 25 hours with AI tools!",
    icon: "🧠",
    category: "general",
    type: "aiHours"
  },
  AI_HOURS_50: {
    threshold: 50,
    points: 100,
    name: "AI Master",
    description: "Spent 50 hours with AI tools!",
    icon: "🤖",
    category: "general",
    type: "aiHours"
  },
  AI_HOURS_100: {
    threshold: 100,
    points: 200,
    name: "AI Wizard",
    description: "Spent 100 hours with AI tools!",
    icon: "🧙",
    category: "general",
    type: "aiHours"
  },

  // Shutterstock Achievements
  SHUTTERSTOCK_10: {
    threshold: 10,
    points: EXPERIENCE_POINTS.BONUS_SHUTTERSTOCK_10,
    name: "Shutterstock Enthusiast",
    description: "Used Shutterstock 10 times!",
    icon: "📸",
    category: "general",
    type: "shutterstockCount"
  },
  SHUTTERSTOCK_25: {
    threshold: 25,
    points: 50,
    name: "Shutterstock Pro",
    description: "Used Shutterstock 25 times!",
    icon: "📷",
    category: "general",
    type: "shutterstockCount"
  },
  SHUTTERSTOCK_50: {
    threshold: 50,
    points: 100,
    name: "Shutterstock Master",
    description: "Used Shutterstock 50 times!",
    icon: "📹",
    category: "general",
    type: "shutterstockCount"
  },

  // AI Usage Achievements
  AI_10: {
    threshold: 10,
    points: EXPERIENCE_POINTS.BONUS_AI_10,
    name: "AI Power User",
    description: "Used AI tools 10 times!",
    icon: "🤖",
    category: "general",
    type: "aiCount"
  },
  AI_25: {
    threshold: 25,
    points: 50,
    name: "AI Expert",
    description: "Used AI tools 25 times!",
    icon: "🧠",
    category: "general",
    type: "aiCount"
  },
  AI_50: {
    threshold: 50,
    points: 100,
    name: "AI Master",
    description: "Used AI tools 50 times!",
    icon: "🤖",
    category: "general",
    type: "aiCount"
  },

  // VIP Task Achievements
  VIP_5: {
    threshold: 5,
    points: 50,
    name: "VIP Handler",
    description: "Completed 5 VIP tasks!",
    icon: "💎",
    category: "general",
    type: "vipCount"
  },
  VIP_10: {
    threshold: 10,
    points: 100,
    name: "VIP Specialist",
    description: "Completed 10 VIP tasks!",
    icon: "👑",
    category: "general",
    type: "vipCount"
  },
  VIP_25: {
    threshold: 25,
    points: 250,
    name: "VIP Master",
    description: "Completed 25 VIP tasks!",
    icon: "💫",
    category: "general",
    type: "vipCount"
  },

  // Deliverable Achievements
  DELIVERABLES_25: {
    threshold: 25,
    points: 40,
    name: "Deliverable Creator",
    description: "Created 25 deliverables!",
    icon: "📦",
    category: "general",
    type: "deliverableCount"
  },
  DELIVERABLES_50: {
    threshold: 50,
    points: 80,
    name: "Deliverable Expert",
    description: "Created 50 deliverables!",
    icon: "📚",
    category: "general",
    type: "deliverableCount"
  },
  DELIVERABLES_100: {
    threshold: 100,
    points: 150,
    name: "Deliverable Master",
    description: "Created 100 deliverables!",
    icon: "🎁",
    category: "general",
    type: "deliverableCount"
  },
};

/**
 * Department-specific achievements
 * These are unlocked based on total task count, but are department-specific
 */
export const DEPARTMENT_ACHIEVEMENTS = {
  design: {
    DESIGN_MASTER: {
      threshold: 50,
      points: 100,
      name: "Design Master",
      description: "Completed 50 design tasks!",
      icon: "🎨",
      department: "design",
      category: "department"
    },
    DESIGN_LEGEND: {
      threshold: 100,
      points: 200,
      name: "Design Legend",
      description: "Completed 100 design tasks!",
      icon: "✨",
      department: "design",
      category: "department"
    },
    DESIGN_EXPERT: {
      threshold: 200,
      points: 500,
      name: "Design Expert",
      description: "Completed 200 design tasks!",
      icon: "🏆",
      department: "design",
      category: "department"
    }
  },
  video: {
    VIDEO_MASTER: {
      threshold: 50,
      points: 100,
      name: "Video Master",
      description: "Completed 50 video tasks!",
      icon: "🎬",
      department: "video",
      category: "department"
    },
    VIDEO_LEGEND: {
      threshold: 100,
      points: 200,
      name: "Video Legend",
      description: "Completed 100 video tasks!",
      icon: "🎥",
      department: "video",
      category: "department"
    },
    VIDEO_EXPERT: {
      threshold: 200,
      points: 500,
      name: "Video Expert",
      description: "Completed 200 video tasks!",
      icon: "🌟",
      department: "video",
      category: "department"
    }
  },
  developer: {
    DEV_MASTER: {
      threshold: 50,
      points: 100,
      name: "Developer Master",
      description: "Completed 50 developer tasks!",
      icon: "💻",
      department: "developer",
      category: "department"
    },
    DEV_LEGEND: {
      threshold: 100,
      points: 200,
      name: "Developer Legend",
      description: "Completed 100 developer tasks!",
      icon: "⚡",
      department: "developer",
      category: "department"
    },
    DEV_EXPERT: {
      threshold: 200,
      points: 500,
      name: "Developer Expert",
      description: "Completed 200 developer tasks!",
      icon: "🚀",
      department: "developer",
      category: "department"
    }
  }
};

/**
 * Get all achievements for a specific department
 * @param {string} department - Department name (design, video, developer)
 * @returns {Object} - Object with general and department achievements
 */
export const getAchievementsForDepartment = (department = 'design') => {
  return {
    general: GENERAL_ACHIEVEMENTS,
    department: DEPARTMENT_ACHIEVEMENTS[department] || DEPARTMENT_ACHIEVEMENTS.design
  };
};

/**
 * Get all achievements as a flat array
 * @param {string} department - Department name
 * @returns {Array} - Array of all achievements
 */
export const getAllAchievements = (department = 'design') => {
  const general = Object.values(GENERAL_ACHIEVEMENTS);
  const dept = Object.values(DEPARTMENT_ACHIEVEMENTS[department] || DEPARTMENT_ACHIEVEMENTS.design);
  return [...general, ...dept];
};

// ============================================================================
// LEGACY COMPATIBILITY - EXPERIENCE_CONFIG
// ============================================================================

/**
 * Legacy EXPERIENCE_CONFIG object for backward compatibility
 * New code should import directly from this file
 */
/**
 * Time-based level progression (similar to experience levels but for hours)
 */
export const TIME_LEVELS = [
  { level: 1, minHours: 0, maxHours: 50, name: "Time Keeper", icon: "⏰", points: 30 },
  { level: 2, minHours: 50, maxHours: 200, name: "Time Warrior", icon: "🕐", points: 150 },
  { level: 3, minHours: 200, maxHours: 500, name: "Time Master", icon: "⏳", points: 300 },
  { level: 4, minHours: 500, maxHours: 1000, name: "Time Legend", icon: "🕰️", points: 600 },
  { level: 5, minHours: 1000, maxHours: Infinity, name: "Time God", icon: "⚡", points: 1000 },
];

/**
 * AI Hours-based level progression
 */
export const AI_HOURS_LEVELS = [
  { level: 1, minHours: 0, maxHours: 10, name: "AI Explorer", icon: "🤖", points: 25 },
  { level: 2, minHours: 10, maxHours: 25, name: "AI Specialist", icon: "🧠", points: 50 },
  { level: 3, minHours: 25, maxHours: 50, name: "AI Master", icon: "🤖", points: 100 },
  { level: 4, minHours: 50, maxHours: 100, name: "AI Wizard", icon: "🧙", points: 200 },
  { level: 5, minHours: 100, maxHours: Infinity, name: "AI Deity", icon: "⚡", points: 400 },
];

/**
 * Task count-based level progression
 */
export const TASK_LEVELS = [
  { level: 1, minTasks: 0, maxTasks: 50, name: "Task Master", icon: "🏆", points: 50 },
  { level: 2, minTasks: 50, maxTasks: 100, name: "Centurion", icon: "👑", points: 100 },
  { level: 3, minTasks: 100, maxTasks: 200, name: "Task Legend", icon: "⚡", points: 200 },
  { level: 4, minTasks: 200, maxTasks: 500, name: "Task God", icon: "✨", points: 500 },
  { level: 5, minTasks: 500, maxTasks: Infinity, name: "Task Deity", icon: "🌟", points: 1000 },
];

/**
 * VIP task count-based level progression
 */
export const VIP_LEVELS = [
  { level: 1, minTasks: 0, maxTasks: 5, name: "VIP Handler", icon: "💎", points: 50 },
  { level: 2, minTasks: 5, maxTasks: 10, name: "VIP Specialist", icon: "👑", points: 100 },
  { level: 3, minTasks: 10, maxTasks: 25, name: "VIP Master", icon: "⭐", points: 250 },
  { level: 4, minTasks: 25, maxTasks: 50, name: "VIP Legend", icon: "🔥", points: 500 },
  { level: 5, minTasks: 50, maxTasks: Infinity, name: "VIP Deity", icon: "⚡", points: 1000 },
];

/**
 * Deliverable count-based level progression
 */
export const DELIVERABLE_LEVELS = [
  { level: 1, minCount: 0, maxCount: 10, name: "Deliverable Starter", icon: "📦", points: 30 },
  { level: 2, minCount: 10, maxCount: 25, name: "Deliverable Pro", icon: "📋", points: 75 },
  { level: 3, minCount: 25, maxCount: 50, name: "Deliverable Master", icon: "📄", points: 150 },
  { level: 4, minCount: 50, maxCount: 100, name: "Deliverable Legend", icon: "📚", points: 300 },
  { level: 5, minCount: 100, maxCount: Infinity, name: "Deliverable Deity", icon: "📖", points: 600 },
];

/**
 * AI Uses count-based level progression
 */
export const AI_USES_LEVELS = [
  { level: 1, minCount: 0, maxCount: 10, name: "AI Novice", icon: "🤖", points: 25 },
  { level: 2, minCount: 10, maxCount: 25, name: "AI Enthusiast", icon: "🧠", points: 50 },
  { level: 3, minCount: 25, maxCount: 50, name: "AI Expert", icon: "⚡", points: 100 },
  { level: 4, minCount: 50, maxCount: 100, name: "AI Master", icon: "🎯", points: 200 },
  { level: 5, minCount: 100, maxCount: Infinity, name: "AI Deity", icon: "🌟", points: 400 },
];

/**
 * Shutterstock Uses count-based level progression
 */
export const SHUTTERSTOCK_LEVELS = [
  { level: 1, minCount: 0, maxCount: 10, name: "Shutterstock Starter", icon: "📸", points: 20 },
  { level: 2, minCount: 10, maxCount: 25, name: "Shutterstock Pro", icon: "📷", points: 50 },
  { level: 3, minCount: 25, maxCount: 50, name: "Shutterstock Master", icon: "📹", points: 100 },
  { level: 4, minCount: 50, maxCount: 100, name: "Shutterstock Legend", icon: "🎬", points: 200 },
  { level: 5, minCount: 100, maxCount: Infinity, name: "Shutterstock Deity", icon: "🎥", points: 400 },
];

/**
 * Get current time level based on hours
 * @param {number} hours - Total hours
 * @returns {Object} - Current time level and next level info
 */
export const getCurrentTimeLevel = (hours = 0) => {
  if (!hours || hours < 0) return TIME_LEVELS[0];

  for (let i = TIME_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = TIME_LEVELS[i];
    if (hours >= levelConfig.minHours) {
      return levelConfig;
    }
  }

  return TIME_LEVELS[0];
};

/**
 * Get next time level
 */
export const getNextTimeLevel = (currentLevel) => {
  const currentIndex = TIME_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < TIME_LEVELS.length - 1) {
    return TIME_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress to next time level
 */
export const calculateTimeLevelProgress = (hours, currentLevel) => {
  const nextLevel = getNextTimeLevel(currentLevel);
  if (!nextLevel) return 100; // Max level reached

  const hoursInCurrentLevel = hours - currentLevel.minHours;
  const hoursNeededForNext = nextLevel.minHours - currentLevel.minHours;

  return Math.min(100, Math.max(0, (hoursInCurrentLevel / hoursNeededForNext) * 100));
};

/**
 * Get current AI hours level based on hours
 */
export const getCurrentAIHoursLevel = (hours = 0) => {
  if (!hours || hours < 0) return AI_HOURS_LEVELS[0];

  for (let i = AI_HOURS_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = AI_HOURS_LEVELS[i];
    if (hours >= levelConfig.minHours) {
      return levelConfig;
    }
  }

  return AI_HOURS_LEVELS[0];
};

/**
 * Get next AI hours level
 */
export const getNextAIHoursLevel = (currentLevel) => {
  const currentIndex = AI_HOURS_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < AI_HOURS_LEVELS.length - 1) {
    return AI_HOURS_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress to next AI hours level
 */
export const calculateAIHoursLevelProgress = (hours, currentLevel) => {
  const nextLevel = getNextAIHoursLevel(currentLevel);
  if (!nextLevel) return 100;

  const hoursInCurrentLevel = hours - currentLevel.minHours;
  const hoursNeededForNext = nextLevel.minHours - currentLevel.minHours;

  return Math.min(100, Math.max(0, (hoursInCurrentLevel / hoursNeededForNext) * 100));
};

/**
 * Get current task level based on task count
 */
export const getCurrentTaskLevel = (taskCount = 0) => {
  if (!taskCount || taskCount < 0) return TASK_LEVELS[0];

  for (let i = TASK_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = TASK_LEVELS[i];
    if (taskCount >= levelConfig.minTasks) {
      return levelConfig;
    }
  }

  return TASK_LEVELS[0];
};

/**
 * Get next task level
 */
export const getNextTaskLevel = (currentLevel) => {
  const currentIndex = TASK_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < TASK_LEVELS.length - 1) {
    return TASK_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress to next task level
 */
export const calculateTaskLevelProgress = (taskCount, currentLevel) => {
  const nextLevel = getNextTaskLevel(currentLevel);
  if (!nextLevel) return 100;

  const tasksInCurrentLevel = taskCount - currentLevel.minTasks;
  const tasksNeededForNext = nextLevel.minTasks - currentLevel.minTasks;

  return Math.min(100, Math.max(0, (tasksInCurrentLevel / tasksNeededForNext) * 100));
};

/**
 * Get current VIP level based on VIP task count
 */
export const getCurrentVIPLevel = (vipCount = 0) => {
  if (!vipCount || vipCount < 0) return VIP_LEVELS[0];

  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = VIP_LEVELS[i];
    if (vipCount >= levelConfig.minTasks) {
      return levelConfig;
    }
  }

  return VIP_LEVELS[0];
};

/**
 * Get next VIP level
 */
export const getNextVIPLevel = (currentLevel) => {
  const currentIndex = VIP_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < VIP_LEVELS.length - 1) {
    return VIP_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress to next VIP level
 */
export const calculateVIPLevelProgress = (vipCount, currentLevel) => {
  const nextLevel = getNextVIPLevel(currentLevel);
  if (!nextLevel) return 100;

  const tasksInCurrentLevel = vipCount - currentLevel.minTasks;
  const tasksNeededForNext = nextLevel.minTasks - currentLevel.minTasks;

  return Math.min(100, Math.max(0, (tasksInCurrentLevel / tasksNeededForNext) * 100));
};

/**
 * Get current deliverable level based on count
 */
export const getCurrentDeliverableLevel = (count = 0) => {
  if (!count || count < 0) return DELIVERABLE_LEVELS[0];

  for (let i = DELIVERABLE_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = DELIVERABLE_LEVELS[i];
    if (count >= levelConfig.minCount) {
      return levelConfig;
    }
  }

  return DELIVERABLE_LEVELS[0];
};

/**
 * Get next deliverable level
 */
export const getNextDeliverableLevel = (currentLevel) => {
  const currentIndex = DELIVERABLE_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < DELIVERABLE_LEVELS.length - 1) {
    return DELIVERABLE_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress to next deliverable level
 */
export const calculateDeliverableLevelProgress = (count, currentLevel) => {
  const nextLevel = getNextDeliverableLevel(currentLevel);
  if (!nextLevel) return 100;

  const countInCurrentLevel = count - currentLevel.minCount;
  const countNeededForNext = nextLevel.minCount - currentLevel.minCount;

  return Math.min(100, Math.max(0, (countInCurrentLevel / countNeededForNext) * 100));
};

/**
 * Get current AI uses level based on count
 */
export const getCurrentAIUsesLevel = (count = 0) => {
  if (!count || count < 0) return AI_USES_LEVELS[0];

  for (let i = AI_USES_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = AI_USES_LEVELS[i];
    if (count >= levelConfig.minCount) {
      return levelConfig;
    }
  }

  return AI_USES_LEVELS[0];
};

/**
 * Get next AI uses level
 */
export const getNextAIUsesLevel = (currentLevel) => {
  const currentIndex = AI_USES_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < AI_USES_LEVELS.length - 1) {
    return AI_USES_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress to next AI uses level
 */
export const calculateAIUsesLevelProgress = (count, currentLevel) => {
  const nextLevel = getNextAIUsesLevel(currentLevel);
  if (!nextLevel) return 100;

  const countInCurrentLevel = count - currentLevel.minCount;
  const countNeededForNext = nextLevel.minCount - currentLevel.minCount;

  return Math.min(100, Math.max(0, (countInCurrentLevel / countNeededForNext) * 100));
};

/**
 * Get current Shutterstock level based on count
 */
export const getCurrentShutterstockLevel = (count = 0) => {
  if (!count || count < 0) return SHUTTERSTOCK_LEVELS[0];

  for (let i = SHUTTERSTOCK_LEVELS.length - 1; i >= 0; i--) {
    const levelConfig = SHUTTERSTOCK_LEVELS[i];
    if (count >= levelConfig.minCount) {
      return levelConfig;
    }
  }

  return SHUTTERSTOCK_LEVELS[0];
};

/**
 * Get next Shutterstock level
 */
export const getNextShutterstockLevel = (currentLevel) => {
  const currentIndex = SHUTTERSTOCK_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex >= 0 && currentIndex < SHUTTERSTOCK_LEVELS.length - 1) {
    return SHUTTERSTOCK_LEVELS[currentIndex + 1];
  }
  return null;
};

/**
 * Calculate progress to next Shutterstock level
 */
export const calculateShutterstockLevelProgress = (count, currentLevel) => {
  const nextLevel = getNextShutterstockLevel(currentLevel);
  if (!nextLevel) return 100;

  const countInCurrentLevel = count - currentLevel.minCount;
  const countNeededForNext = nextLevel.minCount - currentLevel.minCount;

  return Math.min(100, Math.max(0, (countInCurrentLevel / countNeededForNext) * 100));
};

export const EXPERIENCE_CONFIG = {
  POINTS: EXPERIENCE_POINTS,
  LEVELS: EXPERIENCE_LEVELS,
  ACHIEVEMENTS: GENERAL_ACHIEVEMENTS,
  DEPARTMENT_ACHIEVEMENTS: DEPARTMENT_ACHIEVEMENTS,
  TIME_LEVELS: TIME_LEVELS,
  AI_HOURS_LEVELS: AI_HOURS_LEVELS,
  TASK_LEVELS: TASK_LEVELS,
  VIP_LEVELS: VIP_LEVELS,
  DELIVERABLE_LEVELS: DELIVERABLE_LEVELS,
  AI_USES_LEVELS: AI_USES_LEVELS,
  SHUTTERSTOCK_LEVELS: SHUTTERSTOCK_LEVELS,
};
