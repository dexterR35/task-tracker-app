import React, { useMemo, memo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { calculateShutterstockAnalytics } from "@/components/Cards/configs/ShutterstockAnalyticsConfig";
import { Icons } from "@/components/icons";

const ShutterstockAnalyticsCard = memo(({
  tasks = [],
  users = [],
  className = "",
  isLoading = false,
}) => {
  const cardData = useMemo(() => {
    if (isLoading) return null;

    const calculatedData = calculateShutterstockAnalytics(tasks, users);

    return {
      title: "Shutterstock Analytics",
      tableData: calculatedData.tableData,
      tableColumns: calculatedData.tableColumns,
      comparisonTableData: calculatedData.comparisonTableData,
      comparisonTableColumns: calculatedData.comparisonTableColumns,
      totalTasks: calculatedData.totalTasks,
      totalHours: calculatedData.totalHours,
      totalAllTasks: calculatedData.totalAllTasks,
    };
  }, [tasks, users, isLoading]);

  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  if (!cardData) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  const {
    title,
    tableData,
    tableColumns,
    comparisonTableData,
    comparisonTableColumns,
    totalTasks,
    totalHours,
    totalAllTasks,
  } = cardData;

  // Check if there's real data
  const hasRealData = tableData && tableData.some(
    (row) => !row.bold && !row.user?.toLowerCase().includes("no data available") && (row.totalTasks > 0)
  );

  // If no data at all, show error message
  if (!hasRealData) {
    return (
      <div id="shutterstock-analytics-card" className={`${className}`}>
        <div className="card">
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Shutterstock Data Available
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No tasks with Shutterstock usage found for the selected criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="shutterstock-analytics-card" className={`${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tables Section */}
        <div className="space-y-6">
          {/* Shutterstock vs AI Tools Comparison Table */}
          {comparisonTableData && comparisonTableData.length > 0 ? (
            <AnalyticsTable
              data={comparisonTableData}
              columns={comparisonTableColumns}
              title="Comparison: Shutterstock vs AI Tools"
            />
          ) : null}
          
          {/* Shutterstock Analytics Table */}
          {hasRealData && (
            <AnalyticsTable
              data={tableData}
              columns={tableColumns}
              title={`Shutterstock Analytics (${totalTasks} tasks, ${totalHours}h)`}
            />
          )}
          
          {/* Percentage Calculation Explanation - At the bottom */}
          {comparisonTableData && comparisonTableData.length > 0 ? (
            <div className="card">
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 mt-1">
                    <Icons.generic.help className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How Percentages Are Calculated
                    </h3>
                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <p className="font-medium mb-2">
                          Percentages are calculated as a percentage of all tasks ({totalAllTasks}):
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="space-y-2">
                            {comparisonTableData.map((row, index) => {
                              if (row.tool === "Total (Shutterstock + AI Tools)") return null;
                              const exampleCalculation = totalAllTasks > 0 
                                ? `${row.tasks} task${row.tasks !== 1 ? 's' : ''} = ${row.percentage}% of ${totalAllTasks}`
                                : 'N/A';
                              return (
                                <div key={index}>
                                  <span className="font-semibold text-gray-900 dark:text-white">{row.tool}:</span>
                                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                                    {exampleCalculation}
                                  </span>
                                </div>
                              );
                            })}
                            {comparisonTableData.find(row => row.tool === "Total (Shutterstock + AI Tools)") && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {comparisonTableData.find(row => row.tool === "Total (Shutterstock + AI Tools)")?.tool}:
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 ml-2">
                                  {comparisonTableData.find(row => row.tool === "Total (Shutterstock + AI Tools)")?.tasks} tasks = {comparisonTableData.find(row => row.tool === "Total (Shutterstock + AI Tools)")?.percentage}% of {totalAllTasks}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

ShutterstockAnalyticsCard.displayName = 'ShutterstockAnalyticsCard';

export default ShutterstockAnalyticsCard;

