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
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { showError, showSuccess, showInfo } from '@/utils/toast';
import { exportToCSV } from "@/utils/exportData";
// Column helper for type safety
const columnHelper = createColumnHelper();

// CSV Export utility function


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
  showActions = true, 
  pageSize = 25,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnResizing = true,
  enableRowSelection = false,
  onRowSelectionChange = null,
}) => {
  
  // DynamicTable component rendering

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
        
            />
          ),
          cell: ({ row }) => (
            <input
              name={`select-row-${row.id}`}
              id={`select-row-${row.id}`}
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
             
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
                iconName="edit"
                iconPosition="center"
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
  // if (isLoading) {
  //   return (
  //   <Loader size="xs" variant="spinner" text="Loading data..." fullScreen={false} />
  //   );
  // }


  // Show empty state
  if (!data.length) {
    return (
      <div className="card text-center py-8">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Loading {tableType}...</span>
            </div>
          ) : (
            <div>
              <div className="text-lg mb-2">📋</div>
              <div className="text-sm">No {tableType} found</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tableType === 'tasks' ? 'Try creating a new task or check a different month' : 
                 tableType === 'users' ? 'No users available' : 
                 'No data available'}
              </div>
            </div>
          )}
        </div>
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getAllColumns().length} className="px-6 py-8 text-center">
                    <div className="text-gray-400 dark:text-gray-500">
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-lg mb-2">📋</div>
                          <div>No data available</div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => {
                  // Render table rows
                  
                  return (
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TanStack Table Pagination */}
      {showPagination && enablePagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-gray-400">
            {Object.keys(rowSelection).length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-300">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="h-8 w-[70px] rounded border border-gray-600 bg-gray-700 text-white text-sm"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-300">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                iconName="chevron-left"
                iconPosition="center"
              />
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                iconName="chevron-right"
                iconPosition="center"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicTable;
