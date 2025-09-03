import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { formatTaskDisplayName } from '../../forms/utils/sanitization';
import { normalizeTimestamp, formatDate } from '@/utils/dateUtils';

const columnHelper = createColumnHelper();

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
export const getTaskColumns = (monthId = null) => [
  columnHelper.accessor('id', {
    header: '# ID',
    cell: ({ getValue, row }) => {
      const taskId = getValue();
      const taskNumber = row.original.taskNumber;
      return formatTaskDisplayName(taskId, taskNumber);
    },
    size: 80,
  }),
  columnHelper.accessor('taskName', {
    header: 'Task Name',
    cell: ({ getValue, row }) => {
      const taskName = getValue();
      const taskId = row.original.id;
      const taskNumber = row.original.taskNumber;
      const displayId = formatTaskDisplayName(taskId, taskNumber);
      return `${taskName} (${displayId})`;
    },
    size: 150,
  }),
  columnHelper.accessor('markets', {
    header: 'Markets',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('product', {
    header: 'Product',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('timeInHours', {
    header: 'Hours',
    cell: ({ getValue }) => numberFmt(parseFloat(getValue()) || 0),
    size: 80,
  }),
  columnHelper.accessor('timeSpentOnAI', {
    header: 'AI Hr',
    cell: ({ getValue }) => numberFmt(parseFloat(getValue()) || 0),
    size: 80,
  }),
  columnHelper.accessor('aiModels', {
    header: 'AI Models',
    cell: ({ row }) => {
      const aiUsed = row.original.aiUsed;
      const aiModels = row.original.aiModels || row.original.aiModel;
      return aiUsed && aiModels ? safeDisplay(aiModels) : "-";
    },
    size: 120,
  }),
  columnHelper.accessor('aiUsed', {
    header: 'AI?',
    cell: ({ getValue }) => getValue() ? "✓" : "-",
    size: 60,
  }),
  columnHelper.accessor('reworked', {
    header: 'Reworked?',
    cell: ({ getValue }) => getValue() ? "✓" : "-",
    size: 100,
  }),
  columnHelper.accessor('deliverables', {
    header: 'Deliverables',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('reporters', {
    header: 'Reporters',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('deliverablesCount', {
    header: 'Nr Deliverables',
    cell: ({ getValue }) => Number(getValue()) || 0,
    size: 120,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: ({ getValue }) => formatDate(getValue(), 'MMM d, yyyy'),
    size: 100,
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
export const getColumns = (tableType, monthId = null) => {
  switch (tableType) {
    case 'tasks':
      return getTaskColumns(monthId);
    case 'users':
      return getUserColumns(monthId);
    case 'reporters':
      return getReporterColumns(monthId);
    default:
      return [];
  }
};
