import React, { useMemo, useState } from "react";
import TanStackTable from "@/components/Table/TanStackTable";
import { createColumnHelper } from "@tanstack/react-table";
import { TABLE_SYSTEM } from "@/constants";
import DynamicButton from "@/components/ui/Button/DynamicButton";

const columnHelper = createColumnHelper();

const AnalyticsTable = ({ 
  data, 
  columns, 
  className = "",
  isLoading = false,
  title = "",
  enablePagination = false,
  showPagination = false
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggle = () => {
    setIsOpen(!isOpen);
  };
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


  const tableProps = {
    data: data || [],
    columns: tableColumns,
    tableType: "analytics",
    isLoading,
    className: "!text-sm !space-y-0",
    enableRowSelection: false,
    showBulkActions: false,
    showFilters: false,
    showPagination: showPagination,
    showColumnToggle: false,
    enablePagination: enablePagination,
    enableFiltering: false,
    pageSize: defaultPageSize,
    title: "", // Don't pass title to TanStackTable since we're handling it in our header
    initialState: {
      pagination: {
        pageSize: defaultPageSize
      }
    }
  };

  return (
    <div className={`analytics-table ${className}`}>
      {/* Header with title and show/hide button */}
      {title && (
        <div className="flex justify-between items-center gap-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <DynamicButton
            onClick={toggle}
            variant="outline"
            size="sm"
          >
            {isOpen ? "Hide" : "Show"}
          </DynamicButton>
        </div>
      )}
      
      {/* Table content */}
      {isOpen && <TanStackTable {...tableProps} />}
    </div>
  );
};

export default AnalyticsTable;
