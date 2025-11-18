import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDataContext } from "@/context/AppDataContext";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";
import MarketsByUsersCard from "@/components/Cards/MarketsByUsersCard";
import MarketingAnalyticsCard from "@/components/Cards/MarketingAnalyticsCard";
import AcquisitionAnalyticsCard from "@/components/Cards/AcquisitionAnalyticsCard";
import ProductAnalyticsCard from "@/components/Cards/ProductAnalyticsCard";
import MiscAnalyticsCard from "@/components/Cards/MiscAnalyticsCard";
import AIAnalyticsCard from "@/components/Cards/AIAnalyticsCard";
import ReporterAnalyticsCard from "@/components/Cards/ReporterAnalyticsCard";
import TotalAnalyticsCard from "@/components/Cards/TotalAnalyticsCard";
import ShutterstockAnalyticsCard from "@/components/Cards/ShutterstockAnalyticsCard";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import {
  getCachedMarketingAnalyticsCardProps,
  getCachedAcquisitionAnalyticsCardProps,
  getCachedProductAnalyticsCardProps,
  getCachedMiscAnalyticsCardProps,
  getCachedAIAnalyticsCardProps,
  getCachedReporterAnalyticsCardProps,
  getCachedMarketsByUsersCardProps,
  getCachedTotalAnalyticsCardProps,
  getCachedShutterstockAnalyticsCardProps,
} from "@/components/Cards/analyticsCardConfig";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import Skeleton, { SkeletonAnalyticsCard, SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import DynamicButton from "@/components/ui/Button/DynamicButton";

import { CARD_SYSTEM } from "@/constants";
import { logger } from "@/utils/logger";

const AnalyticsPage = () => {
  // Get real-time data from month selection
  const { users, reporters, error } = useAppDataContext();
  const navigate = useNavigate();
  const { cardId } = useParams();

  // Use URL parameter for selected card, fallback to null for overview
  const selectedCard = cardId || null;

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

  // Get current month name for display
  const currentMonthName = currentMonth?.monthName || "Current Month";
  const selectedMonthName = selectedMonth?.monthName || currentMonthName;

  // Helper function to check if data is empty
  const hasNoData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return true;
    }
    return false;
  }, [tasks]);

  // Analytics cards configuration
  const analyticsCards = useMemo(
    () => [
      {
        id: "total-analytics",
        name: "Total Analytics",
        description: "View  all hours by Product, Acquisition, and Marketing",
        icon: Icons.generic.chart,
        color: "blue",
      },
      {
        id: "markets-by-users",
        name: "Markets by Users",
        description: "View  tasks by markets and users",
        icon: Icons.generic.globe,
        color: "green",
      },
      {
        id: "marketing-analytics",
        name: "Marketing Analytics",
        description: "View  marketing hours",
        icon: Icons.generic.target,
        color: "pink",
      },
      {
        id: "acquisition-analytics",
        name: "Acquisition Analytics",
        description: "View  acquisition tasks and hours",
        icon: Icons.generic.target,
        color: "amber",
      },
      {
        id: "product-analytics",
        name: "Product Analytics",
        description: "View  product tasks and hours",
        icon: Icons.generic.package,
        color: "orange",
      },
      {
        id: "misc-analytics",
        name: "Misc Analytics",
        description: "View misc product tasks and hours",
        icon: Icons.generic.product,
        color: "soft_purple",
      },
      {
        id: "ai-analytics",
        name: "AI Analytics",
        description: "View AI usage by users and models",
        icon: Icons.generic.ai,
        color: "yellow",
      },
      {
        id: "reporter-analytics",
        name: "Reporter Analytics",
        description: "View  tasks, hours, markets, and products by reporter",
        icon: Icons.admin.reporters,
        color: "purple",
      },
      {
        id: "shutterstock-analytics",
        name: "Shutterstock Analytics",
        description: "View Shutterstock tasks and hours by user and market",
        icon: Icons.generic.chart,
        color: "blue",
      },
    ],
    []
  );

  // Handle card click to view in detail - navigate to route
  const handleCardClick = useCallback((cardId) => {
    navigate(`/analytics/${cardId}`);
  }, [navigate]);

  // Handle back to analytics view - navigate to base analytics route
  const handleBackToAnalytics = useCallback(() => {
    navigate('/analytics');
  }, [navigate]);

  // All card props now include unique tasks count
  const getCardProps = useCallback((cardId) => {
    if (isLoading || hasNoData) return null;

    try {
      switch (cardId) {
        case "reporter-analytics":
          // Use unique tasks count 
          return getCachedReporterAnalyticsCardProps(tasks, reporters);
        case "markets-by-users":
          // Use unique tasks count
          return getCachedMarketsByUsersCardProps(tasks, users);
        case "marketing-analytics":
          // Use unique tasks count 
          return getCachedMarketingAnalyticsCardProps(tasks, users);
        case "acquisition-analytics":
          // Use unique tasks count 
          return getCachedAcquisitionAnalyticsCardProps(tasks, users);
        case "product-analytics":
          // Use unique tasks count 
          return getCachedProductAnalyticsCardProps(tasks, users);
        case "misc-analytics":
          // Use unique tasks count 
          return getCachedMiscAnalyticsCardProps(tasks, users);
        case "ai-analytics":
          // Use unique tasks count 
          return getCachedAIAnalyticsCardProps(tasks, users);
        case "total-analytics":
          // Use unique tasks count across all categories
          return getCachedTotalAnalyticsCardProps(tasks);
        case "shutterstock-analytics":
          // Filter tasks by useShutterstock = true
          return getCachedShutterstockAnalyticsCardProps(tasks, users);
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Error calculating props for ${cardId}:`, error);
      return null;
    }
  }, [tasks, users, reporters, isLoading, hasNoData]);


  if (isLoading || isInitialLoading) {
    return (
      <div className="space-y-6 mt-4">
        {/* Page Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton height="2rem" width="16rem" className="mb-2" />
              <Skeleton height="1rem" width="24rem" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton height="2.5rem" width="10rem" rounded="lg" />
            </div>
          </div>

          {/* Month Progress Bar Skeleton */}
          <div className="mt-4">
            <Skeleton height="6rem" width="100%" rounded="lg" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        {/* Analytics Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <SkeletonAnalyticsCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error || monthError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-error dark:text-red-error">
          Error loading analytics:{" "}
          {(error || monthError)?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  // Render Analytics Card Preview 
  const AnalyticsCardPreview = ({ card, onClick }) => {
    const cardProps = getCardProps(card.id);
    const hasData = cardProps && !cardProps.hasNoData;
    const totalTasks = useMemo(() => {
      if (!cardProps || !hasData) return 0;
      return cardProps.totalTasks || 0;
    }, [cardProps, hasData]);
    const totalHours = useMemo(() => {
      if (!cardProps || !hasData) return 0;
      return cardProps.totalHours || 0;
    }, [cardProps, hasData]);

    const cardData = useMemo(() => ({
      id: card.id,
      title: card.name,
      subtitle: card.description,
      icon: card.icon,
      color: card.color,
      value: hasData && totalTasks > 0 ? totalTasks.toLocaleString() : "0",
      description: hasData ? `${totalTasks.toLocaleString()} tasks` : "No data available",
      badge: hasData && totalTasks > 0 ? {
        text: `${totalTasks.toLocaleString()} tasks`,
        color: card.color
      } : null,
      details: hasData ? [
        {
          label: "Total Hours",
          value: `${totalHours.toLocaleString()}h`
        }
      ] : []
    }), [card, hasData, totalTasks, totalHours]);

    return (
      <div
        className="cursor-pointer group hover:scale-[1.02] transition-all duration-300"
        onClick={() => onClick(card.id)}
      >
        <SmallCard card={cardData} />
      </div>
    );
  };

  // Render detailed card view
  const renderDetailedCard = () => {
    if (!selectedCard) return null;

    const cardProps = getCardProps(selectedCard);
    const card = analyticsCards.find((c) => c.id === selectedCard);

    if (!cardProps || cardProps.hasNoData) {
      return (
        <div className="card">
          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center">
              <Icons.generic.document className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Data Available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                There is no data available for {card?.name || "this section"}. Data will
                appear once tasks are added for the selected month.
              </p>
              <DynamicButton
                onClick={handleBackToAnalytics}
                variant="primary"
                size="lg"
                iconName="arrowLeft"
                iconCategory="buttons"
                iconPosition="left"
                className="font-semibold shadow-md"
              >
                Back to Analytics
              </DynamicButton>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="mb-4">
            <DynamicButton
              onClick={handleBackToAnalytics}
              variant="primary"
              size="md"
              iconName="arrowLeft"
              iconCategory="buttons"
              iconPosition="left"
              className="font-semibold shadow-md my-4 py-3"
            >
              Back to Analytics
            </DynamicButton>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {card?.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {card?.description}
          </p>
        </div>

        <div id={`${selectedCard}-card`}>
          {/* All analytics cards now use unique tasks count in totals (not sum of market/category counts) */}
          {selectedCard === "reporter-analytics" && (
            <ReporterAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "markets-by-users" && (
            <MarketsByUsersCard {...cardProps} />
          )}
          {selectedCard === "marketing-analytics" && (
            <MarketingAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "acquisition-analytics" && (
            <AcquisitionAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "product-analytics" && (
            <ProductAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "misc-analytics" && (
            <MiscAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "ai-analytics" && (
            <AIAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "total-analytics" && (
            <TotalAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "shutterstock-analytics" && (
            <ShutterstockAnalyticsCard {...cardProps} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your task performance and analytics data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Month Selector */}
          <select
            value={selectedMonth?.monthId || currentMonth?.monthId || ""}
            onChange={(e) => selectMonth(e.target.value)}
            className="bg-white dark:bg-primary border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      <div className="mb-8">
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

      {/* Detailed View */}
      {selectedCard && renderDetailedCard()}

      {/* Analytics Dashboard */}
      {!selectedCard && (
        <div className="space-y-8">
          {/* Analytics Cards Grid */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Product statistics 
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click on any card to view detailed breakdown
              </p>
            </div>

            {hasNoData ? (
              <div className="card-small-modern">
                <div className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Icons.generic.document className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Data Available
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      There is no data available for the selected month. Data will
                      appear once tasks are added.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {analyticsCards.map((card) => (
                  <AnalyticsCardPreview
                    key={card.id}
                    card={card}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Counting Logic Explanation */}
          <div className="mb-8">
            <div className="card  ">
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 mt-1">
                    <Icons.generic.help className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How Task and Market Counting Works
                    </h3>
                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <p className="font-medium mb-2">Example: 3 tasks with markets [UK,RO,IE], [RO,UK], [RO,IE] will show:</p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">Total: 3 tasks</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">(unique tasks - each task counted once)</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">RO: 3, IE: 2, UK: 2</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">(per market counts - how many times each market appears)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">How it works:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600 dark:text-gray-400">
                          <li><span className="font-medium text-gray-900 dark:text-white">Total Tasks</span> = Count of unique tasks (3 tasks in the example)</li>
                          <li><span className="font-medium text-gray-900 dark:text-white">RO: 3</span> = RO appears in 3 tasks (Task 1, Task 2, Task 3)</li>
                          <li><span className="font-medium text-gray-900 dark:text-white">IE: 2</span> = IE appears in 2 tasks (Task 1, Task 3)</li>
                          <li><span className="font-medium text-gray-900 dark:text-white">UK: 2</span> = UK appears in 2 tasks (Task 1, Task 2)</li>
                        </ul>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500">
                    
                        <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600 dark:text-gray-400">
                          <li><span className="font-medium">Acquisition, Marketing, Product, Misc</span> - Total shows unique tasks, market breakdowns show per-market counts</li>
                          <li><span className="font-medium">AI Analytics</span> - Total shows unique tasks, breakdowns by product/market/user show per-category counts</li>
                          <li><span className="font-medium">Reporter Analytics</span> - Total shows unique tasks, breakdowns by reporter/market show per-category counts</li>
                          <li><span className="font-medium">Markets by Users</span> - Total shows unique tasks, market breakdowns show per-market counts</li>
                          <li><span className="font-medium">Total Analytics</span> - Shows unique tasks across all categories</li>
                        </ul>
                  
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
