import React, { useMemo, memo } from "react";
import AnalyticsTable from "@/components/Table/AnalyticsTable";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { calculateShutterstockAnalytics } from "@/components/Cards/configs/ShutterstockAnalyticsConfig";

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
      totalTasks: calculatedData.totalTasks,
      totalHours: calculatedData.totalHours,
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
    totalTasks,
    totalHours,
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
        {/* Table Section */}
        <div>
          {hasRealData && (
            <AnalyticsTable
              data={tableData}
              columns={tableColumns}
              title={`Shutterstock Analytics (${totalTasks} tasks, ${totalHours}h)`}
            />
          )}
        </div>
      </div>
    </div>
  );
});

ShutterstockAnalyticsCard.displayName = 'ShutterstockAnalyticsCard';

export default ShutterstockAnalyticsCard;

