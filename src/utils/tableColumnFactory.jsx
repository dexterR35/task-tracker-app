/**
 * Table Column Factory
 * Unified system for creating table columns with consistent patterns
 */

import { createColumnHelper } from '@tanstack/react-table';
import { formatDate } from './dateUtils';
import { getVariantClass, getStatusBadgeVariant } from './colorSystem';
import Badge from '@/components/ui/Badge/Badge';
import Avatar from '@/components/ui/Avatar/Avatar';
import DynamicButton from '@/components/ui/Button/DynamicButton';

const columnHelper = createColumnHelper();

// ============================================================================
// COLUMN TYPES
// ============================================================================

export const COLUMN_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  BADGE: 'badge',
  AVATAR: 'avatar',
  BUTTON: 'button',
  SELECTION: 'selection',
  CUSTOM: 'custom'
};

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
  SHORT: 'dd MMM yyyy',
  LONG: 'dd MMM yyyy, HH:mm',
  TIME_ONLY: 'HH:mm',
  DATE_ONLY: 'yyyy-MM-dd'
};

// ============================================================================
// COLUMN FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a text column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createTextColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 150,
    className = '',
    truncate = false,
    maxLength = 50,
    tooltip = false
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      
      const displayValue = truncate && value.length > maxLength 
        ? `${value.substring(0, maxLength)}...` 
        : value;
      
      return (
        <span 
          className={`text-gray-900 dark:text-white ${className}`}
          title={tooltip ? value : undefined}
        >
          {displayValue}
        </span>
      );
    }
  });
};

/**
 * Create a number column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createNumberColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 100,
    format = 'number',
    precision = 0,
    suffix = '',
    prefix = '',
    className = ''
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return '-';
      
      let formattedValue;
      switch (format) {
        case 'currency':
          formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
          break;
        case 'percentage':
          formattedValue = `${(value * 100).toFixed(precision)}%`;
          break;
        case 'decimal':
          formattedValue = value.toFixed(precision);
          break;
        default:
          formattedValue = value.toString();
      }
      
      return (
        <span className={`text-gray-900 dark:text-white ${className}`}>
          {prefix}{formattedValue}{suffix}
        </span>
      );
    }
  });
};

/**
 * Create a date column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createDateColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 120,
    format = DATE_FORMATS.SHORT,
    showTime = true,
    className = ''
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      
      const formattedDate = formatDate(value, format, showTime);
      
      return (
        <span className={`text-gray-700 dark:text-gray-300 ${className}`}>
          {formattedDate}
        </span>
      );
    }
  });
};

/**
 * Create a boolean column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createBooleanColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 80,
    trueText = '✓',
    falseText = '-',
    trueVariant = 'success',
    falseVariant = 'default',
    className = ''
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: ({ getValue }) => {
      const value = getValue();
      const isTrue = Boolean(value);
      
      return (
        <Badge 
          variant={isTrue ? trueVariant : falseVariant}
          size="sm"
          className={className}
        >
          {isTrue ? trueText : falseText}
        </Badge>
      );
    }
  });
};

/**
 * Create a badge column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createBadgeColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 120,
    variantMap = {},
    defaultVariant = 'default',
    size: badgeSize = 'sm',
    className = ''
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      
      const variant = variantMap[value] || defaultVariant;
      
      return (
        <Badge 
          variant={variant}
          size={badgeSize}
          className={className}
        >
          {value}
        </Badge>
      );
    }
  });
};

/**
 * Create an avatar column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createAvatarColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 200,
    showEmail = false,
    showName = true,
    gradient = 'from-blue-500 to-purple-600',
    fallbackIcon = null,
    className = ''
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: ({ getValue, row }) => {
      const value = getValue();
      const user = row.original;
      
      return (
        <Avatar 
          user={user}
          name={value}
          gradient={gradient}
          showEmail={showEmail}
          showName={showName}
          fallbackIcon={fallbackIcon}
          className={className}
        />
      );
    }
  });
};

/**
 * Create a button column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createButtonColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 100,
    buttonText,
    buttonVariant = 'primary',
    buttonSize = 'sm',
    onClick,
    disabled = false,
    iconName = null,
    className = ''
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: ({ getValue, row }) => {
      const value = getValue();
      
      return (
        <DynamicButton
          onClick={() => onClick?.(value, row.original)}
          disabled={disabled}
          variant={buttonVariant}
          size={buttonSize}
          iconName={iconName}
          className={className}
        >
          {buttonText || value}
        </DynamicButton>
      );
    }
  });
};

/**
 * Create a selection column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createSelectionColumn = (config = {}) => {
  const {
    size = 30,
    className = ''
  } = config;

  return columnHelper.display({
    id: 'select',
    header: () => (
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Select
      </span>
    ),
    size,
    cell: ({ row }) => (
      <input
        name={`select-row-${row.id}`}
        id={`select-row-${row.id}`}
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${className}`}
      />
    ),
    enableSorting: false,
    enableHiding: false
  });
};

/**
 * Create a custom column
 * @param {Object} config - Column configuration
 * @returns {Object} TanStack column definition
 */
