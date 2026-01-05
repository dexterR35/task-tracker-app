/**
 * Experience API
 * 
 * Handles experience data updates in Firestore
 */

import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { logger } from '@/utils/logger';
import { calculateLevel } from './experienceConfig';

/**
 * Initialize experience data for a new user
 * Only stores: points, level, lastUpdated
 * Everything else is calculated on frontend from tasks across all years/months
 */
export const initializeUserExperience = () => {
  const initialLevel = calculateLevel(0);
  return {
    points: 0,
    level: initialLevel.level,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Update user experience in Firestore
 * Stores: points, level, unlockedAchievements, lastUpdated
 * Everything else is calculated on frontend from tasks across all years/months
 * @param {string} userId - User document ID
 * @param {Object} experienceData - Experience data to update (points, level, unlockedAchievements)
 * @returns {Promise<Object>} - Updated experience data
 */
export const updateUserExperience = async (userId, experienceData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    
    // Calculate current level based on points if not provided
    const points = experienceData.points || 0;
    const currentLevel = experienceData.level !== undefined 
      ? { level: experienceData.level, name: experienceData.levelName?.[0] || calculateLevel(points).name }
      : calculateLevel(points);
    
    // Get current experience to merge unlockedAchievements
    const currentExperience = await getUserExperience(userId);
    const existingAchievements = currentExperience?.unlockedAchievements || [];
    
    // Merge new achievements if provided
    let updatedAchievements = existingAchievements;
    if (experienceData.unlockedAchievements) {
      if (Array.isArray(experienceData.unlockedAchievements)) {
        // If array provided, merge with existing (avoid duplicates)
        updatedAchievements = [...new Set([...existingAchievements, ...experienceData.unlockedAchievements])];
      } else if (typeof experienceData.unlockedAchievements === 'string') {
        // If single achievement name provided, add it
        if (!existingAchievements.includes(experienceData.unlockedAchievements)) {
          updatedAchievements = [...existingAchievements, experienceData.unlockedAchievements];
        }
      }
    }
    
    // Store: points, level, unlockedAchievements, lastUpdated
    // All other data (counts, hours) calculated on frontend from tasks
    const experienceUpdate = {
      experience: {
        points: points,
        level: currentLevel.level,
        unlockedAchievements: updatedAchievements,
        lastUpdated: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, experienceUpdate);

    logger.log('User experience updated successfully:', userId);
    return {
      success: true,
      experience: {
        points: points,
        level: currentLevel.level,
        unlockedAchievements: updatedAchievements
      }
    };
  } catch (error) {
    logger.error('Error updating user experience:', error);
    throw error;
  }
};

/**
 * Get user experience from Firestore
 * @param {string} userId - User document ID
 * @returns {Promise<Object|null>} - User experience data or null
 */
export const getUserExperience = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return userData.experience || null;
  } catch (error) {
    logger.error('Error fetching user experience:', error);
    return null;
  }
};

/**
 * Add points to user experience
 * Only stores: points, level, lastUpdated
 * Everything else is calculated on frontend from tasks across all years/months
 * @param {string} userId - User document ID
 * @param {number} pointsToAdd - Points to add
 * @param {Object} additionalData - Not used (kept for backward compatibility)
 * @returns {Promise<Object>} - Updated experience and level up info
 */
export const addExperiencePoints = async (userId, pointsToAdd, additionalData = {}) => {
  try {
    if (!userId) {
      throw new Error('User ID is required for adding experience points');
    }

    logger.log(`Adding ${pointsToAdd} points to user ${userId}`);
    
    const currentExperience = await getUserExperience(userId);
    
    // Initialize if doesn't exist
    const experience = currentExperience || initializeUserExperience();
    
    // Get old level from current experience or calculate from points
    const oldPoints = experience.points || 0;
    const oldLevel = calculateLevel(oldPoints);
    const newPoints = oldPoints + pointsToAdd;
    const newLevel = calculateLevel(newPoints);
    
    // Store only: points, level, lastUpdated
    const updatedExperience = {
      points: newPoints,
      level: newLevel.level
    };

    logger.log(`Updating experience for user ${userId}:`, updatedExperience);
    await updateUserExperience(userId, updatedExperience);

    // Check if level up occurred
    const levelUp = newLevel.level > oldLevel.level;

    return {
      success: true,
      experience: updatedExperience,
      levelUp,
      oldLevel: oldLevel.level,
      newLevel: newLevel.level,
      pointsAdded: pointsToAdd
    };
  } catch (error) {
    logger.error('Error adding experience points:', error);
    throw error;
  }
};

/**
 * Recalculate experience from all tasks across all years/months
 * Only stores: points, level, lastUpdated
 * Everything else is calculated on frontend
 * @param {string} userId - User document ID
 * @param {Array} allTasks - Array of all user tasks across all years/months
 * @param {Array} deliverablesOptions - Optional deliverables options for accurate time calculations
 * @returns {Promise<Object>} - Updated experience data (only points and level stored)
 */
export const recalculateExperienceFromTasks = async (userId, allTasks = [], deliverablesOptions = []) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    logger.log(`Recalculating experience for user ${userId} from ${allTasks.length} tasks across all years/months`);

    const { calculateCompleteExperienceFromTasks } = await import('./experienceCalculator');
    
    // Calculate ALL experience metrics from tasks (single source of truth)
    const calculatedExperience = calculateCompleteExperienceFromTasks(allTasks, deliverablesOptions);
    
    // Store only: points, level, lastUpdated
    // All other metrics (counts, hours, achievements) are calculated on frontend
    const points = calculatedExperience.points || 0;
    const level = calculateLevel(points);

    const updatedExperience = {
      points: points,
      level: level.level
    };

    logger.log(`Recalculated experience for user ${userId} from tasks:`, updatedExperience);

    await updateUserExperience(userId, updatedExperience);

    return {
      success: true,
      experience: {
        points: points,
        level: level.level,
        // Return calculated values for reference (not stored in DB)
        calculated: calculatedExperience
      }
    };
  } catch (error) {
    logger.error('Error recalculating experience:', error);
    throw error;
  }
};

