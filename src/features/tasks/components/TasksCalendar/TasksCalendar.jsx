import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import Tooltip from '@/components/ui/Tooltip/Tooltip';
import { normalizeTimestamp, formatDateString } from '@/utils/dateUtils';
import DynamicCalendar, { getUserColor, generateMultiColorGradient, useCalendarUsers, ColorLegend } from '@/components/Calendar/DynamicCalendar';
import { Icons } from '@/components/icons';
import { useAvailableMonths } from '@/features/months/monthsApi';
import { useAuth } from '@/context/AuthContext';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { serializeTimestampsForContext } from '@/utils/dateUtils';
import { logger } from '@/utils/logger';
import listenerManager from '@/features/utils/firebaseListenerManager';
import { useAppDataContext } from '@/context/AppDataContext';

/**
 * Tasks Calendar Component
 * Shows all tasks per day with user colors across all months
 * Fetches tasks for ALL months independently - does NOT use dashboard filters
 */
const TasksCalendar = () => {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  const userUID = authUser?.userUID || null;
  
  // Use shared hook for user fetching
  const allUsers = useCalendarUsers();
  
  // Get current month tasks from context (already fetched by TaskTable)
  const { tasks: currentMonthTasks = [], currentMonth } = useAppDataContext();
  const currentMonthId = currentMonth?.monthId;
  
  // Get all available months to fetch tasks for all months
  const { availableMonths = [] } = useAvailableMonths();
  
  // Get current year for multi-month view
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // State for all tasks from all months
  const [allTasks, setAllTasks] = useState([]);
  
  // Fetch tasks only for months in the current year (optimize Firebase reads)
  useEffect(() => {
    if (availableMonths.length === 0) {
      return;
    }
    
    // Filter months to only current year to reduce Firebase reads
    const currentYearMonths = availableMonths.filter(month => {
      const monthYear = month.monthId.split('-')[0];
      return monthYear === String(currentYear);
    });
    
    if (currentYearMonths.length === 0) {
      setAllTasks([]);
      return;
    }
    
    const unsubscribes = [];
    const tasksMap = new Map();
    
    // Fetch tasks only for months in current year
    for (const month of currentYearMonths) {
      try {
        const monthId = month.monthId;
        const yearId = monthId.split('-')[0];
        
        // Get tasks collection reference (using taskdata as per tasksApi.js)
        const tasksRef = collection(db, 'departments', 'design', yearId, monthId, 'taskdata');
        
        // Build query based on role (same logic as buildTaskQuery in tasksApi.js)
        let tasksQuery;
        if (!isAdmin && userUID) {
          // Regular users: fetch only their own tasks
          tasksQuery = query(tasksRef, where('userUID', '==', userUID));
        } else {
          // Admin users: fetch all tasks
          tasksQuery = query(tasksRef);
        }
        
        // Use SAME listener key format as useTasks hook to prevent duplicate listeners
        // This ensures if TaskTable already has a listener for this month, we reuse it
        const role = isAdmin ? 'admin' : 'user';
        const listenerKey = `tasks_${monthId}_${role}_${userUID || 'all'}`;
        
        // Check if listener already exists (prevents duplicates with TaskTable)
        if (listenerManager.hasListener(listenerKey)) {
          logger.log(`[TasksCalendar] Listener already exists for ${monthId} (shared with TaskTable), using cached data`);
          
          // If this is the current month, use tasks from context (already loaded by TaskTable)
          if (monthId === currentMonthId && currentMonthTasks.length > 0) {
            tasksMap.set(monthId, currentMonthTasks);
            // Update combined tasks immediately
            const allCombined = Array.from(tasksMap.values()).flat();
            const uniqueTasksMap = new Map();
            allCombined.forEach(task => {
              if (task && task.id && !uniqueTasksMap.has(task.id)) {
                uniqueTasksMap.set(task.id, task);
              }
            });
            setAllTasks(Array.from(uniqueTasksMap.values()));
          }
          continue;
        }
        
        // Set up real-time listener through listener manager
        const unsubscribe = listenerManager.addListener(
          listenerKey,
          () => onSnapshot(
            tasksQuery,
            (snapshot) => {
              if (!snapshot || !snapshot.docs) {
                tasksMap.set(monthId, []);
                // Update combined tasks
                const allCombined = Array.from(tasksMap.values()).flat();
                const uniqueTasksMap = new Map();
                allCombined.forEach(task => {
                  if (task && task.id && !uniqueTasksMap.has(task.id)) {
                    uniqueTasksMap.set(task.id, task);
                  }
                });
                setAllTasks(Array.from(uniqueTasksMap.values()));
                return;
              }
              
              const monthTasks = snapshot.docs
                .map((d) => {
                  if (!d || !d.exists() || !d.data() || !d.id) return null;
                  return serializeTimestampsForContext({
                    id: d.id,
                    monthId: monthId,
                    ...d.data(),
                  });
                })
                .filter((task) => task !== null);
              
              tasksMap.set(monthId, monthTasks);
              
              // Combine all tasks from all months and deduplicate by task ID
              const allCombined = Array.from(tasksMap.values()).flat();
              const uniqueTasksMap = new Map();
              allCombined.forEach(task => {
                if (task && task.id) {
                  // Use task.id as key to ensure uniqueness
                  if (!uniqueTasksMap.has(task.id)) {
                    uniqueTasksMap.set(task.id, task);
                  }
                }
              });
              const combinedTasks = Array.from(uniqueTasksMap.values());
              setAllTasks(combinedTasks);
            },
            (err) => {
              logger.error(`Error fetching tasks for month ${monthId}:`, err);
              tasksMap.set(monthId, []);
              // Combine and deduplicate
              const allCombined = Array.from(tasksMap.values()).flat();
              const uniqueTasksMap = new Map();
              allCombined.forEach(task => {
                if (task && task.id && !uniqueTasksMap.has(task.id)) {
                  uniqueTasksMap.set(task.id, task);
                }
              });
              const combinedTasks = Array.from(uniqueTasksMap.values());
              setAllTasks(combinedTasks);
            }
          ),
          true, // Preserve listener - calendar needs real-time updates
          'tasks', // Category
          'tasks-calendar' // Page identifier
        );
        
        unsubscribes.push(() => {
          listenerManager.removeListener(listenerKey);
        });
      } catch (err) {
        logger.error(`Error setting up listener for month ${month.monthId}:`, err);
      }
    }
    
    // Cleanup listeners on unmount
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [availableMonths, currentYear, isAdmin, userUID]);

  // Use ALL tasks - no filtering, but ensure uniqueness by task ID
  const filteredTasks = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return [];
    
    // Deduplicate tasks by ID to ensure each task is only counted once
    const uniqueTasksMap = new Map();
    allTasks.forEach(task => {
      if (task && task.id) {
        // Use task.id as key, keep the first occurrence
        if (!uniqueTasksMap.has(task.id)) {
          uniqueTasksMap.set(task.id, task);
        }
      }
    });
    
    const uniqueTasks = Array.from(uniqueTasksMap.values());
    
    // Log task counts per month in development mode for verification
    if (import.meta.env.MODE === 'development') {
      const tasksByMonth = new Map();
      uniqueTasks.forEach(task => {
        const monthId = task.monthId || 'unknown';
        if (!tasksByMonth.has(monthId)) {
          tasksByMonth.set(monthId, 0);
        }
        tasksByMonth.set(monthId, tasksByMonth.get(monthId) + 1);
      });
      
      logger.log('📅 [TasksCalendar] Task counts by month:', 
        Object.fromEntries(tasksByMonth)
      );
      logger.log('📅 [TasksCalendar] Total unique tasks:', uniqueTasks.length);
    }
    
    return uniqueTasks;
  }, [allTasks]);

  // Group tasks by date and user
  const tasksByDate = useMemo(() => {
    const map = new Map();
    
    // Create user lookup map for O(1) access instead of O(n) find()
    const userLookup = new Map();
    allUsers.forEach(user => {
      const uid = user.userUID || user.id;
      if (uid) {
        userLookup.set(uid, user);
      }
    });
    
    filteredTasks.forEach(task => {
      // IMPORTANT: Use ONLY createdAt (when task was added) - this is the unique identifier
      // Do NOT use startDate, endDate, or any other date field
      let taskDate = task.createdAt;
      
      // Fallback only if createdAt is completely missing (shouldn't happen for valid tasks)
      if (!taskDate) {
        taskDate = task.timestamp || task.data_task?.createdAt || task.data_task?.timestamp;
      }
      
      if (!taskDate) {
        // Log missing createdAt in development
        if (import.meta.env.MODE === 'development') {
          console.warn('Task missing createdAt:', {
            taskId: task.id,
            taskName: task.data_task?.taskName,
            task: task
          });
        }
        return;
      }
      
      // Handle Firestore timestamp formats more robustly
      let date = null;
      
      // If it's a Firestore Timestamp object with toDate method
      if (taskDate && typeof taskDate.toDate === 'function') {
        date = taskDate.toDate();
      }
      // If it's a Firestore timestamp-like object with seconds
      else if (taskDate && typeof taskDate === 'object' && 'seconds' in taskDate) {
        const milliseconds = taskDate.seconds * 1000 + (taskDate.nanoseconds || 0) / 1000000;
        date = new Date(milliseconds);
      }
      // Otherwise use normalizeTimestamp
      else {
        date = normalizeTimestamp(taskDate);
      }
      
      if (!date || isNaN(date.getTime())) {
        // Log tasks that can't be parsed for debugging
        if (import.meta.env.MODE === 'development') {
          console.warn('Task date could not be parsed:', {
            taskId: task.id,
            taskName: task.data_task?.taskName,
            taskDate: taskDate,
            createdAt: task.createdAt,
            date: date
          });
        }
        return;
      }
      
      // Use local date components to avoid timezone issues
      // formatDateString uses getFullYear(), getMonth(), getDate() which are local timezone
      // This ensures the date shown matches the user's local calendar view
      const dateString = formatDateString(date);
      
      if (!map.has(dateString)) {
        map.set(dateString, {
          date: date,
          dateString: dateString,
          tasks: [],
          users: new Map(),
          totalHours: 0,
          totalTasks: 0
        });
      }
      
      const dayData = map.get(dateString);
      dayData.tasks.push(task);
      dayData.totalTasks++;
      
      // Get hours
      const hours = task.data_task?.timeInHours || task.timeInHours || 0;
      dayData.totalHours += typeof hours === 'number' ? hours : 0;
      
      // Get user (using optimized lookup map)
      const userUID = task.data_task?.userUID || task.userUID || task.userId;
      if (userUID) {
        const user = userLookup.get(userUID);
        if (user) {
          if (!dayData.users.has(userUID)) {
            dayData.users.set(userUID, {
              user: user,
              color: getUserColor(user),
              tasks: [],
              hours: 0
            });
          }
          const userData = dayData.users.get(userUID);
          userData.tasks.push(task);
          userData.hours += typeof hours === 'number' ? hours : 0;
        }
      }
    });
    
    return map;
  }, [filteredTasks, allUsers]);

  // Get day data for a specific date
  const getDayData = useCallback((date) => {
    const dateString = formatDateString(date);
    return tasksByDate.get(dateString) || null;
  }, [tasksByDate]);

  // Get all users with tasks for legend (show all users, no filtering)
  const allUsersWithTasks = useMemo(() => {
    const userMap = new Map();
    
    tasksByDate.forEach((dayData) => {
      dayData.users.forEach((userData, userUID) => {
        if (!userMap.has(userUID)) {
          userMap.set(userUID, {
            userUID,
            userName: userData.user.name || userData.user.email || 'Unknown',
            color: userData.color,
            tasksCount: 0
          });
        }
        const user = userMap.get(userUID);
        user.tasksCount += userData.tasks.length;
      });
    });
    
    // Show all users (no filtering by role or selection)
    return Array.from(userMap.values());
  }, [tasksByDate]);

  // Get users with tasks on a specific date (ensures unique users)
  const getUsersWithTasksOnDate = useCallback((date) => {
    const dateString = formatDateString(date);
    const dayData = tasksByDate.get(dateString);
    if (!dayData) return [];
    
    // Use Map to ensure unique users
    const uniqueUsersMap = new Map();
    
    dayData.users.forEach((userData, userUID) => {
      const uid = userData.user.userUID || userData.user.id || userUID;
      if (!uniqueUsersMap.has(uid)) {
        uniqueUsersMap.set(uid, {
          userUID: uid,
          userName: userData.user.name || userData.user.email || 'Unknown',
          color: userData.color,
          tasksCount: userData.tasks.length,
          hours: userData.hours
        });
      }
    });
    
    return Array.from(uniqueUsersMap.values());
  }, [tasksByDate]);

  // Render day cell
  const renderDay = useCallback((day, dayIndex, dayData, monthDate) => {
    const dateString = formatDateString(day.date);
    const usersWithTasks = getUsersWithTasksOnDate(day.date);
    
    // Show all users - no filtering
    const visibleUsers = usersWithTasks;
    const hasTasks = visibleUsers.length > 0;

    // Determine background color
    let bgColor = 'bg-gray-50 dark:bg-gray-600';
    let textColor = 'text-gray-600 dark:text-gray-200';
    
    if (hasTasks) {
      bgColor = '';
      textColor = 'text-white font-semibold';
    }

    const style = {};
    if (hasTasks) {
      if (visibleUsers.length > 1) {
        const gradient = generateMultiColorGradient(visibleUsers);
        if (gradient) {
          style.background = gradient;
        }
      } else if (visibleUsers.length === 1) {
        style.backgroundColor = visibleUsers[0].color;
      }
    }

    // Prepare tooltip content with unique users (only users with tasks)
    let tooltipContent = '';
    
    if (dayData && hasTasks) {
      // Ensure unique users by userUID
      const uniqueUsersMap = new Map();
      visibleUsers.forEach(userData => {
        const uid = userData.userUID;
        if (!uniqueUsersMap.has(uid)) {
          uniqueUsersMap.set(uid, userData);
        }
      });
      const uniqueUsers = Array.from(uniqueUsersMap.values());
      
      tooltipContent = (
        <div className="space-y-2">
          <div className="font-semibold text-sm">
            {format(day.date, 'EEEE, MMMM dd, yyyy')}
          </div>
          <div className="text-xs space-y-1">
            <div>Total Tasks: <strong>{dayData.totalTasks}</strong></div>
            <div>Total Hours: <strong>{dayData.totalHours.toFixed(1)}h</strong></div>
            {uniqueUsers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                <div className="font-medium mb-1">By User:</div>
                {uniqueUsers.map((userData) => (
                  <div key={`${userData.userUID}-${day.date.getTime()}`} className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: userData.color }}
                    />
                    <span className="text-xs">
                      <strong>{userData.userName}</strong>: {userData.tasksCount} task{userData.tasksCount !== 1 ? 's' : ''} ({userData.hours.toFixed(1)}h)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      tooltipContent = (
        <div className="text-sm">
          {format(day.date, 'EEEE, MMMM dd, yyyy')}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">No tasks</div>
        </div>
      );
    }

    return (
      <Tooltip
        key={`${dayIndex}-${dateString}`}
        content={tooltipContent}
      >
        <div
          className={`
            rounded text-sm flex flex-col items-center justify-center relative
            ${bgColor} ${textColor}
          `}
          style={{ ...style, aspectRatio: '1 / 1' }}
        >
          <span>{day.date.getDate()}</span>
          {hasTasks && dayData && (
            <span className="text-[10px] font-semibold mt-0.5">
              {dayData.totalTasks}
            </span>
          )}
        </div>
      </Tooltip>
    );
  }, [getUsersWithTasksOnDate]);

  return (
    <DynamicCalendar
      initialMonth={new Date(currentYear, 0, 1)}
      getDayData={getDayData}
      renderDay={renderDay}
      onMonthChange={(year) => setCurrentYear(year)}
      config={{
        title: 'Tasks Calendar',
        description: 'View all tasks organized by date with user color coding',
        showNavigation: true,
        showMultipleMonths: true,
        emptyMessage: 'No tasks found',
        emptyCheck: ({ hasData }) => !hasData && filteredTasks.length === 0,
        className: 'card p-6 space-y-6'
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentYear(prev => prev - 1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            aria-label="Previous year"
          >
            <Icons.buttons.chevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear(prev => prev + 1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            aria-label="Next year"
          >
            <Icons.buttons.chevronRight className="w-5 h-5" />
          </button>
        </div>
      }
    >
      {/* Color Legend */}
      <ColorLegend
        users={allUsersWithTasks}
        selectedUserId={null}
        countLabel="tasks"
        getCount={(user) => user.tasksCount}
      />
    </DynamicCalendar>
  );
};

export default TasksCalendar;