export const createCustomColumn = (config) => {
  const {
    accessorKey,
    header,
    size = 150,
    cell: customCell,
    className = ''
  } = config;

  return columnHelper.accessor(accessorKey, {
    header,
    size,
    cell: customCell
  });
};

// ============================================================================
// PREDEFINED COLUMN SETS
// ============================================================================

/**
 * Create user table columns
 * @param {Object} options - Column options
 * @returns {Array} Array of column definitions
 */
export const createUserColumns = (options = {}) => {
  const {
    showSelection = false,
    showActions = false,
    onEdit = null,
    onDelete = null
  } = options;

  const columns = [];

  if (showSelection) {
    columns.push(createSelectionColumn());
  }

  columns.push(
    createAvatarColumn({
      accessorKey: 'name',
      header: 'User',
      showEmail: true,
      gradient: 'from-blue-500 to-purple-600'
    }),
    createTextColumn({
      accessorKey: 'email',
      header: 'Email',
      size: 200
    }),
    createBadgeColumn({
      accessorKey: 'role',
      header: 'Role',
      size: 100,
      variantMap: {
        admin: 'admin',
        user: 'user',
        reporter: 'reporter'
      }
    }),
    createBooleanColumn({
      accessorKey: 'isActive',
      header: 'Active',
      size: 80
    }),
    createDateColumn({
      accessorKey: 'createdAt',
      header: 'Created',
      size: 120
    })
  );

  if (showActions) {
    columns.push(
      createButtonColumn({
        accessorKey: 'id',
        header: 'Actions',
        size: 120,
        buttonText: 'Edit',
        buttonVariant: 'primary',
        buttonSize: 'sm',
        onClick: onEdit
      })
    );
  }

  return columns;
};

/**
 * Create reporter table columns
 * @param {Object} options - Column options
 * @returns {Array} Array of column definitions
 */
export const createReporterColumns = (options = {}) => {
  const {
    showSelection = false,
    showActions = false,
    onEdit = null,
    onDelete = null
  } = options;

  const columns = [];

  if (showSelection) {
    columns.push(createSelectionColumn());
  }

  columns.push(
    createAvatarColumn({
      accessorKey: 'name',
      header: 'Reporter',
      showEmail: true,
      gradient: 'from-red-500 to-pink-600'
    }),
    createTextColumn({
      accessorKey: 'email',
      header: 'Email',
      size: 200
    }),
    createTextColumn({
      accessorKey: 'departament',
      header: 'Department',
      size: 150
    }),
    createTextColumn({
      accessorKey: 'country',
      header: 'Country',
      size: 100
    }),
    createTextColumn({
      accessorKey: 'channelName',
      header: 'Channel',
      size: 120
    }),
    createDateColumn({
      accessorKey: 'createdAt',
      header: 'Created',
      size: 120
    })
  );

  if (showActions) {
    columns.push(
      createButtonColumn({
        accessorKey: 'id',
        header: 'Actions',
        size: 120,
        buttonText: 'Edit',
        buttonVariant: 'primary',
        buttonSize: 'sm',
        onClick: onEdit
      })
    );
  }

  return columns;
};

/**
 * Create task table columns
 * @param {Object} options - Column options
 * @returns {Array} Array of column definitions
 */
export const createTaskColumns = (options = {}) => {
  const {
    showSelection = false,
    showActions = false,
    onEdit = null,
    onDelete = null,
    isUserAdmin = false
  } = options;

  const columns = [];

  if (showSelection) {
    columns.push(createSelectionColumn());
  }

  columns.push(
    createTextColumn({
      accessorKey: 'jiraLink',
      header: 'Jira Link',
      size: 200,
      truncate: true,
      maxLength: 30
    }),
    createTextColumn({
      accessorKey: 'data_task.products',
      header: 'Products',
      size: 150
    }),
    createTextColumn({
      accessorKey: 'data_task.departments',
      header: 'Department',
      size: 120
    }),
    createTextColumn({
      accessorKey: 'data_task.markets',
      header: 'Markets',
      size: 150
    }),
    createNumberColumn({
      accessorKey: 'data_task.timeInHours',
      header: 'Hours',
      size: 80,
      format: 'decimal',
      precision: 1,
      suffix: 'h'
    }),
    createDateColumn({
      accessorKey: 'data_task.startDate',
      header: 'Start Date',
      size: 120
    }),
    createDateColumn({
      accessorKey: 'data_task.endDate',
      header: 'End Date',
      size: 120
    })
  );

  if (isUserAdmin) {
    columns.push(
      createTextColumn({
        accessorKey: 'userName',
        header: 'User',
        size: 150
      })
    );
  }

  if (showActions) {
    columns.push(
      createButtonColumn({
        accessorKey: 'id',
        header: 'Actions',
        size: 120,
        buttonText: 'Edit',
        buttonVariant: 'primary',
        buttonSize: 'sm',
        onClick: onEdit
      })
    );
  }

  return columns;
};

