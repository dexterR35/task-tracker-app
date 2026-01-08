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

  // Check for new level reached and show modal (don't auto-update - wait for claim)
  useEffect(() => {
    if (!userId || tasksLoading || !calculatedExperience || !userData) return;

    const storedExperience = userData?.experience;
    const currentPoints = calculatedExperience.points || 0;
    const currentLevel = calculatedExperience.level || 1;
    const storedLevel = storedExperience?.level || 1;

    // Check for new level reached (level increased) - show modal but don't store yet
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
    } catch (error) {
      console.error('Error claiming experience:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const value = {};

  return (
    <ExperienceContext.Provider value={value}>
      {children}
      {/* Level Up Claim Modal - shows when level increases */}
      <AchievementModal
        achievement={claimableAchievement}
        isOpen={showClaimModal}
        onClose={() => {}} // Disabled - modal can only be closed by claiming
        onClaim={handleClaimExperience}
        showClaimButton={true}
      />
    </ExperienceContext.Provider>
  );
};
