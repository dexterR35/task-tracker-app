import React, { useMemo } from "react";
import TanStackTable from "@/components/Table/TanStackTable";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const AnalyticsTable = ({ 
  data, 
  columns, 
  className = "",
  isLoading = false,
  sectionTitle = "📊 Tables"
}) => {
  // Convert columns to TanStack format - memoized to prevent re-renders
  const tableColumns = useMemo(() => 
    columns.map(column => 
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
    ), [columns]
  );

  // Table props
  const tableProps = {
    data: data || [],
    columns: tableColumns,
    tableType: "analytics",
    isLoading,
    className: "text-md",
    enableRowSelection: false,
    showBulkActions: false,
    showFilters: false,
    showPagination: false,
    showColumnToggle: false,
    enablePagination: false,
    enableFiltering: false,
    pageSize: data?.length || 10000,
    sectionTitle: sectionTitle,
    initialState: {
      pagination: {
        pageSize: data?.length || 10000
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
