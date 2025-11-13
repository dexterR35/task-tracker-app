import React, {
  useState,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CARD_SYSTEM, TABLE_SYSTEM } from "@/constants";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { SkeletonTable } from "@/components/ui/Skeleton/Skeleton";
import { exportToCSV, exportTasksToCSVForUser } from "@/utils/exportData";
import { CheckboxField, TextField } from "@/components/forms/components";
import { logger } from "@/utils/logger";

// Constants
const PAGE_SIZE_OPTIONS = TABLE_SYSTEM.PAGE_SIZE_OPTIONS;
const DEFAULT_PAGE_SIZE = TABLE_SYSTEM.DEFAULT_PAGE_SIZE;
const SORT_ICONS = TABLE_SYSTEM.SORT_ICONS;

// Utility functions
const getSelectedRows = (table, rowSelection) => {
  return table.getFilteredRowModel().rows.filter((row) => {
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
  table,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="card-small-modern">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{
                backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.select_badge,
              }}
            ></div>
            <div className="flex flex-col">
              <span
                className="text-sm font-semibold"
                style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.pink }}
              >
                {selectedCount} row selected
              </span>
              <span className="text-xs text-gray-400">
                (Single selection mode)
              </span>
            </div>
          </div>
          <DynamicButton
            onClick={onClearSelection}
            variant="outline"
            size="xs"
            className="!border-0 !bg-transparent"
          >
            Clear selection
          </DynamicButton>
        </div>
        <div className="flex items-center space-x-2">
          {bulkActions.map((action, index) => (
            <DynamicButton
              key={index}
              onClick={() => onBulkAction(action, table)}
              disabled={selectedCount > 1}
              variant={action.variant}
              size="sm"
              iconName={action.icon}
              iconPosition="left"
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
  handleCSVExport,
  handleUserCSVExport, // New prop for user-specific export
  isExporting,
  onPageSizeChange,
  customFilter,
  title,
  departmentFilter, // New prop for department filter
  showUserExportButton = false, // Show user export button only when user is selected
}) => (
  <>
    <div className="card-small-modern overflow-visible p-0 relative">
      {/* Accent line on top - matching table design */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10 rounded-t-xl"
        style={{
          background: CARD_SYSTEM.COLOR_HEX_MAP.blue,
        }}
      />

      {/* Main Content Section */}
      <div className="px-5 py-4 bg-white dark:bg-smallCard overflow-visible">
        {/* Title and Export Button Row */}
        {title && (
          <div className="flex flex-row-reverse justify-between items-center gap-4 py-2 ">
            {/* Export Button - Right side */}
            <DynamicButton
              onClick={handleCSVExport}
              disabled={isExporting}
              variant="secondary"
              size="sm"
            >
              {isExporting ? "Exporting..." : "Export CSV"}
            </DynamicButton>

            {/* Title - Left side */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">
              {title}
            </h3>
          </div>
        )}

        <div className="flex justify-between items-center gap-4 flex-wrap overflow-visible">
          {/* Left - Filters */}
          <div className="flex items-center gap-4 flex-1 flex-wrap overflow-visible">
            {/* Global Filter */}
            {showFilters && (
              <div className="min-w-[200px] max-w-sm">
                <TextField
                  field={{
                    name: `${tableType}-search`,
                    label: `Search ${tableType}...`,
                    required: false,
                    placeholder: `Search ${tableType}...`,
                  }}
                  register={() => ({})}
                  errors={{}}
                  setValue={(name, value) => setGlobalFilter(value)}
                  trigger={() => {}}
                  clearErrors={() => {}}
                  formValues={{ [`${tableType}-search`]: globalFilter ?? "" }}
                />
              </div>
            )}

            {/* Department Filter */}
            {departmentFilter && <div className="w-64">{departmentFilter}</div>}

            {/* Custom Filter */}
            {customFilter && (
              <div className="flex-1 min-w-0">{customFilter}</div>
            )}
          </div>

          {/* Right - Actions (Rows, Columns, Export) */}
          <div className="flex items-center gap-3">
            {/* Rows per page selector */}
            {showPagination && enablePagination && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="page-size-select"
                  className="text-sm font-medium text-gray-800 dark:text-gray-300 m-0"
                >
                  Rows
                </label>
                <select
                  id="page-size-select"
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="h-8 w-16 px-3 py-1.5 text-sm font-normal border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:ring-blue-400/50 dark:focus:border-blue-400 transition-colors shadow-sm"
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
                 >
                   Columns
                 </DynamicButton>
                <div className="absolute right-0 mt-2 w-fit bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible z-10 backdrop-blur-sm">
                  <div className="py-2">
                    {table
                      .getAllLeafColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <label
                          key={column.id}
                          className="flex items-center px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <input
                            name={`column-${column.id}`}
                            id={`column-${column.id}`}
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="mr-3 w-4 h-4 text-blue-600 dark:text-blue-400"
                          />
                          {column.columnDef.header || column.id}
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            )}

             {/* Export CSV - Only show if no title (title row has its own export button) */}
             {!title && (
               <DynamicButton
                 onClick={handleCSVExport}
                 disabled={isExporting}
                 variant="secondary"
                 size="sm"
               >
                 {isExporting ? "Exporting..." : "Export CSV"}
               </DynamicButton>
             )}
 
             {/* User-specific export button */}
             {showUserExportButton && handleUserCSVExport && (
               <DynamicButton
                 onClick={handleUserCSVExport}
                 disabled={isExporting}
                 variant="secondary"
                 size="sm"
               >
                 {isExporting ? "Exporting..." : "Export User CSV"}
               </DynamicButton>
             )}
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-200/50 dark:border-gray-700/50 my-6"></div>
  </>
);

// Pagination component - TanStack pagination
const Pagination = ({
  showPagination,
  enablePagination,
  table,
  selectedCount,
  totalRows,
  onPageChange,
}) => {
  if (!showPagination || !enablePagination) return null;

  return (
    <div className="card-small-modern">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-400">
          {selectedCount} of {totalRows} row(s) selected.
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-2 bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                onPageChange(table.getState().pagination.pageIndex - 1)
              }
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            <button
              onClick={() =>
                onPageChange(table.getState().pagination.pageIndex + 1)
              }
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TanStackTable = forwardRef(
  (
    {
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
      pageSize = DEFAULT_PAGE_SIZE,
      enableSorting = true,
      enableFiltering = true,
      enablePagination = true,
      enableColumnResizing = true,
      enableRowSelection = false,
      onRowSelectionChange = null,

      // Column visibility
      initialColumnVisibility = {},
      onColumnVisibilityChange = null, // Callback when column visibility changes

      // Action handlers (for bulk actions)
      onEdit = null,
      onDelete = null,
      onSelect = null,

      // Bulk actions
      showBulkActions = false,
      bulkActions = [],

      // Pagination props
      paginationProps = null,
      onPageChange = null,
      onPageSizeChange = null,

      // Custom filter component
      customFilter = null,
      departmentFilter = null, // Department filter to show after search

      // Custom filters state (for dynamic export detection)
      customFilters = {},

      // Global filter props
      initialGlobalFilter = "",
      onGlobalFilterChange = null,

      // Additional props
      ...additionalProps
    },
    ref
  ) => {
    // Table state management
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState(initialGlobalFilter || "");
    const [columnFilters, setColumnFilters] = useState([]);

    // Sync global filter when initialGlobalFilter prop changes
    useEffect(() => {
      if (
        initialGlobalFilter !== undefined &&
        initialGlobalFilter !== globalFilter
      ) {
        setGlobalFilter(initialGlobalFilter);
      }
    }, [initialGlobalFilter]);

    // Wrapper for setGlobalFilter that also calls the callback
    const handleGlobalFilterChange = useCallback(
      (value) => {
        setGlobalFilter(value);
        if (onGlobalFilterChange) {
          onGlobalFilterChange(value);
        }
      },
      [onGlobalFilterChange]
    );
    const [columnVisibility, setColumnVisibility] = useState(
      initialColumnVisibility
    );

    // Sync column visibility when initialColumnVisibility prop changes (e.g., when user changes)
    useEffect(() => {
      if (
        initialColumnVisibility &&
        Object.keys(initialColumnVisibility).length > 0
      ) {
        // Only update if values actually differ to avoid unnecessary re-renders
        setColumnVisibility((prev) => {
          const hasChanges = Object.keys(initialColumnVisibility).some(
            (key) => prev[key] !== initialColumnVisibility[key]
          );
          return hasChanges ? initialColumnVisibility : prev;
        });
      }
    }, [initialColumnVisibility]);

    // Wrapper for setColumnVisibility that also calls the callback
    const handleColumnVisibilityChange = useCallback(
      (updater) => {
        setColumnVisibility((prev) => {
          const newValue =
            typeof updater === "function" ? updater(prev) : updater;
          if (onColumnVisibilityChange) {
            onColumnVisibilityChange(newValue);
          }
          return newValue;
        });
      },
      [onColumnVisibilityChange]
    );
    const [rowSelection, setRowSelection] = useState({});
    const [rowActionId, setRowActionId] = useState(null);
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: pageSize,
    });

    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState(null);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStep, setExportStep] = useState("");

    // Ref for click outside detection
    const tableRef = useRef(null);

    // Note: handleRowSelectionChange removed since we handle selection manually via row clicks

    // Memoized bulk action handler
    const handleBulkAction = useCallback(
      (action, tableInstance) => {
        const selectedRows = getSelectedRows(tableInstance, rowSelection);

        // Debug: Log bulk action info (removed for production)

        action.onClick(selectedRows.map((row) => row.original));
      },
      [rowSelection]
    );

    // Memoized clear selection handler
    const handleClearSelection = useCallback(() => {
      setRowSelection({});
      onRowSelectionChange?.({});
    }, [onRowSelectionChange]);

    // Memoized row selection change handler (using TanStack's built-in)
    const handleRowSelectionChange = useCallback(
      (updater) => {
        const newSelection =
          typeof updater === "function" ? updater(rowSelection) : updater;

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
      },
      [onRowSelectionChange]
    ); // Remove rowSelection from dependencies to prevent recreation

    // Memoized row click handler for selection
    const handleRowClick = useCallback(
      (row) => {
        if (!enableRowSelection) return;

        // Use TanStack's built-in row ID for selection
        const rowId = row.id;
        const isCurrentlySelected = rowSelection[rowId];

        // Debug: Log selection info (removed for production)

        // Toggle selection: if currently selected, deselect; otherwise select
        const newSelection = isCurrentlySelected ? {} : { [rowId]: true };
        handleRowSelectionChange(newSelection);
      },
      [enableRowSelection, rowSelection, handleRowSelectionChange]
    );

    // Handle click outside table to clear selection - Memoized to prevent excessive re-renders
    const handleClickOutside = useCallback(
      (event) => {
        if (tableRef.current && !tableRef.current.contains(event.target)) {
          // Only clear if there's a selection and we're not clicking on a modal or dropdown
          const isModal =
            event.target.closest('[role="dialog"]') ||
            event.target.closest(".modal") ||
            event.target.closest("[data-modal]") ||
            event.target.closest(".dropdown") ||
            event.target.closest("[data-dropdown]");

          if (Object.keys(rowSelection).length > 0 && !isModal) {
            handleClearSelection();
          }
        }
      },
      [rowSelection, handleClearSelection]
    );

    useEffect(() => {
      if (enableRowSelection) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [enableRowSelection, handleClickOutside]);

    // Expose clear selection function to parent components
    useImperativeHandle(
      ref,
      () => ({
        clearSelection: handleClearSelection,
      }),
      [handleClearSelection]
    );

    // Memoize columns to prevent unnecessary re-renders
    const tableColumns = useMemo(() => columns, [columns]);

    // Create table instance first
    const table = useReactTable({
      data,
      columns: tableColumns,
      getRowId: (row) => row.id, // Use the document ID as row ID
      state: {
        sorting,
        globalFilter,
        columnFilters,
        columnVisibility,
        rowSelection,
        pagination,
      },
      onSortingChange: setSorting,
      onGlobalFilterChange: handleGlobalFilterChange,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: handleColumnVisibilityChange,
      onRowSelectionChange: handleRowSelectionChange,
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(), // Use TanStack pagination
      enableSorting,
      enableFiltering,
      enablePagination: true, // Enable TanStack pagination
      enableColumnResizing,
      enableRowSelection,
    });

    // Handle TanStack pagination
    const handlePageChange = useCallback(
      (newPage) => {
        table.setPageIndex(newPage);
      },
      [table]
    );

    const handlePageSizeChange = useCallback(
      (newPageSize) => {
        table.setPageSize(newPageSize);
        table.setPageIndex(0); // Reset to first page when changing page size
      },
      [table]
    );

    // Export handler with progress simulation
    const handleCSVExport = useCallback(async () => {
      setIsExporting(true);
      setExportType("csv");
      setExportProgress(0);
      setExportStep("Preparing CSV export...");

      try {
        // Simulate progress steps
        const progressSteps = [
          { step: "Preparing data...", progress: 10 },
          { step: "Processing rows...", progress: 30 },
          { step: "Formatting data...", progress: 50 },
          { step: "Generating CSV...", progress: 70 },
          { step: "Finalizing export...", progress: 90 },
          { step: "Saving file...", progress: 100 },
        ];

        // Process each step quickly
        for (const { step, progress } of progressSteps) {
          setExportStep(step);
          setExportProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced from 300ms to 50ms
        }

        // Check if any filters are active
        const hasTanStackFilters =
          Boolean(globalFilter) || (columnFilters && columnFilters.length > 0);
        const hasCustomFilters =
          customFilters &&
          (Boolean(customFilters.selectedFilter) ||
            Boolean(customFilters.selectedDepartmentFilter) ||
            Boolean(customFilters.selectedDeliverableFilter) ||
            Boolean(customFilters.selectedUserId) ||
            Boolean(customFilters.selectedReporterId) ||
            Boolean(customFilters.selectedWeek));
        const hasActiveFilters = hasTanStackFilters || hasCustomFilters;

        // Get visible columns based on column visibility state
        const visibleColumns = table
          .getAllColumns()
          .filter(
            (col) =>
              col.getIsVisible() && col.id !== "select" && col.id !== "actions"
          );

        // Perform actual export with reporters and users data for proper name resolution
        const success = exportToCSV(
          table.getFilteredRowModel().rows.map((row) => row.original),
          visibleColumns.length > 0 ? visibleColumns : columns, // Use visible columns if available, fallback to all columns
          tableType,
          {
            filename: `${tableType}_export_${new Date().toISOString().split("T")[0]}.csv`,
            reporters: additionalProps?.reporters || [],
            users: additionalProps?.users || [],
            deliverables: additionalProps?.deliverables || [],
            hasActiveFilters, // Pass filter state to export function
          }
        );

        if (success) {
          setExportStep("CSV exported successfully!");
          await new Promise((resolve) => setTimeout(resolve, 200)); // Reduced from 1000ms to 200ms
        } else {
          setExportStep("CSV export failed. Please try again.");
          await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced from 2000ms to 500ms
        }
      } catch (error) {
        setExportStep("CSV export failed. Please try again.");
        await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced from 2000ms to 500ms
      } finally {
        setIsExporting(false);
        setExportType(null);
        setExportProgress(0);
        setExportStep("");
      }
    }, [
      table,
      columns,
      tableType,
      additionalProps?.reporters,
      globalFilter,
      columnFilters,
      customFilters,
    ]);

    // User-specific export handler (only for tasks table when user is selected)
    const handleUserCSVExport = useCallback(async () => {
      if (tableType !== "tasks") return;

      setIsExporting(true);
      setExportType("csv");
      setExportProgress(0);
      setExportStep("Preparing user CSV export...");

      try {
        // Simulate progress steps
        const progressSteps = [
          { step: "Preparing data...", progress: 10 },
          { step: "Processing rows...", progress: 30 },
          { step: "Formatting data...", progress: 50 },
          { step: "Generating CSV...", progress: 70 },
          { step: "Finalizing export...", progress: 90 },
          { step: "Saving file...", progress: 100 },
        ];

        for (const { step, progress } of progressSteps) {
          setExportStep(step);
          setExportProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Use user-specific export function
        const success = exportTasksToCSVForUser(
          table.getFilteredRowModel().rows.map((row) => row.original),
          {
            filename: `tasks_user_export_${new Date().toISOString().split("T")[0]}.csv`,
            deliverables: additionalProps?.deliverables || [],
          }
        );

        if (success) {
          setExportStep("User CSV exported successfully!");
          await new Promise((resolve) => setTimeout(resolve, 200));
        } else {
          setExportStep("User CSV export failed. Please try again.");
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        logger.error("Error exporting user CSV:", error);
        setExportStep("User CSV export failed. Please try again.");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } finally {
        setIsExporting(false);
        setExportType(null);
        setExportProgress(0);
        setExportStep("");
      }
    }, [table, tableType, additionalProps?.deliverables]);

    // Memoized values
    const selectedCount = getSelectedCount(rowSelection);
    const totalRows = table.getFilteredRowModel().rows.length;

    // Show skeleton only when loading
    const shouldShowSkeleton = isLoading;
    // Check if there are any rows to display (after filtering)
    const hasRows = table.getRowModel().rows.length > 0;

    return (
      <div ref={tableRef} className={`space-y-4 ${className}`}>
        {shouldShowSkeleton ? (
          <SkeletonTable rows={3} />
        ) : (
          <>
            {/* Table Controls - Always show export button, show other controls based on props */}
            <TableControls
              showFilters={showFilters}
              showPagination={showPagination}
              enablePagination={enablePagination}
              showColumnToggle={showColumnToggle}
              table={table}
              tableType={tableType}
              globalFilter={globalFilter}
              setGlobalFilter={handleGlobalFilterChange}
              columns={columns}
              handleCSVExport={handleCSVExport}
              handleUserCSVExport={
                tableType === "tasks" ? handleUserCSVExport : null
              }
              isExporting={isExporting}
              onPageSizeChange={handlePageSizeChange}
              customFilter={customFilter}
              title={additionalProps?.title}
              departmentFilter={departmentFilter}
              showUserExportButton={
                tableType === "tasks" && Boolean(customFilters?.selectedUserId)
              }
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
            <div className="card-small-modern overflow-hidden p-0 relative ">
              {/* Accent line on top - using green from constants */}
              <div
                className="absolute top-0 left-0 right-0 h-1 z-10 rounded-t-xl"
                style={{
                  background: CARD_SYSTEM.COLOR_HEX_MAP.blue,
                }}
              />
              <div className="overflow-x-auto pt-1">
                <table className="min-w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className={`px-5 py-4 text-start ${tableType === "analytics" ? "font-bold text-sm" : "font-semibold text-[12px]"} text-gray-700 dark:text-gray-200 tracking-tight bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50 ${
                              header.column.getCanSort()
                                ? "cursor-pointer select-none hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors"
                                : ""
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                            style={{ width: header.getSize() }}
                          >
                            <div className="flex items-center space-x-2">
                              <span>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
                              {header.column.getCanSort() && (
                                <span className="text-gray-500 dark:text-gray-300 ml-1">
                                  {SORT_ICONS[header.column.getIsSorted()] ??
                                    SORT_ICONS.false}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white dark:bg-smallCard divide-y divide-gray-200/50 dark:divide-gray-700/30">
                    {hasRows ? (
                      table.getRowModel().rows.map((row, index) => {
                        const rowKey = row.original?.id || row.id;
                        const isSelected = rowSelection[row.id];
                        const isBoldRow =
                          row.original?.bold || row.original?.highlight;
                        // Determine font weight: bold for analytics tables or rows marked as bold/highlight
                        const fontWeight =
                          tableType === "analytics" || isBoldRow
                            ? "font-bold"
                            : "font-normal";

                        return (
                          <tr
                            key={rowKey}
                            className={`cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ${
                              isSelected
                                ? "bg-blue-50/50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                                : ""
                            }`}
                            onClick={() => handleRowClick(row)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={`${row.original?.id || row.id}-${cell.column.id}`}
                                className={`px-5 py-4 ${tableType === "analytics" ? "text-sm" : "text-[13px]"} ${fontWeight} text-gray-700 dark:text-gray-300`}
                                style={{ width: cell.column.getSize() }}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={table.getAllColumns().length}
                          className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-2xl mb-2">📊</div>
                            <div className="text-sm font-medium">
                              {tableType === "analytics"
                                ? "No analytics data found for the selected criteria."
                                : "No tasks found matching the current filters."}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination - TanStack pagination */}
            <Pagination
              showPagination={showPagination}
              enablePagination={enablePagination}
              table={table}
              selectedCount={selectedCount}
              totalRows={totalRows}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* Export Progress Modal */}
        {isExporting && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="card p-8 max-w-md w-full mx-4">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h3>Generating CSV Export</h3>
                  <p className="text-gray-200">{exportStep}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-500 rounded-full h-3">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full  ease-out"
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
                  <div className="flex justify-between text-xs text-gray-800 dark:text-gray-400">
                    <div>• Table type: {tableType}</div>
                    <div>• Rows: {table.getFilteredRowModel().rows.length}</div>
                  </div>
                </div>

                {/* Success/Error message */}
                {(exportStep.includes("successfully") ||
                  exportStep.includes("failed")) && (
                  <div className="text-center">
                    <p
                      className={`text-sm font-medium ${
                        exportStep.includes("successfully")
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {exportStep.includes("successfully") ? "✅" : "❌"}{" "}
                      {exportStep}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TanStackTable.displayName = "TanStackTable";

export default TanStackTable;
