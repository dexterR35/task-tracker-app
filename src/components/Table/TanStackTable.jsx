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

// Bulk actions bar component – minimal, matches card
const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  bulkActions,
  onBulkAction,
  table,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="table-card mb-4">
      <div className="table-card-inner flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="table-bulk-label">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="table-bulk-clear"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2">
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
  onPageSizeChange,
  customFilter,
  departmentFilter,
}) => {
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target)
      ) {
        setIsColumnMenuOpen(false);
      }
    };

    if (isColumnMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColumnMenuOpen]);

  return (
    <div className="table-card-controls">
      {/* Left - Filters */}
      <div className="flex items-center gap-4 flex-1 flex-wrap min-w-0">
        {showFilters && (
          <div className="table-controls-search">
            <TextField
              field={{
                name: `${tableType}-search`,
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
        {departmentFilter && <div className="w-52 shrink-0">{departmentFilter}</div>}
        {customFilter && <div className="flex-1 min-w-0">{customFilter}</div>}
      </div>

      {/* Right - Rows, Columns */}
      <div className="flex items-center gap-3 shrink-0">
        {showPagination && enablePagination && (
          <div className="flex items-center gap-2">
            <span className="table-card-header">Rows</span>
            <select
              id="page-size-select"
              value={table.getState().pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="table-page-size-select"
            >
              {PAGE_SIZE_OPTIONS.map((ps) => (
                <option key={ps} value={ps}>{ps}</option>
              ))}
            </select>
          </div>
        )}
        {showColumnToggle && (
          <div className="relative" ref={columnMenuRef}>
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="table-card-header hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Columns
            </button>
            <div
              className={`absolute right-0 mt-2 w-56 bg-white dark:bg-smallCard border border-gray-200/80 dark:border-gray-700/60 rounded-xl shadow-lg z-50 overflow-hidden ${
                isColumnMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
            >
              <div className="px-4 py-2 ">
                <span className="table-card-header">Show / hide</span>
              </div>
              <div className="py-1 max-h-72 overflow-y-auto">
                {table.getAllLeafColumns().filter((col) => col.getCanHide()).map((column) => (
                  <label
                    key={column.id}
                    className="table-column-menu-item"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-0"
                    />
                    <span className="truncate">{column.columnDef.header || column.id}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Pagination – minimal, matches card typography
const Pagination = ({
  showPagination,
  enablePagination,
  table,
  selectedCount,
  totalRows,
  onPageChange,
}) => {
  if (!showPagination || !enablePagination) return null;

  const pageIndex = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();

  return (
    <div className="table-card-pagination">
      <span className="table-card-header">
        {totalRows} row{totalRows !== 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <span className="table-card-header">
          {pageIndex} / {pageCount || 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(pageIndex - 2)}
          disabled={!table.getCanPreviousPage()}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pageIndex)}
          disabled={!table.getCanNextPage()}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          →
        </button>
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

    // Memoized values
    const selectedCount = getSelectedCount(rowSelection);
    const totalRows = table.getFilteredRowModel().rows.length;

    // Show skeleton only when loading
    const shouldShowSkeleton = isLoading;
    // Check if there are any rows to display (after filtering)
    const hasRows = table.getRowModel().rows.length > 0;

    // Check if there are active filters to determine the empty state message
    const hasActiveFilters = useMemo(() => {
      const columnFilters = table.getState().columnFilters;
      const hasTanStackFilters =
        Boolean(globalFilter) || (columnFilters && columnFilters.length > 0);
      const hasCustomFilters =
        customFilters &&
        (Boolean(customFilters.selectedUserId) ||
          Boolean(customFilters.selectedReporterId));
      return hasTanStackFilters || hasCustomFilters;
    }, [globalFilter, table.getState().columnFilters, customFilters]);

    return (
      <div ref={tableRef} className={`space-y-0 ${className}`}>
        {shouldShowSkeleton ? (
          <SkeletonTable rows={3} />
        ) : (
          <div className="table-card">
            <div className="table-card-inner">
              {/* Controls */}
              <TableControls
                showFilters={showFilters}
                showPagination={showPagination}
                enablePagination={enablePagination}
                showColumnToggle={showColumnToggle}
                table={table}
                tableType={tableType}
                globalFilter={globalFilter}
                setGlobalFilter={handleGlobalFilterChange}
                onPageSizeChange={handlePageSizeChange}
                customFilter={customFilter}
                departmentFilter={departmentFilter}
              />

              <BulkActionsBar
                selectedCount={selectedCount}
                onClearSelection={handleClearSelection}
                bulkActions={bulkActions}
                onBulkAction={handleBulkAction}
                table={table}
              />

              {/* Table */}
              <div className="table-wrapper">
                <table className="min-w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="table-card-row">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className={`table-card-header-cell ${
                              header.column.getCanSort()
                                ? "table-header-cell-sortable"
                                : ""
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                            style={{ width: header.getSize() }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
                              {header.column.getCanSort() && (
                                <span className="table-sort-icon">
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
                  <tbody className="table-body">
                    {hasRows ? (
                      table.getRowModel().rows.map((row) => {
                        const rowKey = row.original?.id || row.id;
                        const isSelected = rowSelection[row.id];
                        const isBoldRow =
                          row.original?.bold || row.original?.highlight;
                        const fontWeight = isBoldRow ? "font-semibold" : "font-normal";

                        return (
                          <tr
                            key={rowKey}
                            className={`table-card-row cursor-pointer ${
                              isSelected ? "table-row-selected" : ""
                            }`}
                            onClick={() => handleRowClick(row)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={`${row.original?.id || row.id}-${cell.column.id}`}
                                className={`table-card-cell table-cell-text ${fontWeight}`}
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
                          className="table-card-empty"
                        >
                          {hasActiveFilters
                            ? "No results for the current filters."
                            : "No data yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                showPagination={showPagination}
                enablePagination={enablePagination}
                table={table}
                selectedCount={selectedCount}
                totalRows={totalRows}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

TanStackTable.displayName = "TanStackTable";

export default TanStackTable;
