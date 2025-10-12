import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import Badge from '@/components/ui/Badge/Badge';
import Avatar from '@/components/ui/Avatar/Avatar';
import { formatDate } from '@/utils/dateUtils';
import { useDeliverableCalculation } from '@/hooks/useDeliverableCalculation';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';
import { TABLE_SYSTEM } from '@/constants';

const columnHelper = createColumnHelper();

// Note: createSelectionColumn is defined locally to avoid duplication
// This function is no longer used since row selection is handled by clicking the row


// Constants
const DATE_FORMATS = TABLE_SYSTEM.DATE_FORMATS;

// Badge variants moved to Badge component

// Utility functions
const formatDateCell = (value, format = DATE_FORMATS.SHORT, showTime = true) => {
  if (!value) return '-';
  return formatDate(value, format, showTime);
};

// getTimeVariant moved to Badge component

const getDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    // Calculate duration from start to end (not absolute difference)
    const diffTime = end - start;
    
    // If end is before start, return 0
    if (diffTime < 0) return 0;
    
    // Calculate calendar days (24 hours per day)
    // Convert milliseconds to days
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Return calendar days (including partial days)
    return Math.ceil(diffDays);
  } catch {
    return null;
  }
};

// Common column cell helpers
const createSimpleCell = (fallback = '-') => ({ getValue }) => getValue() || fallback;
const createDateCell = (format = DATE_FORMATS.SHORT) => ({ getValue }) => formatDateCell(getValue(), format);
const createBooleanCell = (trueText = "✓", falseText = "-") => ({ getValue }) => getValue() ? trueText : falseText;

