import React from "react";
import { useAppData, useMonthSelection } from "@/hooks/useAppData";
import CategoryBreakdownCard from "@/components/Cards/CategoryBreakdownCard";
import ProductBreakdownCard from "@/components/Cards/ProductBreakdownCard";
import MarketUserBreakdownCard from "@/components/Cards/MarketUserBreakdownCard";
import ReporterAnalyticsCard from "@/components/Cards/ReporterAnalyticsCard";
import UserAnalyticsCard from "@/components/Cards/UserAnalyticsCard";
import AcquisitionAnalyticsCard from "@/components/Cards/AcquisitionAnalyticsCard";
import MarketingAnalyticsCard from "@/components/Cards/MarketingAnalyticsCard";
import ProductAnalyticsCard from "@/components/Cards/ProductAnalyticsCard";
import MonthProgressBar from "@/components/ui/MonthProgressBar";
import CSVExportButton from "@/components/ui/CSVExportButton";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

const AnalyticsPage = () => {
  // Get real-time data from month selection (same as AdminDashboardPage)
  const { user, users, reporters, error, isLoading: appDataLoading } = useAppData();
  
  const {
    tasks, // Real-time tasks data (already filtered by selected month)
    availableMonths, // Available months for dropdown
    currentMonth, // Current month info
    selectedMonth, // Selected month info
    isCurrentMonth, // Boolean check
    isLoading, // Loading state for selected month
    isInitialLoading, // Loading state for initial month data
    isMonthDataReady, // Flag indicating month data is ready
    error: monthError, // Error state
    selectMonth, // Function to select month
    resetToCurrentMonth, // Function to reset
  } = useMonthSelection();

  // Get current month name for display
  const currentMonthName = currentMonth?.monthName || "Current Month";
  const selectedMonthName = selectedMonth?.monthName || currentMonthName;

  if (isLoading || isInitialLoading) {
    return (
      <div>
        {/* Page Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
          </div>
          
          {/* Month Progress Bar Skeleton */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
          </div>
        </div>

        {/* Analytics Cards Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonAnalyticsCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error || monthError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">
          Error loading analytics: {(error || monthError)?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Task breakdown by acquisition, product, and marketing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* CSV Export Button */}
            <CSVExportButton 
              tasks={tasks}
              filename={`analytics_${selectedMonth?.monthName || currentMonth?.monthName || 'export'}`}
              className="relative"
            />
            
            {/* Month Selector */}
            <select
              value={selectedMonth?.monthId || currentMonth?.monthId || ""}
              onChange={(e) => selectMonth(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              {availableMonths.map(month => (
                <option key={month.monthId} value={month.monthId}>
                  {month.monthName}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Month Progress Bar */}
        <div className="mt-4">
          <MonthProgressBar 
            monthId={selectedMonth?.monthId || currentMonth?.monthId}
            monthName={selectedMonth?.monthName || currentMonth?.monthName}
            isCurrentMonth={isCurrentMonth}
            startDate={selectedMonth?.startDate || currentMonth?.startDate}
            endDate={selectedMonth?.endDate || currentMonth?.endDate}
            daysInMonth={selectedMonth?.daysInMonth || currentMonth?.daysInMonth}
          />
        </div>
      </div>

      {/* Chart-based Analytics Cards */}
      <div className="space-y-6">
        <MarketUserBreakdownCard tasks={tasks} selectedMonth={selectedMonth} users={users} isLoading={isLoading} />
        <ReporterAnalyticsCard tasks={tasks} selectedMonth={selectedMonth} reporters={reporters} isLoading={isLoading} />
        <UserAnalyticsCard tasks={tasks} selectedMonth={selectedMonth} users={users} isLoading={isLoading} />
        <AcquisitionAnalyticsCard tasks={tasks} selectedMonth={selectedMonth} isLoading={isLoading} />
        <MarketingAnalyticsCard tasks={tasks} selectedMonth={selectedMonth} isLoading={isLoading} />
        <ProductAnalyticsCard tasks={tasks} selectedMonth={selectedMonth} isLoading={isLoading} />
      </div>

      {/* Icon and Badge Cards */}
      <div className="space-y-6 mt-8">
        <CategoryBreakdownCard tasks={tasks} selectedMonth={selectedMonth} isLoading={isLoading} />
        <ProductBreakdownCard tasks={tasks} selectedMonth={selectedMonth} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default AnalyticsPage;