import { createColumnHelper } from '@tanstack/react-table';
import { formatDate } from '@/utils/dateUtils';

const columnHelper = createColumnHelper();

// Simple task display formatter
const formatTaskDisplayName = (taskId, taskNumber) => {
  if (!taskId) return 'Unknown Task';
  return taskNumber || taskId;
};

// Helper function to safely display data
const safeDisplay = (value, fallback = "-") => {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    return value.join(", ") || fallback;
  }
  return String(value) || fallback;
};

// Helper function to format numbers
const numberFmt = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : 0);

// Tasks Table Columns
export const getTaskColumns = (monthId = null, reporters = []) => [
  columnHelper.accessor('id', {
    header: '# ID',
    cell: ({ getValue, row }) => {
      const taskId = getValue();
      const taskNumber = row.original.taskNumber;
      return formatTaskDisplayName(taskId, taskNumber);
    },
    size: 80,
  }),
  columnHelper.accessor('departments', {
    header: 'Department',
    cell: ({ getValue }) => {
      const departments = getValue();
      return departments || 'Unnamed Task';
    },
    size: 150,
  }),
  columnHelper.accessor('markets', {
    header: 'Markets',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('products', {
    header: 'Product',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('timeInHours', {
    header: 'Hours',
    cell: ({ getValue }) => numberFmt(parseFloat(getValue()) || 0),
    size: 80,
  }),
  columnHelper.accessor('aiTime', {
    header: 'AI Hr',
    cell: ({ getValue }) => {
      const aiTime = getValue();
      if (typeof aiTime === 'number' && aiTime > 0) {
        return numberFmt(aiTime);
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
      const taskData = row.original;
      
      // Debug logging
      console.log('Full task data:', taskData);
      console.log('Reporter ID from task:', reporterId);
      console.log('Available reporters:', reporters);
      
      // If no reporter ID, return dash
      if (!reporterId) {
        return "-";
      }
      
      // Find the reporter by ID in the reporters array
      const reporter = reporters.find(r => r.id === reporterId);
      console.log('Found reporter:', reporter);
      
      // Return the reporter name if found, otherwise return the ID
      if (reporter) {
        const name = reporter.name || reporter.email || reporterId;
        console.log('Returning reporter name:', name);
        return name;
      }
      
      // Fallback to the ID if reporter not found
      console.log('Reporter not found, returning ID:', reporterId);
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
];

// Users Table Columns
export const getUserColumns = (monthId = null) => [
  columnHelper.accessor('name', {
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-white">
              {user.name || 'No Name'}
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
      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {(reporter.name || 'R').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-white">
              {reporter.name || 'No Name'}
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
      const role = getValue() || 'reporter';
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {role}
        </span>
      );
    },
    size: 120,
  }),
  columnHelper.accessor('departament', {
    header: 'Department',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 150,
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
// Column factory function
export const getColumns = (tableType, monthId = null, reporters = []) => {
  switch (tableType) {
    case 'tasks':
      return getTaskColumns(monthId, reporters);
    case 'users':
      return getUserColumns(monthId);
    case 'reporters':
      return getReporterColumns(monthId);
    default:
      return [];
  }
};
