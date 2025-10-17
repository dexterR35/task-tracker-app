import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef, useEffect, useRef } from "react";
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
import { exportToCSV } from "@/utils/exportData";
import { TABLE_SYSTEM } from '@/constants';

// Constants
const PAGE_SIZE_OPTIONS = TABLE_SYSTEM.PAGE_SIZE_OPTIONS;
const SORT_ICONS = TABLE_SYSTEM.SORT_ICONS;

// Utility functions
const getSelectedRows = (table, rowSelection) => {
  return table.getFilteredRowModel().rows.filter(row => {
    return rowSelection[row.id];
  });
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
            {selectedCount} row selected
            <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
              (Single selection mode)
            </span>
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
  columns,
  handleCSVExport,
  isExporting
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
                    className="flex items-center px-4 py-0.5 text-sm font-medium hover:bg-hover cursor-pointer transition-colors duration-150"
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
      
      <DynamicButton
        variant="outline"
        size="sm"
        onClick={handleCSVExport}
        disabled={isExporting}
        iconName={isExporting ? "loading" : "download"}
        iconPosition="left"
        className="font-semibold"
      >
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </DynamicButton>
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

const TanStackTable = forwardRef(({
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
  pageSize = 10,
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
}, ref) => {
  // Table state management
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [rowSelection, setRowSelection] = useState({});
  const [rowActionId, setRowActionId] = useState(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');

  // Ref for click outside detection
  const tableRef = useRef(null);

  // Note: handleRowSelectionChange removed since we handle selection manually via row clicks

  // Memoized bulk action handler
  const handleBulkAction = useCallback((action, tableInstance) => {
    const selectedRows = getSelectedRows(tableInstance, rowSelection);
    
    // Debug: Log bulk action info (removed for production)
    
    action.onClick(selectedRows.map(row => row.original));
  }, [rowSelection]);

  // Memoized clear selection handler
  const handleClearSelection = useCallback(() => {
    setRowSelection({});
    onRowSelectionChange?.({});
  }, [onRowSelectionChange]);

  // Memoized row selection change handler (using TanStack's built-in)
  const handleRowSelectionChange = useCallback((updater) => {
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    
    // Enforce single selection - if multiple rows selected, keep only the last one
    const selectedKeys = Object.keys(newSelection);
    if (selectedKeys.length > 1) {
      const lastSelected = selectedKeys[selectedKeys.length - 1];
      const singleSelection = { [lastSelected]: true };
      setRowSelection(singleSelection);
      onRowSelectionChange?.(singleSelection);
    } else {
      setRowSelection(newSelection);
      onRowSelectionChange?.(newSelection);
    }
  }, [onRowSelectionChange]); // Remove rowSelection from dependencies to prevent recreation

  // Memoized row click handler for selection
  const handleRowClick = useCallback((row) => {
    if (!enableRowSelection) return;
    
    // Use TanStack's built-in row ID for selection
    const rowId = row.id;
    const isCurrentlySelected = rowSelection[rowId];
    
    // Debug: Log selection info (removed for production)
    
    // Toggle selection: if currently selected, deselect; otherwise select
    const newSelection = isCurrentlySelected ? {} : { [rowId]: true };
    handleRowSelectionChange(newSelection);
  }, [enableRowSelection, rowSelection, handleRowSelectionChange]);

  // Handle click outside table to clear selection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        // Only clear if there's a selection and we're not clicking on a modal or dropdown
        const isModal = event.target.closest('[role="dialog"]') || 
                       event.target.closest('.modal') || 
                       event.target.closest('[data-modal]') ||
                       event.target.closest('.dropdown') ||
                       event.target.closest('[data-dropdown]');
        
        if (Object.keys(rowSelection).length > 0 && !isModal) {
          handleClearSelection();
        }
      }
    };

    if (enableRowSelection) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [enableRowSelection, rowSelection, handleClearSelection]);

  // Expose clear selection function to parent components
  useImperativeHandle(ref, () => ({
    clearSelection: handleClearSelection
  }), [handleClearSelection]);

  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => {
    // Selection column removed - row selection now works by clicking anywhere on the row
    return columns;
  }, [columns]);

  // Create table instance
  const table = useReactTable({
    data,
    columns: memoizedColumns,
    getRowId: (row) => row.id, // Use the document ID as row ID
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

  // Export handler with progress simulation
  const handleCSVExport = useCallback(async () => {
    setIsExporting(true);
    setExportType('csv');
    setExportProgress(0);
    setExportStep('Preparing CSV export...');

    try {
      // Simulate progress steps
      const progressSteps = [
        { step: 'Preparing data...', progress: 10 },
        { step: 'Processing rows...', progress: 30 },
        { step: 'Formatting data...', progress: 50 },
        { step: 'Generating CSV...', progress: 70 },
        { step: 'Finalizing export...', progress: 90 },
        { step: 'Saving file...', progress: 100 }
      ];

      // Process each step quickly
      for (const { step, progress } of progressSteps) {
        setExportStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 50)); // Reduced from 300ms to 50ms
      }

      // Perform actual export with reporters data for proper name resolution
      const success = exportToCSV(
        table.getFilteredRowModel().rows.map((row) => row.original),
        columns,
        tableType,
        { 
          filename: `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`,
          reporters: additionalProps?.reporters || []
        }
      );

      if (success) {
        setExportStep('CSV exported successfully!');
        await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 1000ms to 200ms
      } else {
        setExportStep('CSV export failed. Please try again.');
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2000ms to 500ms
      }

    } catch (error) {
      setExportStep('CSV export failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2000ms to 500ms
    } finally {
      setIsExporting(false);
      setExportType(null);
      setExportProgress(0);
      setExportStep('');
    }
  }, [table, columns, tableType, additionalProps?.reporters]);

  // Memoized values
  const selectedCount = getSelectedCount(rowSelection);
  const totalRows = table.getFilteredRowModel().rows.length;

  // Show skeleton only when loading, show no data message when data is empty but not loading
  const shouldShowSkeleton = isLoading;
  const shouldShowNoData = !isLoading && (!data || data.length === 0);

  return (
    <div ref={tableRef} className={`space-y-4 ${className}`}>
      {shouldShowSkeleton ? (
        <SkeletonTable rows={5} />
      ) : shouldShowNoData ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-lg font-medium mb-2">No Data Available</div>
          <div className="text-sm text-center">
            {tableType === "analytics" 
              ? "No analytics data found for the selected criteria."
              : "No data found for the current selection."
            }
          </div>
        </div>
      ) : (
        <>
          {/* Table Controls - Only show if any controls are enabled */}
          {(showFilters || (showPagination && enablePagination) || showColumnToggle) && (
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
              handleCSVExport={handleCSVExport}
              isExporting={isExporting}
            />
          )}

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
              <thead className="bg-btn-primary py-2 h-14">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-4 py-2 text-start font-semibold !capitalize tracking-wider ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none hover:bg-hover"
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
                  const isSelected = rowSelection[row.id];
                 
                  return (
                    <tr
                      key={rowKey}
                      className={`hover:bg-hover cursor-pointer transition-colors duration-150 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleRowClick(row)}
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
        </>
      )}

      {/* Export Progress Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {/* Animated loading icon */}
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Generating CSV Export
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {exportStep}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                
                {/* Progress percentage */}
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {exportProgress}% complete
                  </span>
                </div>
              </div>
              
              {/* Processing details */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Processing table data and formatting for CSV export...
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>• Table type: {tableType}</div>
                  <div>• Rows: {table.getFilteredRowModel().rows.length}</div>
                  <div>• Export type: CSV</div>
                  <div>• Quality: High</div>
                </div>
              </div>
              
              {/* Success/Error message */}
              {(exportStep.includes('successfully') || exportStep.includes('failed')) && (
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    exportStep.includes('successfully') 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {exportStep.includes('successfully') ? '✅' : '❌'} {exportStep}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TanStackTable.displayName = 'TanStackTable';

export default TanStackTable;