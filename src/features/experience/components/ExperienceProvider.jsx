/**
 * Experience Provider Component
 * 
 * Provides experience tracking context and achievement modal
 */

import { useState, createContext, useContext } from 'react';
import AchievementModal from './AchievementModal';
import { useAppDataContext } from '@/context/AppDataContext';
import { getUserUID } from '@/features/utils/authUtils';
import { calculateTaskPoints, calculateBonusAchievements } from '../experienceCalculator';
import { addExperiencePoints, getUserExperience } from '../experienceApi';

/**
 * Calculate deliverable and variation time from task data
 */
const calculateDeliverableTime = (task, deliverablesOptions = []) => {
  if (!task.data_task?.deliverablesUsed || !Array.isArray(task.data_task.deliverablesUsed)) {
    return { deliverableHours: 0, variationHours: 0 };
  }

  let deliverableHours = 0;
  let variationHours = 0;

  task.data_task.deliverablesUsed.forEach((deliverable) => {
    const deliverableName = deliverable?.name;
    const quantity = deliverable?.count || 1;
    const variationsQuantity = deliverable?.variationsCount || deliverable?.variationsQuantity || 0;

    if (!deliverableName) return;

    // Find deliverable in options
    const deliverableOption = deliverablesOptions.find(d => 
      d.value && d.value.toLowerCase().trim() === deliverableName.toLowerCase().trim()
    );

    if (deliverableOption) {
      const timePerUnit = deliverableOption.timePerUnit || 1;
      const timeUnit = deliverableOption.timeUnit || 'hr';
      const requiresQuantity = deliverableOption.requiresQuantity || false;
      const variationsTime = (requiresQuantity && deliverableOption.variationsTime) || deliverableOption.declinariTime || 0;
      const variationsTimeUnit = deliverableOption.variationsTimeUnit || deliverableOption.declinariTimeUnit || 'min';

      // Convert deliverable time to hours
      let deliverableTimeInHours = timePerUnit;
      if (timeUnit === 'min') deliverableTimeInHours = timePerUnit / 60;
      deliverableHours += deliverableTimeInHours * quantity;

      // Convert variation time to hours
      if (requiresQuantity && variationsTime > 0 && variationsQuantity > 0) {
        let variationTimeInHours = variationsTime;
        if (variationsTimeUnit === 'min') variationTimeInHours = variationsTime / 60;
        variationHours += variationTimeInHours * variationsQuantity;
      }
    }
  });

  return { deliverableHours, variationHours };
};

const ExperienceContext = createContext(null);

export const useExperience = () => {
  const context = useContext(ExperienceContext);
  if (!context) {
    return {
      trackTaskCreation: async () => {},
      trackTaskUpdate: async () => {},
      achievement: null,
      showAchievement: false,
      closeAchievement: () => {}
    };
  }
  return context;
};