/**
 * Create deliverable table columns
 * @param {Object} options - Column options
 * @returns {Array} Array of column definitions
 */
export const createDeliverableColumns = (options = {}) => {
  const {
    showSelection = false,
    showActions = false,
    onEdit = null,
    onDelete = null,
    canManageDeliverables = false
  } = options;

  const columns = [];

  if (showSelection) {
    columns.push(createSelectionColumn());
  }

  columns.push(
    createTextColumn({
      accessorKey: 'name',
      header: 'Deliverable Name',
      size: 200
    }),
    createBadgeColumn({
      accessorKey: 'department',
      header: 'Department',
      size: 140,
      variantMap: {
        'video': 'info',
        'design': 'warning',
        'developer': 'success'
      }
    })
  );

  if (canManageDeliverables) {
    columns.push(
      createNumberColumn({
        accessorKey: 'timePerUnit',
        header: 'Time/Unit',
        size: 100,
        format: 'decimal',
        precision: 1
      }),
      createTextColumn({
        accessorKey: 'timeUnit',
        header: 'Unit',
        size: 80
      }),
      createNumberColumn({
        accessorKey: 'declinariTime',
        header: 'Declinari Time',
        size: 120,
        format: 'decimal',
        precision: 1
      }),
      createTextColumn({
        accessorKey: 'declinariTimeUnit',
        header: 'Declinari Unit',
        size: 120
      })
    );
  }

  if (showActions) {
    columns.push(
      createButtonColumn({
        accessorKey: 'id',
        header: 'Actions',
        size: 120,
        buttonText: 'Edit',
        buttonVariant: 'primary',
        buttonSize: 'sm',
        onClick: onEdit
      })
    );
  }

  return columns;
};

// ============================================================================
// COLUMN UTILITIES
// ============================================================================

/**
 * Create columns from configuration array
 * @param {Array} columnConfigs - Array of column configurations
 * @returns {Array} Array of column definitions
 */
export const createColumnsFromConfig = (columnConfigs) => {
  return columnConfigs.map(config => {
    switch (config.type) {
      case COLUMN_TYPES.TEXT:
        return createTextColumn(config);
      case COLUMN_TYPES.NUMBER:
        return createNumberColumn(config);
      case COLUMN_TYPES.DATE:
        return createDateColumn(config);
      case COLUMN_TYPES.BOOLEAN:
        return createBooleanColumn(config);
      case COLUMN_TYPES.BADGE:
        return createBadgeColumn(config);
      case COLUMN_TYPES.AVATAR:
        return createAvatarColumn(config);
      case COLUMN_TYPES.BUTTON:
        return createButtonColumn(config);
      case COLUMN_TYPES.SELECTION:
        return createSelectionColumn(config);
      case COLUMN_TYPES.CUSTOM:
        return createCustomColumn(config);
      default:
        return createTextColumn(config);
    }
  });
};

/**
 * Get column factory function by type
 * @param {string} type - Column type
 * @returns {Function} Column factory function
 */
export const getColumnFactory = (type) => {
  const factories = {
    [COLUMN_TYPES.TEXT]: createTextColumn,
    [COLUMN_TYPES.NUMBER]: createNumberColumn,
    [COLUMN_TYPES.DATE]: createDateColumn,
    [COLUMN_TYPES.BOOLEAN]: createBooleanColumn,
    [COLUMN_TYPES.BADGE]: createBadgeColumn,
    [COLUMN_TYPES.AVATAR]: createAvatarColumn,
    [COLUMN_TYPES.BUTTON]: createButtonColumn,
    [COLUMN_TYPES.SELECTION]: createSelectionColumn,
    [COLUMN_TYPES.CUSTOM]: createCustomColumn
  };
  
  return factories[type] || createTextColumn;
};

/**
 * Create a column with conditional visibility
 * @param {Object} config - Column configuration
 * @param {Function} condition - Visibility condition function
 * @returns {Object} TanStack column definition
 */
export const createConditionalColumn = (config, condition) => {
  const column = getColumnFactory(config.type)(config);
  
  return {
    ...column,
    meta: {
      ...column.meta,
      isVisible: condition
    }
  };
};
