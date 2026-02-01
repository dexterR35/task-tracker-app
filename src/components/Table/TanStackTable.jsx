import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { TABLE_SYSTEM } from "@/constants";
import { SkeletonTable } from "@/components/ui/Skeleton/Skeleton";
import { TextField } from "@/components/forms/components";

const PAGE_SIZE_OPTIONS = TABLE_SYSTEM.PAGE_SIZE_OPTIONS;
const DEFAULT_PAGE_SIZE = TABLE_SYSTEM.DEFAULT_PAGE_SIZE;
const SORT_ICONS = TABLE_SYSTEM.SORT_ICONS;

/**
 * Users table controls: search, rows per page, column visibility.
 */
const TableControls = ({
  showFilters,
  showPagination,
  enablePagination,
  showColumnToggle,
  table,
  globalFilter,
  setGlobalFilter,
  onPageSizeChange,
}) => {
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setIsColumnMenuOpen(false);
      }
    };
    if (isColumnMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isColumnMenuOpen]);

  return (
    <div className="table-card-controls">
      <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
        {showFilters && (
          <div className="table-controls-search">
            <TextField
              field={{
                name: "users-search",
                required: false,
                placeholder: "Search users...",
              }}
              register={() => ({})}
              errors={{}}
              setValue={(name, value) => setGlobalFilter(value)}
              watch={() => globalFilter ?? ""}
            />
          </div>
        )}
      </div>
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
              <div className="px-4 py-2">
                <span className="table-card-header">Show / hide</span>
              </div>
              <div className="py-1 max-h-72 overflow-y-auto">
                {table.getAllLeafColumns().filter((col) => col.getCanHide()).map((column) => (
                  <label key={column.id} className="table-column-menu-item">
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

/**
 * Users table pagination.
 */
const Pagination = ({
  showPagination,
  enablePagination,
  table,
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
        <span className="table-card-header">{pageIndex} / {pageCount || 1}</span>
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

/**
 * Users table – TanStack Table wired for user list only.
 */
const TanStackTable = ({
  data = [],
  columns = [],
  error = null,
  className = "",
  isLoading = false,
  showPagination = true,
  showFilters = true,
  showColumnToggle = true,
  pageSize = DEFAULT_PAGE_SIZE,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnResizing = true,
  initialColumnVisibility = {},
}) => {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const tableColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
    enableFiltering,
    enablePagination: true,
    enableColumnResizing,
    enableRowSelection: false,
  });

  const handlePageChange = useCallback((newPage) => table.setPageIndex(newPage), [table]);
  const handlePageSizeChange = useCallback((newPageSize) => {
    table.setPageSize(newPageSize);
    table.setPageIndex(0);
  }, [table]);

  const totalRows = table.getFilteredRowModel().rows.length;
  const hasRows = table.getRowModel().rows.length > 0;
  const hasActiveFilters = Boolean(globalFilter) || (columnFilters && columnFilters.length > 0);

  if (isLoading) {
    return <SkeletonTable rows={3} className={className} />;
  }

  return (
    <div className={`space-y-0 ${className}`}>
      <div className="table-card">
        <div className="table-card-inner">
          <TableControls
            showFilters={showFilters}
            showPagination={showPagination}
            enablePagination={enablePagination}
            showColumnToggle={showColumnToggle}
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            onPageSizeChange={handlePageSizeChange}
          />

          <div className="table-wrapper">
            <table className="min-w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="table-card-row">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`table-card-header-cell ${
                          header.column.getCanSort() ? "table-header-cell-sortable" : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ width: header.getSize() }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="table-sort-icon">
                              {SORT_ICONS[header.column.getIsSorted()] ?? SORT_ICONS.false}
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
                    return (
                      <tr key={rowKey} className="table-card-row">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={`${row.original?.id || row.id}-${cell.column.id}`}
                            className="table-card-cell table-cell-text"
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="table-card-empty">
                      {hasActiveFilters ? "No results for the current filters." : "No data yet."}
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
            totalRows={totalRows}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

TanStackTable.displayName = "TanStackTable";
export default TanStackTable;
