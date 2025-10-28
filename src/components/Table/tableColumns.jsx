import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import Badge from '@/components/ui/Badge/Badge';
import Avatar from '@/components/ui/Avatar/Avatar';
import { formatDate, normalizeTimestamp } from '@/utils/dateUtils';
import { useDeliverableCalculation, useDeliverablesOptionsFromProps } from '@/features/deliverables/DeliverablesManager';
import { TABLE_SYSTEM, CARD_SYSTEM } from '@/constants';
import { differenceInDays } from 'date-fns';

const columnHelper = createColumnHelper();

// Note: createSelectionColumn is defined locally to avoid duplication
// This function is no longer used since row selection is handled by clicking the row


// Constants
const DATE_FORMATS = TABLE_SYSTEM.DATE_FORMATS;
const COLUMN_TYPES = TABLE_SYSTEM.COLUMN_TYPES;

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
    // Use date utilities for consistent date handling
    const start = normalizeTimestamp(startDate);
    const end = normalizeTimestamp(endDate);
    
    // Check if dates are valid
    if (!start || !end) return null;
    
    // Use date-fns for accurate day calculation
    const diffDays = differenceInDays(end, start);
    
    // If end is before start, return 0
    if (diffDays < 0) return 0;
    
    // Return calendar days (including partial days)
    return Math.ceil(diffDays);
  } catch {
    return null;
  }
};

// Common column cell helpers
const createSimpleCell = (fallback = '-') => ({ getValue }) => getValue() || fallback;
const createDateCell = (format = DATE_FORMATS.SHORT) => ({ getValue }) => {
  const value = getValue();
  if (!value) return '-';
  return (
    <span className="text-xs font-normal text-gray-700 dark:text-gray-300">
      {formatDateCell(value, format)}
    </span>
  );
};
const createBooleanCell = (trueText = "✓", falseText = "-") => ({ getValue }) => getValue() ? trueText : falseText;

