import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, getDaysInMonth, eachMonthOfInterval, isSameDay, parseISO } from 'date-fns';
import { Icons } from '@/components/icons';
import { useTeamDaysOff } from '../teamDaysOffApi';
import { useAuth } from '@/context/AuthContext';
import { useAppDataContext } from '@/context/AppDataContext';
import { useUsers } from '@/features/users/usersApi';
import SearchableSelectField from '@/components/forms/components/SearchableSelectField';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import Tooltip from '@/components/ui/Tooltip/Tooltip';
import { showSuccess, showError } from '@/utils/toast';
import { logger } from '@/utils/logger';
import { formatDateString } from '@/utils/dateUtils';
import TeamDaysOffFormModal from './TeamDaysOffFormModal';
import DynamicCalendar, { getUserColor, generateMultiColorGradient, generateCalendarDays, BaseCalendarGrid } from '@/components/Calendar/DynamicCalendar';

/**
 * Calendar component to display and manage days off for users
 * Supports admin and regular user flows
 */
const DaysOffCalendar = ({ teamDaysOff: propTeamDaysOff = [] }) => {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  // Use real-time data from hook - prop is redundant since hook provides real-time updates
  const { teamDaysOff: realTimeTeamDaysOff = [], addOffDays, removeOffDays } = useTeamDaysOff();
  // Always use real-time data from hook (prop is legacy/fallback, but hook should always have data)
  const teamDaysOff = realTimeTeamDaysOff.length > 0 ? realTimeTeamDaysOff : propTeamDaysOff;
  
  // Get users from AppDataContext (includes color_set from database)
  // Falls back to useUsers() API if context doesn't have users
  // Both sources include the color_set field from the users collection
  // Memoize to avoid unnecessary re-renders
  const appData = useAppDataContext();
  const { users: contextUsers = [] } = appData || {};
  const { users: apiUsers = [] } = useUsers();
  const allUsers = useMemo(() => {
    return contextUsers.length > 0 ? contextUsers : apiUsers;
  }, [contextUsers, apiUsers]);

  // Admin starts with no user selected (can select any user)
  // Regular users automatically have themselves selected
  const [selectedUserId, setSelectedUserId] = useState(isAdmin ? '' : (authUser?.userUID || ''));
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // For regular users, ensure they always have themselves selected
  useEffect(() => {
    if (!isAdmin && authUser?.userUID && !selectedUserId) {
      setSelectedUserId(authUser.userUID);
    }
  }, [isAdmin, authUser, selectedUserId]);
  
  // State for date selection
  const [selectedDates, setSelectedDates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [recentlySavedDates, setRecentlySavedDates] = useState([]); // Track recently saved dates for email
  const [showEntryModal, setShowEntryModal] = useState(false);

  // Get selected user
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return allUsers.find(u => (u.userUID || u.id) === selectedUserId);
  }, [selectedUserId, allUsers]);

  // Get user's color from database color_set field
  const userColor = useMemo(() => {
    if (!selectedUser) return '#64748B'; // gray
    return getUserColor(selectedUser);
  }, [selectedUser]);

  // Get selected user's team days off entry
  const selectedUserEntry = useMemo(() => {
    if (!selectedUserId) return null;
    return teamDaysOff.find(e => (e.userUID || e.userId) === selectedUserId);
  }, [teamDaysOff, selectedUserId]);

  // Get selected user's off days
  // Create a new array reference to ensure reactivity when offDays changes
  const selectedUserOffDays = useMemo(() => {
    if (!selectedUserEntry?.offDays) return [];
    // Create a new array reference to ensure React detects changes
    return Array.isArray(selectedUserEntry.offDays) ? [...selectedUserEntry.offDays] : [];
  }, [selectedUserEntry?.offDays, selectedUserEntry?.id]);

  // Check if selected user has available days (baseDays > 0 or daysTotal > 0)
  const hasAvailableDays = useMemo(() => {
    if (!selectedUserEntry) return false;
    const baseDays = selectedUserEntry.baseDays || 0;
    const daysTotal = selectedUserEntry.daysTotal || 0;
    return baseDays > 0 || daysTotal > 0;
  }, [selectedUserEntry]);

  // Check if a date is a weekend (Saturday = 6, Sunday = 0)
  const isWeekend = useCallback((date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }, []);

  // Check if a date is in the past
  const isPastDate = useCallback((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  }, []);

  // Check if a date is disabled (weekend or past)
  const isDateDisabled = useCallback((date) => {
    return isWeekend(date) || isPastDate(date);
  }, [isWeekend, isPastDate]);

  // Create lookup map for date -> users (optimized to avoid filtering on every render)
  // This updates in real-time when teamDaysOff changes
  const dateToUsersMap = useMemo(() => {
    const map = new Map();
    teamDaysOff.forEach(entry => {
      const userUID = entry.userUID || entry.userId;
      if (!userUID) return;
      
      const user = allUsers.find(u => (u.userUID || u.id) === userUID);
      if (!user) return;
      
      const offDays = Array.isArray(entry.offDays) ? entry.offDays : [];
      offDays.forEach(offDay => {
        // Handle offDay format: can be { dateString, year, month, day } object or Date/string
        let dateString;
        if (typeof offDay === 'string') {
          dateString = offDay;
        } else if (offDay && typeof offDay === 'object') {
          // If it has dateString property, use it
          if (offDay.dateString) {
            dateString = offDay.dateString;
          } 
          // Otherwise construct from year/month/day
          else if (offDay.year && offDay.month && offDay.day) {
            const month = String(offDay.month).padStart(2, '0');
            const day = String(offDay.day).padStart(2, '0');
            dateString = `${offDay.year}-${month}-${day}`;
          }
          // Otherwise try to format as date
          else {
            dateString = formatDateString(offDay);
          }
        } else {
          dateString = formatDateString(offDay);
        }
        
        if (!dateString) return;
        
        if (!map.has(dateString)) {
          map.set(dateString, []);
        }
        map.get(dateString).push({
          userUID,
          userName: user.name || user.email || 'Unknown',
          color: getUserColor(user)
        });
      });
    });
    return map;
  }, [teamDaysOff, allUsers]);

  // Check if a date is an off day for the selected user
  const isDateOff = useCallback((date) => {
    if (!selectedUserId) return false;
    const dateString = formatDateString(date);
    const usersOff = dateToUsersMap.get(dateString) || [];
    return usersOff.some(u => u.userUID === selectedUserId);
  }, [selectedUserId, dateToUsersMap]);

  // Check if a date is selected (temporarily, not saved)
  const isDateSelected = useCallback((date) => {
    if (!selectedUserId) return false;
    const dateString = formatDateString(date);
    return selectedDates.some(d => formatDateString(d) === dateString);
  }, [selectedUserId, selectedDates]);

  // Get users who have off on a specific date
  const getUsersOffOnDate = useCallback((date) => {
    const dateString = formatDateString(date);
    return dateToUsersMap.get(dateString) || [];
  }, [dateToUsersMap]);

  // Get day data for a specific date (for DynamicCalendar)
  const getDayData = useCallback((date) => {
    const isOff = selectedUserId ? isDateOff(date) : false;
    const isSelected = selectedUserId ? isDateSelected(date) : false;
    const usersOff = getUsersOffOnDate(date);
    const isDisabled = isDateDisabled(date);
    
    return {
      isOff,
      isSelected,
      usersOff,
      isDisabled,
      canSelect: selectedUserId && hasAvailableDays && !isOff && !isDisabled
    };
  }, [selectedUserId, hasAvailableDays, isDateOff, isDateSelected, getUsersOffOnDate, isDateDisabled]);

  // Get all users with their assigned colors for legend
  // Admin sees all users, regular users see only themselves
  // Colors are from database color_set field
  const allUsersWithColors = useMemo(() => {
    return allUsers.map(user => {
      const userUID = user.userUID || user.id;
      const userName = user.name || user.email || 'Unknown';
      
      // Get color from database color_set field
      const color = getUserColor(user);
      
      // Find off days for this user
      const entry = teamDaysOff.find(e => (e.userUID || e.userId) === userUID);
      // Ensure offDays is always an array and create a new reference for reactivity
      const offDays = Array.isArray(entry?.offDays) ? [...entry.offDays] : [];
      
      return {
        userUID,
        userName,
        color,
        offDays
      };
    }).filter(user => {
      // For regular users, only show themselves
      if (!isAdmin && user.userUID !== authUser?.userUID) {
        return false;
      }
      return true;
    });
  }, [allUsers, teamDaysOff, isAdmin, authUser]);

  // Get all users with off days (for calendar display)
  const usersWithOffDays = useMemo(() => {
    return allUsersWithColors.filter(user => user.offDays.length > 0);
  }, [allUsersWithColors]);

  // Handle date click
  const handleDateClick = useCallback((date) => {
    if (!selectedUserId) {
      showError('Please select a user first');
      return;
    }

    // Check if user has available days
    if (!hasAvailableDays) {
      showError('User has no available days off. Please add base days first.');
      return;
    }

    // Check if date is disabled (weekend or past)
    if (isDateDisabled(date)) {
      if (isWeekend(date)) {
        showError('Weekends cannot be selected');
      } else {
        showError('Past dates cannot be selected');
      }
      return;
    }

    const dateString = formatDateString(date);
    
    // Check if date is already saved
    if (isDateOff(date)) {
      // Don't allow clicking on saved dates - use Edit/Remove buttons instead
      return;
    }

    // Toggle selection
    setSelectedDates(prev => {
      const exists = prev.some(d => formatDateString(d) === dateString);
      if (exists) {
        return prev.filter(d => formatDateString(d) !== dateString);
      } else {
        return [...prev, date];
      }
    });
  }, [selectedUserId, isDateOff, isDateDisabled, isWeekend]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!selectedUserId || selectedDates.length === 0) {
      showError('Please select a user and at least one date');
      return;
    }

    setSaving(true);
    try {
      await addOffDays(selectedUserId, selectedDates, authUser);
      showSuccess(`Successfully saved ${selectedDates.length} day(s) off`);
      // Store recently saved dates for email functionality
      setRecentlySavedDates([...selectedDates]);
      setSelectedDates([]); // Clear selections after save
    } catch (error) {
      logger.error('Error saving off days:', error);
      showError(error.message || 'Failed to save off days');
    } finally {
      setSaving(false);
    }
  }, [selectedUserId, selectedDates, addOffDays, authUser]);

  // Handle remove
  const handleRemove = useCallback(async (date) => {
    if (!selectedUserId) return;

    setSaving(true);
    try {
      await removeOffDays(selectedUserId, [date], authUser);
      showSuccess('Day off removed successfully');
    } catch (error) {
      logger.error('Error removing off day:', error);
      showError(error.message || 'Failed to remove off day');
    } finally {
      setSaving(false);
    }
  }, [selectedUserId, removeOffDays, authUser]);

  // Handle send email to HR (for recently saved dates) - Opens mailto: link
  const handleSendEmail = useCallback(() => {
    if (!selectedUserId || recentlySavedDates.length === 0) {
      showError('No saved dates to send email for');
      return;
    }

    // Get selected user info
    const user = selectedUser || allUsers.find(u => (u.userUID || u.id) === selectedUserId);
    const userName = user?.name || user?.email || 'User';
    
    // Format dates for email (format as readable dates)
    const formattedDates = recentlySavedDates.map(date => {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'MMMM dd, yyyy');
    }).join(', ');
    
    // Create email subject
    const subject = encodeURIComponent(`Days Off Request - ${userName}`);
    
    // Create email body
    const body = encodeURIComponent(
      `Hello HR Team,\n\n` +
      `I would like to request the following days off:\n\n` +
      `Dates: ${formattedDates}\n` +
      `Total Days: ${recentlySavedDates.length}\n\n` +
      `Thank you,\n${userName}`
    );
    
    // Open mailto link (using support email from constants or default to hr@company.com)
    const hrEmail = 'hr@company.com'; // You can change this to use a constant if needed
    const mailtoLink = `mailto:${hrEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    
    // Clear recently saved dates after opening email
    setRecentlySavedDates([]);
    showSuccess('Email client opened. Please send the email to HR.');
  }, [selectedUserId, recentlySavedDates, selectedUser, allUsers]);

  // Handle user selection change
  const handleUserSelect = useCallback((userId) => {
    if (!isAdmin && userId !== authUser?.userUID) {
      return; // Regular users can only select themselves
    }
    setSelectedUserId(userId || '');
    setSelectedDates([]); // Clear selections when user changes
    setRecentlySavedDates([]); // Clear recently saved dates
  }, [isAdmin, authUser]);

  // Handle entry modal success
  const handleEntrySuccess = useCallback(() => {
    setShowEntryModal(false);
    // Data will be updated automatically via real-time hook
  }, []);

  // Prepare user options for select
  const userOptions = useMemo(() => {
    if (!isAdmin) {
      // Regular users only see themselves
      return [{
        value: authUser?.userUID || '',
        label: authUser?.name || authUser?.email || 'You'
      }];
    }
    return allUsers.map(user => ({
      value: user.userUID || user.id,
      label: user.name || user.email
    }));
  }, [isAdmin, allUsers, authUser]);

  // Render day cell for days off calendar
  const renderDay = useCallback((day, dayIndex, dayData, monthDate) => {
    if (!dayData) {
      dayData = getDayData(day.date);
    }

    const { isOff, isSelected, usersOff: usersOffData, isDisabled, canSelect } = dayData;
    const usersOff = usersOffData || getUsersOffOnDate(day.date);
    
    // Filter usersOff based on role and selection
    const visibleUsersOff = isAdmin
      ? (selectedUserId 
          ? usersOff.filter(u => u.userUID === selectedUserId)
          : usersOff)
      : usersOff.filter(u => u.userUID === authUser?.userUID);
    
    // Determine background color
    let bgColor = 'bg-gray-50 dark:bg-gray-600';
    let textColor = 'text-gray-600 dark:text-gray-200';
    
    const shouldShowColors = (isOff && selectedUserId) || (!selectedUserId && isAdmin && visibleUsersOff.length > 0) || (selectedUserId && visibleUsersOff.length > 0 && !isOff);
    
    if (isDisabled && visibleUsersOff.length === 0) {
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-400 dark:text-gray-600';
    } else if (shouldShowColors || isSelected) {
      bgColor = '';
      textColor = 'text-white font-semibold';
    }

    const style = {};
    if (isDisabled && visibleUsersOff.length === 0) {
      style.opacity = 0.4;
    } else if (isSelected) {
      style.backgroundColor = userColor;
    } else if (isOff && selectedUserId) {
      style.backgroundColor = userColor;
    } else if (visibleUsersOff.length > 0) {
      const gradient = generateMultiColorGradient(visibleUsersOff);
      if (gradient && visibleUsersOff.length > 1) {
        style.background = gradient;
      } else {
        style.backgroundColor = visibleUsersOff[0].color;
      }
      style.opacity = isDisabled ? 0.6 : 1;
    }

    // Prepare tooltip content
    let tooltipContent = '';
    let tooltipUsers = [];
    
    if (isOff && selectedUserId) {
      tooltipContent = `${selectedUser?.name || 'User'} - Off${isDisabled ? ' (Past date)' : ''}`;
      tooltipUsers = [{
        userName: selectedUser?.name || 'User',
        color: getUserColor(selectedUser)
      }];
    } else if (visibleUsersOff.length > 0) {
      tooltipContent = `${visibleUsersOff.length > 1 ? `${visibleUsersOff.length} users off` : 'User off'}${isDisabled ? ' (Past date)' : ''}`;
      tooltipUsers = visibleUsersOff.map(u => ({
        userUID: u.userUID,
        userName: u.userName,
        color: u.color || getUserColor(u)
      }));
    } else if (isDisabled) {
      tooltipContent = isWeekend(day.date) ? 'Weekend - Cannot be selected' : 'Past date - Cannot be selected';
    } else if (canSelect) {
      tooltipContent = 'Click to select';
    } else if (!hasAvailableDays && selectedUserId) {
      tooltipContent = 'User has no available days off. Add base days first.';
    } else if (!selectedUserId) {
      tooltipContent = isAdmin ? 'Select a user to manage their days off, or view all users\' days off' : 'Your days off';
    }

    return (
      <Tooltip
        key={`${dayIndex}-${formatDateString(day.date)}`}
        content={tooltipContent}
        users={tooltipUsers.length > 0 ? tooltipUsers : []}
      >
        <div
          className={`
            rounded text-sm flex flex-col items-center justify-center relative
            ${bgColor} ${textColor}
            ${canSelect ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors' : 'cursor-not-allowed'}
          `}
          style={{ ...style, aspectRatio: '5 / 3' }}
          onClick={() => canSelect && handleDateClick(day.date)}
        >
          <span>{day.date.getDate()}</span>
          {isOff && selectedUserId && (
            <DynamicButton
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(day.date);
              }}
              className="absolute top-0 right-0 text-[10px] w-3 h-4 min-w-[10px] p-0 flex items-center justify-center bg-red-500/80 hover:bg-red-600 text-white rounded-bl rounded-tr"
              title="Remove"
            >
              ×
            </DynamicButton>
          )}
        </div>
      </Tooltip>
    );
  }, [selectedUserId, isAdmin, authUser, userColor, selectedUser, hasAvailableDays, getDayData, getUsersOffOnDate, isWeekend, handleDateClick, handleRemove]);

  return (
    <div className="days-off-calendar space-y-6">
      {/* User Selection - Above calendar */}
      {isAdmin && (
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select User
          </label>
          <SearchableSelectField
            field={{
              name: "selectedUser",
              type: "select",
              label: "",
              required: false,
              options: userOptions,
              placeholder: "Search users...",
            }}
            register={() => {}}
            errors={{}}
            setValue={(fieldName, value) => {
              if (fieldName === "selectedUser") {
                handleUserSelect(value);
              }
            }}
            watch={() => selectedUserId || ""}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{}}
            noOptionsMessage="No users found"
          />
        </div>
      )}

      {/* Color Legend - Above calendar */}
      {allUsersWithColors.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex justify-start">
            <div className="text-start">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Color Legend
              </h4>
              <div className="flex flex-wrap gap-4 justify-end">
                {allUsersWithColors.map((user) => (
                  <div key={user.userUID} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600" 
                      style={{ backgroundColor: user.color }}
                    />
                    <span className={`text-sm text-gray-700 dark:text-gray-300 ${selectedUserId === user.userUID ? 'font-semibold' : ''}`}>
                      {user.userName} {user.offDays.length > 0 && `(${user.offDays.length} days)`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning message if user has no available days */}
      {selectedUserId && !hasAvailableDays && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icons.generic.warning className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                No Available Days Off
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This user has no base days configured. Please add base days in the table above before selecting days off in the calendar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Above calendar */}
      {selectedUserId && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Entry button - only visible to admins */}
          {isAdmin && (
            <DynamicButton
              variant="secondary"
              size="md"
              onClick={() => setShowEntryModal(true)}
              icon={Icons.buttons.edit}
            >
              Entry
            </DynamicButton>
          )}
          
          <DynamicButton
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={!hasAvailableDays || selectedDates.length === 0 || saving || selectedDates.some(date => isDateOff(date))}
            loading={saving}
            icon={Icons.buttons.save}
          >
            Save ({selectedDates.length})
          </DynamicButton>
          
          {recentlySavedDates.length > 0 && (
            <DynamicButton
              variant="secondary"
              size="md"
              onClick={handleSendEmail}
            >
              Send Email to HR ({recentlySavedDates.length} saved days)
            </DynamicButton>
          )}
        </div>
      )}

      {/* Dynamic Calendar - Show all months */}
      <DynamicCalendar
        initialMonth={new Date(currentYear, 0, 1)}
        getDayData={getDayData}
        renderDay={renderDay}
        onMonthChange={(year) => setCurrentYear(year)}
        config={{
          title: 'Days Off Calendar',
          description: isAdmin ? 'Select a user and manage their days off' : 'Manage your days off',
          showNavigation: true,
          showMultipleMonths: true,
          emptyMessage: 'No days off data',
          emptyCheck: null,
          className: 'card p-6 space-y-6'
        }}
        headerActions={
          <div className="flex items-center gap-2">
            <DynamicButton
              variant="secondary"
              size="md"
              onClick={() => setCurrentYear(prev => prev - 1)}
              icon={Icons.buttons.chevronLeft}
            />
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
              {currentYear}
            </span>
            <DynamicButton
              variant="secondary"
              size="md"
              onClick={() => setCurrentYear(prev => prev + 1)}
              icon={Icons.buttons.chevronRight}
            />
          </div>
        }
      />

      {/* Entry Modal - only visible to admins */}
      {isAdmin && showEntryModal && (
        <TeamDaysOffFormModal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          mode={selectedUserEntry ? "edit" : "create"}
          teamDaysOff={selectedUserEntry || null}
          initialUserId={selectedUserId || null}
          onSuccess={handleEntrySuccess}
        />
      )}
    </div>
  );
};

export default DaysOffCalendar;
