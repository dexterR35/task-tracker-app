/**
 * Achievements System Configuration
 * 
 * Quest-based achievement system with multiple levels per achievement
 */

// ============================================================================
// ACHIEVEMENT TYPES
// ============================================================================

export const ACHIEVEMENT_TYPES = {
  COMPLETE_TASKS: 'complete_tasks',
  COMPLETE_DELIVERABLES: 'complete_deliverables',
  TOTAL_HOURS: 'total_hours',
  USE_SHUTTERSTOCK: 'use_shutterstock',
  USE_AI: 'use_ai',
  VARIATIONS: 'variations',
};

// ============================================================================
// ACHIEVEMENTS CONFIGURATION
// ============================================================================

/**
 * Achievement definitions with multiple levels
 * Each achievement has levels with thresholds
 */
export const ACHIEVEMENTS = {
  [ACHIEVEMENT_TYPES.COMPLETE_TASKS]: {
    id: ACHIEVEMENT_TYPES.COMPLETE_TASKS,
    name: "Task Master",
    description: "Complete tasks to unlock achievements",
    icon: "✅",
    color: "#3b82f6",
    levels: [
      { level: 1, target: 50, name: "Getting Started", badge: "🌱", reward: "50 XP" },
      { level: 2, target: 100, name: "Task Warrior", badge: "⚔️", reward: "100 XP" },
      { level: 3, target: 200, name: "Task Champion", badge: "🏆", reward: "200 XP" },
      { level: 4, target: 400, name: "Task Legend", badge: "👑", reward: "400 XP" },
      { level: 5, target: 600, name: "Task Master", badge: "🌟", reward: "600 XP" },
      { level: 6, target: 1000, name: "Task God", badge: "🌌", reward: "1000 XP" },
    ],
  },
  [ACHIEVEMENT_TYPES.COMPLETE_DELIVERABLES]: {
    id: ACHIEVEMENT_TYPES.COMPLETE_DELIVERABLES,
    name: "Deliverable Expert",
    description: "Create deliverables to progress",
    icon: "📦",
    color: "#10b981",
    levels: [
      { level: 1, target: 25, name: "First Steps", badge: "🌱", reward: "25 XP" },
      { level: 2, target: 50, name: "Deliverable Pro", badge: "📦", reward: "50 XP" },
      { level: 3, target: 100, name: "Deliverable Expert", badge: "⭐", reward: "100 XP" },
      { level: 4, target: 200, name: "Deliverable Master", badge: "💎", reward: "200 XP" },
      { level: 5, target: 400, name: "Deliverable Legend", badge: "👑", reward: "400 XP" },
      { level: 6, target: 800, name: "Deliverable God", badge: "🌌", reward: "800 XP" },
    ],
  },
  [ACHIEVEMENT_TYPES.TOTAL_HOURS]: {
    id: ACHIEVEMENT_TYPES.TOTAL_HOURS,
    name: "Time Warrior",
    description: "Accumulate hours worked",
    icon: "⏰",
    color: "#f59e0b",
    levels: [
      { level: 1, target: 100, name: "Hour Starter", badge: "⏰", reward: "100 XP" },
      { level: 2, target: 250, name: "Hour Warrior", badge: "🕐", reward: "250 XP" },
      { level: 3, target: 500, name: "Hour Expert", badge: "⏳", reward: "500 XP" },
      { level: 4, target: 1000, name: "Hour Master", badge: "🕰️", reward: "1000 XP" },
      { level: 5, target: 2000, name: "Hour Legend", badge: "⚡", reward: "2000 XP" },
      { level: 6, target: 5000, name: "Hour God", badge: "🌌", reward: "5000 XP" },
    ],
  },
  [ACHIEVEMENT_TYPES.USE_SHUTTERSTOCK]: {
    id: ACHIEVEMENT_TYPES.USE_SHUTTERSTOCK,
    name: "Shutterstock Pro",
    description: "Use Shutterstock in your tasks",
    icon: "📸",
    color: "#8b5cf6",
    levels: [
      { level: 1, target: 10, name: "Shutterstock User", badge: "📸", reward: "50 XP" },
      { level: 2, target: 25, name: "Shutterstock Pro", badge: "⭐", reward: "100 XP" },
      { level: 3, target: 50, name: "Shutterstock Expert", badge: "💎", reward: "200 XP" },
      { level: 4, target: 100, name: "Shutterstock Master", badge: "👑", reward: "400 XP" },
      { level: 5, target: 200, name: "Shutterstock Legend", badge: "🌌", reward: "800 XP" },
    ],
  },
  [ACHIEVEMENT_TYPES.USE_AI]: {
    id: ACHIEVEMENT_TYPES.USE_AI,
    name: "AI Enthusiast",
    description: "Use AI features in your tasks",
    icon: "🤖",
    color: "#ec4899",
    levels: [
      { level: 1, target: 10, name: "AI User", badge: "🤖", reward: "50 XP" },
      { level: 2, target: 25, name: "AI Pro", badge: "⭐", reward: "100 XP" },
      { level: 3, target: 50, name: "AI Expert", badge: "💎", reward: "200 XP" },
      { level: 4, target: 100, name: "AI Master", badge: "👑", reward: "400 XP" },
      { level: 5, target: 200, name: "AI Legend", badge: "🌌", reward: "800 XP" },
    ],
  },
  [ACHIEVEMENT_TYPES.VARIATIONS]: {
    id: ACHIEVEMENT_TYPES.VARIATIONS,
    name: "Variation Master",
    description: "Create variations in deliverables",
    icon: "🎨",
    color: "#06b6d4",
    levels: [
      { level: 1, target: 50, name: "Variation Starter", badge: "🎨", reward: "50 XP" },
      { level: 2, target: 100, name: "Variation Pro", badge: "⭐", reward: "100 XP" },
      { level: 3, target: 200, name: "Variation Expert", badge: "💎", reward: "200 XP" },
      { level: 4, target: 400, name: "Variation Master", badge: "👑", reward: "400 XP" },
      { level: 5, target: 800, name: "Variation Legend", badge: "🌌", reward: "800 XP" },
    ],
  },
};

