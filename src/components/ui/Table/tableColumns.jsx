import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import {
  safeDisplay,
  UserAvatarCell,
  DateCell,
  RoleBadgeCell,
  JiraLinkCell,
  HoursCell,
  AIModelsCell,
  AITimeCell,
  AIUsedCell,
  DeliverablesCell,
  DeliverablesCountCell,
  ReporterCell,
  CheckboxCell
} from './TableCellComponents';

const columnHelper = createColumnHelper();


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
  columnHelper.accessor('data_task.taskName', {
    header: 'Jira Link',
    cell: ({ getValue }) => <JiraLinkCell taskName={getValue()} />,
    size: 200,
  }),
  columnHelper.accessor('data_task.departments', {
    header: 'Department',
    cell: ({ getValue }) => {
      const departments = getValue();
      return departments || 'Unnamed Task';
    },
    size: 150,
  }),
  columnHelper.accessor('data_task.products', {
    header: 'Product',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 120,
  }),
  columnHelper.accessor('data_task.timeInHours', {
    header: 'Hours',
    cell: ({ getValue }) => <HoursCell value={getValue()} />,
    size: 80,
  }),
  columnHelper.accessor('data_task.usedAI.aiTime', {
    header: 'AI Hr',
    cell: ({ getValue, row }) => {
      const dataTask = row.original.data_task;
      const aiTime = dataTask?.usedAI?.aiTime;
      return <AITimeCell aiTime={aiTime} />;
    },
    size: 80,
  }),
  columnHelper.accessor('data_task.usedAI.aiModels', {
    header: 'AI Models',
    cell: ({ getValue, row }) => {
      const dataTask = row.original.data_task;
      const aiModels = dataTask?.usedAI?.aiModels;
      return <AIModelsCell aiModels={aiModels} />;
    },
    size: 120,
  }),
  columnHelper.accessor('data_task.usedAI.aiModels', {
    id: 'aiUsed',
    header: 'AI?',
    cell: ({ getValue, row }) => {
      const dataTask = row.original.data_task;
      const aiModels = dataTask?.usedAI?.aiModels;
      return <AIUsedCell aiModels={aiModels} />;
    },
    size: 60,
  }),
  columnHelper.accessor('reworked', {
    header: 'Reworked?',
    cell: ({ getValue }) => <CheckboxCell value={getValue()} />,
    size: 100,
  }),
  columnHelper.accessor('deliverables', {
    id: 'deliverablesList',
    header: 'Deliverables',
    cell: ({ getValue }) => <DeliverablesCell deliverables={getValue()} />,
    size: 120,
  }),
  columnHelper.accessor('deliverables', {
    id: 'deliverablesCount',
    header: 'Nr Deliverables',
    cell: ({ getValue }) => <DeliverablesCountCell deliverables={getValue()} />,
    size: 120,
  }),
  columnHelper.accessor('reporters', {
    header: 'Reporter',
    cell: ({ getValue }) => <ReporterCell reporterId={getValue()} reporters={reporters} />,
    size: 120,
  }),

  columnHelper.accessor('createdByName', {
    header: 'Created By',
    cell: ({ getValue }) => {
      return getValue() || '-';
    },
    size: 120,
  }),
  columnHelper.accessor('dataInfo', {
    header: 'Data Info',
    cell: ({ getValue }) => {
      const dataInfo = getValue();
      if (!Array.isArray(dataInfo) || dataInfo.length === 0) {
        return <span className="text-gray-400">No data</span>;
      }
      
      const latestEntry = dataInfo[dataInfo.length - 1];
      return (
        <div className="text-xs">
          <div className="font-medium text-gray-900 dark:text-white">
            {latestEntry.name || 'Unknown'}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            by {latestEntry.createdbyname || 'Unknown'}
          </div>
          <div className="text-gray-400">
            {dataInfo.length} entry{dataInfo.length !== 1 ? 'ies' : ''}
          </div>
        </div>
      );
    },
    size: 150,
  }),
], [monthId, reporters]);
};

// Users Table Columns
export const getUserColumns = (monthId = null) => [
  columnHelper.accessor('name', {
    header: 'User',
    cell: ({ row }) => <UserAvatarCell user={row.original} />,
    size: 200,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 200,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: ({ getValue }) => <RoleBadgeCell role={getValue()} />,
    size: 100,
  }),
  columnHelper.accessor('occupation', {
    header: 'Occupation',
    cell: ({ getValue }) => safeDisplay(getValue()),
    size: 150,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: ({ getValue }) => <DateCell value={getValue()} />,
    size: 120,
  }),
];


// Reporters Table Columns
export const getReporterColumns = (monthId = null) => [
  columnHelper.accessor('name', {
    header: 'Reporter',
    cell: ({ row }) => <UserAvatarCell user={row.original} gradient="from-green-500 to-green-600" />,
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
    cell: ({ getValue }) => <DateCell value={getValue()} />,
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
