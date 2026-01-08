/**
 * Experience System Page
 *
 * Displays time calculation and level progress
 */

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAllUserTasks } from "@/features/tasks/tasksApi";
import {
  calculateCompleteExperienceFromTasks,
} from "@/features/experience/experienceCalculator";
import {
  EXPERIENCE_CONFIG,
  calculateLevel,
  calculateProgress,
  getPointsToNextLevel,
  getCurrentTimeLevel,
  getNextTimeLevel,
  calculateTimeLevelProgress,
} from "@/features/experience/experienceConfig";
import Badge from "@/components/ui/Badge/Badge";
import ChartHeader from "@/components/Cards/ChartHeader";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";
import { getUserUID } from "@/features/utils/authUtils";
import Loader from "@/components/ui/Loader/Loader";

const ExperienceSystemPage = () => {
  const { user } = useAuth();
  const { deliverables } = useAppDataContext();
  const [showLevelProgression, setShowLevelProgression] = useState(false);

  // Get user UID for fetching tasks
  const userUID = getUserUID(user);

  // Fetch all user tasks across all months (real-time listener - automatically updates on CRUD)
  // Tasks are filtered by userUID directly at the database level
  const { tasks: allTasks = [], isLoading: tasksLoading } =
    useAllUserTasks(userUID);

  // Transform deliverables to options format for time calculations
  const deliverablesOptions = useMemo(() => {
    if (!deliverables || deliverables.length === 0) return [];
    return deliverables.map((deliverable) => ({
      value: deliverable.name,
      label: deliverable.name,
      department: deliverable.department,
      timePerUnit: deliverable.timePerUnit,
      timeUnit: deliverable.timeUnit,
      requiresQuantity: deliverable.requiresQuantity,
      variationsTime: deliverable.variationsTime,
      variationsTimeUnit: deliverable.variationsTimeUnit || "min",
    }));
  }, [deliverables]);

  // Calculate experience from all tasks (frontend calculation - automatically updates when tasks change)
  const experience = useMemo(() => {
    if (tasksLoading || !allTasks || allTasks.length === 0) {
      return {
        points: 0,
        totalHours: 0,
        taskCount: 0,
      };
    }

    const calculated = calculateCompleteExperienceFromTasks(
      allTasks,
      deliverablesOptions,
      userUID
    );

    return {
      points: calculated.points || 0,
      totalHours: calculated.totalHours || 0,
      taskCount: calculated.taskCount || 0,
    };
  }, [allTasks, deliverablesOptions, tasksLoading, userUID]);

  const currentLevel = calculateLevel(experience.points || 0);
  const progress = calculateProgress(experience.points || 0, currentLevel);
  const pointsToNext = getPointsToNextLevel(
    experience.points || 0,
    currentLevel
  );

  const totalHours = experience.totalHours || 0;
  const blueColor = CARD_SYSTEM.COLOR_HEX_MAP.blue;
  const greenColor = CARD_SYSTEM.COLOR_HEX_MAP.green;
  const amberColor = CARD_SYSTEM.COLOR_HEX_MAP.amber;

  // Time Level System
  const currentTimeLevel = getCurrentTimeLevel(totalHours);
  const nextTimeLevel = getNextTimeLevel(currentTimeLevel);
  const timeLevelProgress = calculateTimeLevelProgress(
    totalHours,
    currentTimeLevel
  );

  // Helper function to create tooltip content for time levels
  const createTimeLevelTooltipContent = () => {
    return (
      <div className="space-y-2 min-w-[200px]">
        <div className="font-semibold mb-2 text-sm border-b border-gray-600 pb-1">
          All Time Levels
        </div>
        {EXPERIENCE_CONFIG.TIME_LEVELS.map((level) => {
          const isCurrent =
            totalHours >= level.minHours &&
            (level.maxHours === Infinity || totalHours < level.maxHours);
          const maxValue = level.maxHours === Infinity ? Infinity : level.maxHours;
          return (
            <div
              key={level.level}
              className={`flex items-start gap-2 ${isCurrent ? "text-amber-300" : ""}`}
            >
              <span className="text-base">{level.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{level.name}</div>
                <div className="text-xs text-gray-300">
                  Logged {level.minHours}{level.maxHours === Infinity ? "+" : "-" + level.maxHours} hours
                  {maxValue === Infinity ? "+" : ""}
                </div>
                <div className="text-xs text-gray-400">
                  {isCurrent
                    ? "Current"
                    : level.points
                      ? `Reward: +${level.points} XP`
                      : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Create tooltip content for main experience levels
  const createExperienceLevelTooltipContent = () => {
    return (
      <div className="space-y-2 min-w-[200px]">
        <div className="font-semibold mb-2 text-sm border-b border-gray-600 pb-1">
          All Levels
        </div>
        {EXPERIENCE_CONFIG.LEVELS.map((level) => {
          const isCurrent =
            (experience.points || 0) >= level.minPoints &&
            (level.maxPoints === Infinity || (experience.points || 0) < level.maxPoints);
          return (
            <div
              key={level.level}
              className={`flex items-start gap-2 ${isCurrent ? "text-amber-300" : ""}`}
            >
              <span className="text-base">{level.badge}</span>
              <div className="flex-1">
                <div className="font-medium">{level.name}</div>
                <div className="text-xs text-gray-300">
                  {level.minPoints}{level.maxPoints === Infinity ? "+" : "-" + level.maxPoints} XP
                </div>
                <div className="text-xs text-gray-400">
                  {isCurrent ? "Current" : ""}
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
    <div className="p-4">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1>Experience System</h1>
          <p className="text-small mt-2">
            Track your level progress and time calculation
          </p>
        </div>

        {/* Level Progress Card */}
        <ChartHeader
          variant="section"
          title={
            <div className="flex items-center gap-2">
              <span>
                Level {currentLevel.level} - {currentLevel.name}
              </span>
              <Tooltip content={createExperienceLevelTooltipContent()}>
                <div className="cursor-help">
                  <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                </div>
              </Tooltip>
            </div>
          }
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
              <div className="card-label mb-1">Total XP</div>
              <div className="card-value">{experience.points || 0}</div>
            </div>
            <div>
              <div className="card-label mb-1">Total Hours</div>
              <div className="card-value">{Math.round(totalHours)}</div>
            </div>
            <div>
              <div className="card-label mb-1">Current Level</div>
              <div className="card-value">{currentLevel.level}</div>
            </div>
          </div>
        </ChartHeader>

        {/* Time Level Calculation */}
        <div className="card-small-modern p-0 relative">
          {/* Colored left accent bar */}
          <div
            className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-xl transition-all duration-300"
            style={{
              backgroundColor: amberColor,
              opacity: 0.8,
            }}
          />
          <div className="p-4">
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="amber" size="sm">
                {nextTimeLevel
                  ? `Level ${nextTimeLevel.level}`
                  : "Complete"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-base font-semibold">Time Levels</h4>
              <Tooltip content={createTimeLevelTooltipContent()}>
                <div className="cursor-help">
                  <Icons.generic.help className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                </div>
              </Tooltip>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-4xl">
                {nextTimeLevel
                  ? nextTimeLevel.icon
                  : currentTimeLevel.icon}
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
        </div>

        {/* Level Progression Map */}
        <div className="card">
          <div className="flex justify-between items-center gap-4 mb-4">
            <h2>Level Progression Map 🗺️</h2>
            <DynamicButton
              onClick={() => setShowLevelProgression(!showLevelProgression)}
              variant="outline"
              size="sm"
            >
              {showLevelProgression ? "Hide" : "Show"}
            </DynamicButton>
          </div>
          {showLevelProgression && (
            <div className="space-y-4">
              {EXPERIENCE_CONFIG.LEVELS.map((level) => {
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
          )}
        </div>

        {/* Points System */}
        <div className="card">
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
        </div>

        {/* Experience System Summary */}
        <div className="mt-8 card rounded-lg p-8 border-l-4 border-blue-500 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            Experience System Summary 📚
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            {/* Points System */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">
                How Points Work
              </h3>
              <p className="text-sm leading-relaxed mb-4">
                The Experience System rewards you with{" "}
                <strong>Experience Points (XP)</strong> for completing tasks and
                using features. Points are automatically calculated when you
                create or update tasks. Your total XP determines your level,
                which ranges from
                <strong> Noob (Level 1)</strong> to{" "}
                <strong>Transcendent Overlord (Level 20)</strong>.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Level Progression:</strong> Each level requires a
                certain amount of XP. As you earn more points, you automatically
                level up and unlock new badges. The system tracks your progress
                in real-time across all your tasks.
              </p>
            </div>

            {/* How to Gain Points */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">
                How to Gain Points
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 min-w-[120px]">
                    Task Added:
                  </div>
                  <div>
                    +{EXPERIENCE_CONFIG.POINTS.TASK_ADDED} XP - Every time you
                    create a new task
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 min-w-[120px]">
                    Deliverable:
                  </div>
                  <div>
                    +{EXPERIENCE_CONFIG.POINTS.DELIVERABLE} XP - For each
                    deliverable you add to a task
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 min-w-[120px]">
                    Variation:
                  </div>
                  <div>
                    +{EXPERIENCE_CONFIG.POINTS.VARIATION} XP - For each
                    variation of a deliverable
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 min-w-[120px]">
                    Shutterstock Used:
                  </div>
                  <div>
                    +{EXPERIENCE_CONFIG.POINTS.SHUTTERSTOCK_USED} XP - When you
                    use Shutterstock in a task
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 min-w-[120px]">
                    AI Used:
                  </div>
                  <div>
                    +{EXPERIENCE_CONFIG.POINTS.AI_USED} XP - When you use AI
                    tools in a task
                  </div>
                </div>
              </div>
            </div>

            {/* What to Do */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">
                What Should You Do?
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mt-0.5">
                    1.
                  </div>
                  <div>
                    <strong>Create Tasks Regularly:</strong> Every task you
                    create gives you {EXPERIENCE_CONFIG.POINTS.TASK_ADDED} XP.
                    The more tasks you complete, the more points you earn.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mt-0.5">
                    2.
                  </div>
                  <div>
                    <strong>Track Your Progress:</strong> Monitor your level
                    progress and time calculation above. Track your total tasks,
                    XP, and hours to see how you're progressing.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mt-0.5">
                    3.
                  </div>
                  <div>
                    <strong>Level Up:</strong> Focus on completing tasks
                    consistently. Your experience is calculated from ALL your
                    tasks across all months, so every task counts toward your
                    total progress!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceSystemPage;
