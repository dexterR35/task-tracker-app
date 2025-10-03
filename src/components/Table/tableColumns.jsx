import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import Badge from '@/components/ui/Badge/Badge';
import Avatar from '@/components/ui/Avatar/Avatar';
import { formatDate } from '@/utils/dateUtils';
import { useDeliverableCalculation } from '@/hooks/useDeliverableCalculation';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';
import { useAuth } from '@/features/auth/hooks/useAuth';


const columnHelper = createColumnHelper();

// Component that uses the hook directly
const DeliverableCalculationCell = ({ deliverablesUsed, isUserAdmin }) => {
  const { deliverablesOptions = [] } = useDeliverablesOptions();
  const { deliverablesList, totalTime } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
  
  if (!deliverablesList || deliverablesList.length === 0) {
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

// Tasks Table Columns - Memoized to prevent re-renders
export const useTaskColumns = (monthId = null, reporters = [], user = null) => {
  // Ensure reporters is always an array to prevent hooks issues
  const stableReporters = Array.isArray(reporters) ? reporters : [];
  
  // Check if user is admin for role-based column content
  const isUserAdmin = user?.role === 'admin';
  
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
      // Handle both string and array formats
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : <span className="text-red-500 text-xs">❌ Missing</span>;
      }
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
      const markets = getValue();
      
      if (!markets || !Array.isArray(markets) || markets.length === 0) return '-';
      
      return (
        <div className="flex flex-wrap gap-1">
          {markets.map((market, index) => (
            <Badge key={index} variant="blue" size="sm">
              {market}
            </Badge>
          ))}
        </div>
      );
    },
    size: 200,
  }),
  columnHelper.accessor((row) => row.data_task?.aiUsed?.[0]?.aiModels, {
    id: 'aiModels',
    header: 'AI Models',
    cell: ({ getValue, row }) => {
      const aiModels = getValue();
      const aiTime = row.original?.data_task?.aiUsed?.[0]?.aiTime;
      
      if (!aiModels || !Array.isArray(aiModels) || aiModels.length === 0) return '-';
      
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {aiModels.map((model, index) => (
              <Badge key={index} variant="purple" size="sm">
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
    size: 200,
  }),
  columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
    id: 'deliverables',
    header: 'Deliverables',
    cell: ({ getValue, row }) => {
      const deliverablesUsed = getValue();
      
      // Use the hook directly
      return <DeliverableCalculationCell 
        deliverablesUsed={deliverablesUsed || row.original?.data_task}
        isUserAdmin={isUserAdmin}
      />;
    },
    size: 200,
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
      if (!value) return '-';
      
      // Color code based on hours
      const variant = value <= 2 ? 'success' : value <= 8 ? 'warning' : 'error';
      
      return (
        <Badge variant={variant} size="sm">
          {value}h
        </Badge>
      );
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
    id: 'done',
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
        
        // Color code based on duration
        const variant = diffDays <= 1 ? 'success' : diffDays <= 3 ? 'warning' : 'error';
        
        return (
          <Badge variant={variant} size="sm">
            {diffDays} days
          </Badge>
        );
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
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      return formatDate(value, 'dd MMM yyyy, HH:mm', true);
    },
    size: 150,
  }),
  columnHelper.accessor((row) => row.data_task?.endDate, {
    id: 'endDate',
    header: 'End Date',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      return formatDate(value, 'dd MMM yyyy, HH:mm', true);
    },
    size: 150,
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
  columnHelper.accessor('permissions', {
    header: 'Permissions',
    cell: ({ getValue }) => {
      const permissions = getValue();
      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
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
export const getReporterColumns = () => [
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
  columnHelper.accessor('channelName', {
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
      return getReporterColumns();
    default:
      return [];
  }
};
