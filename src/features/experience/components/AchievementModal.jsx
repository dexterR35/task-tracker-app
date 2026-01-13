/**
 * Achievement Modal Component
 *
 * Displays achievement notifications for level ups and bonuses
 * Supports claim button to update experience in database
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import Badge from "@/components/ui/Badge/Badge";
import DynamicButton from "@/components/ui/Button/DynamicButton";

const AchievementModal = ({
  achievement,
  onClose,
  isOpen,
  onClaim,
  showClaimButton = false,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);

  if (!isOpen || !achievement) return null;

  const isLevelUp = achievement.type === "levelUp";
  const isLevelDown = achievement.type === "levelDown";
  const isBonus = achievement.type === "bonus";

  const handleClaim = async () => {
    if (!onClaim) return;

    setIsClaiming(true);
    try {
      await onClaim();
      onClose();
    } catch (error) {
      console.error("Error claiming achievement:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn"
      onClick={(e) => {
        // Prevent closing by clicking outside
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        // Prevent closing with Escape key
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div 
        className="card p-8 max-w-md w-full mx-4 transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
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
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Dark overlay effect for level downgrade */}
        {isLevelDown && (
          <div className="absolute inset-0 pointer-events-none bg-gray-900 bg-opacity-20 rounded-lg" />
        )}

        {/* Achievement Icon/Emoji */}
        <div className="text-center mb-4">
          <div className={`text-8xl mb-4 ${isLevelDown ? 'animate-pulse' : 'animate-bounce'}`}>
            {isLevelUp || isLevelDown ? achievement.badge : achievement.icon || "🏆"}
          </div>
        </div>

        {/* Achievement Title - Achievement Name */}
        <h2 className="text-3xl font-bold text-center mb-2">
          {isLevelUp
            ? `Level ${achievement.newLevel} - ${achievement.levelName}`
            : isLevelDown
            ? `Level ${achievement.newLevel} - ${achievement.levelName}`
            : achievement.name || "Achievement"}
        </h2>

        {/* Subtitle - Unlocked Badge */}
        <div className="text-center mb-2">
          <Badge
            variant={isLevelDown ? "red" : "green"}
            size="md"
            className="!text-sm"
          >
            {isLevelUp ? "Level Up!" : isLevelDown ? "Level Down!" : "Unlocked"}
          </Badge>
        </div>

        {/* Achievement Description */}
        <p className="text-center text-lg mb-2">
          {isLevelUp
            ? `Congratulations! You've reached ${achievement.levelName}!`
            : isLevelDown
            ? `You've been downgraded from ${achievement.oldLevelName || `Level ${achievement.oldLevel}`} to ${achievement.levelName}.`
            : achievement.description || `You've unlocked: ${achievement.name}`}
        </p>

        {/* Points Earned/Lost */}
        {achievement.points !== undefined && (
          <div className="text-center mb-6">
            <Badge
              variant={achievement.points < 0 ? "red" : "pink"}
              size="md"
              className="!text-lg !font-bold"
            >
              {achievement.points > 0 ? "+" : ""} {achievement.points} Points
            </Badge>
          </div>
        )}

        {/* Action Buttons - Only Claim button, no close button */}
        <div className="flex gap-3">
          {showClaimButton && onClaim ? (
            <DynamicButton
              onClick={handleClaim}
              disabled={isClaiming}
              loading={isClaiming}
              loadingText="Claiming..."
              variant="primary"
              size="md"
              className="w-full"
              iconName="check"
              iconCategory="generic"
              iconPosition="left"
            >
              🎁 Claim Reward
            </DynamicButton>
          ) : (
            <DynamicButton
              onClick={onClose}
              variant="primary"
              size="md"
              className="w-full"
              iconName="check"
              iconCategory="generic"
              iconPosition="left"
            >
              {isLevelUp ? "🚀 Awesome!" : isLevelDown ? "😔 Understood" : "🎉 Great!"}
            </DynamicButton>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AchievementModal;
