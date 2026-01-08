/**
 * Experience System Configuration (Legacy Compatibility)
 *
 * This file re-exports from the constants file for backward compatibility
 * New code should import directly from '@/features/experience/constants'
 */

export {
  EXPERIENCE_POINTS,
  EXPERIENCE_LEVELS,
  ACHIEVEMENT_LEVEL_NAMES,
  EXPERIENCE_CONFIG,
  TIME_LEVELS,
  calculateLevel,
  getNextLevel,
  calculateProgress,
  getPointsToNextLevel,
  getCurrentTimeLevel,
  getNextTimeLevel,
  calculateTimeLevelProgress,
} from './constants';

