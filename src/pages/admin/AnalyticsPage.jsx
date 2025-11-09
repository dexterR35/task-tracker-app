import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { Icons } from "@/components/icons";
import MarketsByUsersCard from "@/components/Cards/MarketsByUsersCard";
import MarketingAnalyticsCard from "@/components/Cards/MarketingAnalyticsCard";
import AcquisitionAnalyticsCard from "@/components/Cards/AcquisitionAnalyticsCard";
import ProductAnalyticsCard from "@/components/Cards/ProductAnalyticsCard";
import MiscAnalyticsCard from "@/components/Cards/MiscAnalyticsCard";
import AIAnalyticsCard from "@/components/Cards/AIAnalyticsCard";
import ReporterAnalyticsCard from "@/components/Cards/ReporterAnalyticsCard";
import {
  getCachedMarketingAnalyticsCardProps,
  getCachedAcquisitionAnalyticsCardProps,
  getCachedProductAnalyticsCardProps,
  getCachedMiscAnalyticsCardProps,
  getCachedAIAnalyticsCardProps,
  getCachedReporterAnalyticsCardProps,
  getCachedMarketsByUsersCardProps,
} from "@/components/Cards/analyticsCardConfig";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

import { CARD_SYSTEM } from "@/constants";
import { logger } from "@/utils/logger";

