/**
 * Level Progress Bar Component
 * 
 * Compact progress bar for header display
 */

import { calculateLevel, calculateProgress, getPointsToNextLevel } from '../experienceConfig';

const LevelProgressBar = ({ experience, compact = false }) => {
  if (!experience || experience.points === undefined) {
    return null;
  }

  const points = experience.points || 0;
  const currentLevel = calculateLevel(points);
  const progress = calculateProgress(points, currentLevel);
  const pointsToNext = getPointsToNextLevel(points, currentLevel);

  if (compact) {
    // Ultra-compact version for header
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Badge */}
        <span className="text-lg" title={`Level ${currentLevel.level}: ${currentLevel.name}`}>
          {currentLevel.badge}
        </span>
        
        {/* Progress Bar */}
        <div className="flex-1 min-w-[120px] max-w-[200px]">
          <div className="flex items-center gap-2 mb-0.5">
            <span 
              className="text-xs font-semibold"
              style={{ color: currentLevel.color }}
            >
              Lv.{currentLevel.level}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: currentLevel.color
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
            <span>{points} XP</span>
            {pointsToNext > 0 && (
              <span>{pointsToNext} to next</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard compact version
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Badge and Level */}
      <div className="flex items-center gap-2">
        <span className="text-2xl" title={`Level ${currentLevel.level}: ${currentLevel.name}`}>
          {currentLevel.badge}
        </span>
        <div className="flex flex-col">
          <span 
            className="text-xs font-bold"
            style={{ color: currentLevel.color }}
          >
            {currentLevel.name}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            Level {currentLevel.level}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="flex-1 min-w-[150px] max-w-[250px]">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>{points} XP</span>
          {pointsToNext > 0 && (
            <span>{pointsToNext} to next level</span>
          )}
          {pointsToNext === 0 && (
            <span className="text-yellow-500">Max Level! 🎉</span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: currentLevel.color
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LevelProgressBar;

