/**
 * Experience System Page
 *
 * Displays the gamification system with levels, achievements, and user progress
 */

import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAllUserTasks } from "@/features/tasks/tasksApi";
import { calculateCompleteExperienceFromTasks, calculateUnlockedAchievements } from "@/features/experience/experienceCalculator";
import { updateUserExperience } from "@/features/experience/experienceApi";
import {
  EXPERIENCE_CONFIG,
  calculateLevel,
  calculateProgress,
  getPointsToNextLevel,
  getCurrentTimeLevel,
  getNextTimeLevel,
  calculateTimeLevelProgress,
  getCurrentAIHoursLevel,
  getNextAIHoursLevel,
  calculateAIHoursLevelProgress,
  getCurrentTaskLevel,
  getNextTaskLevel,
  calculateTaskLevelProgress,
  getCurrentVIPLevel,
  getNextVIPLevel,
  calculateVIPLevelProgress,
  getCurrentDeliverableLevel,
  getNextDeliverableLevel,
  calculateDeliverableLevelProgress,
  getCurrentAIUsesLevel,
  getNextAIUsesLevel,
  calculateAIUsesLevelProgress,
  getCurrentShutterstockLevel,
  getNextShutterstockLevel,
  calculateShutterstockLevelProgress,
  GENERAL_ACHIEVEMENTS,
} from "@/features/experience/experienceConfig";
import UserBadge from "@/features/experience/components/UserBadge";
import Badge from "@/components/ui/Badge/Badge";
import ChartHeader from "@/components/Cards/ChartHeader";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import { FORM_OPTIONS, CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";
import { getUserUID } from "@/features/utils/authUtils";
import Loader from "@/components/ui/Loader/Loader";
import AchievementModal from "@/features/experience/components/AchievementModal";

const ExperienceSystemPage = () => {
  const { user } = useAuth();
  const { deliverables } = useAppDataContext();
  
  // Get user UID for fetching tasks
  const userUID = getUserUID(user);
  
  // Fetch all user tasks across all months (real-time listener - automatically updates on CRUD)
  const { tasks: allTasks = [], isLoading: tasksLoading } = useAllUserTasks(
    userUID,
    'user' // Always use 'user' role to filter by userUID for experience calculation
  );

  // Get user's department from occupation field
  const userDepartment = user?.occupation?.toLowerCase() || "design";
  const departmentName =
    FORM_OPTIONS.DEPARTMENTS.find((d) => d.value === userDepartment)?.label ||
    userDepartment;

  // Transform deliverables to options format for time calculations
  const deliverablesOptions = useMemo(() => {
    if (!deliverables || deliverables.length === 0) return [];
    return deliverables.map(deliverable => ({
      value: deliverable.name,
      label: deliverable.name,
      department: deliverable.department,
      timePerUnit: deliverable.timePerUnit,
      timeUnit: deliverable.timeUnit,
      requiresQuantity: deliverable.requiresQuantity,
      variationsTime: deliverable.variationsTime,
      variationsTimeUnit: deliverable.variationsTimeUnit || 'min'
    }));
  }, [deliverables]);

  // Calculate experience from all tasks (frontend calculation - automatically updates when tasks change)
  const experience = useMemo(() => {
    if (tasksLoading || !allTasks || allTasks.length === 0) {
      return {
        points: 0,
        level: 1,
        levelName: "Amateur",
        taskCount: 0,
        shutterstockCount: 0,
        aiCount: 0,
        totalHours: 0,
        aiHours: 0,
        vipCount: 0,
        deliverableCount: 0,
        unlockedAchievements: [],
      };
    }
    
    // Calculate complete experience from tasks - filter by userUID for safety
    // Debug: Log what we're calculating
    const recentTasks = allTasks.slice(0, 5);
    console.log('[ExperienceSystemPage] Calculating experience:', {
      userUID: userUID,
      allTasksCount: allTasks.length,
      sampleTasks: recentTasks.map(t => ({
        id: t.id,
        userUID: t.userUID,
        createbyUID: t.createbyUID,
        data_task_userUID: t.data_task?.userUID,
        timeInHours: t.data_task?.timeInHours,
        gimodear: t.data_task?.gimodear,
        monthId: t.monthId
      }))
    });
    
    const calculated = calculateCompleteExperienceFromTasks(allTasks, deliverablesOptions, userUID);
    
    console.log('[ExperienceSystemPage] Calculated experience:', {
      taskCount: calculated.taskCount,
      points: calculated.points,
      totalHours: calculated.totalHours,
      taskHours: calculated.taskHours,
      deliverableHours: calculated.deliverableHours,
      aiHours: calculated.aiHours,
      variationHours: calculated.variationHours,
      shutterstockCount: calculated.shutterstockCount,
      aiCount: calculated.aiCount,
      vipCount: calculated.vipCount,
      deliverableCount: calculated.deliverableCount
    });
    
    // Calculate level from points
    const level = calculateLevel(calculated.points);
    
    // Calculate unlocked achievements from current counts
    const unlockedAchievements = calculateUnlockedAchievements(calculated, userDepartment);
    
    return {
      ...calculated,
      level: level.level,
      levelName: level.name,
      unlockedAchievements, // Calculate achievements from tasks
    };
  }, [allTasks, deliverablesOptions, tasksLoading, userDepartment, userUID]);

  const currentLevel = calculateLevel(experience.points || 0);
  const progress = calculateProgress(experience.points || 0, currentLevel);
  const pointsToNext = getPointsToNextLevel(
    experience.points || 0,
    currentLevel
  );

  // State for claimable achievements modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimableAchievement, setClaimableAchievement] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Check for new achievements to claim (compare with stored experience)
  useEffect(() => {
    if (!user?.id || tasksLoading || !experience) return;

    // Check if there are new achievements or level changes that need to be claimed
    const storedExperience = user?.experience;
    const storedUnlockedAchievements = storedExperience?.unlockedAchievements || [];
    const currentPoints = experience.points || 0;
    const currentLevel = experience.level || 1;
    const storedPoints = storedExperience?.points || 0;
    const storedLevel = storedExperience?.level || 1;
    const currentTotalHours = experience.totalHours || 0;
    const storedTotalHours = storedExperience?.totalHours || 0;

    // Check for point-based level up (only if not already stored)
    if (currentPoints > storedPoints || currentLevel > storedLevel) {
      const level = calculateLevel(currentPoints);
      const levelUpAchievementName = `Level ${currentLevel} - ${level.name}`;
      
      // Only show if this level up hasn't been claimed yet
      if (!storedUnlockedAchievements.includes(levelUpAchievementName)) {
        setClaimableAchievement({
          type: 'levelUp',
          newLevel: currentLevel,
          levelName: level.name,
          badge: level.badge,
          color: level.color,
          points: currentPoints - storedPoints,
          achievementName: levelUpAchievementName // Store the achievement identifier
        });
        setShowClaimModal(true);
        return;
      }
    }

    // Check for time-based level achievement (e.g., 500 hours, 1000 hours)
    // Only check if current hours increased or if stored hours is missing/0
    if (currentTotalHours > (storedTotalHours || 0)) {
      const currentTimeLevel = getCurrentTimeLevel(currentTotalHours);
      const storedTimeLevel = getCurrentTimeLevel(storedTotalHours || 0);
      
      // Check if user crossed a time level threshold and hasn't claimed it yet
      if (currentTimeLevel.level > storedTimeLevel.level && 
          !storedUnlockedAchievements.includes(currentTimeLevel.name)) {
        setClaimableAchievement({
          type: 'bonus',
          name: currentTimeLevel.name,
          description: `Logged ${Math.round(currentTotalHours)} hours of work!`,
          icon: currentTimeLevel.icon,
          points: currentTimeLevel.points,
          color: '#8B5CF6', // Purple color for time achievements
          achievementName: currentTimeLevel.name // Store the achievement identifier
        });
        setShowClaimModal(true);
        return;
      }
    }

    // Check for general achievements (task count, AI hours, etc.)
    // Compare current unlocked achievements with stored ones
    const currentUnlockedAchievements = experience.unlockedAchievements || [];
    const newlyUnlocked = currentUnlockedAchievements.filter(
      achievementName => !storedUnlockedAchievements.includes(achievementName)
    );

    if (newlyUnlocked.length > 0) {
      // Find the achievement details for the first newly unlocked achievement
      const newAchievementName = newlyUnlocked[0];
      let achievementDetails = null;

      // Search in GENERAL_ACHIEVEMENTS
      for (const achievement of Object.values(GENERAL_ACHIEVEMENTS)) {
        if (achievement.name === newAchievementName) {
          achievementDetails = achievement;
          break;
        }
      }

      // If found, show the modal
      if (achievementDetails) {
        setClaimableAchievement({
          type: 'bonus',
          name: achievementDetails.name,
          description: achievementDetails.description,
          icon: achievementDetails.icon,
          points: achievementDetails.points,
          color: '#10B981', // Green color for general achievements
          achievementName: achievementDetails.name // Store the achievement identifier
        });
        setShowClaimModal(true);
        return;
      }
    }
  }, [user?.id, user?.experience, experience, tasksLoading]);

  // Handle claim button click - update experience in database
  const handleClaimExperience = async () => {
    if (!user?.id || isClaiming || !claimableAchievement) return;

    setIsClaiming(true);
    try {
      // Get the achievement name to store
      const achievementName = claimableAchievement.achievementName || 
                               (claimableAchievement.type === 'levelUp' 
                                 ? `Level ${claimableAchievement.newLevel} - ${claimableAchievement.levelName}`
                                 : claimableAchievement.name);

      // Update experience with points, level, and the new achievement name
      await updateUserExperience(user.id, {
        points: experience.points,
        level: experience.level,
        unlockedAchievements: achievementName // Save the achievement name to prevent showing again
      });
      
      setShowClaimModal(false);
      setClaimableAchievement(null);
    } catch (error) {
      console.error('Error claiming experience:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Use calculated counts from tasks (automatically updates when tasks change)
  const shutterstockCount = experience.shutterstockCount || 0;
  const aiCount = experience.aiCount || 0;
  const totalHours = experience.totalHours || 0;
  const aiHours = experience.aiHours || 0;
  const vipCount = experience.vipCount || 0;
  const deliverableCount = experience.deliverableCount || 0;
  const unlockedAchievements = experience.unlockedAchievements || [];

  // Get department-specific achievements
  const deptAchievements =
    EXPERIENCE_CONFIG.DEPARTMENT_ACHIEVEMENTS[userDepartment] ||
    EXPERIENCE_CONFIG.DEPARTMENT_ACHIEVEMENTS.design;

  const blueColor = CARD_SYSTEM.COLOR_HEX_MAP.blue;
  const greenColor = CARD_SYSTEM.COLOR_HEX_MAP.green;
  const purpleColor = CARD_SYSTEM.COLOR_HEX_MAP.purple;
  const amberColor = CARD_SYSTEM.COLOR_HEX_MAP.amber;

  // Time Level System
  const currentTimeLevel = getCurrentTimeLevel(totalHours);
  const nextTimeLevel = getNextTimeLevel(currentTimeLevel);
  const timeLevelProgress = calculateTimeLevelProgress(
    totalHours,
    currentTimeLevel
  );

  // AI Hours Level System
  const currentAIHoursLevel = getCurrentAIHoursLevel(aiHours);
  const nextAIHoursLevel = getNextAIHoursLevel(currentAIHoursLevel);
  const aiHoursLevelProgress = calculateAIHoursLevelProgress(
    aiHours,
    currentAIHoursLevel
  );

  // Task Level System
  const currentTaskLevel = getCurrentTaskLevel(experience.taskCount || 0);
  const nextTaskLevel = getNextTaskLevel(currentTaskLevel);
  const taskLevelProgress = calculateTaskLevelProgress(
    experience.taskCount || 0,
    currentTaskLevel
  );

  // VIP Level System
  const currentVIPLevel = getCurrentVIPLevel(vipCount);
  const nextVIPLevel = getNextVIPLevel(currentVIPLevel);
  const vipLevelProgress = calculateVIPLevelProgress(vipCount, currentVIPLevel);

  // Deliverable Level System
  const currentDeliverableLevel = getCurrentDeliverableLevel(deliverableCount);
  const nextDeliverableLevel = getNextDeliverableLevel(currentDeliverableLevel);
  const deliverableLevelProgress = calculateDeliverableLevelProgress(
    deliverableCount,
    currentDeliverableLevel
  );

  // AI Uses Level System
  const currentAIUsesLevel = getCurrentAIUsesLevel(aiCount);
  const nextAIUsesLevel = getNextAIUsesLevel(currentAIUsesLevel);
  const aiUsesLevelProgress = calculateAIUsesLevelProgress(
    aiCount,
    currentAIUsesLevel
  );

  // Shutterstock Level System
  const currentShutterstockLevel =
    getCurrentShutterstockLevel(shutterstockCount);
  const nextShutterstockLevel = getNextShutterstockLevel(
    currentShutterstockLevel
  );
  const shutterstockLevelProgress = calculateShutterstockLevelProgress(
    shutterstockCount,
    currentShutterstockLevel
  );

  // Helper function to create tooltip content for levels (JSX format)
  const createLevelTooltipContent = (levels, currentValue, getValueLabel) => {
    return (
      <div className="space-y-2 min-w-[200px]">
        <div className="font-semibold mb-2 text-sm border-b border-gray-600 pb-1">
          All Levels
        </div>
        {levels.map((level) => {
          const isCurrent =
            (level.minHours !== undefined &&
              currentValue >= level.minHours &&
              (level.maxHours === Infinity || currentValue < level.maxHours)) ||
            (level.minTasks !== undefined &&
              currentValue >= level.minTasks &&
              (level.maxTasks === Infinity || currentValue < level.maxTasks)) ||
            (level.minCount !== undefined &&
              currentValue >= level.minCount &&
              (level.maxCount === Infinity || currentValue < level.maxCount));
          const maxValue =
            level.maxHours !== undefined
              ? level.maxHours
              : level.maxTasks !== undefined
                ? level.maxTasks
                : level.maxCount !== undefined
                  ? level.maxCount
                  : Infinity;
          const valueLabel = getValueLabel(level);
          return (
            <div
              key={level.level}
              className={`flex items-start gap-2 ${isCurrent ? "text-amber-300" : ""}`}
            >
              <span className="text-base">{level.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{level.name}</div>
                <div className="text-xs text-gray-300">
                  {valueLabel}
                  {maxValue === Infinity ? "+" : ""}
                </div>
                <div className="text-xs text-gray-400">
                  {isCurrent ? "Current" : `Reward: +${level.points} XP`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Show loading state while fetching tasks
  if (tasksLoading) {
    return (
      <div className="p-6">
        <Loader 
          size="lg" 
          text="Loading your experience data..." 
          fullScreen={false}
          minHeight="min-h-[400px]"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1>Experience System</h1>
          <p className="text-small mt-2">
            Level up by completing tasks and unlock achievements! 🎮
          </p>
        </div>

        {/* User Current Status Card - Dynamic like Month Progress */}
        <ChartHeader
          variant="section"
          title={`Level ${currentLevel.level} - ${currentLevel.name}`}
          subtitle="Your Experience Progress"
          badges={[`${Math.round(progress)}%`, `${experience.points || 0} XP`]}
          color={currentLevel.color}
          showIcon={true}
          icon={<Icons.generic.star className="w-5 h-5 text-white" />}
          className="w-full"
        >
          {/* Progress Bar Section */}
          <div className="my-4">
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: currentLevel.color,
                }}
              />
            </div>
          </div>

          {/* Stats Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: currentLevel.color }}
              ></div>
              <span className="text-xs">
                {experience.points || 0} XP earned
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {pointsToNext > 0 ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-error"></div>
                  <span className="text-xs">
                    {pointsToNext} XP to next level
                  </span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs">Max Level! 🎉</span>
                </>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200/40 dark:border-gray-600">
            <div>
              <div className="card-label mb-1">Total Tasks</div>
              <div className="card-value">{experience.taskCount || 0}</div>
            </div>
            <div>
              <div className="card-label mb-1">Shutterstock Uses</div>
              <div className="card-value">{shutterstockCount}</div>
            </div>
            <div>
              <div className="card-label mb-1">AI Uses</div>
              <div className="card-value">{aiCount}</div>
            </div>
            <div>
              <div className="card-label mb-1">Total XP</div>
              <div className="card-value">{experience.points || 0}</div>
            </div>
          </div>
        </ChartHeader>

        {/* Achievements */}
        <div className="space-y-6">
          <h2>Your Achievements 🏆</h2>

          {/* General Achievements Box */}
          <div className="card">
            <h3 className="mb-4">General Achievements ⭐</h3>

            {/* Level Systems - Grid of 7 boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Time Level Box */}
              <div className="card relative">
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="amber" size="sm">
                    {nextTimeLevel ? `Level ${nextTimeLevel.level}` : "Complete"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-semibold">Time Levels</h4>
                  <Tooltip
                    content={createLevelTooltipContent(
                      EXPERIENCE_CONFIG.TIME_LEVELS,
                      totalHours,
                      (level) =>
                        `Logged ${level.minHours}${level.maxHours === Infinity ? "+" : "-" + level.maxHours} hours`
                    )}
                  >
                    <div className="cursor-help">
                      <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                    </div>
                  </Tooltip>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-4xl">
                    {nextTimeLevel ? nextTimeLevel.icon : currentTimeLevel.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base">
                        {nextTimeLevel
                          ? nextTimeLevel.name
                          : currentTimeLevel.name}
                      </h4>
                    </div>
                    <p className="text-small mb-3">
                      Logged{" "}
                      {nextTimeLevel
                        ? nextTimeLevel.minHours
                        : currentTimeLevel.maxHours === Infinity
                          ? "1000+"
                          : currentTimeLevel.maxHours}{" "}
                      hours of work!
                    </p>
                    {nextTimeLevel && (
                      <>
                        <div className="mb-2">
                          <div className="flex justify-between text-dashboard-xs mb-1">
                            <span>Progress</span>
                            <span>
                              {Math.round(totalHours)} /{" "}
                              {nextTimeLevel.minHours}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${timeLevelProgress}%`,
                                backgroundColor: amberColor,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          className="text-dashboard-xs font-semibold"
                          style={{ color: amberColor }}
                        >
                          Reward: +{nextTimeLevel.points} XP
                        </div>
                      </>
                    )}
                    {!nextTimeLevel && (
                      <div
                        className="text-dashboard-xs font-semibold"
                        style={{ color: greenColor }}
                      >
                        ✓ All time levels completed! 🎉
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Hours Level Box */}
              <div className="card relative">
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="purple" size="sm">
                    {nextAIHoursLevel ? `Level ${nextAIHoursLevel.level}` : "Complete"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-semibold">AI Hours Levels</h4>
                  <Tooltip
                    content={createLevelTooltipContent(
                      EXPERIENCE_CONFIG.AI_HOURS_LEVELS,
                      aiHours,
                      (level) =>
                        `Spent ${level.minHours}${level.maxHours === Infinity ? "+" : "-" + level.maxHours} AI hours`
                    )}
                  >
                    <div className="cursor-help">
                      <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                    </div>
                  </Tooltip>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-4xl">
                    {nextAIHoursLevel
                      ? nextAIHoursLevel.icon
                      : currentAIHoursLevel.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base">
                        {nextAIHoursLevel
                          ? nextAIHoursLevel.name
                          : currentAIHoursLevel.name}
                      </h4>
                    </div>
                    <p className="text-small mb-3">
                      Spent{" "}
                      {nextAIHoursLevel
                        ? nextAIHoursLevel.minHours
                        : currentAIHoursLevel.maxHours === Infinity
                          ? "100+"
                          : currentAIHoursLevel.maxHours}{" "}
                      hours with AI tools!
                    </p>
                    {nextAIHoursLevel && (
                      <>
                        <div className="mb-2">
                          <div className="flex justify-between text-dashboard-xs mb-1">
                            <span>Progress</span>
                            <span>
                              {Math.round(aiHours)} /{" "}
                              {nextAIHoursLevel.minHours}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${aiHoursLevelProgress}%`,
                                backgroundColor: amberColor,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          className="text-dashboard-xs font-semibold"
                          style={{ color: amberColor }}
                        >
                          Reward: +{nextAIHoursLevel.points} XP
                        </div>
                      </>
                    )}
                    {!nextAIHoursLevel && (
                      <div
                        className="text-dashboard-xs font-semibold"
                        style={{ color: greenColor }}
                      >
                        ✓ All AI hours levels completed! 🎉
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Task Level Box */}
              <div className="card relative">
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="blue" size="sm">
                    {nextTaskLevel ? `Level ${nextTaskLevel.level}` : "Complete"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-semibold">Task Levels</h4>
                  <Tooltip
                    content={createLevelTooltipContent(
                      EXPERIENCE_CONFIG.TASK_LEVELS,
                      experience.taskCount || 0,
                      (level) =>
                        `Completed ${level.minTasks}${level.maxTasks === Infinity ? "+" : "-" + level.maxTasks} tasks`
                    )}
                  >
                    <div className="cursor-help">
                      <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                    </div>
                  </Tooltip>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-4xl">
                    {nextTaskLevel ? nextTaskLevel.icon : currentTaskLevel.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base">
                        {nextTaskLevel
                          ? nextTaskLevel.name
                          : currentTaskLevel.name}
                      </h4>
                    </div>
                    <p className="text-small mb-3">
                      Completed{" "}
                      {nextTaskLevel
                        ? nextTaskLevel.minTasks
                        : currentTaskLevel.maxTasks === Infinity
                          ? "500+"
                          : currentTaskLevel.maxTasks}{" "}
                      tasks!
                    </p>
                    {nextTaskLevel && (
                      <>
                        <div className="mb-2">
                          <div className="flex justify-between text-dashboard-xs mb-1">
                            <span>Progress</span>
                            <span>
                              {experience.taskCount || 0} /{" "}
                              {nextTaskLevel.minTasks}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${taskLevelProgress}%`,
                                backgroundColor: amberColor,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          className="text-dashboard-xs font-semibold"
                          style={{ color: amberColor }}
                        >
                          Reward: +{nextTaskLevel.points} XP
                        </div>
                      </>
                    )}
                    {!nextTaskLevel && (
                      <div
                        className="text-dashboard-xs font-semibold"
                        style={{ color: greenColor }}
                      >
                        ✓ All task levels completed! 🎉
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* VIP Level Box */}
              <div className="card relative">
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="amber" size="sm">
                    {nextVIPLevel ? `Level ${nextVIPLevel.level}` : "Complete"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-semibold">VIP Levels</h4>
                  <Tooltip
                    content={createLevelTooltipContent(
                      EXPERIENCE_CONFIG.VIP_LEVELS,
                      vipCount,
                      (level) =>
                        `Completed ${level.minTasks}${level.maxTasks === Infinity ? "+" : "-" + level.maxTasks} VIP tasks`
                    )}
                  >
                    <div className="cursor-help">
                      <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                    </div>
                  </Tooltip>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-4xl">
                    {nextVIPLevel ? nextVIPLevel.icon : currentVIPLevel.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base">
                        {nextVIPLevel
                          ? nextVIPLevel.name
                          : currentVIPLevel.name}
                      </h4>
                    </div>
                    <p className="text-small mb-3">
                      Completed{" "}
                      {nextVIPLevel
                        ? nextVIPLevel.minTasks
                        : currentVIPLevel.maxTasks === Infinity
                          ? "50+"
                          : currentVIPLevel.maxTasks}{" "}
                      VIP tasks!
                    </p>
                    {nextVIPLevel && (
                      <>
                        <div className="mb-2">
                          <div className="flex justify-between text-dashboard-xs mb-1">
                            <span>Progress</span>
                            <span>
                              {vipCount} / {nextVIPLevel.minTasks}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${vipLevelProgress}%`,
                                backgroundColor: amberColor,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          className="text-dashboard-xs font-semibold"
                          style={{ color: amberColor }}
                        >
                          Reward: +{nextVIPLevel.points} XP
                        </div>
                      </>
                    )}
                    {!nextVIPLevel && (
                      <div
                        className="text-dashboard-xs font-semibold"
                        style={{ color: greenColor }}
                      >
                        ✓ All VIP levels completed! 🎉
                      </div>
                    )}
                  </div>
                </div>

          
              </div>
      {/* Deliverable Level Box */}
      <div className="card relative">
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="green" size="sm">
            {nextDeliverableLevel ? `Level ${nextDeliverableLevel.level}` : "Complete"}
          </Badge>
        </div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-base font-semibold">
                      Deliverable Levels
                    </h4>
                    <Tooltip
                      content={createLevelTooltipContent(
                        EXPERIENCE_CONFIG.DELIVERABLE_LEVELS,
                        deliverableCount,
                        (level) =>
                          `Completed ${level.minCount}${level.maxCount === Infinity ? "+" : "-" + level.maxCount} deliverables`
                      )}
                    >
                      <div className="cursor-help">
                        <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">
                      {nextDeliverableLevel
                        ? nextDeliverableLevel.icon
                        : currentDeliverableLevel.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base">
                          {nextDeliverableLevel
                            ? nextDeliverableLevel.name
                            : currentDeliverableLevel.name}
                        </h4>
                      </div>
                      <p className="text-small mb-3">
                        Completed{" "}
                        {nextDeliverableLevel
                          ? nextDeliverableLevel.minCount
                          : currentDeliverableLevel.maxCount === Infinity
                            ? "100+"
                            : currentDeliverableLevel.maxCount}{" "}
                        deliverables!
                      </p>
                      {nextDeliverableLevel && (
                        <>
                          <div className="mb-2">
                            <div className="flex justify-between text-dashboard-xs mb-1">
                              <span>Progress</span>
                              <span>
                                {deliverableCount} /{" "}
                                {nextDeliverableLevel.minCount}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${deliverableLevelProgress}%`,
                                  backgroundColor: amberColor,
                                }}
                              />
                            </div>
                          </div>
                          <div
                            className="text-dashboard-xs font-semibold"
                            style={{ color: amberColor }}
                          >
                            Reward: +{nextDeliverableLevel.points} XP
                          </div>
                        </>
                      )}
                      {!nextDeliverableLevel && (
                        <div
                          className="text-dashboard-xs font-semibold"
                          style={{ color: greenColor }}
                        >
                          ✓ All deliverable levels completed! 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              {/* AI Uses Level Box */}
              <div className="card relative">
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="purple" size="sm">
                    {nextAIUsesLevel ? `Level ${nextAIUsesLevel.level}` : "Complete"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-semibold">AI Uses Levels</h4>
                    <Tooltip
                      content={createLevelTooltipContent(
                        EXPERIENCE_CONFIG.AI_USES_LEVELS,
                        aiCount,
                        (level) =>
                          `Used AI ${level.minCount}${level.maxCount === Infinity ? "+" : "-" + level.maxCount} times`
                      )}
                    >
                      <div className="cursor-help">
                        <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">
                      {nextAIUsesLevel
                        ? nextAIUsesLevel.icon
                        : currentAIUsesLevel.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base">
                          {nextAIUsesLevel
                            ? nextAIUsesLevel.name
                            : currentAIUsesLevel.name}
                        </h4>
                      </div>
                      <p className="text-small mb-3">
                        Used AI{" "}
                        {nextAIUsesLevel
                          ? nextAIUsesLevel.minCount
                          : currentAIUsesLevel.maxCount === Infinity
                            ? "100+"
                            : currentAIUsesLevel.maxCount}{" "}
                        times!
                      </p>
                      {nextAIUsesLevel && (
                        <>
                          <div className="mb-2">
                            <div className="flex justify-between text-dashboard-xs mb-1">
                              <span>Progress</span>
                              <span>
                                {aiCount} / {nextAIUsesLevel.minCount}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${aiUsesLevelProgress}%`,
                                  backgroundColor: amberColor,
                                }}
                              />
                            </div>
                          </div>
                          <div
                            className="text-dashboard-xs font-semibold"
                            style={{ color: amberColor }}
                          >
                            Reward: +{nextAIUsesLevel.points} XP
                          </div>
                        </>
                      )}
                      {!nextAIUsesLevel && (
                        <div
                          className="text-dashboard-xs font-semibold"
                          style={{ color: greenColor }}
                        >
                          ✓ All AI uses levels completed! 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shutterstock Level Box */}
                <div className="card relative">
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="amber" size="sm">
                      {nextShutterstockLevel ? `Level ${nextShutterstockLevel.level}` : "Complete"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-base font-semibold">
                      Shutterstock Levels
                    </h4>
                    <Tooltip
                      content={createLevelTooltipContent(
                        EXPERIENCE_CONFIG.SHUTTERSTOCK_LEVELS,
                        shutterstockCount,
                        (level) =>
                          `Used Shutterstock ${level.minCount}${level.maxCount === Infinity ? "+" : "-" + level.maxCount} times`
                      )}
                    >
                      <div className="cursor-help">
                        <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">
                      {nextShutterstockLevel
                        ? nextShutterstockLevel.icon
                        : currentShutterstockLevel.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base">
                          {nextShutterstockLevel
                            ? nextShutterstockLevel.name
                            : currentShutterstockLevel.name}
                        </h4>
                      </div>
                      <p className="text-small mb-3">
                        Used Shutterstock{" "}
                        {nextShutterstockLevel
                          ? nextShutterstockLevel.minCount
                          : currentShutterstockLevel.maxCount === Infinity
                            ? "100+"
                            : currentShutterstockLevel.maxCount}{" "}
                        times!
                      </p>
                      {nextShutterstockLevel && (
                        <>
                          <div className="mb-2">
                            <div className="flex justify-between text-dashboard-xs mb-1">
                              <span>Progress</span>
                              <span>
                                {shutterstockCount} /{" "}
                                {nextShutterstockLevel.minCount}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${shutterstockLevelProgress}%`,
                                  backgroundColor: amberColor,
                                }}
                              />
                            </div>
                          </div>
                          <div
                            className="text-dashboard-xs font-semibold"
                            style={{ color: amberColor }}
                          >
                            Reward: +{nextShutterstockLevel.points} XP
                          </div>
                        </>
                      )}
                      {!nextShutterstockLevel && (
                        <div
                          className="text-dashboard-xs font-semibold"
                          style={{ color: greenColor }}
                        >
                          ✓ All Shutterstock levels completed! 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              {/* Other General Achievements */}
              {/* <div className="mt-6">
                <h4 className="mb-4 text-base font-semibold">
                  Other Achievements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(EXPERIENCE_CONFIG.ACHIEVEMENTS)
                    .filter(([key]) => {
                      // Filter out achievements that have level systems
                      return (
                        !key.includes("HOURS") &&
                        !key.includes("TASKS") &&
                        !key.includes("VIP_") &&
                        !key.includes("SHUTTERSTOCK") &&
                        !key.startsWith("AI_") &&
                        !key.includes("DELIVERABLE")
                      );
                    })
                    .map(([key, achievement]) => {
                      const isUnlocked = unlockedAchievements.includes(
                        achievement.name
                      );

                      // Get current count based on achievement type
                      let currentCount = 0;
                      switch (achievement.type) {
                        case "taskCount":
                          currentCount = experience.taskCount || 0;
                          break;
                        case "shutterstockCount":
                          currentCount = shutterstockCount;
                          break;
                        case "aiCount":
                          currentCount = aiCount;
                          break;
                        case "aiHours":
                          currentCount = Math.round(aiHours);
                          break;
                        case "vipCount":
                          currentCount = vipCount;
                          break;
                        case "deliverableCount":
                          currentCount = deliverableCount;
                          break;
                        default:
                          // Fallback for old achievements without type
                          if (key.includes("SHUTTERSTOCK")) {
                            currentCount = shutterstockCount;
                          } else if (
                            key.includes("AI_") &&
                            !key.includes("HOURS")
                          ) {
                            currentCount = aiCount;
                          } else if (key.includes("TASKS")) {
                            currentCount = experience.taskCount || 0;
                          }
                      }

                      const progress = Math.min(
                        100,
                        (currentCount / achievement.threshold) * 100
                      );

                      return (
                        <div
                          key={key}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isUnlocked
                              ? "shadow-md"
                              : "border-gray-200/70 dark:border-gray-700/70 bg-gray-50/50 dark:bg-gray-800/30"
                          }`}
                          style={{
                            borderColor: isUnlocked ? amberColor : undefined,
                            backgroundColor: isUnlocked
                              ? `${amberColor}15`
                              : undefined,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4>{achievement.name}</h4>
                                {isUnlocked && (
                                  <Badge variant="amber" size="sm">
                                    ✓ Unlocked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-small mb-2">
                                {achievement.description}
                              </p>
                              <div className="mb-2">
                                <div className="flex justify-between text-dashboard-xs mb-1">
                                  <span>Progress</span>
                                  <span>
                                    {currentCount} / {achievement.threshold}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${progress}%`,
                                      backgroundColor: amberColor,
                                    }}
                                  />
                                </div>
                              </div>
                              <div
                                className="text-dashboard-xs font-semibold"
                                style={{ color: amberColor }}
                              >
                                Reward: +{achievement.points} XP
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div> */}
            </div>

            {/* Department-Specific Achievements Box */}
            {/* <div className="card">
              <h3 className="mb-4">
                {departmentName} Department Achievements 🎯
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deptAchievements &&
                  Object.entries(deptAchievements).map(([key, achievement]) => {
                    const isUnlocked = unlockedAchievements.includes(
                      achievement.name
                    );
                    const currentCount = experience.taskCount || 0;
                    const progress = Math.min(
                      100,
                      (currentCount / achievement.threshold) * 100
                    );

                    return (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isUnlocked
                            ? "shadow-md"
                            : "border-gray-200/70 dark:border-gray-700/70 bg-gray-50/50 dark:bg-gray-800/30"
                        }`}
                        style={{
                          borderColor: isUnlocked ? purpleColor : undefined,
                          backgroundColor: isUnlocked
                            ? `${purpleColor}15`
                            : undefined,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4>{achievement.name}</h4>
                              {isUnlocked && (
                                <Badge variant="purple" size="sm">
                                  ✓ Unlocked
                                </Badge>
                              )}
                              <Badge variant="purple" size="xs">
                                {departmentName}
                              </Badge>
                            </div>
                            <p className="text-small mb-2">
                              {achievement.description}
                            </p>
                            <div className="mb-2">
                              <div className="flex justify-between text-dashboard-xs mb-1">
                                <span>Progress</span>
                                <span>
                                  {currentCount} / {achievement.threshold}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${progress}%`,
                                    backgroundColor: purpleColor,
                                  }}
                                />
                              </div>
                            </div>
                            <div
                              className="text-dashboard-xs font-semibold"
                              style={{ color: purpleColor }}
                            >
                              Reward: +{achievement.points} XP
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div> */}
          </div>

          {/* Level Progression Map */}
          {/* <div className="card">
            <h2 className="mb-4">Level Progression Map 🗺️</h2>
            <div className="space-y-4">
              {EXPERIENCE_CONFIG.LEVELS.map((level, index) => {
                const isCurrentLevel = level.level === currentLevel.level;
                const isUnlocked = experience.points >= level.minPoints;
                const isCompleted = experience.points > level.maxPoints;

                return (
                  <div
                    key={level.level}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      isCurrentLevel || isUnlocked
                        ? ""
                        : "border-gray-200/70 dark:border-gray-700/70 bg-gray-50/50 dark:bg-gray-800/30"
                    }`}
                    style={{
                      borderColor: isCurrentLevel
                        ? blueColor
                        : isUnlocked
                          ? greenColor
                          : undefined,
                      backgroundColor: isCurrentLevel
                        ? `${blueColor}15`
                        : isUnlocked
                          ? `${greenColor}15`
                          : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="text-3xl"
                          style={{ opacity: isUnlocked ? 1 : 0.3 }}
                        >
                          {level.badge}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4>
                              Level {level.level} - {level.name}
                            </h4>
                            {isCurrentLevel && (
                              <Badge variant="blue" size="sm">
                                Current
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="green" size="sm">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-small mt-1">
                            {level.minPoints} -{" "}
                            {level.maxPoints === Infinity
                              ? "∞"
                              : level.maxPoints}{" "}
                            XP
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={isUnlocked ? undefined : "gray"}
                        colorHex={isUnlocked ? level.color : undefined}
                        size="md"
                      >
                        {level.minPoints} -{" "}
                        {level.maxPoints === Infinity ? "∞" : level.maxPoints}{" "}
                        XP
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}

          {/* Points System */}
          {/* <div className="card">
            <h2 className="mb-4">Points System 💰</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/40 dark:border-gray-700/40">
                <div className="card-subtitle mb-1">Task Added</div>
                <div className="card-value">
                  +{EXPERIENCE_CONFIG.POINTS.TASK_ADDED} XP
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/40 dark:border-gray-700/40">
                <div className="card-subtitle mb-1">Deliverable</div>
                <div className="card-value">
                  +{EXPERIENCE_CONFIG.POINTS.DELIVERABLE} XP
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/40 dark:border-gray-700/40">
                <div className="card-subtitle mb-1">Variation</div>
                <div className="card-value">
                  +{EXPERIENCE_CONFIG.POINTS.VARIATION} XP each
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/40 dark:border-gray-700/40">
                <div className="card-subtitle mb-1">Shutterstock Used</div>
                <div className="card-value">
                  +{EXPERIENCE_CONFIG.POINTS.SHUTTERSTOCK_USED} XP
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/40 dark:border-gray-700/40">
                <div className="card-subtitle mb-1">AI Used</div>
                <div className="card-value">
                  +{EXPERIENCE_CONFIG.POINTS.AI_USED} XP
                </div>
              </div>
            </div>
          </div> */}

          {/* Department Info */}
          {/* <div className="card">
            <h2 className="mb-4">Your Department: {departmentName} 🏢</h2>
            <p className="text-small">
              You're part of the <strong>{departmentName}</strong> department.
              Complete tasks to unlock department-specific achievements!
            </p>
          </div> */}
        </div>
      </div>

      {/* Claim Experience Modal */}
      <AchievementModal
        achievement={claimableAchievement}
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onClaim={handleClaimExperience}
        showClaimButton={true}
      />
    </div>
  );
};

export default ExperienceSystemPage;
