import React, { useState, useMemo, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useCurrentMonth } from '../../hooks/useCurrentMonth';
import { useFetchData } from '../../hooks/useFetchData';
import DynamicButton from './DynamicButton';
import { showError, showSuccess, showInfo } from '../../utils/toast';
import { logger } from '../../utils/logger';
import { getColumns } from "./tableColumns.jsx";

// Column helper for type safety
const columnHelper = createColumnHelper();

// CSV Export utility function
const exportToCSV = (data, columns, tableType) => {
  try {
    // Get visible columns (excluding actions and selection columns)
    const visibleColumns = columns.filter(col => 
      col.id !== 'actions' && col.id !== 'select' && col.accessorKey
    );

    // Create headers
    const headers = visibleColumns.map(col => {
      // Handle different header types
      if (typeof col.header === 'string') return col.header;
      if (typeof col.header === 'function') return col.accessorKey || col.id;
      return col.accessorKey || col.id;
    }).join(',');

    // Create rows
    const rows = data.map(row => {
      return visibleColumns.map(col => {
        const value = row[col.accessorKey];
        // Handle different data types
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
          // Handle arrays, objects, etc.
          if (Array.isArray(value)) return value.join('; ');
          return JSON.stringify(value);
        }
        // Escape commas and quotes in string values
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    logger.error('Error exporting CSV:', error);
    return false;
  }
};

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
  showActions = true, // New prop to control Actions column visibility
  pageSize = 25,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnResizing = true,
  enableRowSelection = false,
  onRowSelectionChange = null,
}) => {
  const { monthId } = useCurrentMonth();
  const { user, canAccess } = useFetchData();
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
              name="select-all"
              id="select-all"
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="rounded border-gray-300"
            />
          ),
          cell: ({ row }) => (
            <input
              name={`select-row-${row.id}`}
              id={`select-row-${row.id}`}
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

    // Add action columns only if showActions is true
    const actionColumn = showActions ? columnHelper.display({
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
                onClick={() => onDelete(item)}
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
    }) : null;

    // Combine base columns, data columns, and action column (if exists)
    return [...baseColumns, ...columns, ...(actionColumn ? [actionColumn] : [])];
  }, [columns, enableRowSelection, onSelect, onEdit, onDelete, rowActionId]);



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
              name={`${tableType}-search`}
              id={`${tableType}-search`}
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
            <div className="relative group">
              <DynamicButton
                variant="outline"
                size="sm"
                iconName="settings"
                iconPosition="left"
              >
                Columns
              </DynamicButton>
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  {table.getAllLeafColumns()
                    .filter(column => column.getCanHide())
                    .map(column => (
                      <label key={column.id} className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 cursor-pointer">
                        <input
                          name={`column-${column.id}`}
                          id={`column-${column.id}`}
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="mr-2 rounded border-gray-500 bg-gray-600"
                        />
                        {column.columnDef.header || column.id}
                      </label>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Export Button */}
          <DynamicButton
            variant="outline"
            size="sm"
            onClick={() => {
              const success = exportToCSV(
                table.getFilteredRowModel().rows.map(row => row.original),
                columns,
                tableType
              );
              if (success) {
                showSuccess(`${tableType} exported successfully!`);
              } else {
                showError('Failed to export data. Please try again.');
              }
            }}
            iconName="download"
            iconPosition="left"
          >
            Export CSV
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
              name="page-size"
              id="page-size"
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