// Optimized DeliverableCalculationCell component
const DeliverableCalculationCell = ({ deliverablesUsed, isUserAdmin }) => {
  const { deliverablesOptions = [] } = useDeliverablesOptions();
  const { deliverablesList, totalTime } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
  
  if (!deliverablesList?.length) {
    return <span className="text-gray-500 dark:text-gray-400">No deliverables</span>;
  }
  
  return (
    <div className="space-y-1">
      {deliverablesList.map((deliverable, index) => (
        <div key={index} className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {deliverable.quantity}x{deliverable.name}
            {deliverable.declinariQuantity > 0 && (
              <span className="text-orange-600 dark:text-orange-400">
                {' '}+ {deliverable.declinariQuantity} declinari
              </span>
            )}
          </div>
          {isUserAdmin && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {deliverable.configured ? (
                <div className="text-xs block">
                  <div className="block">
                    Base: {deliverable.timePerUnit}{deliverable.timeUnit} × {deliverable.quantity} = {(deliverable.timeInHours * deliverable.quantity).toFixed(1)}h
                    {deliverable.timeUnit === 'min' && (
                      <span> ({(deliverable.timeInHours * deliverable.quantity * 60).toFixed(0)}min)</span>
                    )}
                  </div>
                  {deliverable.declinariQuantity > 0 && (
                    <div className="block">
                      Declinari: {deliverable.declinariQuantity}x{deliverable.declinariTime}{deliverable.declinariTimeUnit} = {deliverable.totalDeclinariTime.toFixed(1)}h
                      {deliverable.declinariTimeUnit === 'min' && (
                        <span> ({(deliverable.totalDeclinariTime * 60).toFixed(0)}min)</span>
                      )}
                    </div>
                  )}
                  <div className="block font-semibold text-yellow-600 dark:text-yellow-400">
                    Total: {deliverable.time.toFixed(1)}h ({(deliverable.time / 8).toFixed(1)} day)
                  </div>
                </div>
              ) : deliverable.notConfigured ? (
                <span className="text-amber-600 dark:text-amber-400">
                  ⚠️ Not configured in settings - Add to Settings → Deliverables
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  No time configuration
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Task column definitions
const createTaskColumns = (isUserAdmin, stableReporters) => [
  columnHelper.accessor('data_task.taskName', {
    header: 'Jira Link',
    cell: ({ getValue, row }) => {
      const taskName = getValue() || row.original?.data_task?.taskName;
      if (!taskName) return 'No Link';
      
      return (
        <span className="font-mono text-blue-600 dark:text-blue-400">
          {taskName}
        </span>
      );
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.departments, {
    id: 'departments',
    header: 'Department',
    cell: ({ getValue, row }) => {
      if (!row.original?.data_task) {
        return <span className="text-red-500 text-xs">❌ No data_task</span>;
      }
      
      const value = getValue();
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : <span className="text-red-500 text-xs">❌ Missing</span>;
      }
      return value || <span className="text-red-500 text-xs">❌ Missing</span>;
    },
    size: 100,
  }),
  columnHelper.accessor((row) => row.data_task?.products, {
    id: 'products',
    header: 'Product',
    cell: createSimpleCell(),
    size: 100,
  }),
  columnHelper.accessor((row) => row.data_task?.markets, {
    id: 'markets',
    header: 'Markets',
    cell: ({ getValue }) => {
      const markets = getValue();
      if (!markets?.length) return '-';
      
      return (
        <div className="flex flex-wrap gap-1 uppercase">
          {markets.map((market, index) => (
            <Badge key={index} variant="amber" size="sm">
              {market}
            </Badge>
          ))}
        </div>
      );
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.aiUsed?.[0]?.aiModels, {
    id: 'aiModels',
    header: 'AI Models',
    cell: ({ getValue, row }) => {
      const aiModels = getValue();
      const aiTime = row.original?.data_task?.aiUsed?.[0]?.aiTime;
      
      if (!aiModels?.length) return '-';
      
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {aiModels.map((model, index) => (
              <Badge key={index} variant="amber" size="sm">
                {model}
              </Badge>
            ))}
          </div>
          {aiTime > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total: {aiTime}h
            </div>
          )}
        </div>
      );
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
    id: 'deliverables',
    header: 'Deliverables',
    cell: ({ getValue, row }) => (
      <DeliverableCalculationCell 
        deliverablesUsed={getValue() || row.original?.data_task}
        isUserAdmin={isUserAdmin}
      />
    ),
    size: 150,
  }),
  columnHelper.accessor((row) => row.data_task?.reporters, {
    id: 'reporters',
    header: 'Reporter',
    cell: ({ getValue }) => {
      const reporterId = getValue();
      if (!reporterId) return '-';
      
      const reporter = stableReporters.find(r => 
        r.reporterUID?.toLowerCase() === reporterId.toLowerCase()
      );
      return reporter?.name || reporterId;
    },
    size: 120,
  }),
  columnHelper.accessor('createdByName', {
    header: 'Created',
    cell: createSimpleCell(),
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.timeInHours, {
    id: 'timeInHours',
    header: 'Task Hr',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      
      return (
        <Badge variant="blue" size="sm">
          {value}h
        </Badge>
      );
    },
    size: 80,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Date created',
    cell: createDateCell(DATE_FORMATS.LONG),
    size: 150,
  }),

  columnHelper.accessor((row) => row.data_task?.observations, {
    id: 'observations',
    header: 'Observations',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      
      const truncated = value.length > 50 ? `${value.substring(0, 50)}...` : value;
      
      return (
        <span 
          title={value} 
          className="block truncate"
        >
          {truncated}
        </span>
      );
    },
    size: 200,
  }),
  
  // Additional task data columns (hidden by default)
  columnHelper.accessor((row) => row.data_task?.startDate, {
    id: 'startDate',
    header: 'Start Date',
    cell: createDateCell(DATE_FORMATS.LONG),
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.endDate, {
    id: 'endDate',
    header: 'End Date',
    cell: createDateCell(DATE_FORMATS.LONG),
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.startDate, {
    id: 'done',
    header: 'Done',
    cell: ({ getValue, row }) => {
      const startDate = getValue();
      const endDate = row.original?.data_task?.endDate;
      
      const days = getDurationDays(startDate, endDate);
      
      if (days === 0) {
        return (
          <Badge variant="amber" size="sm">
            Same day
          </Badge>
        );
      }

      return (
        <Badge variant="crimson" size="sm">
          {days} days
        </Badge>
      );
    },
    size: 80,
  }),
  columnHelper.accessor((row) => row.data_task?.isVip, {
    id: 'isVip',
    header: 'VIP',
    cell: createBooleanCell(),
    size: 40,
  }),
  columnHelper.accessor((row) => row.data_task?.reworked, {
    id: 'reworked',
    header: 'ReWorked',
    cell: createBooleanCell(),
    size: 50,
  }),
];

// Tasks Table Columns - Memoized to prevent re-renders
export const useTaskColumns = (monthId = null, reporters = [], user = null) => {
  const stableReporters = Array.isArray(reporters) ? reporters : [];
  const isUserAdmin = user?.role === 'admin';
  
  return useMemo(() => createTaskColumns(isUserAdmin, stableReporters), [monthId, stableReporters, isUserAdmin]);
};

// User column definitions
const createUserColumns = () => [
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
    cell: createSimpleCell(),
    size: 200,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: ({ getValue }) => {
      const role = getValue() || 'user';
      return (
        <Badge variant={role} size="sm">
          {role}
        </Badge>
      );
    },
    size: 100,
  }),
  columnHelper.accessor('permissions', {
    header: 'Permissions',
    cell: ({ getValue }) => {
      const permissions = getValue();
      if (!permissions?.length) {
        return <span className="text-gray-500">No permissions</span>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {permissions.map((permission, index) => (
            <Badge 
              key={index} 
              variant="blue" 
              size="xs"
              className="text-xs"
            >
              {permission.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      );
    },
    size: 200,
  }),
  columnHelper.accessor('occupation', {
    header: 'Department',
    cell: createSimpleCell(),
    size: 150,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: createDateCell(),
    size: 120,
  }),
];

// Reporter column definitions
const createReporterColumns = () => [
  columnHelper.accessor('name', {
    header: 'Reporter',
    cell: ({ row }) => (
      <Avatar 
        user={row.original}
        gradient="from-red-error to-red-700"
        showEmail={true}
        size="md"
      />
    ),
    size: 200,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: createSimpleCell(),
    size: 200,
  }),
  columnHelper.accessor('departament', {
    header: 'Department',
    cell: createSimpleCell(),
    size: 150,
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: createSimpleCell(),
    size: 100,
  }),
  columnHelper.accessor('channelName', {
    header: 'Channel',
    cell: createSimpleCell(),
    size: 120,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: createDateCell(),
    size: 120,
  }),
];

// Unified column factory function for all tables
export const getColumns = (tableType, monthId = null, reporters = [], user = null) => {
  switch (tableType) {
    case 'tasks':
      // For tasks, we need the hook for memoization and admin logic
      // This will be handled by useTaskColumns in components
      return [];
    case 'users':
      return createUserColumns();
    case 'reporters':
      return createReporterColumns();
    default:
      return [];
  }
};