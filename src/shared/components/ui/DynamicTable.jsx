import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMonth } from '../../hooks/useCurrentMonth';
import DynamicButton from './DynamicButton';
import { showSuccess, showError } from '../../utils/toast';
import { logger } from '../../utils/logger';
import { getColumns } from "./tableColumns.jsx";

// Column helper for type safety
const columnHelper = createColumnHelper();

const DynamicTable = ({
  data = [],
  columns = [],
  tableType = 'tasks', // 'tasks', 'users', 'reporters'
  onEdit = null,
  onDelete = null,
  onSelect = null,
  isLoading = false,
  error = null,
  className = '',
  showPagination = true,
  showFilters = true,
  showColumnToggle = true,
  pageSize = 25,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnResizing = true,
  enableRowSelection = false,
  onRowSelectionChange = null,
}) => {
  const { user, canAccess } = useAuth();
  const { monthId } = useCurrentMonth();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [rowActionId, setRowActionId] = useState(null);

  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => {
    const baseColumns = [];

    // Add selection column if enabled
    if (enableRowSelection) {
      baseColumns.push(
        columnHelper.display({
          id: 'select',
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="rounded border-gray-300"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="rounded border-gray-300"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        })
      );
    }

    // Add action columns
    const actionColumn = columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        const isActionLoading = rowActionId === item.id;

        return (
          <div className="flex space-x-2">
            {onSelect && (
              <DynamicButton
                variant="primary"
                size="xs"
                onClick={() => onSelect(item)}
                title="View Details"
              >
                View
              </DynamicButton>
            )}
            {onEdit && (
              <DynamicButton
                variant="edit"
                size="xs"
                disabled={isActionLoading}
                onClick={() => onEdit(item)}
                iconName="edit"
                iconPosition="center"
                title="Edit"
              />
            )}
            {onDelete && (
              <DynamicButton
                variant="danger"
                size="xs"
                disabled={isActionLoading}
                onClick={() => handleDelete(item)}
                iconName="delete"
                iconPosition="center"
                title="Delete"
              />
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    });

    // Combine base columns, data columns, and action column
    return [...baseColumns, ...columns, actionColumn];
  }, [columns, enableRowSelection, onSelect, onEdit, onDelete, rowActionId]);

  // Handle delete with confirmation
  const handleDelete = async (item) => {
    const itemName = item.name || item.email || item.taskName || item.taskNumber || 'this item';
    
    if (!window.confirm(`Are you sure you want to delete ${itemName}?`)) {
      return;
    }

    try {
      setRowActionId(item.id);
      await onDelete(item);
      showSuccess(`${tableType.slice(0, -1)} deleted successfully!`);
    } catch (error) {
      logger.error(`Error deleting ${tableType.slice(0, -1)}:`, error);
      showError(`Failed to delete: ${error?.message || "Unknown error"}`);
    } finally {
      setRowActionId(null);
    }
  };

  // Create table instance
  const table = useReactTable({
    data,
    columns: memoizedColumns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      onRowSelectionChange?.(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
    enableFiltering,
    enablePagination,
    enableColumnResizing,
    enableRowSelection,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading {tableType}...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="card border border-red-500 text-center text-white-dark">
        <p className="text-sm mb-4">
          Error loading {tableType}: {error?.message || "Unknown error"}
        </p>
        <DynamicButton
          onClick={() => window.location.reload()}
          variant="danger"
          iconName="alert"
          iconPosition="left"
          size="sm"
        >
          Refresh Page
        </DynamicButton>
      </div>
    );
  }

  // Show empty state
  if (!data.length) {
    return (
      <div className="card text-center text-sm text-white-dark">
        No {tableType} found.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Global Filter */}
        {showFilters && (
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={`Search ${tableType}...`}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Table Controls */}
        <div className="flex items-center space-x-2">
          {/* Column Visibility Toggle */}
          {showColumnToggle && (
            <div className="relative">
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => {}} // Will be implemented with dropdown
                iconName="settings"
                iconPosition="left"
              >
                Columns
              </DynamicButton>
            </div>
          )}

          {/* Export Button */}
          <DynamicButton
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement CSV export
              // showInfo('Export functionality coming soon!'); // This line was removed as per the new_code
            }}
            iconName="download"
            iconPosition="left"
          >
            Export
          </DynamicButton>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
                        header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        width: header.getSize(),
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted()] ?? '↕'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-700 ${
                    row.getIsSelected() ? 'bg-blue-900/20' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && enablePagination && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <DynamicButton
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              iconName="chevron-left"
              iconPosition="left"
            >
              Previous
            </DynamicButton>

            <span className="text-sm text-gray-400">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>

            <DynamicButton
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              iconName="chevron-right"
              iconPosition="right"
            >
              Next
            </DynamicButton>

            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="px-2 py-1 border border-gray-600 rounded bg-gray-700 text-white text-sm"
            >
              {[10, 25, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Row Selection Info */}
      {enableRowSelection && Object.keys(rowSelection).length > 0 && (
        <div className="text-sm text-gray-400">
          {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
      )}
    </div>
  );
};

export default DynamicTable;
