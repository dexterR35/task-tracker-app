/**
 * Experience System Configuration (Legacy Compatibility)
 *
 * This file re-exports from the constants file for backward compatibility
 * New code should import directly from '@/features/experience/constants'
 */

export {
  EXPERIENCE_POINTS,
  EXPERIENCE_LEVELS,
  GENERAL_ACHIEVEMENTS,
  DEPARTMENT_ACHIEVEMENTS,
  EXPERIENCE_CONFIG,
  TIME_LEVELS,
  AI_HOURS_LEVELS,
  TASK_LEVELS,
  VIP_LEVELS,
  DELIVERABLE_LEVELS,
  AI_USES_LEVELS,
  SHUTTERSTOCK_LEVELS,
  calculateLevel,
  getNextLevel,
  calculateProgress,
  getPointsToNextLevel,
  getAchievementsForDepartment,
  getAllAchievements,
  getCurrentTimeLevel,
  getNextTimeLevel,
  calculateTimeLevelProgress,
  getCurrentAIHoursLevel,
  getNextAIHoursLevel,
  calculateAIHoursLevelProgress,
  getCurrentTaskLevel,
  getNextTaskLevel,
  calculateTaskLevelProgress,
  getCurrentVIPLevel,
  getNextVIPLevel,
  calculateVIPLevelProgress,
  getCurrentDeliverableLevel,
  getNextDeliverableLevel,
  calculateDeliverableLevelProgress,
  getCurrentAIUsesLevel,
  getNextAIUsesLevel,
  calculateAIUsesLevelProgress,
  getCurrentShutterstockLevel,
  getNextShutterstockLevel,
  calculateShutterstockLevelProgress
} from './constants';