const AnalyticsPage = () => {
  // Get real-time data from month selection
  const { users, reporters, error } = useAppDataContext();

  // Tab state
  const [activeTab, setActiveTab] = useState("markets-by-users");

  const {
    tasks, // Real-time tasks data (selected or current month)
    availableMonths, // Available months for dropdown
    currentMonth, // Current month info
    selectedMonth, // Selected month info
    isCurrentMonth, // Boolean check
    isLoading, // Loading state for selected month
    isInitialLoading, // Loading state for initial month data
    error: monthError, // Error state
    selectMonth, // Function to select month
  } = useAppDataContext();

  // Debug logging removed for cleaner code

  // Get current month name for display
  const currentMonthName = currentMonth?.monthName || "Current Month";
  const selectedMonthName = selectedMonth?.monthName || currentMonthName;

  // Tab change handler - memoized to prevent re-renders
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Analytics tabs configuration - memoized to prevent re-renders
  const analyticsTabs = useMemo(
    () => [
      {
        id: "markets-by-users",
        name: "Markets by Users",
        description: "Task breakdown by markets and users",
      },
      {
        id: "marketing-analytics",
        name: "Marketing Analytics",
        description: "Marketing performance and analytics",
      },
      {
        id: "acquisition-analytics",
        name: "Acquisition Analytics",
        description: "Acquisition metrics and insights",
      },
      {
        id: "product-analytics",
        name: "Product Analytics",
        description: "Product breakdown and analytics",
      },
      {
        id: "misc-analytics",
        name: "Misc Analytics",
        description: "Misc product breakdown and analytics",
      },
      {
        id: "ai-analytics",
        name: "AI Analytics",
        description: "AI analytics by users and models",
      },
      {
        id: "reporter-analytics",
        name: "Reporter Analytics",
        description:
          "Reporter metrics with tasks, hours, markets, and products",
      },
    ],
    []
  );

  // Memoize tab button click handlers to prevent re-renders
  // Note: analyticsTabs is already memoized with empty deps, so it's stable
  const tabClickHandlers = useMemo(() => {
    const handlers = {};
    analyticsTabs.forEach((tab) => {
      handlers[tab.id] = () => handleTabChange(tab.id);
    });
    return handlers;
  }, [analyticsTabs, handleTabChange]);

  // Helper function to check if data is empty
  const hasNoData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return true;
    }
    return false;
  }, [tasks]);

  // Optimized card props calculation - only calculate for active tab
  const activeCardProps = useMemo(() => {
    if (isLoading) return null;

    // If there's no data, return a special object to indicate no data state
    if (hasNoData) {
      return { hasNoData: true };
    }

    try {
      switch (activeTab) {
        case "reporter-analytics":
          return getCachedReporterAnalyticsCardProps(
            tasks,
            reporters
          );
        case "markets-by-users":
          return getCachedMarketsByUsersCardProps(tasks, users);
        case "marketing-analytics":
          return getCachedMarketingAnalyticsCardProps(
            tasks,
            users
          );
        case "acquisition-analytics":
          return getCachedAcquisitionAnalyticsCardProps(
            tasks,
            users
          );
        case "product-analytics":
          return getCachedProductAnalyticsCardProps(
            tasks,
            users
          );
        case "misc-analytics":
          return getCachedMiscAnalyticsCardProps(
            tasks,
            users
          );
        case "ai-analytics":
          return getCachedAIAnalyticsCardProps(
            tasks,
            users
          );
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Error calculating props for ${activeTab}:`, error);
      return null;
    }
  }, [activeTab, tasks, users, reporters, hasNoData]);

  // Memoize active tab name to avoid repeated find() calls
  const activeTabName = useMemo(() => {
    return (
      analyticsTabs.find((tab) => tab.id === activeTab)?.name || "this tab"
    );
  }, [analyticsTabs, activeTab]);

  // Memoize tab button styles to prevent object recreation
  const tabButtonStyles = useMemo(() => {
    const activeStyle = {
      borderBottomColor: CARD_SYSTEM.COLOR_HEX_MAP.blue,
      borderBottomWidth: "3px",
    };
    return { active: activeStyle, inactive: {} };
  }, []);

  // Error handling function
  const showError = (message) => {
    logger.error(message);
    // You can replace this with a toast notification if you have one
    alert(message);
  };

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
          Error loading analytics:{" "}
          {(error || monthError)?.message || "Unknown error"}
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
            <h1 className="text-xl font-bold ">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Task breakdown by acquisition, product, and marketing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Month Selector */}
            <select
              value={selectedMonth?.monthId || currentMonth?.monthId || ""}
              onChange={(e) => selectMonth(e.target.value)}
              className="bg-white dark:bg-primary border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              {availableMonths && availableMonths.length > 0
                ? availableMonths.map((month) => (
                    <option key={month.monthId} value={month.monthId}>
                      {month.monthName} {month.isCurrent ? "(Current)" : ""}
                    </option>
                  ))
                : currentMonth && (
                    <option value={currentMonth.monthId}>
                      {currentMonth.monthName} (Current)
                    </option>
                  )}
            </select>
          </div>
        </div>

        {/* Month Progress Bar */}
        <div className="mt-4 mb-8">
          <MonthProgressBar
            monthId={selectedMonth?.monthId || currentMonth?.monthId}
            monthName={selectedMonth?.monthName || currentMonth?.monthName}
            isCurrentMonth={isCurrentMonth}
            startDate={selectedMonth?.startDate || currentMonth?.startDate}
            endDate={selectedMonth?.endDate || currentMonth?.endDate}
            daysInMonth={
              selectedMonth?.daysInMonth || currentMonth?.daysInMonth
            }
          />
        </div>
      </div>

      {/* Analytics Tabs */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Traditional Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex flex-wrap -mb-px space-x-8">
              {analyticsTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={tabClickHandlers[tab.id]}
                    className={`
                      py-3 px-4 border-b-2 font-medium text-base rounded-none
                      ${
                        isActive
                          ? "text-gray-900 dark:text-gray-100 font-semibold"
                          : "border-transparent text-gray-500 dark:text-gray-400"
                      }
                    `}
                    style={
                      isActive
                        ? tabButtonStyles.active
                        : tabButtonStyles.inactive
                    }
                  >
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {isLoading ? (
              <SkeletonAnalyticsCard />
            ) : activeCardProps && activeCardProps.hasNoData ? (
              <div className="card">
                <div className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Icons.generic.document className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Data Available
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      There is no data available for {activeTabName}. Data will
                      appear once tasks are added for the selected month.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeCardProps ? (
              <div className="relative">
                <div id={`${activeTab}-card`}>
                  <div className="relative">
                    {activeTab === "reporter-analytics" && (
                      <ReporterAnalyticsCard {...activeCardProps} />
                    )}
                    {activeTab === "markets-by-users" && (
                      <MarketsByUsersCard {...activeCardProps} />
                    )}
                    {activeTab === "marketing-analytics" && (
                      <MarketingAnalyticsCard {...activeCardProps} />
                    )}
                    {activeTab === "acquisition-analytics" && (
                      <AcquisitionAnalyticsCard {...activeCardProps} />
                    )}
                    {activeTab === "product-analytics" && (
                      <ProductAnalyticsCard {...activeCardProps} />
                    )}
                    {activeTab === "misc-analytics" && (
                      <MiscAnalyticsCard {...activeCardProps} />
                    )}
                    {activeTab === "ai-analytics" && (
                      <AIAnalyticsCard {...activeCardProps} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Icons.generic.document className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Data Available
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      Unable to load data for {activeTabName}. Please try
                      refreshing the page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
