/**
 * Experience API
 * Stores points and level in Firestore
 */

import { doc, updateDoc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { calculateLevel } from "./experienceConfig";

/**
 * Initialize experience data for a new user
 */
export const initializeUserExperience = () => {
  const initialLevel = calculateLevel(0);
  return {
    points: 0,
    level: initialLevel.level,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Get user experience from Firestore
 */
export const getUserExperience = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return userData.experience || null;
  } catch (error) {
    logger.error("Error fetching user experience:", error);
    return null;
  }
};

/**
 * Update user experience in Firestore
 * Stores: points, level, lastUpdated
 */
export const updateUserExperience = async (userId, experienceData) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userRef = doc(db, "users", userId);
    const points = experienceData.points || 0;
    const currentLevel = calculateLevel(points);

    const experienceUpdate = {
      experience: {
        points: points,
        level: currentLevel.level,
        lastUpdated: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    };

    // Check if user document exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }

    // Check if experience exists, if not initialize it
    const currentExperience = await getUserExperience(userId);
    if (!currentExperience) {
      // Initialize experience with current data
      await setDoc(userRef, {
        experience: {
          points: points,
          level: currentLevel.level,
          lastUpdated: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      await updateDoc(userRef, experienceUpdate);
    }

    logger.log("User experience updated successfully:", userId);
    return {
      success: true,
      experience: {
        points: points,
        level: currentLevel.level,
      },
    };
  } catch (error) {
    logger.error("Error updating user experience:", error);
    throw error;
  }
};

/**
 * Recalculate experience from tasks and store in Firestore
 */
export const recalculateExperienceFromTasks = async (
  userId,
  allTasks = [],
  deliverablesOptions = [],
  userUID = null
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { calculateCompleteExperienceFromTasks } = await import(
      "./experienceCalculator"
    );

    const calculatedExperience = calculateCompleteExperienceFromTasks(
      allTasks,
      deliverablesOptions,
      userUID
    );

    const points = calculatedExperience.points || 0;
    const level = calculateLevel(points);

    await updateUserExperience(userId, {
      points: points,
      level: level.level,
    });

    logger.log(
      `Recalculated experience for user ${userId} from tasks:`,
      { points, level: level.level }
    );

    return {
      success: true,
      experience: {
        points: points,
        level: level.level,
      },
    };
  } catch (error) {
    logger.error("Error recalculating experience:", error);
    throw error;
  }
};

/**
 * Add experience points - kept for backward compatibility
 * Returns level change information for detecting level ups/downgrades
 */
export const addExperiencePoints = async (userId, pointsToAdd) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const currentExperience = await getUserExperience(userId);
    const experience = currentExperience || initializeUserExperience();
    const oldPoints = experience.points || 0;
    const oldLevel = calculateLevel(oldPoints);
    const newPoints = Math.max(0, oldPoints + pointsToAdd); // Prevent negative points
    const newLevel = calculateLevel(newPoints);

    await updateUserExperience(userId, {
      points: newPoints,
    });

    return {
      success: true,
      pointsAdded: pointsToAdd,
      oldPoints,
      newPoints,
      oldLevel: oldLevel.level,
      newLevel: newLevel.level,
      levelUp: newLevel.level > oldLevel.level,
      levelDown: newLevel.level < oldLevel.level,
      experience: {
        points: newPoints,
        level: newLevel.level,
      },
    };
  } catch (error) {
    logger.error("Error adding experience points:", error);
    throw error;
  }
};
