/**
 * Achievement Modal Component
 * 
 * Displays achievement notifications for level ups and bonuses
 * Supports claim button to update experience in database
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const AchievementModal = ({ achievement, onClose, isOpen, onClaim, showClaimButton = false }) => {
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (isOpen && !showClaimButton) {
      // Auto-close after 5 seconds only if no claim button
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, showClaimButton]);

  if (!isOpen || !achievement) return null;

  const isLevelUp = achievement.type === 'levelUp';
  const isBonus = achievement.type === 'bonus';

  const handleClaim = async () => {
    if (!onClaim) return;
    
    setIsClaiming(true);
    try {
      await onClaim();
      onClose();
    } catch (error) {
      console.error('Error claiming achievement:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-scaleIn">
        {/* Achievement Icon/Emoji */}
        <div className="text-center mb-6">
          <div className="text-8xl mb-4 animate-bounce">
            {isLevelUp ? '🎉' : achievement.icon || '🏆'}
          </div>
          
          {/* Confetti effect for level up */}
          {isLevelUp && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Achievement Title */}
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          {isLevelUp ? 'Level Up!' : 'Achievement Unlocked!'}
        </h2>

        {/* Level Badge for level up */}
        {isLevelUp && (
          <div className="text-center mb-4">
            <div 
              className="inline-block px-6 py-3 rounded-full text-white font-bold text-xl mb-2"
              style={{ backgroundColor: achievement.color }}
            >
              Level {achievement.newLevel} - {achievement.levelName}
            </div>
            <div className="text-4xl mb-2">{achievement.badge}</div>
          </div>
        )}

        {/* Achievement Description */}
        <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-6">
          {isLevelUp 
            ? `Congratulations! You've reached ${achievement.levelName}!`
            : achievement.description || `You've unlocked: ${achievement.name}`
          }
        </p>

        {/* Points Earned */}
        {achievement.points && (
          <div className="text-center mb-6">
            <div className="inline-block bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-lg">
              <span className="text-yellow-800 dark:text-yellow-200 font-semibold">
                +{achievement.points} Points
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {showClaimButton && onClaim ? (
            <>
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isClaiming ? 'Claiming...' : 'Claim 🎁'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Awesome! 🚀
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AchievementModal;

