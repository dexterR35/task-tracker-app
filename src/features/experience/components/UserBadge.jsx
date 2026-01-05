/**
 * User Badge Component
 * 
 * Displays user's current level, badge, and experience progress
 */

import { calculateLevel, calculateProgress, getPointsToNextLevel } from '../experienceConfig';

const UserBadge = ({ experience, showProgress = true, size = 'medium' }) => {
  if (!experience) {
    return null;
  }

  const points = experience.points || 0;
  const currentLevel = calculateLevel(points);
  const progress = calculateProgress(points, currentLevel);
  const pointsToNext = getPointsToNextLevel(points, currentLevel);
  
  // Use stored badge from database if available, otherwise calculate from level
  const badge = experience.badge || currentLevel.badge;
  const levelColor = experience.color || currentLevel.color;

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const badgeSizeClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl'
  };

  return (
    <div className={`flex flex-col items-center ${sizeClasses[size]}`}>
      {/* Badge Icon */}
      <div 
        className={`${badgeSizeClasses[size]} mb-2`}
        title={`Level ${currentLevel.level}: ${currentLevel.name}`}
      >
        {badge}
      </div>

      {/* Level Info */}
      <div className="text-center">
        <div 
          className="font-bold px-3 py-1 rounded-full text-white inline-block mb-1"
          style={{ backgroundColor: levelColor }}
        >
          {currentLevel.name}
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
          Level {currentLevel.level}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full max-w-xs mt-3">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>{points} XP</span>
            {pointsToNext > 0 && (
              <span>{pointsToNext} to next level</span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: levelColor
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBadge;

