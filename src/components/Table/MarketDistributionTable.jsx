import React, { useMemo } from "react";
import TanStackTable from "@/components/Table/TanStackTable";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const MarketDistributionTable = ({ data, isLoading = false }) => {
  const columns = useMemo(() => [
    columnHelper.accessor('user', {
      header: 'User',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {getValue()}
        </span>
      ),
      size: 150,
    }),
    columnHelper.accessor('markets', {
      header: 'Markets',
      cell: ({ getValue }) => (
        <span className="text-gray-700 dark:text-gray-300">
          {getValue()}
        </span>
      ),
      size: 200,
    }),
    columnHelper.accessor('totalTasks', {
      header: 'Total Tasks',
      cell: ({ getValue }) => (
        <span className="text-gray-700 dark:text-gray-300">
          {getValue()}
        </span>
      ),
      size: 120,
    }),
    columnHelper.accessor('totalHours', {
      header: 'Task Hours',
      cell: ({ getValue }) => (
        <span className="text-gray-700 dark:text-gray-300">
          {getValue().toFixed(1)}h
        </span>
      ),
      size: 120,
    }),
    columnHelper.accessor('totalAIHours', {
      header: 'AI Hours',
      cell: ({ getValue }) => (
        <span className="text-gray-700 dark:text-gray-300">
          {getValue().toFixed(1)}h
        </span>
      ),
      size: 120,
    }),
    columnHelper.accessor('combinedHours', {
      header: 'Total Hours',
      cell: ({ getValue }) => (
        <span className="text-gray-700 dark:text-gray-300 font-semibold">
          {getValue()}h
        </span>
      ),
      size: 120,
    }),
  ], []);

  return (
    <TanStackTable
      data={data || []}
      columns={columns}
      tableType="market-distribution"
      isLoading={isLoading}
      enableRowSelection={false}
      showBulkActions={false}
      showFilters={false}
      showPagination={false}
      showColumnToggle={false}
      enablePagination={false}
      enableFiltering={false}
    />
  );
};

export default MarketDistributionTable;
