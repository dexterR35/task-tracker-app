import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import Badge from '@/components/ui/Badge/Badge';
import Avatar from '@/components/ui/Avatar';
import { formatDate } from '@/utils/dateUtils';

const columnHelper = createColumnHelper();


// Tasks Table Columns - Memoized to prevent re-renders
export const useTaskColumns = (monthId = null, reporters = []) => {
  // Ensure reporters is always an array to prevent hooks issues
  const stableReporters = Array.isArray(reporters) ? reporters : [];
  
  return useMemo(() => [
  columnHelper.accessor('data_task.taskName', {
    header: 'Jira Link',
    cell: ({ getValue, row }) => {
      const taskName = getValue() || row.original?.data_task?.taskName || null;
      if (!taskName) return 'No Link';
      
      const jiraUrl = `https://gmrd.atlassian.net/browse/${taskName}`;
      
      return (
        <a 
          href={jiraUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {taskName}
        </a>
      );
    },
    size: 200,
  }),
  columnHelper.accessor((row) => row.data_task?.departments, {
    id: 'departments',
    header: 'Department',
    cell: ({ getValue, row }) => {
      // Check if data_task exists
      if (!row.original?.data_task) {
        return <span className="text-red-500 text-xs">❌ No data_task</span>;
      }
      
      const value = getValue();
      return value || <span className="text-red-500 text-xs">❌ Missing</span>;
    },
    size: 150,
  }),
  columnHelper.accessor((row) => row.data_task?.products, {
    id: 'products',
    header: 'Product',
    cell: ({ getValue }) => {
      const value = getValue();
      return value || '-';
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.markets, {
    id: 'markets',
    header: 'Markets',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value || !Array.isArray(value)) return '-';
      return value.join(', ');
    },
    size: 150,
  }),
  columnHelper.accessor((row) => row.data_task?.aiModels, {
    id: 'aiModels',
    header: 'AI Models',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value || !Array.isArray(value) || value.length === 0) return '-';
      return value.join(', ');
    },
    size: 150,
  }),
  columnHelper.accessor((row) => row.data_task?.deliverables, {
    id: 'deliverables',
    header: 'Deliverables',
    cell: ({ getValue, row }) => {
      const deliverables = getValue();
      const customDeliverables = row.original?.data_task?.customDeliverables;
      
      let allDeliverables = [];
      if (deliverables && Array.isArray(deliverables)) {
        allDeliverables = [...deliverables];
      }
      if (customDeliverables && Array.isArray(customDeliverables)) {
        allDeliverables = [...allDeliverables, ...customDeliverables];
      }
      
      if (allDeliverables.length === 0) return '-';
      return allDeliverables.join(', ');
    },
    size: 200,
  }),

  columnHelper.accessor((row) => row.data_task?.isVip, {
    id: 'isVip',
    header: 'VIP',
    cell: ({ getValue }) => {
      return getValue() ? "✓" : "-";
    },
    size: 40,
  }),
  columnHelper.accessor((row) => row.data_task?.reworked, {
    id: 'reworked',
    header: 'ReWorked',
    cell: ({ getValue }) => {
      return getValue() ? "✓" : "-";
    },
    size: 50,
  }),
  columnHelper.accessor((row) => row.data_task?.reporters, {
    id: 'reporters',
    header: 'Reporter',
    cell: ({ getValue }) => {
      const reporterId = getValue();
      if (!reporterId) return '-';
      const reporter = stableReporters.find(r => r.id === reporterId);
      return reporter?.name || reporterId;
    },
    size: 60,
  }),
  columnHelper.accessor('createdByName', {
    header: 'Created',
    cell: ({ getValue }) => {
      const value = getValue();
      return value || '-';
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.timeInHours, {
    id: 'timeInHours',
    header: 'Task Hr',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? `${value}h` : '-';
    },
    size: 80,
  }),
  columnHelper.accessor((row) => row.data_task?.aiTime, {
    id: 'aiTime',
    header: 'AI Hr',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? `${value}h` : '-';
    },
    size: 80,
  }),

  columnHelper.accessor('createdAt', {
    header: 'Date',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      return formatDate(value, 'dd MMM yyyy, HH:mm', true); 
    },
    size: 60,
  }),
  columnHelper.accessor((row) => row.data_task?.startDate, {
    id: 'startDate',
    header: 'Done',
    cell: ({ getValue, row }) => {
      const startDate = getValue();
      const endDate = row.original?.data_task?.endDate;
      
      if (!startDate || !endDate) return '-';
      
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
      } catch {
        return '-';
      }
    },
    size: 80,
  }),
  columnHelper.accessor((row) => row.data_task?.observations, {
    id: 'observations',
    header: 'Observations',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    },
    size: 200,
  }),
], [monthId, stableReporters]);
};

// Users Table Columns
export const getUserColumns = (monthId = null) => [
  columnHelper.accessor('name', {
    header: 'User',
    cell: ({ row }) => (
      <Avatar 
        user={row.original}
        gradient="from-purple-500 to-purple-600"
        showEmail={false}
        size="md"
      />
    ),
    size: 200,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: ({ getValue }) => {
      return getValue();
    },
    size: 200,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: ({ getValue }) => {
      const role = getValue();
      const getRoleVariant = (role) => {
        switch (role) {
          case 'admin':
            return 'red';
          case 'reporter':
            return 'blue';
          case 'user':
          default:
            return 'green';
        }
      };
      
      const displayRole = role || 'user';
      
      return (
        <Badge variant={getRoleVariant(displayRole)} size="sm">
          {displayRole}
        </Badge>
      );
    },
    size: 100,
  }),
  columnHelper.accessor('occupation', {
    header: 'Occupation',
    cell: ({ getValue }) => {
      return getValue();
    },
    size: 150,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return "-";
      return formatDate(value, 'dd MMM yyyy', true); // Romanian locale
    },
    size: 120,
  }),
];


// Reporters Table Columns
export const getReporterColumns = (monthId = null) => [
  columnHelper.accessor('name', {
    header: 'Reporter',
    cell: ({ row }) => (
      <Avatar 
        user={row.original}
        gradient="from-green-500 to-green-600"
        showEmail={true}
        size="md"
      />
    ),
    size: 200,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: ({ getValue }) => {
      return getValue();
    },
    size: 200,
  }),
  columnHelper.accessor('departament', {
    header: 'Department',
    cell: ({ getValue }) => {
      return getValue();
    },
    size: 150,
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: ({ getValue }) => {
      return getValue();
    },
    size: 100,
  }),
  columnHelper.accessor('channel', {
    header: 'Channel',
    cell: ({ getValue }) => {
      return getValue() || '-';
    },
    size: 120,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return "-";
      return formatDate(value, 'dd MMM yyyy', true); // Romanian locale
    },
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
