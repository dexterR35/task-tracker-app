import React, { useMemo } from "react";
import TanStackTable from "@/components/Table/TanStackTable";
import { createColumnHelper } from "@tanstack/react-table";
import { TABLE_SYSTEM } from "@/constants";

const columnHelper = createColumnHelper();

const AnalyticsTable = ({ 
  data, 
  columns, 
  className = "",
  isLoading = false,
  sectionTitle = "Tables",
  enablePagination = false,
  showPagination = false
}) => {
  // Convert columns to TanStack format - memoized to prevent re-renders
  const tableColumns = useMemo(() => 
    columns.map(column => 
      columnHelper.accessor(column.key, {
        header: column.header,
        enableSorting: false, // Disable sorting for analytics tables
        cell: ({ getValue, row }) => {
          const value = getValue();
          if (column.render) {
            return column.render(value, row.original);
          }
          return value;
        },
        size: column.size || 100,
      })
    ), [columns]
  );

  // Calculate page size - use default page size (20) when pagination is enabled, otherwise show all rows
  const totalRows = data?.length || 0;
  const defaultPageSize = enablePagination ? TABLE_SYSTEM.DEFAULT_PAGE_SIZE : (totalRows || 10000);

  // Table props
  const tableProps = {
    data: data || [],
    columns: tableColumns,
    tableType: "analytics",
    isLoading,
    className: "!text-sm",
    enableRowSelection: false,
    showBulkActions: false,
    showFilters: false,
    showPagination: showPagination,
    showColumnToggle: false,
    enablePagination: enablePagination,
    enableFiltering: false,
    pageSize: defaultPageSize,
    sectionTitle: sectionTitle,
    initialState: {
      pagination: {
        pageSize: defaultPageSize
      }
    }
  };

  return (
    <div className={`analytics-table ${className}`}>
      <TanStackTable {...tableProps} />
    </div>
  );
};

export default AnalyticsTable;