export const ExperienceProvider = ({ children }) => {
  const { user: userData, tasks: currentMonthTasks = [], deliverables: deliverablesData = [] } = useAppDataContext();
  const userUID = getUserUID(userData);
  const userId = userData?.id;
  
  // Transform deliverables to options format for calculation
  const deliverablesOptions = deliverablesData.map(d => ({
    value: d.name,
    label: d.name,
    timePerUnit: d.timePerUnit,
    timeUnit: d.timeUnit,
    requiresQuantity: d.requiresQuantity,
    variationsTime: d.variationsTime,
    variationsTimeUnit: d.variationsTimeUnit || 'min',
    declinariTime: d.declinariTime
  }));

  const [achievement, setAchievement] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState([]);

  /**
   * Track experience from a new task
   */
  const trackTaskCreation = async (task) => {
    if (!userId || !task) {
      console.warn('trackTaskCreation: Missing userId or task', { userId, task: !!task });
      return;
    }

    try {
      console.log('trackTaskCreation: Starting for task', task.id);
      
      // Calculate points from this task
      const { calculateTaskPoints } = await import('../experienceCalculator');
      const taskPoints = calculateTaskPoints(task);
      console.log('trackTaskCreation: Calculated points', taskPoints);
      
      // Get current experience (cumulative - stored in user document)
      // We need to get this even if points are 0, to track hours and other metrics
      const currentExperience = await getUserExperience(userId);
      console.log('trackTaskCreation: Current experience', currentExperience);
      
      // If task has 0 points, we still need to track hours and other metrics
      // but we won't add points or check for achievements
      if (taskPoints === 0) {
        console.log('trackTaskCreation: Task has 0 points, but tracking hours and metrics');
        
        // Still track hours and other metrics even if no points
        const currentTaskHours = currentExperience?.taskHours || 0;
        const currentDeliverableHours = currentExperience?.deliverableHours || 0;
        const currentVariationHours = currentExperience?.variationHours || 0;
        const currentAiHours = currentExperience?.aiHours || 0;
        const currentTotalHours = currentExperience?.totalHours || 0;
        const currentVipCount = currentExperience?.vipCount || 0;
        const currentDeliverableCount = currentExperience?.deliverableCount || 0;
        
        // Calculate all time components
        const taskHoursValue = task.data_task?.timeInHours;
        const addsTaskHours = taskHoursValue !== undefined && taskHoursValue !== null 
          ? (typeof taskHoursValue === 'string' ? parseFloat(taskHoursValue) : Number(taskHoursValue)) || 0
          : 0;
        
        const { deliverableHours: addsDeliverableHours, variationHours: addsVariationHours } = 
          calculateDeliverableTime(task, deliverablesOptions);
        
        const aiTimeValue = task.data_task?.aiUsed?.[0]?.aiTime;
        const addsAiHours = aiTimeValue !== undefined && aiTimeValue !== null
          ? (typeof aiTimeValue === 'string' ? parseFloat(aiTimeValue) : Number(aiTimeValue)) || 0
          : 0;
        
        const addsTotalHours = addsTaskHours + addsDeliverableHours + addsVariationHours + addsAiHours;
        
        const addsVip = task.data_task?.isVip === true ? 1 : 0;
        const addsDeliverable = task.data_task?.deliverablesUsed && Array.isArray(task.data_task.deliverablesUsed) && task.data_task.deliverablesUsed.length > 0 ? 1 : 0;
        
        const newTaskHours = currentTaskHours + addsTaskHours;
        const newDeliverableHours = currentDeliverableHours + addsDeliverableHours;
        const newVariationHours = currentVariationHours + addsVariationHours;
        const newAiHours = currentAiHours + addsAiHours;
        const newTotalHours = currentTotalHours + addsTotalHours;
        const newVipCount = currentVipCount + addsVip;
        const newDeliverableCount = currentDeliverableCount + addsDeliverable;
        
        // Update experience with new metrics (no points added)
        await addExperiencePoints(userId, 0, {
          taskCount: (currentExperience?.taskCount || 0),
          shutterstockCount: (currentExperience?.shutterstockCount || 0),
          aiCount: (currentExperience?.aiCount || 0),
          taskHours: newTaskHours,
          deliverableHours: newDeliverableHours,
          variationHours: newVariationHours,
          aiHours: newAiHours,
          totalHours: newTotalHours,
          vipCount: newVipCount,
          deliverableCount: newDeliverableCount,
          unlockedAchievements: currentExperience?.unlockedAchievements || []
        });
        
        return;
      }
      
      // Calculate new cumulative counts by adding this task's contribution
      const currentShutterstockCount = currentExperience?.shutterstockCount || 0;
      const currentAiCount = currentExperience?.aiCount || 0;
      const currentTaskCount = currentExperience?.taskCount || 0;
      const currentTaskHours = currentExperience?.taskHours || 0;
      const currentDeliverableHours = currentExperience?.deliverableHours || 0;
      const currentVariationHours = currentExperience?.variationHours || 0;
      const currentAiHours = currentExperience?.aiHours || 0;
      const currentTotalHours = currentExperience?.totalHours || 0;
      const currentVipCount = currentExperience?.vipCount || 0;
      const currentDeliverableCount = currentExperience?.deliverableCount || 0;
      
      // Check if this task contributes to counts
      const addsShutterstock = task.data_task?.useShutterstock === true ? 1 : 0;
      const addsAi = task.data_task?.aiUsed && Array.isArray(task.data_task.aiUsed) && 
                     task.data_task.aiUsed.length > 0 &&
                     task.data_task.aiUsed.some(ai => ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0) ? 1 : 0;
      
      // Handle task hours (timeInHours)
      const taskHoursValue = task.data_task?.timeInHours;
      const addsTaskHours = taskHoursValue !== undefined && taskHoursValue !== null 
        ? (typeof taskHoursValue === 'string' ? parseFloat(taskHoursValue) : Number(taskHoursValue)) || 0
        : 0;
      
      // Calculate deliverable and variation hours
      const { deliverableHours: addsDeliverableHours, variationHours: addsVariationHours } = 
        calculateDeliverableTime(task, deliverablesOptions);
      
      // Handle AI hours
      const aiTimeValue = task.data_task?.aiUsed?.[0]?.aiTime;
      const addsAiHours = aiTimeValue !== undefined && aiTimeValue !== null
        ? (typeof aiTimeValue === 'string' ? parseFloat(aiTimeValue) : Number(aiTimeValue)) || 0
        : 0;
      
      // Calculate total hours (sum of all time components)
      const addsTotalHours = addsTaskHours + addsDeliverableHours + addsVariationHours + addsAiHours;
      
      const addsVip = task.data_task?.isVip === true ? 1 : 0;
      const addsDeliverable = task.data_task?.deliverablesUsed && Array.isArray(task.data_task.deliverablesUsed) && task.data_task.deliverablesUsed.length > 0 ? 1 : 0;
      
      const newTaskHours = currentTaskHours + addsTaskHours;
      const newDeliverableHours = currentDeliverableHours + addsDeliverableHours;
      const newVariationHours = currentVariationHours + addsVariationHours;
      const newAiHours = currentAiHours + addsAiHours;
      const newTotalHours = currentTotalHours + addsTotalHours;
      
      console.log('trackTaskCreation: Task hours data', {
        addsTaskHours,
        addsDeliverableHours,
        addsVariationHours,
        addsAiHours,
        addsTotalHours,
        newTotalHours,
        taskData: task.data_task
      });
      
      const newShutterstockCount = currentShutterstockCount + addsShutterstock;
      const newAiCount = currentAiCount + addsAi;
      const newTaskCount = currentTaskCount + 1;
      const newVipCount = currentVipCount + addsVip;
      const newDeliverableCount = currentDeliverableCount + addsDeliverable;
      
      // Calculate bonus achievements using cumulative counts
      // We check if we just crossed a threshold
      const bonuses = [];
      const { EXPERIENCE_CONFIG } = await import('../experienceConfig');
      
      // Helper function to check if achievement threshold was just crossed
      const checkAchievement = (achievement, currentValue, newValue) => {
        if (newValue >= achievement.threshold && currentValue < achievement.threshold) {
          bonuses.push({
            ...achievement,
            points: achievement.points
          });
        }
      };
      
      // Check all general achievements
      Object.values(EXPERIENCE_CONFIG.ACHIEVEMENTS).forEach(achievement => {
        let currentValue, newValue;
        
        switch (achievement.type) {
          case 'taskCount':
            currentValue = currentTaskCount;
            newValue = newTaskCount;
            break;
          case 'shutterstockCount':
            currentValue = currentShutterstockCount;
            newValue = newShutterstockCount;
            break;
          case 'aiCount':
            currentValue = currentAiCount;
            newValue = newAiCount;
            break;
          case 'totalHours':
            currentValue = currentTotalHours;
            newValue = newTotalHours;
            break;
          case 'aiHours':
            currentValue = currentAiHours;
            newValue = newAiHours;
            break;
          case 'vipCount':
            currentValue = currentVipCount;
            newValue = newVipCount;
            break;
          case 'deliverableCount':
            currentValue = currentDeliverableCount;
            newValue = newDeliverableCount;
            break;
          default:
            return; // Skip achievements without type
        }
        
        checkAchievement(achievement, currentValue, newValue);
      });
      
      // Check department-specific achievements
      // Get user's department from userData (occupation field)
      const userDepartment = userData?.occupation?.toLowerCase() || 'design';
      const deptAchievements = EXPERIENCE_CONFIG.DEPARTMENT_ACHIEVEMENTS[userDepartment] || 
                                EXPERIENCE_CONFIG.DEPARTMENT_ACHIEVEMENTS.design;
      
      if (deptAchievements) {
        Object.values(deptAchievements).forEach(achievement => {
          if (newTaskCount >= achievement.threshold &&
              currentTaskCount < achievement.threshold) {
            bonuses.push({
              ...achievement,
              points: achievement.points
            });
          }
        });
      }
      
      // Add bonus points if achievements unlocked
      let totalPointsToAdd = taskPoints;
      bonuses.forEach(bonus => {
        totalPointsToAdd += bonus.points;
      });
      
      // Update unlocked achievements list
      const existingAchievements = currentExperience?.unlockedAchievements || [];
      const newAchievements = bonuses.map(b => b.name).filter(name => !existingAchievements.includes(name));
      const updatedAchievements = [...existingAchievements, ...newAchievements];
      
      // Add points and update experience with cumulative counts
      const { calculateLevel } = await import('../experienceConfig');
      const result = await addExperiencePoints(userId, totalPointsToAdd, {
        shutterstockCount: newShutterstockCount,
        aiCount: newAiCount,
        taskCount: newTaskCount,
        taskHours: newTaskHours,
        deliverableHours: newDeliverableHours,
        variationHours: newVariationHours,
        aiHours: newAiHours,
        totalHours: newTotalHours,
        vipCount: newVipCount,
        deliverableCount: newDeliverableCount,
        unlockedAchievements: updatedAchievements
      });
      
      console.log('trackTaskCreation: Result', result);

      // Also update department experience
      // Extract department from task - prefer task.department (from path), then data_task.departments
      const getTaskDepartment = (task) => {
        // First check if department is already extracted from path
        if (task.department) {
          return task.department;
        }
        // Check data_task.departments array
        if (task.data_task?.departments) {
          const depts = Array.isArray(task.data_task.departments) 
            ? task.data_task.departments 
            : [task.data_task.departments];
          // Map department names to IDs (design, video, developer)
          const deptMap = {
            'design': 'design',
            'video': 'video',
            'developer': 'developer',
            'Video Production': 'video',
            'Design': 'design',
            'Development': 'developer'
          };
          const primaryDept = depts.find(d => deptMap[d?.toLowerCase()] || deptMap[d]);
          return primaryDept ? (deptMap[primaryDept] || deptMap[primaryDept.toLowerCase()] || 'design') : 'design';
        }
        return 'design'; // Default
      };


      // Check for level up (show first)
      if (result.levelUp) {
        const newLevel = calculateLevel(result.experience.points);
        queueAchievement({
          type: 'levelUp',
          newLevel: result.newLevel,
          levelName: newLevel.name,
          badge: newLevel.badge,
          color: newLevel.color,
          points: taskPoints
        });
      }

      // Queue bonus achievements (will show after level up if present, or one by one)
      if (bonuses.length > 0) {
        bonuses.forEach((bonus) => {
          queueAchievement({
            type: 'bonus',
            ...bonus
          });
        });
      }
    } catch (error) {
      console.error('Error tracking task creation experience:', error);
      // Don't throw - experience tracking shouldn't break task creation
    }
  };

  /**
   * Track experience from task update
   */
  const trackTaskUpdate = async (updatedTask, oldTask) => {
    if (!userId || !updatedTask || !oldTask) return;

    try {
      // Calculate points difference
      const { calculateTaskPoints } = await import('../experienceCalculator');
      const oldPoints = calculateTaskPoints(oldTask);
      const newPoints = calculateTaskPoints(updatedTask);
      const pointsDifference = newPoints - oldPoints;

      // Only update if points increased
      if (pointsDifference > 0) {
        // Get current experience (cumulative)
        const currentExperience = await getUserExperience(userId);
        
        // Calculate new counts based on what changed in the task
        const oldShutterstock = oldTask.data_task?.useShutterstock === true ? 1 : 0;
        const newShutterstock = updatedTask.data_task?.useShutterstock === true ? 1 : 0;
        const oldAi = oldTask.data_task?.aiUsed && Array.isArray(oldTask.data_task.aiUsed) && 
                      oldTask.data_task.aiUsed.length > 0 &&
                      oldTask.data_task.aiUsed.some(ai => ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0) ? 1 : 0;
        const newAi = updatedTask.data_task?.aiUsed && Array.isArray(updatedTask.data_task.aiUsed) && 
                      updatedTask.data_task.aiUsed.length > 0 &&
                      updatedTask.data_task.aiUsed.some(ai => ai.aiModels && Array.isArray(ai.aiModels) && ai.aiModels.length > 0) ? 1 : 0;
        
        // Calculate time differences
        const oldTaskHoursValue = oldTask.data_task?.timeInHours;
        const oldTaskHours = oldTaskHoursValue !== undefined && oldTaskHoursValue !== null 
          ? (typeof oldTaskHoursValue === 'string' ? parseFloat(oldTaskHoursValue) : Number(oldTaskHoursValue)) || 0
          : 0;
        
        const newTaskHoursValue = updatedTask.data_task?.timeInHours;
        const newTaskHours = newTaskHoursValue !== undefined && newTaskHoursValue !== null 
          ? (typeof newTaskHoursValue === 'string' ? parseFloat(newTaskHoursValue) : Number(newTaskHoursValue)) || 0
          : 0;
        
        const oldDeliverableTime = calculateDeliverableTime(oldTask, deliverablesOptions);
        const newDeliverableTime = calculateDeliverableTime(updatedTask, deliverablesOptions);
        
        const oldAiHoursValue = oldTask.data_task?.aiUsed?.[0]?.aiTime;
        const oldAiHours = oldAiHoursValue !== undefined && oldAiHoursValue !== null
          ? (typeof oldAiHoursValue === 'string' ? parseFloat(oldAiHoursValue) : Number(oldAiHoursValue)) || 0
          : 0;
        
        const newAiHoursValue = updatedTask.data_task?.aiUsed?.[0]?.aiTime;
        const newAiHours = newAiHoursValue !== undefined && newAiHoursValue !== null
          ? (typeof newAiHoursValue === 'string' ? parseFloat(newAiHoursValue) : Number(newAiHoursValue)) || 0
          : 0;
        
        const oldVip = oldTask.data_task?.isVip === true ? 1 : 0;
        const newVip = updatedTask.data_task?.isVip === true ? 1 : 0;
        const oldDeliverable = oldTask.data_task?.deliverablesUsed && Array.isArray(oldTask.data_task.deliverablesUsed) && oldTask.data_task.deliverablesUsed.length > 0 ? 1 : 0;
        const newDeliverable = updatedTask.data_task?.deliverablesUsed && Array.isArray(updatedTask.data_task.deliverablesUsed) && updatedTask.data_task.deliverablesUsed.length > 0 ? 1 : 0;
        
        const shutterstockDiff = newShutterstock - oldShutterstock;
        const aiDiff = newAi - oldAi;
        const taskHoursDiff = newTaskHours - oldTaskHours;
        const deliverableHoursDiff = newDeliverableTime.deliverableHours - oldDeliverableTime.deliverableHours;
        const variationHoursDiff = newDeliverableTime.variationHours - oldDeliverableTime.variationHours;
        const aiHoursDiff = newAiHours - oldAiHours;
        const totalHoursDiff = taskHoursDiff + deliverableHoursDiff + variationHoursDiff + aiHoursDiff;
        const vipDiff = newVip - oldVip;
        const deliverableDiff = newDeliverable - oldDeliverable;
        
        const currentShutterstockCount = (currentExperience?.shutterstockCount || 0) + shutterstockDiff;
        const currentAiCount = (currentExperience?.aiCount || 0) + aiDiff;
        const currentTaskHours = (currentExperience?.taskHours || 0) + taskHoursDiff;
        const currentDeliverableHours = (currentExperience?.deliverableHours || 0) + deliverableHoursDiff;
        const currentVariationHours = (currentExperience?.variationHours || 0) + variationHoursDiff;
        const currentAiHours = (currentExperience?.aiHours || 0) + aiHoursDiff;
        const currentTotalHours = (currentExperience?.totalHours || 0) + totalHoursDiff;
        const currentVipCount = (currentExperience?.vipCount || 0) + vipDiff;
        const currentDeliverableCount = (currentExperience?.deliverableCount || 0) + deliverableDiff;
        const currentTaskCount = currentExperience?.taskCount || 0; // Task count doesn't change on update
        
        // Add difference in points (bonus achievements handled on creation)
        const { calculateLevel } = await import('../experienceConfig');
        const result = await addExperiencePoints(userId, pointsDifference, {
          shutterstockCount: currentShutterstockCount,
          aiCount: currentAiCount,
          taskCount: currentTaskCount,
          taskHours: currentTaskHours,
          deliverableHours: currentDeliverableHours,
          variationHours: currentVariationHours,
          aiHours: currentAiHours,
          totalHours: currentTotalHours,
          vipCount: currentVipCount,
          deliverableCount: currentDeliverableCount,
          unlockedAchievements: currentExperience?.unlockedAchievements || []
        });

        // Check for level up
        if (result.levelUp) {
          const newLevel = calculateLevel(result.experience.points);
          queueAchievement({
            type: 'levelUp',
            newLevel: result.newLevel,
            levelName: newLevel.name,
            badge: newLevel.badge,
            color: newLevel.color,
            points: pointsDifference
          });
        }
      }
    } catch (error) {
      console.error('Error tracking task update experience:', error);
      // Don't throw - experience tracking shouldn't break task update
    }
  };

  const closeAchievement = () => {
    setShowAchievement(false);
    setAchievement(null);
    
    // Show next achievement in queue after a short delay
    setTimeout(() => {
      setAchievementQueue(prevQueue => {
        if (prevQueue.length > 0) {
          const nextAchievement = prevQueue[0];
          setAchievement(nextAchievement);
          setShowAchievement(true);
          return prevQueue.slice(1); // Remove the first item
        }
        return [];
      });
    }, 300); // Small delay for smooth transition
  };

  // Function to add achievement to queue
  const queueAchievement = (achievementData) => {
    if (showAchievement) {
      // If modal is already showing, add to queue
      setAchievementQueue(prev => [...prev, achievementData]);
    } else {
      // If no modal is showing, show immediately
      setAchievement(achievementData);
      setShowAchievement(true);
    }
  };

  const value = {
    trackTaskCreation,
    trackTaskUpdate,
    achievement,
    showAchievement,
    closeAchievement
  };

  return (
    <ExperienceContext.Provider value={value}>
      {children}
      <AchievementModal
        achievement={achievement}
        isOpen={showAchievement}
        onClose={closeAchievement}
      />
    </ExperienceContext.Provider>
  );
};

