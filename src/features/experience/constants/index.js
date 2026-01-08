/**
 * Experience System Constants
 *
 * Time calculation and level progress configuration
 */

// ============================================================================
// EXPERIENCE POINTS CONFIGURATION
// ============================================================================

export const EXPERIENCE_POINTS = {
  TASK_ADDED: 1000,
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
// STANDARDIZED ACHIEVEMENT LEVEL NAMES
// ============================================================================

/**
 * Standardized level names used for time levels
 */
export const ACHIEVEMENT_LEVEL_NAMES = [
  "Novice",      // Level 1
  "Enthusiast",  // Level 2
  "Expert",      // Level 3
  "Master",      // Level 4
  "Grandmaster", // Level 5
];

// ============================================================================
// EXPERIENCE LEVELS CONFIGURATION
// ============================================================================

export const EXPERIENCE_LEVELS = [
  { level: 1, minPoints: 0, maxPoints: 200, name: "Noob", color: "#94a3b8", badge: "🥉" },
  { level: 2, minPoints: 200, maxPoints: 500, name: "Slacker", color: "#60a5fa", badge: "🥈" },
  { level: 3, minPoints: 500, maxPoints: 1000, name: "Procrastinator", color: "#34d399", badge: "⭐" },
  { level: 4, minPoints: 1000, maxPoints: 2000, name: "Task Dodger", color: "#a78bfa", badge: "💎" },
  { level: 5, minPoints: 2000, maxPoints: 3500, name: "Coffee Addict", color: "#f59e0b", badge: "🔥" },
  { level: 6, minPoints: 3500, maxPoints: 5500, name: "Copy-Paste Master", color: "#ef4444", badge: "👑" },
  { level: 7, minPoints: 5500, maxPoints: 8000, name: "Ctrl+C Champion", color: "#ec4899", badge: "⚡" },
  { level: 8, minPoints: 8000, maxPoints: 12000, name: "Tab Hoarder", color: "#8b5cf6", badge: "🌟" },
  { level: 9, minPoints: 12000, maxPoints: 18000, name: "Notification Slave", color: "#06b6d4", badge: "💫" },
  { level: 10, minPoints: 18000, maxPoints: 25000, name: "Actually Trying", color: "#fbbf24", badge: "✨" },
  { level: 11, minPoints: 25000, maxPoints: 35000, name: "Not Bad", color: "#10b981", badge: "🎯" },
  { level: 12, minPoints: 35000, maxPoints: 50000, name: "Pretty Good", color: "#3b82f6", badge: "🏆" },
  { level: 13, minPoints: 50000, maxPoints: 70000, name: "Wait, You're Good?", color: "#8b5cf6", badge: "💎" },
  { level: 14, minPoints: 70000, maxPoints: 100000, name: "Okay, Respect", color: "#f59e0b", badge: "🔥" },
  { level: 15, minPoints: 100000, maxPoints: 150000, name: "Actually Impressive", color: "#ef4444", badge: "👑" },
  { level: 16, minPoints: 150000, maxPoints: 220000, name: "Legendary", color: "#ec4899", badge: "⚡" },
  { level: 17, minPoints: 220000, maxPoints: 320000, name: "Unstoppable", color: "#8b5cf6", badge: "🌟" },
  { level: 18, minPoints: 320000, maxPoints: 450000, name: "God Mode", color: "#06b6d4", badge: "💫" },
  { level: 19, minPoints: 450000, maxPoints: 650000, name: "Task Destroyer", color: "#fbbf24", badge: "✨" },
  { level: 20, minPoints: 650000, maxPoints: Infinity, name: "Transcendent Overlord", color: "#ff006e", badge: "🌌" },
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
// TIME LEVELS CONFIGURATION
// ============================================================================

/**
 * Time-based level progression (similar to experience levels but for hours)
 */
export const TIME_LEVELS = [
  { level: 1, minHours: 0, maxHours: 50, name: ACHIEVEMENT_LEVEL_NAMES[0], icon: "⏰", points: 30 },
  { level: 2, minHours: 50, maxHours: 200, name: ACHIEVEMENT_LEVEL_NAMES[1], icon: "🕐", points: 150 },
  { level: 3, minHours: 200, maxHours: 500, name: ACHIEVEMENT_LEVEL_NAMES[2], icon: "⏳", points: 300 },
  { level: 4, minHours: 500, maxHours: 1000, name: ACHIEVEMENT_LEVEL_NAMES[3], icon: "🕰️", points: 600 },
  { level: 5, minHours: 1000, maxHours: Infinity, name: ACHIEVEMENT_LEVEL_NAMES[4], icon: "⚡", points: 1000 },
];


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

export const EXPERIENCE_CONFIG = {
  POINTS: EXPERIENCE_POINTS,
  LEVELS: EXPERIENCE_LEVELS,
  TIME_LEVELS: TIME_LEVELS,
};
