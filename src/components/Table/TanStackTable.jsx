import React, { useState, useMemo } from "react";
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

// Column helper for type safety
const columnHelper = createColumnHelper();

const TanStackTable = ({
  data = [],
  columns = [],
  tableType = "generic",
  error = null,
  className = "",
  isLoading = false,

  // Table features
  showPagination = true,
  showFilters = true,
  showColumnToggle = true,
  showActions = true,
  pageSize = 5,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnResizing = true,
  enableRowSelection = false,
  onRowSelectionChange = null,

  // Column visibility
  initialColumnVisibility = {},

  // Action handlers
  onEdit = null,
  onDelete = null,
  onSelect = null,
  
  // Action button customization
  selectButtonText = "View",
  selectButtonIcon = "edit",

  // Additional props
  ...additionalProps
}) => {
  // Table state management
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(
    initialColumnVisibility
  );
  const [rowSelection, setRowSelection] = useState({});
  const [rowActionId, setRowActionId] = useState(null);

  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => {
    const baseColumns = [];

    // Add selection column if enabled
    if (enableRowSelection) {
      baseColumns.push(
        columnHelper.display({
          id: "select",
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
    const actionColumn = showActions
      ? columnHelper.display({
          id: "actions",
          header: "Actions",
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
                    iconName={selectButtonIcon}
                    iconPosition="center"
                    title="Select Row"
                  >
                    {selectButtonText}
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
        })
      : null;

    // Combine base columns, data columns, and action column (if exists)
    return [
      ...baseColumns,
      ...columns,
      ...(actionColumn ? [actionColumn] : []),
    ];
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
      const newSelection =
        typeof updater === "function" ? updater(rowSelection) : updater;
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
      <div className={`space-y-4 ${className}`}>
        <SkeletonTable rows={5} />
      </div>
    );
  }

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

      {/* Search and Rows per page - Separate row above table */}
      <div className="flex justify-between items-center ">
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
              <label
                htmlFor="page-size-select"
                className="text-xs  m-0"
              >
                Rows per page
              </label>
              <select
                id="page-size-select"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="h-full w-[90px] px-3 py-2 text-sm font-medium "
              >
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
          )}
          

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
              {/* checkbox inside columns toggle */}
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 border border-gray-200/60 dark:border-gray-700/60 ring-1 ring-gray-200/30 dark:ring-gray-600/30">
                <div className="py-2">
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                      >
                        <input
                          name={`column-${column.id}`}
                          id={`column-${column.id}`}
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="mr-3 rounded border-gray-400 dark:border-gray-500 focus:ring-blue-500"
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

      {/* Table */}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
          <thead className="bg-gray-50/80 dark:bg-gray-800/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-2 text-start font-semibold  uppercase tracking-wider ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                        : ""
                    } transition-colors duration-150`}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      {header.column.getCanSort() && (
                        <span className="text-gray-400 dark:text-gray-500">
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted()] ?? "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200/60 dark:divide-gray-700/60">
            {table.getRowModel().rows.map((row, index) => {
                const rowKey = row.original?.id || row.id;
                // Debug logging for row keys
                if (tableType === 'deliverables') {
                  console.log(`TanStackTable: Rendering row ${index}:`, {
                    rowKey,
                    originalId: row.original?.id,
                    tanStackId: row.id,
                    name: row.original?.name
                  });
                }
                return (
                  <tr
                    key={rowKey}
                    className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 cursor-pointer transition-colors duration-150 ${
                      row.getIsSelected()
                        ? "bg-blue-50/80 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <td
                        key={`${row.original?.id || row.id}-${cell.column.id}`}
                        className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100"
                        style={{
                          width: cell.column.getSize(),
                        }}
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
            }
          </tbody>
        </table>
      </div>

      {/* TanStack Table Pagination */}
      {showPagination && enablePagination && (
        <div className="flex items-center justify-between space-x-3 py-4">
          <div className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            {Object.keys(rowSelection).length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex w-[100px] items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
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
      )}
    </div>
  );
};

export default TanStackTable;
