import React from 'react';
import { formatDate } from '@/utils/dateUtils';

/**
 * Table Cell Components - Eliminates duplication in table column logic
 * Reusable components for common table cell patterns
 */

/**
 * Safe display utility - handles null/undefined values and arrays
 */
export const safeDisplay = (value, fallback = "-") => {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    return value.join(", ") || fallback;
  }
  return String(value) || fallback;
};

/**
 * User Avatar Cell - Reusable for Users and Reporters tables
 */
export const UserAvatarCell = ({ 
  user, 
  gradient = "from-purple-500 to-purple-600",
  showEmail = false 
}) => {
  const userName = user.name || 'No Name';
  const userSymbol = userName.substring(0, 2).toUpperCase();
  
  return (
    <div className="flex items-center">
      <div className="flex-shrink-0 h-10 w-10">
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-sm font-medium text-white">
            {userSymbol}
          </span>
        </div>
      </div>
      <div className="ml-4">
        <div className="text-sm font-medium text-white">
          {userName}
        </div>
        {showEmail && user.email && (
          <div className="text-xs text-gray-400">
            {user.email}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Date Cell - Standardized date formatting
 */
export const DateCell = ({ 
  value, 
  format = 'MMM d, yyyy',
  fallback = "-" 
}) => {
  if (!value) return fallback;
  return formatDate(value, format);
};

/**
 * Role Badge Cell - Standardized role display
 */
export const RoleBadgeCell = ({ role }) => {
  const getRoleStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'reporter':
        return 'bg-blue-100 text-blue-800';
      case 'user':
      default:
        return 'bg-green-100 text-green-800';
    }
  };
  
  const displayRole = role || 'user';
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleStyle(displayRole)}`}>
      {displayRole}
    </span>
  );
};

/**
 * Jira Link Cell - Standardized Jira link display
 */
export const JiraLinkCell = ({ taskName }) => {
  if (!taskName) return 'No Link';
  
  const jiraUrl = `https://gmrd.atlassian.net/browse/${taskName}`;
  
  return (
    <a 
      href={jiraUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-sm break-all"
    >
      {taskName}
    </a>
  );
};

/**
 * Hours Cell - Standardized hours display
 */
export const HoursCell = ({ value, fallback = "0" }) => {
  const hours = parseFloat(value) || 0;
  return hours > 0 ? hours.toFixed(1) : fallback;
};

/**
 * AI Models Cell - Standardized AI models display
 */
export const AIModelsCell = ({ aiModels, fallback = "-" }) => {
  if (Array.isArray(aiModels) && aiModels.length > 0) {
    return safeDisplay(aiModels.join(', '));
  }
  return fallback;
};

/**
 * AI Time Cell - Standardized AI time display
 */
export const AITimeCell = ({ aiTime, fallback = "-" }) => {
  if (typeof aiTime === 'number' && aiTime > 0) {
    return aiTime.toFixed(1);
  }
  return fallback;
};

/**
 * AI Used Cell - Standardized AI usage indicator
 */
export const AIUsedCell = ({ aiModels, fallback = "-" }) => {
  if (Array.isArray(aiModels) && aiModels.length > 0) {
    return "✓";
  }
  return fallback;
};

/**
 * Deliverables Cell - Standardized deliverables display
 */
export const DeliverablesCell = ({ deliverables, fallback = "-" }) => {
  if (Array.isArray(deliverables) && deliverables.length > 0) {
    return safeDisplay(deliverables.join(', '));
  }
  return fallback;
};

/**
 * Deliverables Count Cell - Standardized deliverables count
 */
export const DeliverablesCountCell = ({ deliverables, fallback = 0 }) => {
  if (Array.isArray(deliverables)) {
    return deliverables.length;
  }
  return fallback;
};

/**
 * Reporter Cell - Standardized reporter display
 */
export const ReporterCell = ({ reporterId, reporters }) => {
  if (!reporterId) return "-";
  
  const reporter = reporters.find(r => r.id === reporterId);
  
  if (reporter) {
    return reporter.name || reporter.email || reporterId;
  }
  
  return reporterId;
};

/**
 * Checkbox Cell - Standardized checkbox display
 */
export const CheckboxCell = ({ value, fallback = "-" }) => {
  return value ? "✓" : fallback;
};
