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
import { exportToCSV } from "@/utils/exportData";
import { CheckboxField, TextField } from "@/components/forms/components";

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
    <div
      className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{
                backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.purple,          
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
          <DynamicButton onClick={onClearSelection} variant="outline" size="xs" className="!border-0 !bg-transparent">
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
  isExporting,
  onPageSizeChange,
  customFilter,
  sectionTitle,
}) => (
  <div className="flex justify-between items-center py-4 card">
    {/* Left Section - Section Title, Search and Filters */}
    <div className="flex items-center space-x-6 flex-1">
      {/* Section Title */}
      {sectionTitle && (
        <h3 className="text-lg font-semibold m-0">{sectionTitle}</h3>
      )}
      {/* Global Filter */}
      {showFilters && (
        <div className="max-w-sm">
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
      {/* Custom Filter - if provided */}
      {customFilter && (
        <div className="max-w-full">
          {customFilter}
        </div>
      )}
    </div>

    <div className="flex items-center space-x-3">
      {/* Rows per page selector */}
      {showPagination && enablePagination && (
        <div className="flex items-center justify-center gap-3">
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
            className="h-8 w-16 px-3 py-1.5 text-sm font-normal border border-gray-200 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:ring-blue-400/50 dark:focus:border-blue-400  backdrop-blur-sm"
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
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-700/50  backdrop-blur-sm">
            Columns
          </button>
          <div className="absolute right-0 mt-2 w-fit bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible  z-10 backdrop-blur-sm">
            <div className="py-2">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 cursor-pointer "
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

      <button
        onClick={handleCSVExport}
        disabled={isExporting}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-700/50  disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
      >
        {isExporting ? "Exporting..." : "Export CSV"}
      </button>
    </div>
  </div>
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
    <div className="flex items-center justify-between space-x-4 py-4">
      <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-400">
        {selectedCount} of {totalRows} row(s) selected.
      </div>
      <div className="flex items-center space-x-6">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 card px-4 py-2 rounded-md ">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              onPageChange(table.getState().pagination.pageIndex - 1)
            }
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-md card hover:bg-gray-50/80 dark:hover:bg-gray-700/50  disabled:opacity-50 disabled:cursor-not-allowed "
          >
            ←
          </button>
          <button
            onClick={() =>
              onPageChange(table.getState().pagination.pageIndex + 1)
            }
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-md card hover:bg-gray-50/80 dark:hover:bg-gray-700/50  disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
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

      // Additional props
      ...additionalProps
    },
    ref
  ) => {
    // Table state management
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState(
      initialColumnVisibility
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
      onGlobalFilterChange: setGlobalFilter,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
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

        // Perform actual export with reporters and users data for proper name resolution
        const success = exportToCSV(
          table.getFilteredRowModel().rows.map((row) => row.original),
          columns,
          tableType,
          {
            filename: `${tableType}_export_${new Date().toISOString().split("T")[0]}.csv`,
            reporters: additionalProps?.reporters || [],
            users: additionalProps?.users || [],
            deliverables: additionalProps?.deliverables || [],
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
    }, [table, columns, tableType, additionalProps?.reporters]);

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
              setGlobalFilter={setGlobalFilter}
              columns={columns}
              handleCSVExport={handleCSVExport}
              isExporting={isExporting}
              onPageSizeChange={handlePageSizeChange}
              customFilter={customFilter}
              sectionTitle={additionalProps?.sectionTitle}
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
            <div className="overflow-x-auto rounded-md border-0">
              <table className="min-w-full">
                <thead
                  style={{
                    backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.dark_gray,
                  }}
                >
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-4 py-3 text-start font-semibold text-[10px] text-gray-200 tracking-normal ${
                            header.column.getCanSort()
                              ? "cursor-pointer select-none hover:bg-gray-600/50"
                              : ""
                          }  first:rounded-tl-md last:rounded-tr-md`}
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
                              <span className="text-gray-200">
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
                <tbody className="bg-white dark:bg-smallCard divide-y divide-gray-500/60">
                  {hasRows ? (
                    table.getRowModel().rows.map((row, index) => {
                      const rowKey = row.original?.id || row.id;
                      const isSelected = rowSelection[row.id];

                      return (
                        <tr
                          key={rowKey}
                          className={`cursor-pointer border-gray-500/60`}
                           
                          style={
                            isSelected
                  ? {
                      // Apply all border styles when selected
                      borderLeft: `1px solid ${CARD_SYSTEM.COLOR_HEX_MAP.green}`,
                      borderRight: `1px solid ${CARD_SYSTEM.COLOR_HEX_MAP.green}`,
                      backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.dark_gray,
                    }
                  : {}
                          }
                          onClick={() => handleRowClick(row)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={`${row.original?.id || row.id}-${cell.column.id}`}
                              className="px-3 py-4 text-xs font-normal "
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
                  <h3>
                    Generating CSV Export
                  </h3>
                  <p className="text-gray-200">
                    {exportStep}
                  </p>
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
