/**
 * Experience Tracking Hook
 *
 * Manages experience points calculation and updates when tasks are created/updated
 */

import { useState, useCallback } from 'react';
import { calculateTaskPoints, calculateBonusAchievements, calculateCompleteExperienceFromTasks } from '../experienceCalculator';
import { addExperiencePoints, getUserExperience } from '../experienceApi';
import { calculateLevel } from '../experienceConfig';
import { logger } from '@/utils/logger';

/**
 * Hook to track experience when tasks are created or updated
 */
export const useExperienceTracking = () => {
  const [achievement, setAchievement] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);

  /**
   * Track experience from a new task
   */
  const trackTaskCreation = useCallback(async (task, userId, allUserTasks = []) => {
    try {
      if (!userId || !task) {
        return;
      }

      // Calculate points from this task
      const taskPoints = calculateTaskPoints(task);

      // Get current experience
      const currentExperience = await getUserExperience(userId);

      // Calculate bonus achievements from all tasks (including the new one)
      const allTasks = [...allUserTasks, task];
      const bonuses = calculateBonusAchievements(allTasks, currentExperience);

      // Calculate total experience summary (use complete function for consistency)
      // Note: allTasks should already be filtered by userUID, but we don't have userUID here
      // so we rely on the tasks being pre-filtered
      // const _experienceSummary = calculateCompleteExperienceFromTasks(allTasks, [], null);

      // Add points and update experience
      const result = await addExperiencePoints(userId, taskPoints);

      // Check for level up
      if (result.levelUp) {
        const newLevel = calculateLevel(result.experience.points);
        setAchievement({
          type: 'levelUp',
          newLevel: result.newLevel,
          levelName: newLevel.name,
          badge: newLevel.badge,
          color: newLevel.color,
          points: taskPoints
        });
        setShowAchievement(true);
      }

      // Check for bonus achievements
      if (bonuses.length > 0) {
        bonuses.forEach(bonus => {
          setTimeout(() => {
            setAchievement({
              type: 'bonus',
              ...bonus
            });
            setShowAchievement(true);
          }, result.levelUp ? 2000 : 0); // Delay if level up just happened
        });
      }

      return result;
    } catch (error) {
      logger.error('Error tracking task creation experience:', error);
      // Don't throw - experience tracking shouldn't break task creation
    }
  }, []);

  /**
   * Track experience from task deletion
   * Subtracts XP points that were earned from the deleted task
   */
  const trackTaskDeletion = useCallback(async (task, userId) => {
    try {
      if (!userId || !task) {
        return;
      }

      // Calculate points that were earned from this task
      const taskPoints = calculateTaskPoints(task);

      // Subtract points (pass negative value to addExperiencePoints)
      if (taskPoints > 0) {
        const result = await addExperiencePoints(userId, -taskPoints);
        logger.log(`Subtracted ${taskPoints} XP points for deleted task: ${task.id}`);

        // Check for level downgrade
        if (result.levelDown) {
          const newLevel = calculateLevel(result.newPoints);
          const oldLevel = calculateLevel(result.oldPoints);
          setAchievement({
            type: 'levelDown',
            oldLevel: result.oldLevel,
            newLevel: result.newLevel,
            levelName: newLevel.name,
            oldLevelName: oldLevel.name,
            badge: newLevel.badge,
            color: newLevel.color,
            points: -taskPoints, // Negative points to show deduction
          });
          setShowAchievement(true);
        }
      }

      return { success: true, pointsSubtracted: taskPoints };
    } catch (error) {
      logger.error('Error tracking task deletion experience:', error);
      // Don't throw - experience tracking shouldn't break task deletion
    }
  }, []);

  /**
   * Track experience from task update
   * Note: We only add points for newly added features (e.g., newly added deliverable)
   */
  const trackTaskUpdate = useCallback(async (updatedTask, oldTask, userId, allUserTasks = []) => {
    try {
      if (!userId || !updatedTask || !oldTask) {
        return;
      }

      // Calculate points difference
      const oldPoints = calculateTaskPoints(oldTask);
      const newPoints = calculateTaskPoints(updatedTask);
      const pointsDifference = newPoints - oldPoints;

      // Only update if points increased
      if (pointsDifference > 0) {
        // Get current experience
        const currentExperience = await getUserExperience(userId);

        // Recalculate bonus achievements
        const bonuses = calculateBonusAchievements(allUserTasks, currentExperience);

        // Calculate total experience summary (use complete function for consistency)
        // const _experienceSummary = calculateCompleteExperienceFromTasks(allUserTasks, [], null);

        // Add difference in points
        const result = await addExperiencePoints(userId, pointsDifference);

        // Check for level up
        if (result.levelUp) {
          const newLevel = calculateLevel(result.experience.points);
          setAchievement({
            type: 'levelUp',
            newLevel: result.newLevel,
            levelName: newLevel.name,
            badge: newLevel.badge,
            color: newLevel.color,
            points: pointsDifference
          });
          setShowAchievement(true);
        }

        // Check for bonus achievements
        if (bonuses.length > 0) {
          bonuses.forEach(bonus => {
            setTimeout(() => {
              setAchievement({
                type: 'bonus',
                ...bonus
              });
              setShowAchievement(true);
            }, result.levelUp ? 2000 : 0);
          });
        }

        return result;
      }
    } catch (error) {
      logger.error('Error tracking task update experience:', error);
      // Don't throw - experience tracking shouldn't break task update
    }
  }, []);

  /**
   * Recalculate experience from all tasks (useful for migration or fixing)
   */
  const recalculateExperience = useCallback(async (userId, allUserTasks) => {
    try {
      if (!userId || !allUserTasks) {
        return;
      }

      const experienceSummary = calculateCompleteExperienceFromTasks(allUserTasks, [], null);
      const bonuses = calculateBonusAchievements(allUserTasks, null);

      // Update experience with total points
      const result = await addExperiencePoints(userId, 0, {
        shutterstockCount: experienceSummary.shutterstockCount,
        aiCount: experienceSummary.aiCount,
        taskCount: experienceSummary.taskCount,
        unlockedAchievements: bonuses.map(b => b.name)
      });

      // Set points directly (overwrite)
      const { updateUserExperience } = await import('../experienceApi');
      await updateUserExperience(userId, {
        ...result.experience,
        points: experienceSummary.totalPoints
      });

      return result;
    } catch (error) {
      logger.error('Error recalculating experience:', error);
      throw error;
    }
  }, []);

  const closeAchievement = useCallback(() => {
    setShowAchievement(false);
    setAchievement(null);
  }, []);

  return {
    trackTaskCreation,
    trackTaskUpdate,
    trackTaskDeletion,
    recalculateExperience,
    achievement,
    showAchievement,
    closeAchievement
  };
};

