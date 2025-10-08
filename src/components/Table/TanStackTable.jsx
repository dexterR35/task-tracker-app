import React, { useState, useMemo, useCallback } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { SkeletonTable } from "@/components/ui/Skeleton/Skeleton";
import TableCSVExportButton from "@/components/ui/TableCSVExportButton/TableCSVExportButton";
import { createSelectionColumn } from "./tableColumns";



// Constants
const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50];
const SORT_ICONS = {
  asc: "↑",
  desc: "↓",
  false: "↕"
};

// Utility functions
const getSelectedRows = (table, rowSelection) => {
  return table.getFilteredRowModel().rows.filter(row => rowSelection[row.id]);
};

const getSelectedCount = (rowSelection) => Object.keys(rowSelection).length;


// Bulk actions bar component
const BulkActionsBar = ({ 
  selectedCount, 
  onClearSelection, 
  bulkActions, 
  onBulkAction,
  table
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-smallCard card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">
            {selectedCount} row(s) selected
            {selectedCount > 1 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                (Select only ONE task for actions)
              </span>
            )}
          </span>
          <DynamicButton
            onClick={onClearSelection}
            className="text-xs text-blue-200 dark:text-blue-300 dark:hover:text-blue-200 underline bg-transparent !p-0 !m-0 hover:bg-transparent"
          >
            Clear selection
          </DynamicButton>
        </div>
        <div className="flex items-center space-x-2">
          {bulkActions.map((action, index) => (
            <DynamicButton
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={() => onBulkAction(action, table)}
              iconName={action.icon}
              iconPosition="left"
              className="font-semibold"
              disabled={selectedCount > 1}
            >
              {action.label}
            </DynamicButton>
          ))}
        </div>
      </div>
    </div>
  );
};

// Table controls component
const TableControls = ({
  showFilters,
  showPagination,
  enablePagination,
  showColumnToggle,
  table,
  tableType,
  globalFilter,
  setGlobalFilter,
  columns
}) => (
  <div className="flex justify-between items-center">
    {/* Global Filter */}
    {showFilters && (
      <div className="flex-1 max-w-sm">
        <input
          name={`${tableType}-search`}
          id={`${tableType}-search`}
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={`Search ${tableType}...`}
          className="text-sm font-medium"
        />
      </div>
    )}
    
    <div className="flex items-center space-x-2">
      {/* Rows per page selector */}
      {showPagination && enablePagination && (
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="page-size-select" className="text-xs m-0">
            Rows per page
          </label>
          <select
            id="page-size-select"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-full w-[80px] px-3 py-2 text-sm font-medium"
          >
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Column Toggle */}
      {showColumnToggle && (
        <div className="relative group">
          <DynamicButton
            variant="outline"
            size="sm"
            iconName="default"
            iconPosition="left"
            className="font-semibold"
          >
            Columns
          </DynamicButton>
          <div className="absolute right-0 mt-2 w-fit dark:bg-primary bg-secondary card !p-0 !m-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-2">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center px-4 py-0.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                  >
                    <input
                      name={`column-${column.id}`}
                      id={`column-${column.id}`}
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="mr-2"
                    />
                    {column.columnDef.header || column.id}
                  </label>
                ))}
            </div>
          </div>
        </div>
      )}
      
      <TableCSVExportButton
        data={table.getFilteredRowModel().rows.map((row) => row.original)}
        columns={columns}
        tableType={tableType}
        buttonText="Export CSV"
        className="font-semibold"
      />
    </div>
  </div>
);

// Pagination component
const Pagination = ({ 
  showPagination, 
  enablePagination, 
  table, 
  selectedCount, 
  totalRows 
}) => {
  if (!showPagination || !enablePagination) return null;

  return (
    <div className="flex items-center justify-between space-x-3 py-4">
      <div className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300">
        {selectedCount} of {totalRows} row(s) selected.
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex w-[100px] items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <DynamicButton
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            iconName="chevronLeft"
            iconPosition="center"
            className="font-semibold text-xs"
          />
          <DynamicButton
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            iconName="chevronRight"
            iconPosition="center"
            className="font-semibold text-xs"
          />
        </div>
      </div>
    </div>
  );
};

const TanStackTable = ({
  data = [],
  columns = [],
  tableType = "generic",
  error = null,
  className = "",
  isLoading = false,

  // Table features with sensible defaults
  showPagination = true,
  showFilters = true,
  showColumnToggle = true,
  pageSize = 5,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnResizing = true,
  enableRowSelection = false,
  onRowSelectionChange = null,

  // Column visibility
  initialColumnVisibility = {},

  // Action handlers (for bulk actions)
  onEdit = null,
  onDelete = null,
  onSelect = null,
  
  // Bulk actions
  showBulkActions = false,
  bulkActions = [],

  // Additional props
  ...additionalProps
}) => {
  // Table state management
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [rowSelection, setRowSelection] = useState({});
  const [rowActionId, setRowActionId] = useState(null);

  // Memoized row selection handler
  const handleRowSelectionChange = useCallback((updater) => {
    const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
    setRowSelection(newSelection);
    onRowSelectionChange?.(newSelection);
  }, [rowSelection, onRowSelectionChange]);

  // Memoized bulk action handler
  const handleBulkAction = useCallback((action, tableInstance) => {
    const selectedRows = getSelectedRows(tableInstance, rowSelection);
    action.onClick(selectedRows.map(row => row.original));
  }, [rowSelection]);

  // Memoized clear selection handler
  const handleClearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => {
    const baseColumns = [];

    // Add selection column if enabled
    if (enableRowSelection) {
      baseColumns.push(createSelectionColumn());
    }

    // Combine base columns and data columns
    return [
      ...baseColumns,
      ...columns,
    ];
  }, [
    columns, 
    enableRowSelection
  ]);

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
    onRowSelectionChange: handleRowSelectionChange,
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

  // Memoized values
  const selectedCount = getSelectedCount(rowSelection);
  const totalRows = table.getFilteredRowModel().rows.length;

  // Show skeleton when loading or no data
  if (isLoading || !data.length) {
    return (
      <div className={`space-y-4 ${className}`}>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Controls */}
      <TableControls
        showFilters={showFilters}
        showPagination={showPagination}
        enablePagination={enablePagination}
        showColumnToggle={showColumnToggle}
        table={table}
        tableType={tableType}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        onClearSelection={handleClearSelection}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        table={table}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-soft py-2 h-14">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-2 text-start font-semibold !capitalize tracking-wider ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none hover:bg-primary/50"
                        : ""
                    } transition-colors duration-150`}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {header.column.getCanSort() && (
                        <span className="text-gray-200">
                          {SORT_ICONS[header.column.getIsSorted()] ?? SORT_ICONS.false}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-smallCard-white dark:bg-smallCard divide-y divide-gray-300 dark:divide-gray-600">
            {table.getRowModel().rows.map((row) => {
              const rowKey = row.original?.id || row.id;
             
              return (
                <tr
                  key={rowKey}
                  className={`hover:bg-gray-50/80 dark:hover:bg-soft/30 cursor-pointer transition-colors duration-150 ${
                    row.getIsSelected()
                      ? "bg-blue-50/80 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={`${row.original?.id || row.id}-${cell.column.id}`}
                      className="px-4 py-2 h-16 whitespace-nowrap text-xs font-medium capitalize"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        showPagination={showPagination}
        enablePagination={enablePagination}
        table={table}
        selectedCount={selectedCount}
        totalRows={totalRows}
      />
    </div>
  );
};

export default TanStackTable;