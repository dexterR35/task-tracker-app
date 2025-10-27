import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import MarketsByUsersCard from "@/components/Cards/MarketsByUsersCard";
import MarketingAnalyticsCard from "@/components/Cards/MarketingAnalyticsCard";
import AcquisitionAnalyticsCard from "@/components/Cards/AcquisitionAnalyticsCard";
import ProductAnalyticsCard from "@/components/Cards/ProductAnalyticsCard";
import AIAnalyticsCard from "@/components/Cards/AIAnalyticsCard";
import ReporterAnalyticsCard from "@/components/Cards/ReporterAnalyticsCard";
import { 
  getCachedMarketsByUsersCardProps, 
  getCachedMarketingAnalyticsCardProps, 
  getCachedAcquisitionAnalyticsCardProps, 
  getCachedProductAnalyticsCardProps,
  getCachedAIAnalyticsCardProps,
  getCachedReporterAnalyticsCardProps
} from "@/components/Cards/analyticsCardConfig";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { CARD_SYSTEM } from '@/constants';

const AnalyticsPage = () => {
  // Get real-time data from month selection
  const { users, reporters, error } = useAppDataContext();
  
  
  // Tab state
  const [activeTab, setActiveTab] = useState('markets-by-users');
  
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
  const analyticsTabs = useMemo(() => [
    {
      id: 'markets-by-users',
      name: 'Markets by Users',
      description: 'Task breakdown by markets and users'
    },
    {
      id: 'marketing-analytics',
      name: 'Marketing Analytics',
      description: 'Marketing performance and analytics'
    },
    {
      id: 'acquisition-analytics',
      name: 'Acquisition Analytics',
      description: 'Acquisition metrics and insights'
    },
    {
      id: 'product-analytics',
      name: 'Product Analytics',
      description: 'Product breakdown and analytics'
    },
    {
      id: 'ai-analytics',
      name: 'AI Analytics',
      description: 'AI analytics by users and models'
    },
    {
      id: 'reporter-analytics',
      name: 'Reporter Analytics',
      description: 'Reporter metrics with tasks, hours, markets, and products'
    },
  ], []);

  // Analytics data object - memoized to prevent unnecessary re-renders
  const analyticsData = useMemo(() => ({
    tasks,
    selectedMonth,
    users,
    reporters,
    isLoading
  }), [tasks, selectedMonth, users, reporters, isLoading]);

  // Lazy load card props - only calculate active tab
  const reporterAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'reporter-analytics') return null;
    return getCachedReporterAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.reporters,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.reporters, analyticsData.selectedMonth, analyticsData.isLoading]);

  const marketsByUsersCardProps = useMemo(() => {
    if (activeTab !== 'markets-by-users') return null;
    return getCachedMarketsByUsersCardProps(
      analyticsData.tasks,
      analyticsData.users,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.users, analyticsData.selectedMonth, analyticsData.isLoading]);

  const marketingAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'marketing-analytics') return null;
    return getCachedMarketingAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.selectedMonth, analyticsData.isLoading]);

  const acquisitionAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'acquisition-analytics') return null;
    return getCachedAcquisitionAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.selectedMonth, analyticsData.isLoading]);

  const productAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'product-analytics') return null;
    return getCachedProductAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.selectedMonth, analyticsData.isLoading]);

  const aiAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'ai-analytics') return null;
    return getCachedAIAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.users,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.users, analyticsData.selectedMonth, analyticsData.isLoading]);



  // Error handling function
  const showError = (message) => {
    console.error(message);
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

            
            {/* Month Selector */}
            <select
              value={selectedMonth?.monthId || currentMonth?.monthId || ""}
              onChange={(e) => selectMonth(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              {availableMonths && availableMonths.length > 0 ? (
                availableMonths.map(month => (
                  <option key={month.monthId} value={month.monthId}>
                    {month.monthName} {month.isCurrent ? "(Current)" : ""}
                  </option>
                ))
              ) : (
                currentMonth && (
                  <option value={currentMonth.monthId}>
                    {currentMonth.monthName} (Current)
                  </option>
                )
              )}
            </select>
          </div>
        </div>
        
        {/* Month Progress Bar */}
        <div className="mt-4 mb-8 card">
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

      {/* Analytics Tabs */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {analyticsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-base transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  style={{
                    borderBottomColor: activeTab === tab.id ? CARD_SYSTEM.COLOR_HEX_MAP.color_default : undefined,
                  }}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'reporter-analytics' ? (
              <div className="relative">
                <div id="reporter-analytics-card">
                  <div className="relative">
                    {reporterAnalyticsCardProps ? (
                      <ReporterAnalyticsCard 
                        {...reporterAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'markets-by-users' ? (
              <div className="relative">
                <div id="market-user-breakdown-card">
                  <div className="relative">
                    {marketsByUsersCardProps ? (
                      <MarketsByUsersCard 
                        {...marketsByUsersCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'marketing-analytics' ? (
              <div className="relative">
                <div id="marketing-analytics-card">
                  <div className="relative">
                    {marketingAnalyticsCardProps ? (
                      <MarketingAnalyticsCard 
                        {...marketingAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'acquisition-analytics' ? (
              <div className="relative">
                <div id="acquisition-analytics-card">
                  <div className="relative">
                    {acquisitionAnalyticsCardProps ? (
                      <AcquisitionAnalyticsCard 
                        {...acquisitionAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'product-analytics' ? (
              <div className="relative">
                <div id="product-analytics-card">
                  <div className="relative">
                    {productAnalyticsCardProps ? (
                      <ProductAnalyticsCard 
                        {...productAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'ai-analytics' ? (
              <div className="relative">
                <div id="ai-analytics-card">
                  <div className="relative">
                    {aiAnalyticsCardProps ? (
                      <AIAnalyticsCard 
                        {...aiAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}



    </div>
  );
};

export default AnalyticsPage;