// ============================================================================
// ACHIEVEMENT CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get current level for an achievement based on progress
 */
export const getAchievementLevel = (achievement, currentValue) => {
  if (!achievement || !achievement.levels || achievement.levels.length === 0) {
    return null;
  }

  // Find the highest level the user has reached
  let currentLevel = null;
  for (let i = achievement.levels.length - 1; i >= 0; i--) {
    const level = achievement.levels[i];
    if (currentValue >= level.target) {
      currentLevel = level;
      break;
    }
  }

  // If no level reached, return first level as next target
  if (!currentLevel) {
    return {
      current: null,
      next: achievement.levels[0],
      progress: currentValue,
      target: achievement.levels[0].target,
      progressPercent: Math.min(100, (currentValue / achievement.levels[0].target) * 100),
    };
  }

  // Find next level
  const currentLevelIndex = achievement.levels.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentLevelIndex < achievement.levels.length - 1 
    ? achievement.levels[currentLevelIndex + 1]
    : null;

  if (nextLevel) {
    // Calculate progress to next level
    const progress = currentValue - currentLevel.target;
    const progressNeeded = nextLevel.target - currentLevel.target;
    const progressPercent = Math.min(100, Math.max(0, (progress / progressNeeded) * 100));

    return {
      current: currentLevel,
      next: nextLevel,
      progress: currentValue,
      target: nextLevel.target,
      progressPercent,
      remaining: nextLevel.target - currentValue,
    };
  } else {
    // Max level reached
    return {
      current: currentLevel,
      next: null,
      progress: currentValue,
      target: currentLevel.target,
      progressPercent: 100,
      remaining: 0,
    };
  }
};

/**
 * Calculate all achievements progress from user data (frontend only, no database storage)
 * @param {Object} userStats - User statistics
 * @returns {Object} Achievements with level info
 */
export const calculateAchievements = (userStats) => {
  const {
    tasksCount = 0,
    deliverablesCount = 0,
    totalHours = 0,
    shutterstockCount = 0,
    aiCount = 0,
    variationsCount = 0,
  } = userStats;

  const achievements = {};

  // Calculate each achievement
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    let currentValue = 0;

    switch (achievement.id) {
      case ACHIEVEMENT_TYPES.COMPLETE_TASKS:
        currentValue = tasksCount;
        break;
      case ACHIEVEMENT_TYPES.COMPLETE_DELIVERABLES:
        currentValue = deliverablesCount;
        break;
      case ACHIEVEMENT_TYPES.TOTAL_HOURS:
        currentValue = totalHours;
        break;
      case ACHIEVEMENT_TYPES.USE_SHUTTERSTOCK:
        currentValue = shutterstockCount;
        break;
      case ACHIEVEMENT_TYPES.USE_AI:
        currentValue = aiCount;
        break;
      case ACHIEVEMENT_TYPES.VARIATIONS:
        currentValue = variationsCount;
        break;
      default:
        currentValue = 0;
    }

    const levelInfo = getAchievementLevel(achievement, currentValue);

    achievements[achievement.id] = {
      ...achievement,
      levelInfo,
      currentValue,
    };
  });

  return {
    achievements,
  };
};

/**
 * Get all achievements as an array
 */
export const getAllAchievements = () => {
  return Object.values(ACHIEVEMENTS);
};
