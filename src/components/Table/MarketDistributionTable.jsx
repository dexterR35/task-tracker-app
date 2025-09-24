import React from "react";

const MarketDistributionTable = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                User
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Markets
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Total Tasks
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Task Hours
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                AI Hours
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Total Hours
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }).map((_, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                User
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Markets
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Total Tasks
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Task Hours
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                AI Hours
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                Total Hours
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                  {row.user}
                </td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {row.markets}
                </td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {row.totalTasks}
                </td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {row.totalHours.toFixed(1)}h
                </td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {row.totalAIHours.toFixed(1)}h
                </td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  {row.combinedHours}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
};

export default MarketDistributionTable;
