import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useAppDataContext } from '@/context/AppDataContext';
import { useUsers } from '@/features/users/usersApi';
import { useAuth } from '@/context/AuthContext';
import Tooltip from '@/components/ui/Tooltip/Tooltip';
import { normalizeTimestamp, formatDateString, parseMonthId } from '@/utils/dateUtils';
import { filterTasksByUserAndReporter } from '@/utils/taskFilters';
import DynamicCalendar, { getUserColor, generateMultiColorGradient } from '@/components/Calendar/DynamicCalendar';

/**
 * Tasks Calendar Component
 * Shows tasks per day with user colors (same as DaysOffCalendar)
 * Uses filters from dashboard cards/filters
 */
const TasksCalendar = ({ 
  tasks = [],
  selectedUserId = null,
  selectedReporterId = null,
  monthId = null
}) => {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  
  const appData = useAppDataContext();
  const { users: contextUsers = [] } = appData || {};
  const { users: apiUsers = [] } = useUsers();
  const allUsers = useMemo(() => {
    return contextUsers.length > 0 ? contextUsers : apiUsers;
  }, [contextUsers, apiUsers]);

  // Get selected month date from monthId
  const selectedMonthDate = useMemo(() => {
    if (!monthId) {
      // If no monthId, use current month
      return new Date();
    }
    try {
      return parseMonthId(monthId);
    } catch {
      return new Date();
    }
  }, [monthId]);


  // Filter tasks based on dashboard filters (including monthId - calendar shows only selected month)
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    // Filter by user, reporter, AND monthId (calendar shows only selected month)
    return filterTasksByUserAndReporter(tasks, {
      selectedUserId: selectedUserId || null,
      selectedReporterId: selectedReporterId || null,
      currentMonthId: monthId || null, // Filter by selected month
      isUserAdmin: isAdmin,
      currentUserUID: authUser?.userUID || null,
    });
  }, [tasks, selectedUserId, selectedReporterId, monthId, isAdmin, authUser?.userUID]);

  // Group tasks by date and user
  const tasksByDate = useMemo(() => {
    const map = new Map();
    
    filteredTasks.forEach(task => {
      // Get task date - use creation date (when task was added), not start/end date
      let taskDate = task.createdAt || 
                     task.timestamp ||
                     task.data_task?.createdAt ||
                     task.data_task?.timestamp;
      
      if (!taskDate) return;
      
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
            taskDate: taskDate,
            task: task
          });
        }
        return;
      }
      
      // Use local date components to avoid timezone issues
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
      
      // Get user
      const userUID = task.data_task?.userUID || task.userUID || task.userId;
      if (userUID) {
        const user = allUsers.find(u => (u.userUID || u.id) === userUID);
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

  // Get users with tasks for legend (only show users that match current filters)
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
    
    // Filter users based on selected filters
    return Array.from(userMap.values()).filter(user => {
      // If a user is selected, only show that user
      if (selectedUserId && user.userUID !== selectedUserId) {
        return false;
      }
      // Regular users only see themselves
      if (!isAdmin && user.userUID !== authUser?.userUID) {
        return false;
      }
      return true;
    });
  }, [tasksByDate, isAdmin, authUser, selectedUserId]);

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
    
    // Filter users based on dashboard filters
    let visibleUsers = usersWithTasks;
    
    // If a user is selected in dashboard, only show that user
    if (selectedUserId) {
      visibleUsers = usersWithTasks.filter(u => u.userUID === selectedUserId);
    } else if (!isAdmin) {
      // Regular users only see themselves
      visibleUsers = usersWithTasks.filter(u => u.userUID === authUser?.userUID);
    }
    // Admin with no user filter sees all users
    
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
  }, [selectedUserId, isAdmin, authUser, getUsersWithTasksOnDate]);

  return (
    <DynamicCalendar
      initialMonth={selectedMonthDate}
      getDayData={getDayData}
      renderDay={renderDay}
      config={{
        title: 'Tasks Calendar',
        description: 'View tasks organized by date with user color coding',
        showNavigation: true,
        showMultipleMonths: false,
        emptyMessage: 'No tasks found',
        emptyCheck: ({ hasData }) => !hasData && filteredTasks.length === 0,
        monthClassName: 'border-2 border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20',
        selectedMonthId: monthId,
        selectedMonthClassName: 'border-blue-500 dark:border-blue-400 border-2 shadow-md'
      }}
    >
      {/* Color Legend */}
      {allUsersWithTasks.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex justify-start">
            <div className="text-start">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Color Legend
              </h4>
              <div className="flex flex-wrap gap-4 justify-end">
                {allUsersWithTasks.map((user) => (
                  <div key={user.userUID} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600" 
                      style={{ backgroundColor: user.color }}
                    />
                    <span className={`text-sm text-gray-700 dark:text-gray-300 ${selectedUserId === user.userUID ? 'font-semibold' : ''}`}>
                      {user.userName} ({user.tasksCount} tasks)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DynamicCalendar>
  );
};

export default TasksCalendar;

