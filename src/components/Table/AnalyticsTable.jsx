import React, { useMemo } from "react";
import TanStackTable from "@/components/Table/TanStackTable";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const AnalyticsTable = ({ 
  data, 
  columns, 
  title, 
  className = "",
  isLoading = false
}) => {
  // Convert columns to TanStack format with proper memoization
  const tableColumns = useMemo(() => {
    return columns.map(column => 
      columnHelper.accessor(column.key, {
        header: column.header,
        cell: ({ getValue, row }) => {
          const value = getValue();
          if (column.render) {
            return column.render(value, row.original);
          }
          return value;
        },
        size: column.size || 100,
      })
    );
  }, [columns]);

  // Memoize table props to prevent unnecessary re-renders
  const tableProps = useMemo(() => ({
    data: data || [],
    columns: tableColumns,
    tableType: "analytics",
    isLoading,
    className: "text-xs",
    enableRowSelection: false,
    showBulkActions: false,
    showFilters: false,
    showPagination: false,
    showColumnToggle: false,
    enablePagination: false,
    enableFiltering: false,
    pageSize: data?.length || 10000,
    initialState: {
      pagination: {
        pageSize: data?.length || 10000
      }
    }
  }), [data, tableColumns, isLoading]);

  return (
    <div className={`card-small ${className}`}>
      <h3 className="card-title text-base mb-4">{title}</h3>
      <TanStackTable {...tableProps} />
    </div>
  );
};

export default AnalyticsTable;