// Optimized DeliverableCalculationCell component
const DeliverableCalculationCell = ({ deliverablesUsed, isUserAdmin, deliverables = [] }) => {
  const { deliverablesOptions = [] } = useDeliverablesOptionsFromProps(deliverables);
  const { deliverablesList, totalTime } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
  
  if (!deliverablesList?.length) {
    return <span className="text-gray-500 dark:text-gray-400">No deliverables</span>;
  }
  
  return (
    <div className="space-y-1">
      {deliverablesList.map((deliverable, index) => (
        <div key={index} className="text-xs">
          <div className="font-medium text-gray-900 dark:text-white">
            {deliverable.quantity}x{deliverable.name}
            {(deliverable.variationsQuantity || deliverable.declinariQuantity) > 0 && (
              <span style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.amber }}>
                {' '}+ {deliverable.variationsQuantity || deliverable.declinariQuantity} variations
              </span>
            )}
          </div>
          {isUserAdmin && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {deliverable.configured ? (
                <div className="text-xs block">
                  <div className="block">
                    {deliverable.timePerUnit}{deliverable.timeUnit} × {deliverable.quantity}
                    {(deliverable.variationsQuantity || deliverable.declinariQuantity) > 0 && (
                      <span> + {(deliverable.variationsQuantity || deliverable.declinariQuantity)}{(deliverable.variationsTimeUnit || deliverable.declinariTimeUnit || 'min')} variations</span>
                    )}
                  </div>
                  <div className="block font-semibold" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.yellow }}>
                    Total: {deliverable.time.toFixed(1)}h ({((deliverable.time * 60) / 480).toFixed(2)} days)
                  </div>
                </div>
              ) : deliverable.notConfigured ? (
                <span style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.amber }}>
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
const createTaskColumns = (isUserAdmin, stableReporters, deliverables = []) => [
  columnHelper.accessor('data_task.taskName', {
    header: 'JIRA LINK',
    cell: ({ getValue, row }) => {
      const taskName = getValue() || row.original?.data_task?.taskName;
      if (!taskName) return <span className="text-gray-500 dark:text-gray-400">No Link</span>;
      
      return (
        <Badge colorHex={CARD_SYSTEM.COLOR_HEX_MAP.blue} size="xs" className="font-mono">
          {taskName}
        </Badge>
      );
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.departments, {
    id: 'departments',
    header: 'DEPARTMENT',
    cell: ({ getValue, row }) => {
      if (!row.original?.data_task) {
        return <span className="text-xs" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.red }}>❌ No data_task</span>;
      }
      
      const value = getValue();
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : <span className="text-xs" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.red }}>❌ Missing</span>;
      }
      return value || <span className="text-xs" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.red }}>❌ Missing</span>;
    },
    size: 100,
  }),
  columnHelper.accessor((row) => row.data_task?.products, {
    id: 'products',
    header: 'PRODUCT',
    cell: createSimpleCell(),
    size: 100,
  }),
  columnHelper.accessor((row) => row.data_task?.markets, {
    id: 'markets',
    header: 'MARKETS',
    cell: ({ getValue }) => {
      const markets = getValue();
      if (!markets?.length) return '-';
      
      return (
        <div className="flex flex-wrap gap-1 uppercase">
          {markets.map((market, index) => (
            <Badge key={index} colorHex={CARD_SYSTEM.COLOR_HEX_MAP.amber} size="xs">
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
    header: 'AI MODELS',
    cell: ({ getValue, row }) => {
      const aiModels = getValue();
      const aiTime = row.original?.data_task?.aiUsed?.[0]?.aiTime;
      
      if (!aiModels?.length) return '-';
      
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {aiModels.map((model, index) => (
              <Badge key={index} colorHex={CARD_SYSTEM.COLOR_HEX_MAP.purple} size="xs">
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
    header: 'LIVRABLES',
    cell: ({ getValue, row }) => (
      <DeliverableCalculationCell 
        deliverablesUsed={getValue()}
        isUserAdmin={isUserAdmin}
        deliverables={deliverables}
      />
    ),
    size: 200,
  }),
  columnHelper.accessor((row) => row.data_task?.reporters, {
    id: 'reporters',
    header: 'REPORTER',
    cell: ({ getValue, row }) => {
      // First try to get reporterName if it exists
      const reporterName = row.original?.data_task?.reporterName;
      if (reporterName) {
        return reporterName;
      }
      
      // Fallback to resolving reporter ID
      const reporterId = getValue();
      if (!reporterId) return '-';
      
      const reporter = stableReporters.find(r => {
        const reporterIdField = r.id || r.uid || r.reporterUID;
        return reporterIdField && 
               typeof reporterIdField === 'string' &&
               reporterIdField.toLowerCase() === reporterId.toLowerCase();
      });
      return reporter?.name || reporterId;
    },
    size: 120,
  }),
  columnHelper.accessor('createdByName', {
    header: 'CREATED BY',
    cell: createSimpleCell(),
    size: 150,
  }),
  columnHelper.accessor('createdAt', {
    header: 'D CREATED',
    cell: createDateCell(DATE_FORMATS.DATETIME_LONG),
    size: 150,
  }),

  columnHelper.accessor((row) => row.data_task?.observations, {
    id: 'observations',
    header: 'OBSERVATIONS',
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
    header: 'START DATE',
    cell: createDateCell(DATE_FORMATS.LONG),
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.endDate, {
    id: 'endDate',
    header: 'END DATE',
    cell: createDateCell(DATE_FORMATS.LONG),
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.startDate, {
    id: 'done',
    header: 'DONE',
    cell: ({ getValue, row }) => {
      const startDate = getValue();
      const endDate = row.original?.data_task?.endDate;
      
      const days = getDurationDays(startDate, endDate);
      
      if (days === 0) {
        return (
          <Badge colorHex={CARD_SYSTEM.COLOR_HEX_MAP.green} size="xs">
            Same day
          </Badge>
        );
      }

      return (
        <Badge colorHex={CARD_SYSTEM.COLOR_HEX_MAP.red} size="xs">
          {days} days
        </Badge>
      );
    },
    size: 100,
  }),
  columnHelper.accessor((row) => row.data_task?.timeInHours, {
    id: 'timeInHours',
    header: 'TASK HR',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      
      return (
        <Badge colorHex={CARD_SYSTEM.COLOR_HEX_MAP.blue} size="xs">
          {value}h
        </Badge>
      );
    },
    size: 120,
  }),
  columnHelper.accessor((row) => row.data_task?.isVip, {
    id: 'isVip',
    header: 'VIP',
    cell: createBooleanCell(),
    size: 40,
  }),
  columnHelper.accessor((row) => row.data_task?.reworked, {
    id: 'reworked',
    header: 'REWORKED',
    cell: createBooleanCell(),
    size: 40,
  }),
];

// Tasks Table Columns - Memoized to prevent re-renders
export const useTaskColumns = (monthId = null, reporters = [], user = null, deliverables = []) => {
  const stableReporters = Array.isArray(reporters) ? reporters : [];
  const isUserAdmin = user?.role === 'admin';
  
  return useMemo(() => createTaskColumns(isUserAdmin, stableReporters, deliverables), [monthId, stableReporters, isUserAdmin, deliverables]);
};

// User column definitions
const createUserColumns = () => [
  columnHelper.accessor('name', {
    header: 'USER',
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
    header: 'EMAIL',
    cell: createSimpleCell(),
    size: 200,
  }),
  columnHelper.accessor('role', {
    header: 'ROLE',
    cell: ({ getValue }) => {
      const role = getValue() || 'user';
      return (
        <Badge 
          colorHex={role === 'admin' ? CARD_SYSTEM.COLOR_HEX_MAP.crimson : CARD_SYSTEM.COLOR_HEX_MAP.blue} 
          size="xs"
        >
          {role}
        </Badge>
      );
    },
    size: 100,
  }),
  columnHelper.accessor('permissions', {
    header: 'PERMISSIONS',
    cell: ({ getValue }) => {
      const permissions = getValue();
      if (!Array.isArray(permissions) || !permissions.length) {
        return <span style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.gray }}>No permissions</span>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {permissions.map((permission, index) => (
            <Badge 
              key={index} 
              colorHex={CARD_SYSTEM.COLOR_HEX_MAP.gray} 
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
    header: 'DEPARTMENT',
    cell: createSimpleCell(),
    size: 150,
  }),
  columnHelper.accessor('createdAt', {
    header: 'CREATED',
    cell: createDateCell(DATE_FORMATS.DATETIME_LONG),
    size: 150,
  }),
];

// Reporter column definitions
const createReporterColumns = () => [
  columnHelper.accessor('name', {
    header: 'REPORTER',
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
    header: 'DEPARTMENT',
    cell: createSimpleCell(),
    size: 150,
  }),
  columnHelper.accessor('country', {
    header: 'COUNTRY',
    cell: createSimpleCell(),
    size: 100,
  }),
  columnHelper.accessor('channelName', {
    header: 'CHANNEL',
    cell: createSimpleCell(),
    size: 120,
  }),
  columnHelper.accessor('createdAt', {
    header: 'CREATED',
    cell: createDateCell(DATE_FORMATS.DATETIME_LONG),
    size: 150,
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