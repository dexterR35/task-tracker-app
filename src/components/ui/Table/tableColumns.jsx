import { createColumnHelper } from '@tanstack/react-table';
import { formatDate } from '@/utils/dateUtils';
import { useMemo } from 'react';

const columnHelper = createColumnHelper();


// Helper function to safely display data
const safeDisplay = (value, fallback = "-") => {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    return value.join(", ") || fallback;
  }
  return String(value) || fallback;
};


// Tasks Table Columns - Memoized to prevent re-renders
export const useTaskColumns = (monthId = null, reporters = []) => {
  return useMemo(() => [
  columnHelper.accessor('id', {
    header: 'Document ID',
    cell: ({ getValue }) => (
      <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
        {getValue() || 'N/A'}
      </div>
    ),
    size: 120,
  }),
  columnHelper.accessor('jiraLink', {
    header: 'Jira Link',
    cell: ({ getValue }) => {
      const jiraLink = getValue();
      if (!jiraLink) return 'No Link';
      return (
        <a 
          href={jiraLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-sm break-all"
        >
          {jiraLink}
        </a>
      );
    },
    size: 200,
  }),
  columnHelper.accessor('departments', {
    header: 'Department',
    cell: ({ getValue }) => {
      const departments = getValue();
      return departments || 'Unnamed Task';
    },
    size: 150,
  }),
  columnHelper.accessor('products', {
    header: 'Product',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('timeInHours', {
    header: 'Hours',
    cell: ({ getValue }) => {
      const hours = parseFloat(getValue()) || 0;
      return hours > 0 ? hours.toFixed(1) : 0;
    },
    size: 80,
  }),
  columnHelper.accessor('aiTime', {
    header: 'AI Hr',
    cell: ({ getValue }) => {
      const aiTime = getValue();
      if (typeof aiTime === 'number' && aiTime > 0) {
        return aiTime.toFixed(1);
      }
      return "-";
    },
    size: 80,
  }),
  columnHelper.accessor('aiModels', {
    header: 'AI Models',
    cell: ({ getValue }) => {
      const aiModels = getValue();
      if (Array.isArray(aiModels) && aiModels.length > 0) {
        return safeDisplay(aiModels.join(', '));
      }
      return "-";
    },
    size: 120,
  }),
  columnHelper.accessor('aiModels', {
    id: 'aiUsed',
    header: 'AI?',
    cell: ({ getValue }) => {
      const aiModels = getValue();
      if (Array.isArray(aiModels) && aiModels.length > 0) {
        return "✓";
      }
      return "-";
    },
    size: 60,
  }),
  columnHelper.accessor('reworked', {
    header: 'Reworked?',
    cell: ({ getValue }) => getValue() ? "✓" : "-",
    size: 100,
  }),
  columnHelper.accessor('deliverables', {
    id: 'deliverablesList',
    header: 'Deliverables',
    cell: ({ getValue }) => {
      const deliverables = getValue();
      if (Array.isArray(deliverables) && deliverables.length > 0) {
        return safeDisplay(deliverables.join(', '));
      }
      return "-";
    },
    size: 120,
  }),
  columnHelper.accessor('deliverables', {
    id: 'deliverablesCount',
    header: 'Nr Deliverables',
    cell: ({ getValue }) => {
      const deliverables = getValue();
      if (Array.isArray(deliverables)) {
        return deliverables.length;
      }
      return 0;
    },
    size: 120,
  }),
  columnHelper.accessor('reporters', {
    header: 'Reporter',
    cell: ({ getValue, row }) => {
      const reporterId = getValue();
      
      // If no reporter ID, return dash
      if (!reporterId) {
        return "-";
      }
      
      // Find the reporter by ID in the reporters array
      const reporter = reporters.find(r => r.id === reporterId);
      
      // Return the reporter name if found, otherwise return the ID
      if (reporter) {
        return reporter.name || reporter.email || reporterId;
      }
      
      // Fallback to the ID if reporter not found
      return reporterId;
    },
    size: 120,
  }),

  columnHelper.accessor('createdByName', {
    header: 'Created By',
    cell: ({ getValue }) => {
      return getValue() || '-';
    },
    size: 120,
  }),
], [monthId, reporters]);
};

// Users Table Columns
export const getUserColumns = (monthId = null) => [
  columnHelper.accessor('name', {
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      const userName = user.name || 'No Name';
      const userSymbol = userName.substring(0, 2).toUpperCase();
      
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {userSymbol}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-white">
              {userName}
            </div>
          </div>
        </div>
      );
    },
    size: 200,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 200,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: ({ getValue }) => {
      const role = getValue() || 'user';
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
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleStyle(role)}`}>
          {role}
        </span>
      );
    },
    size: 100,
  }),
  columnHelper.accessor('occupation', {
    header: 'Occupation',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 150,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: ({ getValue }) => formatDate(getValue(), 'MMM d, yyyy'),
    size: 120,
  }),
];


// Reporters Table Columns
export const getReporterColumns = (monthId = null) => [
  columnHelper.accessor('name', {
    header: 'Reporter',
    cell: ({ row }) => {
      const reporter = row.original;
      const reporterName = reporter.name || 'No Name';
      const reporterSymbol = reporterName.substring(0, 2).toUpperCase();
      
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {reporterSymbol}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-white">
              {reporterName}
            </div>
          </div>
        </div>
      );
    },
    size: 200,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 200,
  }),
  columnHelper.accessor('departament', {
    header: 'Department',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 150,
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 100,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: ({ getValue }) => formatDate(getValue(), 'MMM d, yyyy'),
    size: 120,
  }),
];
// Column factory function
export const getColumns = (tableType, monthId = null, reporters = []) => {
  switch (tableType) {
    case 'tasks':
      // Note: For tasks, use useTaskColumns hook directly in components for better performance
      return [];
    case 'users':
      return getUserColumns(monthId);
    case 'reporters':
      return getReporterColumns(monthId);
    default:
      return [];
  }
};
