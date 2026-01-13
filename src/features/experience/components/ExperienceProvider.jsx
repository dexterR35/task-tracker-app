/**
 * Experience Provider Component
 * 
 * Provides level up modal for experience system
 */

import { useState, createContext, useContext, useEffect, useMemo } from 'react';
import AchievementModal from './AchievementModal';
import { useAppDataContext } from '@/context/AppDataContext';
import { getUserUID } from '@/features/utils/authUtils';
import { calculateCompleteExperienceFromTasks } from '../experienceCalculator';
import { updateUserExperience } from '../experienceApi';
import { useAllUserTasks } from '@/features/tasks/tasksApi';
import {
  calculateLevel,
} from '../experienceConfig';

const ExperienceContext = createContext(null);

export const useExperience = () => {
  const context = useContext(ExperienceContext);
  if (!context) {
    return {};
  }
  return context;
};

export const ExperienceProvider = ({ children }) => {
  const appData = useAppDataContext();
  const userData = appData?.user || null;
  const deliverablesData = appData?.deliverables || [];
  
  const userUID = getUserUID(userData);
  const userId = userData?.id;
  
  // Transform deliverables to options format for calculation
  const deliverablesOptions = useMemo(() => {
    return (deliverablesData || []).map(d => ({
      value: d.name,
      label: d.name,
      timePerUnit: d.timePerUnit,
      timeUnit: d.timeUnit,
      requiresQuantity: d.requiresQuantity,
      variationsTime: d.variationsTime,
      variationsTimeUnit: d.variationsTimeUnit || 'min',
      declinariTime: d.declinariTime
    }));
  }, [deliverablesData]);

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimableAchievement, setClaimableAchievement] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isLevelDown, setIsLevelDown] = useState(false);

  // Get all user tasks for experience calculation
  const { tasks: allTasks = [], isLoading: tasksLoading } = useAllUserTasks(userUID);

  // Calculate experience from all tasks
  const calculatedExperience = useMemo(() => {
    if (tasksLoading || !allTasks || allTasks.length === 0 || !userData) {
      return null;
    }

    const calculated = calculateCompleteExperienceFromTasks(
      allTasks,
      deliverablesOptions,
      userUID
    );

    const level = calculateLevel(calculated.points);

    return {
      ...calculated,
      level: level.level,
      levelName: level.name,
    };
  }, [allTasks, deliverablesOptions, tasksLoading, userUID, userData]);

  // Check for level changes and show modal (don't auto-update - wait for claim)
  useEffect(() => {
    if (!userId || tasksLoading || !calculatedExperience || !userData) return;

    const storedExperience = userData?.experience;
    const currentPoints = calculatedExperience.points || 0;
    const currentLevel = calculatedExperience.level || 1;
    const storedLevel = storedExperience?.level || 1;

    // Check for level up (level increased) - show modal but don't store yet
    if (currentLevel > storedLevel) {
      const level = calculateLevel(currentPoints);
      setClaimableAchievement({
        type: "levelUp",
        newLevel: currentLevel,
        levelName: level.name,
        badge: level.badge,
        color: level.color,
        points: currentPoints,
      });
      setShowClaimModal(true);
    }
    // Check for level downgrade (level decreased) - show modal and auto-update
    else if (currentLevel < storedLevel) {
      const level = calculateLevel(currentPoints);
      const oldLevel = calculateLevel(storedExperience?.points || 0);
      setIsLevelDown(true);
      setClaimableAchievement({
        type: "levelDown",
        oldLevel: storedLevel,
        newLevel: currentLevel,
        levelName: level.name,
        oldLevelName: oldLevel.name,
        badge: level.badge,
        color: level.color,
        points: currentPoints - (storedExperience?.points || 0), // Negative points
      });
      setShowClaimModal(true);
      // Auto-update experience for level downgrades (no claim needed)
      updateUserExperience(userId, {
        points: currentPoints,
        level: currentLevel,
      }).catch(error => {
        console.error('Error updating experience for level downgrade:', error);
      });
    }
  }, [userId, userData?.experience, calculatedExperience, tasksLoading]);

  // Handle claim button click - store points and level in Firestore
  const handleClaimExperience = async () => {
    if (!userId || isClaiming || !claimableAchievement || !calculatedExperience) return;

    setIsClaiming(true);
    try {
      // Update experience in Firestore
      await updateUserExperience(userId, {
        points: calculatedExperience.points,
        level: calculatedExperience.level,
      });

      setShowClaimModal(false);
      setClaimableAchievement(null);
      setIsLevelDown(false);
    } catch (error) {
      console.error('Error claiming experience:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle close for level downgrade (no claim needed, just close)
  const handleCloseLevelDown = () => {
    setShowClaimModal(false);
    setClaimableAchievement(null);
    setIsLevelDown(false);
  };

  const value = {};

  return (
    <ExperienceContext.Provider value={value}>
      {children}
      {/* Level Up/Down Modal - shows when level changes */}
      <AchievementModal
        achievement={claimableAchievement}
        isOpen={showClaimModal}
        onClose={isLevelDown ? handleCloseLevelDown : () => {}} // Level down can be closed, level up requires claim
        onClaim={handleClaimExperience}
        showClaimButton={!isLevelDown} // Only show claim button for level ups
      />
    </ExperienceContext.Provider>
  );
};
